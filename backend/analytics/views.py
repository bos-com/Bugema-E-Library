from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count # Import Count for aggregation
from datetime import datetime, timedelta
from collections import Counter
import itertools

# IMPORTANT: Replaced EventLog with the new Django ORM models
from .models import BookView, SearchQuery 
from catalog.models import Book, Category, BookLike
from reading.models import ReadingProgress, ReadingSession


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_analytics_overview(request):
    """Get admin analytics overview (Refactored to use Django ORM)"""
    if request.user.role != 'ADMIN':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    # Time range (last 30 days)
    end_date = timezone.now()
    start_date = end_date - timedelta(days=30)
    
    # --- Most Read Books (using Django ORM syntax) ---
    most_read_books = Book.objects.filter(
        is_published=True
    ).order_by('-view_count')[:10]
    
    # --- Most Liked Categories (using Django ORM syntax) ---
    category_likes = {}
    # Iterate through all BookLike objects
    for like in BookLike.objects.all():
        # book.categories is a ManyToMany relationship, so we use .all()
        for category in like.book.categories.all():
            category_name = category.name
            category_likes[category_name] = category_likes.get(category_name, 0) + 1
    
    most_liked_categories = sorted(
        category_likes.items(),
        key=lambda x: x[1],
        reverse=True
    )[:10]
    
    # --- Reads per day (last 30 days) ---
    reads_per_day = []
    for i in range(30):
        date = start_date + timedelta(days=i)
        next_date = date + timedelta(days=1)
        
        # Count book opens using the new BookView model
        book_opens = BookView.objects.filter(
            viewed_at__gte=date,
            viewed_at__lt=next_date
        ).count()
        
        reads_per_day.append({
            'date': date.strftime('%Y-%m-%d'),
            'count': book_opens
        })
    
    # --- Active users (users who viewed books in last 7 days) ---
    week_ago = timezone.now() - timedelta(days=7)
    # Get distinct user IDs from BookView (the open-book event replacement)
    active_user_ids = BookView.objects.filter(
        viewed_at__gte=week_ago
    ).values_list('user_id', flat=True).distinct()
    
    # --- Top search terms (using SearchQuery model) ---
    search_events = SearchQuery.objects.filter(
        searched_at__gte=start_date
    )
    
    search_terms = []
    for event in search_events:
        # SearchQuery has a direct 'query' field, no longer a 'payload' dict
        query = event.query 
        if query:
            search_terms.append(query.lower())
    
    top_search_terms = Counter(search_terms).most_common(10)
    
    # --- Total statistics ---
    total_books = Book.objects.filter(is_published=True).count()
    total_categories = Category.objects.count()
    
    # Total users who have performed an action (viewed a book or searched)
    all_view_users = BookView.objects.values_list('user_id', flat=True).distinct()
    all_search_users = SearchQuery.objects.filter(user__isnull=False).values_list('user_id', flat=True).distinct()
    
    # Combine and count distinct user IDs from both querysets
    total_user_ids = set(itertools.chain(all_view_users, all_search_users))
    total_users = len(total_user_ids)
    
    # Total reads are now total BookView records
    total_reads = BookView.objects.count()
    
    return Response({
        'overview': {
            'total_books': total_books,
            'total_categories': total_categories,
            'total_users': total_users,
            'total_reads': total_reads,
            'active_users_7d': len(active_user_ids)
        },
        'most_read_books': [
            {
                # Django IDs are int/UUID, we ensure they are string for JSON safety
                'id': str(book.pk), 
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
    """Get user's reading statistics (Refactored to use Django ORM)"""
    # Use request.user.pk for ForeignKey lookup
    user_pk = request.user.pk 
    
    # Time range (last 30 days)
    end_date = timezone.now()
    start_date = end_date - timedelta(days=30)
    
    # Reading progress data (using Django ORM filter)
    # Assuming ReadingProgress.user is a ForeignKey
    progress_data = ReadingProgress.objects.filter(user_id=user_pk)
    
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
    
    # Get reading sessions for streak calculation (using Django ORM filter)
    sessions = ReadingSession.objects.filter(user_id=user_pk).order_by('-started_at')
    
    if sessions:
        last_session_date = sessions[0].started_at.date()
        
        # Check if the streak includes today or yesterday
        if last_session_date == today or last_session_date == today - timedelta(days=1):
            current_streak = 1
            for session in sessions[1:]:
                session_date = session.started_at.date()
                # Check for consecutive day
                if session_date == last_session_date - timedelta(days=1):
                    current_streak += 1
                    last_session_date = session_date
                # Break if day is before the last consecutive day
                elif session_date < last_session_date - timedelta(days=1):
                    break
                # Ignore multiple sessions on the same day
                # else: pass
        
    
    # Favorite categories
    category_counts = {}
    for progress in progress_data.filter(completed=True):
        # Accessing ManyToMany field requires .all()
        for category in progress.book.categories.all():
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