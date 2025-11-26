import os
import logging 
import cloudinary 
import requests
import time
from pathlib import Path
from django.utils import timezone
from django.shortcuts import get_object_or_404   
from rest_framework import generics, status, filters, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.http import Http404, HttpResponse
from django.db.models import Q, Max, F 

from django.conf import settings 
from django.http import HttpResponse, Http404, FileResponse 

from .models import Category, Book, BookLike, Bookmark
from .serializers import (
    CategorySerializer, BookListSerializer, BookDetailSerializer,
    BookCreateUpdateSerializer, BookLikeSerializer, BookmarkSerializer
)
from rest_framework.parsers import MultiPartParser, FormParser

# Initialize logger
logger = logging.getLogger(__name__)

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
            return [IsAdminUser()] 
        return [AllowAny()]

    def retrieve(self, request, *args, **kwargs):
        # Re-implement the view count logic from the old BookDetailView
        instance = self.get_object()
        Book.objects.filter(pk=instance.pk).update(view_count=F('view_count') + 1)
        instance.refresh_from_db()

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

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
        book = Book.objects.get(id=book_id, is_published=True)
        if not book.file:
            return Response({'error': 'Book file not found'}, status=404)

   
        try:
            rel_path = Path(book.file.name).relative_to('media')
            public_id = rel_path.as_posix()  
        except ValueError:
            return Response({'error': 'Invalid file path'}, status=400)

        resource_type = "raw" if book.file_type in ('PDF', 'EPUB') else "video"

        logger.info("Cloudinary public_id: %s", public_id)

        signed_url = cloudinary.utils.cloudinary_url(
            public_id,
            resource_type=resource_type,
            type="upload",
            sign_url=True,
            expires_at=int(time.time()) + 3600,
            attachment=True,
        )[0]

        logger.info("Signed URL: %s", signed_url)
        cloud_resp = requests.get(signed_url, stream=True, timeout=30)
        cloud_resp.raise_for_status()

        mime_map = {
            'PDF':   'application/pdf',
            'EPUB':  'application/epub+zip',
            'VIDEO': 'video/mp4',
        }
        content_type = mime_map.get(book.file_type, 'application/octet-stream')

    
        filename = os.path.basename(book.file.name) or 'file'

        response = StreamingHttpResponse(
            cloud_resp.iter_content(chunk_size=8192),
            content_type=content_type,
        )
        response['Content-Disposition'] = f'inline; filename="{filename}"'

    
        if 'Content-Length' in cloud_resp.headers:
            response['Content-Length'] = cloud_resp.headers['Content-Length']

        return response



    except Book.DoesNotExist:
        raise HttpResponseNotFound("Book not found")
    except requests.exceptions.HTTPError as exc:
        logger.exception("Cloudinary request failed for book %s", book_id)
        if exc.response.status_code == 404:
             return Response(
                {'error': 'File not found on storage server.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(
            {'error': f'Failed to retrieve file from Cloudinary: {exc}'},
            status=status.HTTP_502_BAD_GATEWAY,
        )
    except Exception as exc:
        logger.exception("Unhandled streaming error for book %s", book_id)
        return Response(
            {'error': 'An internal error occurred while streaming the file.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
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