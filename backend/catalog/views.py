import os
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.http import Http404, HttpResponse
from django.db.models import Q, Max, F # Added F and Max for potential future use

from django.conf import settings 
from wsgiref.util import FileWrapper
from django.http import HttpResponse, Http404, FileResponse

from .models import Category, Book, BookLike, Bookmark
from .serializers import (
    CategorySerializer, BookListSerializer, BookDetailSerializer,
    BookCreateUpdateSerializer, BookLikeSerializer, BookmarkSerializer
)

# ... (CategoryListView remains the same) ...
class CategoryListView(generics.ListAPIView):
    """List all categories with book counts"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]



class BookListCreateView(generics.ListCreateAPIView):
    """
    GET: List books with search and filtering (Reviewing/Listing).
    POST: Add a new book/resource.
    """
    # Base configuration for listing
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categories__id', 'language', 'year', 'file_type'] 
    search_fields = ['title', 'author', 'description', '@tags'] # Assuming '@tags' for M2M search
    ordering_fields = ['created_at', 'view_count', 'like_count', 'title']
    ordering = ['-created_at']
    
    def get_queryset(self):
        # Only return published books for public list/review
        return Book.objects.filter(is_published=True)

    def get_serializer_class(self):
        """Use the appropriate serializer for the request type."""
        # Use the creation serializer for POST requests
        if self.request.method == 'POST':
            return BookCreateUpdateSerializer
        # Use the list serializer for GET requests (listing/reviewing)
        return BookListSerializer

    def get_permissions(self):
        """Restrict POST (creation) to authenticated users."""
        if self.request.method == 'POST':
            # Only authenticated users should be able to add new books
            return [IsAuthenticated()] 
        # All other methods (GET) use the default permission
        return super().get_permissions()

# ... (BookDetailView remains the same for now) ...
class BookDetailView(generics.RetrieveAPIView):
    """Get book details (single book review)"""
    serializer_class = BookDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'id' 
    
    def get_queryset(self):
        return Book.objects.filter(is_published=True)
    
    def retrieve(self, request, *args, **kwargs):
        # ... (rest of the view logic, including view count update) ...
        instance = self.get_object()
        Book.objects.filter(pk=instance.pk).update(view_count=F('view_count') + 1)
        instance.refresh_from_db()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def book_cover(request, book_id):
    """Serve book cover image (Placeholder for new file serving logic)"""
    try:
        book = Book.objects.get(id=book_id, is_published=True)
        if not book.cover_image:
            raise Http404("Cover image not found")
        
        # Placeholder for serving via Django's media system or a redirect
        return HttpResponse(status=status.HTTP_501_NOT_IMPLEMENTED, 
                            content="File serving logic needs to be updated for new storage.")
    except Book.DoesNotExist:
        raise Http404("Book not found")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def book_read_stream(request, book_id):
    """Stream book file for reading (NO DOWNLOAD)"""
    
    # 🚨 TEMPORARY: Logging/raising the specific error instead of the generic 500
    # You MUST check your server console for the actual traceback now!
    try:
        book = Book.objects.get(id=book_id, is_published=True)
    
        if not book.file:
            raise Http404("Book file path not found in database.")
            
        # Construct the full file path
        file_path = os.path.join(settings.MEDIA_ROOT, book.file)
        
        if not os.path.exists(file_path):
            raise Http404(f"Book file not found on server at path: {file_path}")
        
        # Determine the MIME type based on the stored file_type
        if book.file_type == 'PDF':
            content_type = 'application/pdf'
        elif book.file_type == 'EPUB':
            content_type = 'application/epub+zip'
        else:
            content_type = 'application/octet-stream' 

        # Open the file and prepare for streaming
        # The 'with' statement ensures the file_handle is always closed, preventing leaks.
        with open(file_path, 'rb') as file_handle:
            response = HttpResponse(FileWrapper(file_handle), content_type=content_type)
        
        # CRITICAL: Prevent Download with Content-Disposition Header
        response['Content-Disposition'] = f'inline; filename="{os.path.basename(book.file)}"'
        
        response['Content-Length'] = os.path.getsize(file_path)
        
        return response
        
    except Book.DoesNotExist:
        # User requested a book that doesn't exist or isn't published
        raise Http404("Book not found")
    
    # Re-raising the original error for debugging (REMOVE THIS block later)
    # The error now appears in your server console, which is what we need to see!
    except FileNotFoundError as e:
        # This will be raised if the file path is wrong or the file is missing
        return Response({'error': f"File system error: {e}"}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except PermissionError as e:
        # This will be raised if the Django process can't read the file
        return Response({'error': f"Permission error: {e}"}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        # Catch all other exceptions and log them
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Unhandled streaming error for book {book_id}: {e}")
        return Response({'error': 'An unhandled internal error occurred while streaming the file.'}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_like(request, book_id):
    """Toggle book like"""
    try:
        book = Book.objects.get(id=book_id, is_published=True)
        user = request.user
        
        # FIX 2: Switched from MongoEngine query syntax to Django ORM filter
        like = BookLike.objects.filter(user=user, book=book).first()
        
        if like:
            # Unlike
            like.delete()
            # Atomically decrement like count
            Book.objects.filter(pk=book.pk).update(like_count=Max(0, F('like_count') - 1))
            
            # --- FIX 4: Removed Obsolete Analytics Logging ---
            # EventLog.objects.create(event_type='LIKE', payload={'book_id': str(book.id), 'action': 'unlike'}, user=user)
            
            # Re-fetch the count for the response
            book.refresh_from_db()
            return Response({'liked': False, 'like_count': book.like_count})
        else:
            # Like
            # Assuming BookLike has Foreign Keys to User and Book
            BookLike.objects.create(user=user, book=book)
            # Atomically increment like count
            Book.objects.filter(pk=book.pk).update(like_count=F('like_count') + 1)
            
            # --- FIX 4: Removed Obsolete Analytics Logging ---
            # EventLog.objects.create(event_type='LIKE', payload={'book_id': str(book.id), 'action': 'like'}, user=user)
            
            # Re-fetch the count for the response
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
            # Remove bookmark
            bookmark.delete()
            # Atomically decrement bookmark count
            Book.objects.filter(pk=book.pk).update(bookmark_count=Max(0, F('bookmark_count') - 1))
            
            # Re-fetch the count for the response
            book.refresh_from_db()
            return Response({'bookmarked': False, 'bookmark_count': book.bookmark_count})
        else:
            # Add bookmark
            # Assuming Bookmark has Foreign Keys to User and Book
            Bookmark.objects.create(user=user, book=book, location=location)
            # Atomically increment bookmark count
            Book.objects.filter(pk=book.pk).update(bookmark_count=F('bookmark_count') + 1)
            
            # Re-fetch the count for the response
            book.refresh_from_db()
            return Response({'bookmarked': True, 'bookmark_count': book.bookmark_count})
    
    except Book.DoesNotExist:
        raise Http404("Book not found")


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
    ).order_by('-view_count')[:10] # Added ordering and slicing to mimic limit
    
    suggestions = []
    
    # Process book title/author suggestions
    for book in books:
        if query.lower() in book.title.lower():
            suggestions.append({
                'type': 'title',
                'text': book.title,
                'book_id': str(book.id)
            })
        # Check author only if title didn't match closely (to prevent duplicates/prioritize titles)
        elif query.lower() in book.author.lower():
            suggestions.append({
                'type': 'author',
                'text': book.author,
                'book_id': str(book.id)
            })
    
    # Get tag suggestions
    # FIX 2: Switched from MongoEngine distinct to Django ORM distinct values_list
    # NOTE: This assumes 'tags' is a CharField/TextField where tags are comma-separated. 
    # If tags are a ManyToMany field, this logic must be completely changed.
    tag_suggestions = Book.objects.filter(
        tags__icontains=query,
        is_published=True
    ).values_list('tags', flat=True).distinct()

    # Split and process tags
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
    
    # Return top 10 unique suggestions
    return Response({'suggestions': suggestions[:10]})