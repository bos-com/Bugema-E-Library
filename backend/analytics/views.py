from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, timedelta
from collections import Counter
from .models import EventLog
from catalog.models import Book, Category, BookLike
from reading.models import ReadingProgress


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_analytics_overview(request):
    """Get admin analytics overview"""
    if request.user.role != 'ADMIN':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    # Time range (last 30 days)
    end_date = timezone.now()
    start_date = end_date - timedelta(days=30)
    
    # Most read books
    most_read_books = Book.objects(
        is_published=True
    ).order_by('-view_count')[:10]
    
    # Most liked categories
    category_likes = {}
    for like in BookLike.objects():
        for category in like.book.categories:
            category_name = category.name
            category_likes[category_name] = category_likes.get(category_name, 0) + 1
    
    most_liked_categories = sorted(
        category_likes.items(),
        key=lambda x: x[1],
        reverse=True
    )[:10]
    
    # Reads per day (last 30 days)
    reads_per_day = []
    for i in range(30):
        date = start_date + timedelta(days=i)
        next_date = date + timedelta(days=1)
        
        # Count book opens on this day
        book_opens = EventLog.objects(
            event_type='OPEN_BOOK',
            created_at__gte=date,
            created_at__lt=next_date
        ).count()
        
        reads_per_day.append({
            'date': date.strftime('%Y-%m-%d'),
            'count': book_opens
        })
    
    # Active users (users who opened books in last 7 days)
    week_ago = timezone.now() - timedelta(days=7)
    active_users = EventLog.objects(
        event_type='OPEN_BOOK',
        created_at__gte=week_ago,
        user__exists=True
    ).distinct('user')
    
    # Top search terms
    search_events = EventLog.objects(
        event_type='SEARCH',
        created_at__gte=start_date
    )
    
    search_terms = []
    for event in search_events:
        query = event.payload.get('query', '')
        if query:
            search_terms.append(query.lower())
    
    top_search_terms = Counter(search_terms).most_common(10)
    
    # Total statistics
    total_books = Book.objects(is_published=True).count()
    total_categories = Category.objects.count()
    total_users = EventLog.objects(user__exists=True).distinct('user').count()
    total_reads = EventLog.objects(event_type='OPEN_BOOK').count()
    
    return Response({
        'overview': {
            'total_books': total_books,
            'total_categories': total_categories,
            'total_users': total_users,
            'total_reads': total_reads,
            'active_users_7d': len(active_users)
        },
        'most_read_books': [
            {
                'id': str(book.id),
                'title': book.title,
                'author': book.author,
                'view_count': book.view_count,
                'like_count': book.like_count
            } for book in most_read_books
        ],
        'most_liked_categories': [
            {'name': name, 'likes': likes} for name, likes in most_liked_categories
        ],
        'reads_per_day': reads_per_day,
        'top_search_terms': [
            {'term': term, 'count': count} for term, count in top_search_terms
        ]
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_reading_stats(request):
    """Get user's reading statistics"""
    user_id = str(request.user.id)
    
    # Time range (last 30 days)
    end_date = timezone.now()
    start_date = end_date - timedelta(days=30)
    
    # Reading progress data
    progress_data = ReadingProgress.objects(user=user_id)
    
    # Books read this month
    books_read_this_month = progress_data.filter(
        completed=True,
        updated_at__gte=start_date
    ).count()
    
    # Total reading time this month
    total_time_this_month = sum(
        progress.total_time_seconds for progress in 
        progress_data.filter(updated_at__gte=start_date)
    )
    
    # Reading streak
    current_streak = 0
    today = timezone.now().date()
    
    # Get reading sessions for streak calculation
    from reading.models import ReadingSession
    sessions = ReadingSession.objects(user=user_id).order_by('-started_at')
    if sessions:
        last_session_date = sessions[0].started_at.date()
        if last_session_date == today or last_session_date == today - timedelta(days=1):
            current_streak = 1
            for session in sessions[1:]:
                session_date = session.started_at.date()
                if session_date == last_session_date - timedelta(days=1):
                    current_streak += 1
                    last_session_date = session_date
                else:
                    break
    
    # Favorite categories
    category_counts = {}
    for progress in progress_data.filter(completed=True):
        for category in progress.book.categories:
            category_name = category.name
            category_counts[category_name] = category_counts.get(category_name, 0) + 1
    
    favorite_categories = sorted(
        category_counts.items(),
        key=lambda x: x[1],
        reverse=True
    )[:5]
    
    # Reading goal progress (assuming 12 books per year)
    books_read_this_year = progress_data.filter(
        completed=True,
        updated_at__year=timezone.now().year
    ).count()
    
    reading_goal_progress = min(books_read_this_year / 12 * 100, 100)
    
    return Response({
        'books_read_this_month': books_read_this_month,
        'total_time_this_month_seconds': total_time_this_month,
        'current_streak_days': current_streak,
        'favorite_categories': [
            {'name': name, 'count': count} for name, count in favorite_categories
        ],
        'reading_goal_progress': reading_goal_progress,
        'books_read_this_year': books_read_this_year
    })
