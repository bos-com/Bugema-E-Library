import os
import logging 
from django.shortcuts import get_object_or_404   
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
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

# Initialize logger
logger = logging.getLogger(__name__)

# --- CATEGORY VIEWS ---
class CategoryListView(generics.ListAPIView):
    """List all categories with book counts"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


# --- BOOK LIST/CREATE VIEWS ---
class BookListCreateView(generics.ListCreateAPIView):
    """
    GET: List books with search and filtering (Reviewing/Listing).
    POST: Add a new book/resource.
    """
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categories__id', 'language', 'year', 'file_type'] 
    search_fields = ['title', 'author', 'description', '@tags']
    ordering_fields = ['created_at', 'view_count', 'like_count', 'title']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Book.objects.filter(is_published=True)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookCreateUpdateSerializer
        return BookListSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()] 
        return super().get_permissions()


# --- BOOK DETAIL VIEW ---
class BookDetailView(generics.RetrieveAPIView):
    """Get book details (single book review)"""
    serializer_class = BookDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'id' 
    
    def get_queryset(self):
        return Book.objects.filter(is_published=True)
    
    def retrieve(self, request, *args, **kwargs):
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


# --- BOOK STREAMING VIEW ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def book_read_stream(request, book_id):
    """
    Stream book file for reading (works with remote storage like Cloudinary).
    This uses the storage backend API (book.file.open) instead of local filesystem paths.
    """
    try:
        book = Book.objects.get(id=book_id, is_published=True)
        if not book.file:
            raise Http404("Book file not found")

        # Open file via storage backend (works with Cloudinary/django-cloudinary-storage)
        try:
            file_obj = book.file.open('rb')
        except Exception:
            logger.exception("Failed to open file for book %s via storage backend", book_id)
            raise Http404("Unable to open book file")

        # MIME type
        if book.file_type == 'PDF':
            content_type = 'application/pdf'
        elif book.file_type == 'EPUB':
            content_type = 'application/epub+zip'
        elif book.file_type == 'VIDEO':
            content_type = 'video/mp4'
        else:
            content_type = 'application/octet-stream'

        response = FileResponse(file_obj, content_type=content_type)
        # inline so browser displays instead of forcing download
        filename = os.path.basename(book.file.name) if book.file.name else 'file'
        response['Content-Disposition'] = f'inline; filename="{filename}"'

        # try to set length if available
        try:
            if hasattr(file_obj, 'size') and file_obj.size is not None:
                response['Content-Length'] = str(file_obj.size)
        except Exception:
            pass

        return response

    except Book.DoesNotExist:
        raise Http404("Book not found")
    except Http404:
        raise
    except Exception:
        logger.exception("Unhandled streaming error for book %s", book_id)
        return Response({'error': 'An unhandled internal error occurred while streaming the file.'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)




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
            Book.objects.filter(pk=book.pk).update(like_count=Max(0, F('like_count') - 1))
            
            book.refresh_from_db()
            return Response({'liked': False, 'like_count': book.like_count})
        else:
            BookLike.objects.create(user=user, book=book)
            Book.objects.filter(pk=book.pk).update(like_count=F('like_count') + 1)
            
            book.refresh_from_db()
            return Response({'liked': True, 'like_count': book.like_count})
    
    except Book.DoesNotExist:
        raise Http404("Book not found")


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
            Book.objects.filter(pk=book.pk).update(bookmark_count=Max(0, F('bookmark_count') - 1))
            
            book.refresh_from_db()
            return Response({'bookmarked': False, 'bookmark_count': book.bookmark_count})
        else:
            Bookmark.objects.create(user=user, book=book, location=location)
            Book.objects.filter(pk=book.pk).update(bookmark_count=F('bookmark_count') + 1)
            
            book.refresh_from_db()
            return Response({'bookmarked': True, 'bookmark_count': book.bookmark_count})
    
    except Book.DoesNotExist:
        raise Http404("Book not found")


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
        elif query.lower() in book.author.lower():
            suggestions.append({
                'type': 'author',
                'text': book.author,
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