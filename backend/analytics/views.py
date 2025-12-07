from collections import Counter
import itertools
from datetime import timedelta

from django.db.models import Count, Sum
from django.db.models.functions import ExtractHour
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import BookView, SearchQuery
from .serializers import AdminAnalyticsSerializer, UserReadingStatsSerializer
from catalog.models import Book, Category, BookLike
from reading.models import ReadingProgress, ReadingSession


def get_period_date_range(period: str):
    """Get start date based on period parameter"""
    end_date = timezone.now()
    if period == 'today':
        start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == 'week':
        start_date = end_date - timedelta(days=7)
    elif period == 'year':
        start_date = end_date - timedelta(days=365)
    else:  # 'month' default
        start_date = end_date - timedelta(days=30)
    return start_date, end_date


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_analytics_overview(request):
    """Get admin analytics overview (Refactored to use Django ORM)"""
    try:
        if request.user.role != 'ADMIN':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get period parameters for different sections
        reads_period = request.query_params.get('reads_period', 'month')
        liked_period = request.query_params.get('liked_period', 'month')
        search_period = request.query_params.get('search_period', 'month')
        viewed_period = request.query_params.get('viewed_period', 'month')
        
        # --- Most Viewed Books (filtered by viewed_period) ---
        viewed_start_date, _ = get_period_date_range(viewed_period)
        
        # We need to aggregate BookView counts per book for the period
        most_viewed_books_qs = BookView.objects.filter(
            viewed_at__gte=viewed_start_date
        ).values('book').annotate(
            period_view_count=Count('id')
        ).order_by('-period_view_count')[:10]
        
        most_viewed_books = []
        for entry in most_viewed_books_qs:
            try:
                book = Book.objects.get(pk=entry['book'])
                most_viewed_books.append({
                    'id': str(book.pk),
                    'title': book.title,
                    'author': book.author.name if book.author else 'Unknown',
                    'view_count': entry['period_view_count'],
                    'like_count': book.like_count
                })
            except Book.DoesNotExist:
                continue

        # --- Most Liked Books (filtered by liked_period) ---
        liked_start_date, _ = get_period_date_range(liked_period)
        liked_in_period = BookLike.objects.filter(created_at__gte=liked_start_date)
        book_likes_count = {}
        for like in liked_in_period:
            book_id = like.book_id
            book_likes_count[book_id] = book_likes_count.get(book_id, 0) + 1
        
        top_liked_book_ids = sorted(book_likes_count.keys(), key=lambda x: book_likes_count[x], reverse=True)[:10]
        most_liked_books = []
        for book_id in top_liked_book_ids:
            try:
                book = Book.objects.get(pk=book_id, is_published=True)
                most_liked_books.append({
                    'id': str(book.pk),
                    'title': book.title,
                    'author': book.author.name if book.author else 'Unknown',
                    'like_count': book_likes_count[book_id]
                })
            except Book.DoesNotExist:
                continue
        
        # --- Most Liked Categories (filtered by liked_period) ---
        category_likes = {}
        for like in liked_in_period:
            for category in like.book.categories.all():
                category_name = category.name
                category_likes[category_name] = category_likes.get(category_name, 0) + 1
        
        most_liked_categories = sorted(
            category_likes.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
        
        # --- Reads per day (based on reads_period) ---
        reads_start_date, reads_end_date = get_period_date_range(reads_period)
        
        # If period is 'today', show hourly distribution for today
        if reads_period == 'today':
            reads_graph_data = []
            for i in range(24):
                hour_start = reads_end_date.replace(hour=i, minute=0, second=0, microsecond=0)
                hour_end = hour_start + timedelta(hours=1)
                
                count = BookView.objects.filter(
                    viewed_at__gte=hour_start,
                    viewed_at__lt=hour_end
                ).count()
                
                reads_graph_data.append({
                    'date': f"{i}:00", # Label as hour
                    'count': count
                })
        else:
            # For week/month/year, show daily distribution
            # Limit to last 30 days max for graph if period is huge, or show all days in period?
            # User asked for "accurate" data.
            days_to_show = (reads_end_date - reads_start_date).days + 1
            if days_to_show > 365: days_to_show = 365 # Cap at 1 year
            
            reads_graph_data = []
            for i in range(days_to_show):
                date = reads_start_date + timedelta(days=i)
                next_date = date + timedelta(days=1)
                
                book_opens = BookView.objects.filter(
                    viewed_at__gte=date,
                    viewed_at__lt=next_date
                ).count()
                
                reads_graph_data.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'count': book_opens
                })
        
        # --- Reads per hour (Peak usage times - All time or filtered?) ---
        # Usually peak usage is an aggregate pattern, so maybe keep it all time or use reads_period?
        # Let's use reads_period to be consistent with "Reading Activity" context
        reads_per_hour_qs = BookView.objects.filter(
            viewed_at__gte=reads_start_date
        ).annotate(
            hour=ExtractHour('viewed_at')
        ).values('hour').annotate(
            count=Count('id')
        ).order_by('hour')
        
        reads_per_hour = [
            {'hour': item['hour'], 'count': item['count']}
            for item in reads_per_hour_qs
        ]
        
        # --- Active users (users who viewed books in last 7 days) ---
        week_ago = timezone.now() - timedelta(days=7)
        active_user_ids = BookView.objects.filter(
            viewed_at__gte=week_ago
        ).values_list('user_id', flat=True).distinct()
        
        # --- Top search terms (filtered by search_period) ---
        search_start_date, _ = get_period_date_range(search_period)
        search_events = SearchQuery.objects.filter(
            searched_at__gte=search_start_date
        )
        
        search_terms = []
        for event in search_events:
            query = event.query 
            if query:
                search_terms.append(query.lower())
        
        top_search_terms = Counter(search_terms).most_common(10)
        
        # --- Total statistics ---
        total_books = Book.objects.filter(is_published=True).count()
        total_categories = Category.objects.count()
        
        # Total users
        all_view_users = BookView.objects.values_list('user_id', flat=True).distinct()
        all_search_users = SearchQuery.objects.filter(user__isnull=False).values_list('user_id', flat=True).distinct()
        total_user_ids = set(itertools.chain(all_view_users, all_search_users))
        total_users = len(total_user_ids)
        
        # Total reads filtered by reads_period
        total_reads_period = BookView.objects.filter(viewed_at__gte=reads_start_date).count()
        total_reads_all_time = BookView.objects.count()
        
        serializer = AdminAnalyticsSerializer({
            'overview': {
                'total_books': total_books,
                'total_categories': total_categories,
                'total_users': total_users,
                'total_reads': total_reads_all_time,
                'total_reads_period': total_reads_period,
                'active_users_7d': len(active_user_ids),
                'period': reads_period # Main period
            },
            'most_read_books': [
                {
                    'id': str(book['id']), 
                    'title': book['title'],
                    'author': book['author'],
                    'view_count': book['view_count'],
                    'like_count': book['like_count']
                } for book in most_viewed_books
            ],
            'most_liked_books': most_liked_books,
            'most_liked_categories': [
                {'name': name, 'likes': likes} for name, likes in most_liked_categories
            ],
            'reads_per_day': reads_graph_data,
            'reads_per_hour': reads_per_hour,
            'top_search_terms': [
                {'term': term, 'count': count} for term, count in top_search_terms
            ]
        })
        
        return Response(serializer.data)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Admin analytics overview error: {str(e)}", exc_info=True)
        
        return Response(
            {'error': 'Failed to fetch analytics', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_reading_stats(request):
    """Get user's reading statistics (Refactored to use Django ORM)"""
    try:
        # Use request.user.pk for ForeignKey lookup
        user_pk = request.user.pk 
        
        # Time range (last 30 days)
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)
        
        progress_data = ReadingProgress.objects.filter(user_id=user_pk).select_related('book')

        # Aggregate totals
        total_books_read = progress_data.filter(completed=True).count()
        total_time_seconds = progress_data.aggregate(total=Sum('total_time_seconds'))['total'] or 0
        total_pages_read = sum(
            progress.book.pages or 0
            for progress in progress_data.filter(completed=True)
            if progress.book
        )

        # Books read this month/year
        books_read_this_month = progress_data.filter(
            completed=True,
            updated_at__gte=start_date
        ).count()

        total_time_this_month = sum(
            progress.total_time_seconds for progress in 
            progress_data.filter(updated_at__gte=start_date)
        )

        books_read_this_year = progress_data.filter(
            completed=True,
            updated_at__year=timezone.now().year
        ).count()

        # Reading streak
        current_streak = 0
        longest_streak = 0
        today = timezone.now().date()
        
        # Get reading sessions for streak calculation (using Django ORM filter)
        sessions = ReadingSession.objects.filter(user_id=user_pk).order_by('-started_at')
        
        if sessions:
            session_dates = sorted({session.started_at.date() for session in sessions}, reverse=True)

            # Current streak (ending today/yesterday)
            if session_dates and (session_dates[0] == today or session_dates[0] == today - timedelta(days=1)):
                current_streak = 1
                target_date = today if session_dates[0] == today else today - timedelta(days=1)
                for date in session_dates[1:]:
                    expected = target_date - timedelta(days=1)
                    if date == expected:
                        current_streak += 1
                        target_date = expected
                    elif date < expected:
                        break

            # Longest streak over all dates
            streak = 0
            previous_date = None
            for date in sorted(session_dates):
                if previous_date and (date - previous_date).days == 1:
                    streak += 1
                else:
                    streak = 1
                longest_streak = max(longest_streak, streak)
                previous_date = date

        # Favorite categories
        category_counts = {}
        for progress in progress_data.filter(completed=True):
            if progress.book:
                for category in progress.book.categories.all():
                    category_name = category.name
                    category_counts[category_name] = category_counts.get(category_name, 0) + 1
        
        favorite_categories = sorted(
            category_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        favorite_category_name = favorite_categories[0][0] if favorite_categories else None
        
        # Reading goal progress (assuming 12 books per year)
        reading_goal_progress = min(books_read_this_year / 12 * 100, 100)

        # Pages daily activity (Last 14 days)
        pages_daily_activity = []
        for i in range(14):
            date = today - timedelta(days=i)
            # Sum pages_read of sessions started on this date
            day_pages = ReadingSession.objects.filter(
                user_id=user_pk,
                started_at__date=date
            ).aggregate(total_pages=Sum('pages_read'))
            
            pages = day_pages['total_pages'] or 0
            
            pages_daily_activity.append({
                'date': date.strftime('%Y-%m-%d'),
                'pages': pages
            })
        pages_daily_activity.reverse()

        serializer = UserReadingStatsSerializer({
            'total_books_read': total_books_read,
            'total_time_seconds': total_time_seconds,
            'total_pages_read': total_pages_read,
            'current_streak_days': current_streak,
            'longest_streak_days': longest_streak,
            'favorite_category': favorite_category_name,
            'favorite_categories': [
                {'name': name, 'count': count} for name, count in favorite_categories
            ],
            'reading_goal_progress': reading_goal_progress,
            'books_read_this_year': books_read_this_year,
            'books_read_this_month': books_read_this_month,
            'total_time_this_month_seconds': total_time_this_month,
            'pages_daily_activity': pages_daily_activity # Added field
        })

        return Response(serializer.data)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"User reading stats error for user {request.user.id}: {str(e)}", exc_info=True)
        
        return Response(
            {'error': 'Failed to fetch reading statistics', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )