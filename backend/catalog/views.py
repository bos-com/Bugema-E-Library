import os
import re
import logging 
import cloudinary 
import requests
from requests.adapters import HTTPAdapter, Retry
import time
from urllib.parse import urlparse
from django.utils import timezone
from django.shortcuts import get_object_or_404   
from rest_framework import generics, status, filters, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.http import Http404, HttpResponse
from django.db.models import Q, Max, F 

from django.conf import settings 
from django.http import HttpResponse, Http404, FileResponse, StreamingHttpResponse, HttpResponseRedirect

from .models import Category, Book, BookLike, Bookmark
from .serializers import (
    CategorySerializer, BookListSerializer, BookDetailSerializer,
    BookCreateUpdateSerializer, BookLikeSerializer, BookmarkSerializer
)
from accounts.permissions import IsAdminRole
from rest_framework.parsers import MultiPartParser, FormParser
from analytics.models import BookView

# Initialize logger
logger = logging.getLogger(__name__)

# Shared HTTP session for Cloudinary downloads with retry on transient failures
cloudinary_session = requests.Session()
retry_config = Retry(
    total=3,
    backoff_factor=1,
    allowed_methods=frozenset(['GET']),
    status_forcelist=[500, 502, 503, 504],
    raise_on_status=False,
)
cloudinary_session.mount('https://', HTTPAdapter(max_retries=retry_config))

# --- CATEGORY VIEWS ---
class CategoryListView(generics.ListAPIView):
    """List all categories with book counts"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


# --- BOOK LIST/CREATE VIEWS ---
class BookViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for Books, replacing BookListCreateView and BookDetailView.
    """
    # REQUIRED for file upload to be detected by Swagger/DRF
    parser_classes = (MultiPartParser, FormParser) 

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categories__id', 'language', 'year', 'file_type'] 
    search_fields = ['title', 'author__name', 'description', '@tags'] # NOTE: changed to author__name for ForeignKey lookup
    ordering_fields = ['created_at', 'view_count', 'like_count', 'title']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Base queryset with optional free-text search using ?query=...
        Frontend sends `query` while DRF's SearchFilter defaults to `search`,
        so we support both for convenience.
        """
        qs = Book.objects.filter(is_published=True) if self.action in ['list', 'retrieve'] else Book.objects.all()

        request = self.request
        query = request.query_params.get('query') or request.query_params.get('search')
        if query:
            qs = qs.filter(
                Q(title__icontains=query)
                | Q(author__name__icontains=query)
                | Q(description__icontains=query)
                | Q(tags__icontains=query)
            )
        return qs

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return BookCreateUpdateSerializer
        if self.action == 'retrieve':
            return BookDetailSerializer
        return BookListSerializer

    def get_permissions(self):
        # Apply permissions based on action
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminRole()] 
        return [AllowAny()]

    def list(self, request, *args, **kwargs):
        """Override list to add error handling"""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error listing books: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to fetch books', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        """Re-implement the view count logic from the old BookDetailView"""
        try:
            instance = self.get_object()
            
            # Increment view count
            Book.objects.filter(pk=instance.pk).update(view_count=F('view_count') + 1)
            
            # Create BookView record for analytics (only for authenticated users)
            if request.user.is_authenticated:
                BookView.objects.create(
                    user=request.user,
                    book=instance
                )
            
            instance.refresh_from_db()

            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error retrieving book: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to fetch book', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# --- COVER IMAGE VIEW (Placeholder) ---
@api_view(['GET'])
@permission_classes([AllowAny])
def book_cover(request, book_id):
    """Serve book cover image (Placeholder for new file serving logic)"""
    try:
        book = Book.objects.get(id=book_id, is_published=True)
        if not book.cover_image:
            raise Http404("Cover image not found")
        
        return HttpResponse(status=status.HTTP_501_NOT_IMPLEMENTED, 
                            content="File serving logic needs to be updated for new storage.")
    except Book.DoesNotExist:
        raise Http404("Book not found")


# ----------------------------------------------------------------------
#  BOOK STREAMING VIEW – SIGNED CLOUDINARY URL (Option 1)
# ----------------------------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def book_read_stream(request, book_id):
    try:
        book = get_object_or_404(Book, id=book_id, is_published=True)

        public_id = book.cloudinary_public_id
        if not public_id:
            return Response(
                {'error': 'Missing Cloudinary public_id'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Match this to HOW you uploaded the asset.
        # If you uploaded PDFs as image-type (image/upload), use "image".
        # If you uploaded them as raw (raw/upload), use "raw".
        if book.file_type in ("PDF", "EPUB"):
            resource_type = "image"   # change to "raw" if you upload PDFs as raw
        elif book.file_type == "VIDEO":
            resource_type = "video"
        else:
            resource_type = "image"

        signed_url, _ = cloudinary.utils.cloudinary_url(
            public_id,
            resource_type=resource_type,
            type="upload",          
            sign_url=True,
            secure=True,
            expires_at=int(time.time()) + 3600,
        )

        logger.info(
            f"Returning Cloudinary URL for book {book_id}: "
            f"public_id='{public_id}', resource_type='{resource_type}', url='{signed_url}'"
        )

        return Response({'url': signed_url})

    except Exception as exc:
        logger.exception(f"Error preparing book URL {book_id}")
        return Response(
            {'error': 'An internal error occurred.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def book_read_token(request, book_id):
    """
    Lightweight endpoint used by the frontend to verify access before opening the reader.
    For now we just ensure the book exists and the user is authenticated, then return a
    short-lived opaque token string that the frontend passes back as a query param.
    """
    book = get_object_or_404(Book, id=book_id, is_published=True)
    # Optionally log a BookView here in the future.
    # For simplicity, the "token" is not validated server-side by the stream view.
    return Response({'token': f'allowed-{book.id}'}, status=status.HTTP_200_OK)


# --- LIKE/BOOKMARK VIEWS ---
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_like(request, book_id):
    """Toggle book like"""
    try:
        book = Book.objects.get(id=book_id, is_published=True)
        user = request.user
        
        like = BookLike.objects.filter(user=user, book=book).first()
        
        if like:
            like.delete()
            
            # Re-fetch book to ensure we have latest data
            book.refresh_from_db()
            if book.like_count > 0:
                book.like_count -= 1
                book.save(update_fields=['like_count'])
            
            book.refresh_from_db()
            return Response({'liked': False, 'like_count': book.like_count})
        else:
            BookLike.objects.create(user=user, book=book)
            Book.objects.filter(pk=book.pk).update(like_count=F('like_count') + 1)
            
            book.refresh_from_db()
            return Response({'liked': True, 'like_count': book.like_count})
    
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error toggling like for book {book_id}: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to toggle like', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_bookmark(request, book_id):
    """Toggle book bookmark"""
    try:
        book = Book.objects.get(id=book_id, is_published=True)
        user = request.user
        location = request.data.get('location', '')
        
        bookmark = Bookmark.objects.filter(user=user, book=book).first()
        
        if bookmark:
            bookmark.delete()
            # Re-fetch book
            book.refresh_from_db()
            if book.bookmark_count > 0:
                book.bookmark_count -= 1
                book.save(update_fields=['bookmark_count'])
            
            book.refresh_from_db()
            return Response({'bookmarked': False, 'bookmark_count': book.bookmark_count})
        else:
            Bookmark.objects.create(user=user, book=book, location=location)
            Book.objects.filter(pk=book.pk).update(bookmark_count=F('bookmark_count') + 1)
            
            book.refresh_from_db()
            return Response({'bookmarked': True, 'bookmark_count': book.bookmark_count})
    
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error toggling bookmark for book {book_id}: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to toggle bookmark', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# --- SEARCH SUGGESTIONS VIEW ---
@api_view(['GET'])
@permission_classes([AllowAny])
def search_suggestions(request):
    """Get search suggestions"""
    query = request.GET.get('query', '').strip()
    if len(query) < 2:
        return Response({'suggestions': []})
    
    books = Book.objects.filter(
        Q(title__icontains=query) | Q(author__icontains=query),
        is_published=True
    ).order_by('-view_count')[:10]
    
    suggestions = []
    
    for book in books:
        if query.lower() in book.title.lower():
            suggestions.append({
                'type': 'title',
                'text': book.title,
                'book_id': str(book.id)
            })
        elif query.lower() in book.author.name.lower():
            suggestions.append({
                'type': 'author',
                'text': book.author.name,
                'book_id': str(book.id)
            })
    
    tag_suggestions = Book.objects.filter(
        tags__icontains=query,
        is_published=True
    ).values_list('tags', flat=True).distinct()

    unique_tags = set()
    for tag_string in tag_suggestions:
        if tag_string:
            for tag in [t.strip() for t in tag_string.split(',')]:
                if query.lower() in tag.lower():
                    unique_tags.add(tag)
    
    for tag in list(unique_tags)[:5]:
        suggestions.append({
            'type': 'tag',
            'text': tag
        })
    
    return Response({'suggestions': suggestions[:10]})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def book_file_url(request, book_id):
    book = get_object_or_404(Book, id=book_id, is_published=True)
    if not book.file:
        return Response({'error': 'No file for this book'}, status=404)
    return Response({'url': book.file.url})