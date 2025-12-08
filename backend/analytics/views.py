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
    """Get admin analytics overview (Optimized)"""
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
        
        most_viewed_books_qs = BookView.objects.filter(
            viewed_at__gte=viewed_start_date
        ).values('book').annotate(
            period_view_count=Count('id')
        ).order_by('-period_view_count')[:10]
        
        # Optimize: Fetch all books in one query
        book_ids = [entry['book'] for entry in most_viewed_books_qs]
        books_map = Book.objects.in_bulk(book_ids)
        
        most_viewed_books = []
        for entry in most_viewed_books_qs:
            book = books_map.get(entry['book'])
            if book:
                most_viewed_books.append({
                    'id': str(book.pk),
                    'title': book.title,
                    'author': book.author.name if book.author else 'Unknown',
                    'view_count': entry['period_view_count'],
                    'like_count': book.like_count
                })

        # --- Most Liked Books (filtered by liked_period) ---
        liked_start_date, _ = get_period_date_range(liked_period)
        
        # Optimize: Aggregate likes directly in DB
        top_liked_qs = BookLike.objects.filter(
            created_at__gte=liked_start_date
        ).values('book').annotate(
            like_count=Count('id')
        ).order_by('-like_count')[:10]
        
        liked_book_ids = [entry['book'] for entry in top_liked_qs]
        liked_books_map = Book.objects.in_bulk(liked_book_ids)
        
        most_liked_books = []
        for entry in top_liked_qs:
            book = liked_books_map.get(entry['book'])
            if book and book.is_published: # Ensure only published books
                most_liked_books.append({
                    'id': str(book.pk),
                    'title': book.title,
                    'author': book.author.name if book.author else 'Unknown',
                    'like_count': entry['like_count']
                })
        
        # --- Most Liked Categories (filtered by liked_period) ---
        # Optimize: Use reverse relationship from Category to BookLike (through Book)
        # Note: This is complex because BookLike -> Book -> Category (Many-to-Many)
        # We'll stick to the previous method if efficient enough, or optimize:
        # Category -> books -> likes
        
        # Alternative: Fetch all likes with related book and categories pre-fetched
        liked_in_period = BookLike.objects.filter(
            created_at__gte=liked_start_date
        ).select_related('book').prefetch_related('book__categories')
        
        category_likes = {}
        for like in liked_in_period:
            if like.book:
                for category in like.book.categories.all():
                    category_name = category.name
                    category_likes[category_name] = category_likes.get(category_name, 0) + 1
        
        most_liked_categories = sorted(
            category_likes.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
        
        # --- Reads per day/hour (Graph Data - Optimized) ---
        reads_start_date, reads_end_date = get_period_date_range(reads_period)
        
        reads_graph_data = []
        if reads_period == 'today':
            # Hourly aggregation
            from django.db.models.functions import TruncHour
            hourly_counts = BookView.objects.filter(
                viewed_at__gte=reads_start_date,
                viewed_at__lte=reads_end_date
            ).annotate(
                hour=TruncHour('viewed_at')
            ).values('hour').annotate(
                count=Count('id')
            ).order_by('hour')
            
            # Convert to dictionary for easy lookup
            counts_map = {item['hour'].hour: item['count'] for item in hourly_counts}
            
            # Fill all 24 hours
            for i in range(24):
                reads_graph_data.append({
                    'date': f"{i}:00",
                    'count': counts_map.get(i, 0)
                })
        else:
            # Daily aggregation
            from django.db.models.functions import TruncDate
            daily_counts = BookView.objects.filter(
                viewed_at__gte=reads_start_date,
                viewed_at__lte=reads_end_date
            ).annotate(
                day=TruncDate('viewed_at')
            ).values('day').annotate(
                count=Count('id')
            ).order_by('day')
            
            # Convert to dict
            counts_map = {item['day']: item['count'] for item in daily_counts if item['day']}
            
            # Fill days in range
            days_to_show = (reads_end_date - reads_start_date).days + 1
            if days_to_show > 365: days_to_show = 365
            
            for i in range(days_to_show):
                date = (reads_start_date + timedelta(days=i)).date()
                reads_graph_data.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'count': counts_map.get(date, 0)
                })

        # --- Reads per hour (Peak usage - All Time/Period) ---
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
        # Use count(distinct=True) instead of len(list)
        active_users_count = BookView.objects.filter(
            viewed_at__gte=week_ago
        ).values('user_id').distinct().count()
        
        # --- Top search terms (filtered by search_period) ---
        search_start_date, _ = get_period_date_range(search_period)
        # Using DB aggregation for top terms if possible, but queries are strings.
        # Python Counter is fine if dataset isn't huge.
        search_terms = SearchQuery.objects.filter(
            searched_at__gte=search_start_date
        ).values_list('query', flat=True)
        
        top_search_terms = Counter([t.lower() for t in search_terms if t]).most_common(10)
        
        # --- Total statistics ---
        total_books = Book.objects.filter(is_published=True).count()
        total_categories = Category.objects.count()
        
        # Total users (Aggregation)
        # This one is tricky to do in one query because it unions two tables.
        # Stick to Python set for now or optimize if needed.
        all_view_users = set(BookView.objects.values_list('user_id', flat=True))
        all_search_users = set(SearchQuery.objects.filter(user__isnull=False).values_list('user_id', flat=True))
        total_users = len(all_view_users.union(all_search_users))
        
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
                'active_users_7d': active_users_count,
                'period': reads_period
            },
            'most_read_books': most_viewed_books,
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
    """Get user's reading statistics (Optimized)"""
    try:
        # Use request.user.pk for ForeignKey lookup
        user_pk = request.user.pk 
        
        # Time range (last 30 days)
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)
        
        progress_data = ReadingProgress.objects.filter(user_id=user_pk).select_related('book')

        # Aggregate totals directly in DB where possible
        total_books_read = progress_data.filter(completed=True).count()
        
        # Aggregations
        aggregates = progress_data.aggregate(
            total_time=Sum('total_time_seconds'),
            # For total pages, we need to filter completed first, but aggregate() acts on queryset
            # So we calculate separately or use conditional aggregation
        )
        total_time_seconds = aggregates['total_time'] or 0
        
        # Total Pages (Completed books only)
        # Using db aggregation is faster than python sum loop
        total_pages_read = progress_data.filter(completed=True).aggregate(
            total=Sum('book__pages')
        )['total'] or 0

        # Books read this month/year
        books_read_this_month = progress_data.filter(
            completed=True,
            updated_at__gte=start_date
        ).count()

        total_time_this_month = progress_data.filter(
            updated_at__gte=start_date
        ).aggregate(total=Sum('total_time_seconds'))['total'] or 0

        books_read_this_year = progress_data.filter(
            completed=True,
            updated_at__year=timezone.now().year
        ).count()

        # Reading streak
        current_streak = 0
        longest_streak = 0
        today = timezone.now().date()
        
        # Get reading sessions dates (distinct)
        # Optimize: distinct dates only
        session_dates = list(ReadingSession.objects.filter(
            user_id=user_pk
        ).values_list('started_at__date', flat=True).distinct().order_by('-started_at__date'))
        
        if session_dates:
            # Dates are already sorted desc
            latest_date = session_dates[0]
            
            # Current streak checks
            if latest_date == today or latest_date == today - timedelta(days=1):
                current_streak = 1
                streak_date = latest_date
                
                for i in range(1, len(session_dates)):
                    prev_date = session_dates[i]
                    if (streak_date - prev_date).days == 1:
                        current_streak += 1
                        streak_date = prev_date
                    else:
                        break
            
            # Longest streak calculation
            temp_streak = 1
            longest_streak = 1
            # Sort ascending for longest streak logic
            sorted_dates = sorted(session_dates)
            for i in range(1, len(sorted_dates)):
                if (sorted_dates[i] - sorted_dates[i-1]).days == 1:
                    temp_streak += 1
                else:
                    longest_streak = max(longest_streak, temp_streak)
                    temp_streak = 1
            longest_streak = max(longest_streak, temp_streak)

        # Favorite categories
        # Enhance: Could be optimized with aggregation but ManyToMany makes it tricky without annotation
        # Keep python logic for now as it's not the main bottleneck (limited by user's books)
        category_counts = Counter()
        for progress in progress_data.filter(completed=True):
            if progress.book:
                for category in progress.book.categories.all():
                    category_counts[category.name] += 1
        
        favorite_categories = category_counts.most_common(5)
        favorite_category_name = favorite_categories[0][0] if favorite_categories else None
        
        # Reading goal progress (assuming 12 books per year)
        reading_goal_progress = min(books_read_this_year / 12 * 100, 100)

        # Pages daily activity (Last 14 days) - OPTIMIZED
        # Single query instead of 14
        activity_start = today - timedelta(days=13) # Go back 13 days + today = 14
        
        from django.db.models.functions import TruncDate
        daily_pages = ReadingSession.objects.filter(
            user_id=user_pk,
            started_at__date__gte=activity_start
        ).annotate(
            day=TruncDate('started_at')
        ).values('day').annotate(
            total_pages=Sum('pages_read')
        ).order_by('day')
        
        # Convert to map
        pages_map = {item['day']: item['total_pages'] for item in daily_pages if item['day']}
        
        pages_daily_activity = []
        for i in range(14):
            date = today - timedelta(days=i)
            pages_daily_activity.append({
                'date': date.strftime('%Y-%m-%d'),
                'pages': pages_map.get(date, 0)
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
            'pages_daily_activity': pages_daily_activity
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