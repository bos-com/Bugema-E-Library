from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, timedelta
from .models import ReadingProgress, ReadingSession
from .serializers import ReadingProgressSerializer, ReadingSessionSerializer, ReadingStatsSerializer
from catalog.models import Book, BookLike, Bookmark
from analytics.models import EventLog


class ReadingProgressView(generics.RetrieveUpdateAPIView):
    """Get or update reading progress for a book"""
    serializer_class = ReadingProgressSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'book_id'
    
    def get_queryset(self):
        return ReadingProgress.objects(user=str(self.request.user.id))
    
    def get_object(self):
        book_id = self.kwargs.get('book_id')
        try:
            book = Book.objects.get(id=book_id, is_published=True)
        except Book.DoesNotExist:
            return None
        
        progress, created = ReadingProgress.objects.get_or_create(
            user=str(self.request.user.id),
            book=book,
            defaults={
                'last_location': '0',
                'percent': 0.0,
                'total_time_seconds': 0
            }
        )
        return progress
    
    def update(self, request, *args, **kwargs):
        progress = self.get_object()
        if not progress:
            return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Update progress data
        last_location = request.data.get('location', progress.last_location)
        percent = request.data.get('percent', progress.percent)
        time_spent = request.data.get('time_spent', 0)
        
        progress.last_location = last_location
        progress.percent = float(percent)
        progress.total_time_seconds += int(time_spent)
        progress.last_opened_at = timezone.now()
        progress.completed = progress.percent >= 100
        progress.updated_at = timezone.now()
        progress.save()
        
        # Log analytics event
        EventLog.objects.create(
            event_type='READ_PROGRESS',
            payload={
                'book_id': str(progress.book.id),
                'location': last_location,
                'percent': progress.percent,
                'time_spent': time_spent
            },
            user=str(request.user.id)
        )
        
        serializer = self.get_serializer(progress)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_dashboard(request):
    """Get user dashboard data"""
    user_id = str(request.user.id)
    
    # Get reading progress
    in_progress = ReadingProgress.objects(
        user=user_id,
        completed=False
    ).order_by('-last_opened_at')[:10]
    
    completed = ReadingProgress.objects(
        user=user_id,
        completed=True
    ).order_by('-updated_at')[:10]
    
    # Get liked books
    liked_books = BookLike.objects(user=user_id).order_by('-created_at')[:10]
    liked_book_ids = [like.book.id for like in liked_books]
    liked_books_data = Book.objects(id__in=liked_book_ids, is_published=True)
    
    # Get bookmarked books
    bookmarked_books = Bookmark.objects(user=user_id).order_by('-created_at')[:10]
    bookmarked_book_ids = [bookmark.book.id for bookmark in bookmarked_books]
    bookmarked_books_data = Book.objects(id__in=bookmarked_book_ids, is_published=True)
    
    # Calculate stats
    total_books_read = ReadingProgress.objects(user=user_id, completed=True).count()
    total_time_seconds = sum(
        progress.total_time_seconds for progress in 
        ReadingProgress.objects(user=user_id)
    )
    total_pages_read = sum(
        progress.book.pages or 0 for progress in 
        ReadingProgress.objects(user=user_id, completed=True)
    )
    
    # Calculate reading streak
    current_streak = 0
    longest_streak = 0
    today = timezone.now().date()
    current_streak_days = 0
    
    # Get reading sessions for streak calculation
    sessions = ReadingSession.objects(user=user_id).order_by('-started_at')
    if sessions:
        last_session_date = sessions[0].started_at.date()
        if last_session_date == today or last_session_date == today - timedelta(days=1):
            current_streak_days = 1
            for session in sessions[1:]:
                session_date = session.started_at.date()
                if session_date == last_session_date - timedelta(days=1):
                    current_streak_days += 1
                    last_session_date = session_date
                else:
                    break
    
    # Get favorite category
    favorite_category = None
    category_counts = {}
    for progress in ReadingProgress.objects(user=user_id, completed=True):
        for category in progress.book.categories:
            category_name = category.name
            category_counts[category_name] = category_counts.get(category_name, 0) + 1
    
    if category_counts:
        favorite_category = max(category_counts, key=category_counts.get)
    
    # Reading goal progress (assuming 12 books per year)
    reading_goal_progress = min(total_books_read / 12 * 100, 100)
    
    stats = {
        'total_books_read': total_books_read,
        'total_time_seconds': total_time_seconds,
        'total_pages_read': total_pages_read,
        'current_streak_days': current_streak_days,
        'longest_streak_days': longest_streak,
        'favorite_category': favorite_category,
        'reading_goal_progress': reading_goal_progress
    }
    
    return Response({
        'in_progress': ReadingProgressSerializer(in_progress, many=True).data,
        'completed': ReadingProgressSerializer(completed, many=True).data,
        'liked_books': [
            {
                'id': str(book.id),
                'title': book.title,
                'author': book.author,
                'cover_image': book.cover_image,
                'created_at': book.created_at
            } for book in liked_books_data
        ],
        'bookmarked_books': [
            {
                'id': str(book.id),
                'title': book.title,
                'author': book.author,
                'cover_image': book.cover_image,
                'location': bookmark.location,
                'created_at': bookmark.created_at
            } for bookmark, book in zip(bookmarked_books, bookmarked_books_data)
        ],
        'stats': stats
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_reading_session(request, book_id):
    """Start a reading session"""
    try:
        book = Book.objects.get(id=book_id, is_published=True)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # End any existing session for this book
    ReadingSession.objects(
        user=str(request.user.id),
        book=book,
        ended_at__exists=False
    ).update(ended_at=timezone.now())
    
    # Start new session
    session = ReadingSession.objects.create(
        user=str(request.user.id),
        book=book,
        started_at=timezone.now()
    )
    
    return Response(ReadingSessionSerializer(session).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def end_reading_session(request, session_id):
    """End a reading session"""
    try:
        session = ReadingSession.objects.get(
            id=session_id,
            user=str(request.user.id),
            ended_at__exists=False
        )
    except ReadingSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
    
    session.ended_at = timezone.now()
    session.duration_seconds = int((session.ended_at - session.started_at).total_seconds())
    session.save()
    
    return Response(ReadingSessionSerializer(session).data)
