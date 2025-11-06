from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.http import Http404, HttpResponse
from django.db.models import Q, Max, F # Added F and Max for potential future use

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
        
        # FIX 5: Removed dependency on serve_file_from_gridfs
        # Placeholder for serving via Django's media system or a redirect
        return HttpResponse(status=status.HTTP_501_NOT_IMPLEMENTED, 
                            content="File serving logic needs to be updated for new storage.")
    except Book.DoesNotExist:
        raise Http404("Book not found")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def book_read_stream(request, book_id):
    """Stream book file for reading (Placeholder for new file serving logic)"""
    try:
        book = Book.objects.get(id=book_id, is_published=True)
        if not book.file:
            raise Http404("Book file not found")
        
        # FIX 5: Removed dependency on SignedURLGenerator and serve_file_stream
        # The token logic is also removed as it relies on the obsolete file serving system.
        return HttpResponse(status=status.HTTP_501_NOT_IMPLEMENTED, 
                            content="Book stream logic needs to be updated for new storage.")
        
    except Book.DoesNotExist:
        raise Http404("Book not found")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_read_token(request, book_id):
    """Get signed token for reading book (Obsolete view)"""
    # FIX 5: This entire view is obsolete without a custom signed URL generator
    return Response({'error': 'Token generation logic is currently disabled due to system migration.'}, 
                    status=status.HTTP_501_NOT_IMPLEMENTED)


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
        
        # FIX 2: Switched from MongoEngine query syntax to Django ORM filter
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
            
            # --- FIX 4: Removed Obsolete Analytics Logging ---
            # EventLog.objects.create(event_type='BOOKMARK', payload={'book_id': str(book.id), 'location': location}, user=user)
            
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
    
    # FIX 2: Switched from MongoEngine syntax to Django ORM filter
    # Use standard Django Q objects and __icontains for case-insensitive search
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