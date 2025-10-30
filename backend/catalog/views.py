from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.http import Http404
from mongoengine import Q
from .models import Category, Book, BookLike, Bookmark
from .serializers import (
    CategorySerializer, BookListSerializer, BookDetailSerializer,
    BookCreateUpdateSerializer, BookLikeSerializer, BookmarkSerializer
)
from .storage import serve_file_from_gridfs, serve_file_stream, SignedURLGenerator
from analytics.models import EventLog


class CategoryListView(generics.ListAPIView):
    """List all categories with book counts"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class BookListView(generics.ListAPIView):
    """List books with search and filtering"""
    serializer_class = BookListSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categories', 'language', 'year', 'file_type']
    search_fields = ['title', 'author', 'description', 'tags']
    ordering_fields = ['created_at', 'view_count', 'like_count', 'title']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = Book.objects(is_published=True)
        
        # Text search using MongoDB text index
        query = self.request.query_params.get('query', None)
        if query:
            queryset = queryset.search_text(query)
        
        # Category filter
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset(categories__in=[category])
        
        # Tags filter
        tags = self.request.query_params.get('tags', None)
        if tags:
            tag_list = [tag.strip() for tag in tags.split(',')]
            queryset = queryset(tags__in=tag_list)
        
        # Year range filter
        year_from = self.request.query_params.get('year_from', None)
        year_to = self.request.query_params.get('year_to', None)
        if year_from:
            queryset = queryset(year__gte=int(year_from))
        if year_to:
            queryset = queryset(year__lte=int(year_to))
        
        return queryset


class BookDetailView(generics.RetrieveAPIView):
    """Get book details"""
    serializer_class = BookDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'id'
    
    def get_queryset(self):
        return Book.objects(is_published=True)
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Increment view count
        instance.view_count += 1
        instance.save()
        
        # Log analytics event
        if request.user and hasattr(request.user, 'id'):
            EventLog.objects.create(
                event_type='OPEN_BOOK',
                payload={'book_id': str(instance.id), 'book_title': instance.title},
                user=str(request.user.id),
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT')
            )
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def book_cover(request, book_id):
    """Serve book cover image"""
    try:
        book = Book.objects.get(id=book_id, is_published=True)
        if not book.cover_image:
            raise Http404("Cover image not found")
        
        return serve_file_from_gridfs(
            book.cover_image,
            filename=f"{book.title}_cover.jpg",
            content_type='image/jpeg',
            inline=True
        )
    except Book.DoesNotExist:
        raise Http404("Book not found")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def book_read_stream(request, book_id):
    """Stream book file for reading"""
    try:
        book = Book.objects.get(id=book_id, is_published=True)
        if not book.file:
            raise Http404("Book file not found")
        
        # Verify signed token
        token = request.GET.get('token')
        if not token:
            return Response({'error': 'Token required'}, status=status.HTTP_400_BAD_REQUEST)
        
        url_generator = SignedURLGenerator()
        if not url_generator.verify_token(token, book_id, str(request.user.id)):
            return Response({'error': 'Invalid token'}, status=status.HTTP_403_FORBIDDEN)
        
        # Log reading event
        EventLog.objects.create(
            event_type='READ_PROGRESS',
            payload={'book_id': str(book.id), 'action': 'open'},
            user=str(request.user.id),
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT')
        )
        
        # Determine content type
        content_type = 'application/pdf' if book.file_type == 'PDF' else 'application/epub+zip'
        
        return serve_file_stream(
            book.file,
            request,
            filename=f"{book.title}.{book.file_type.lower()}",
            content_type=content_type
        )
    except Book.DoesNotExist:
        raise Http404("Book not found")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_read_token(request, book_id):
    """Get signed token for reading book"""
    try:
        book = Book.objects.get(id=book_id, is_published=True)
        if not book.file:
            raise Http404("Book file not found")
        
        url_generator = SignedURLGenerator()
        token = url_generator.generate_token(book_id, str(request.user.id))
        
        return Response({'token': token})
    except Book.DoesNotExist:
        raise Http404("Book not found")


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_like(request, book_id):
    """Toggle book like"""
    try:
        book = Book.objects.get(id=book_id, is_published=True)
        user_id = str(request.user.id)
        
        # Check if already liked
        like = BookLike.objects(user=user_id, book=book).first()
        
        if like:
            # Unlike
            like.delete()
            book.like_count = max(0, book.like_count - 1)
            book.save()
            
            # Log event
            EventLog.objects.create(
                event_type='LIKE',
                payload={'book_id': str(book.id), 'action': 'unlike'},
                user=user_id
            )
            
            return Response({'liked': False, 'like_count': book.like_count})
        else:
            # Like
            BookLike.objects.create(user=user_id, book=book)
            book.like_count += 1
            book.save()
            
            # Log event
            EventLog.objects.create(
                event_type='LIKE',
                payload={'book_id': str(book.id), 'action': 'like'},
                user=user_id
            )
            
            return Response({'liked': True, 'like_count': book.like_count})
    
    except Book.DoesNotExist:
        raise Http404("Book not found")


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_bookmark(request, book_id):
    """Toggle book bookmark"""
    try:
        book = Book.objects.get(id=book_id, is_published=True)
        user_id = str(request.user.id)
        location = request.data.get('location', '')
        
        # Check if already bookmarked
        bookmark = Bookmark.objects(user=user_id, book=book).first()
        
        if bookmark:
            # Remove bookmark
            bookmark.delete()
            book.bookmark_count = max(0, book.bookmark_count - 1)
            book.save()
            
            return Response({'bookmarked': False, 'bookmark_count': book.bookmark_count})
        else:
            # Add bookmark
            Bookmark.objects.create(user=user_id, book=book, location=location)
            book.bookmark_count += 1
            book.save()
            
            # Log event
            EventLog.objects.create(
                event_type='BOOKMARK',
                payload={'book_id': str(book.id), 'location': location},
                user=user_id
            )
            
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
    
    # Get suggestions from books
    books = Book.objects(
        Q(title__icontains=query) | Q(author__icontains=query),
        is_published=True
    ).limit(10)
    
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
    
    # Get tag suggestions
    tags = Book.objects(
        tags__icontains=query,
        is_published=True
    ).distinct('tags')
    
    for tag in tags[:5]:
        if query.lower() in tag.lower():
            suggestions.append({
                'type': 'tag',
                'text': tag
            })
    
    return Response({'suggestions': suggestions[:10]})
