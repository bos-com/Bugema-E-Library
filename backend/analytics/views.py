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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_analytics_overview(request):
    """Get admin analytics overview (Refactored to use Django ORM)"""
    try:
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
        
        # --- Reads per hour (Peak usage times) ---
        # Group by hour of day (0-23)
        reads_per_hour_qs = BookView.objects.filter(
            viewed_at__gte=start_date
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
        
        serializer = AdminAnalyticsSerializer({
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
            'total_time_this_month_seconds': total_time_this_month
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