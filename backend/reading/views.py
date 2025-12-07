from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta
from django.db.models import Sum, Avg, Q, Count, F
from django.db.models.functions import ExtractHour, ExtractWeekDay

from .models import ReadingProgress, ReadingSession, Highlight
from .serializers import ReadingProgressSerializer, ReadingSessionSerializer, HighlightSerializer
# Assuming ReadingStatsSerializer is also available, though not used directly in views.
# from .serializers import ReadingStatsSerializer 
from catalog.models import Book, BookLike, Bookmark
from analytics.models import BookView
def _absolute_media_url(request, file_field):
    if not file_field:
        return None
    url = file_field.url if hasattr(file_field, 'url') else file_field
    return request.build_absolute_uri(url) if request else url


# --- FIX: Removed the failing import from analytics.models import EventLog ---
# The previous NoSQL EventLog model is not available in the Django ORM context.

class ReadingProgressView(generics.RetrieveUpdateAPIView):
    """Get or update reading progress for a book."""
    serializer_class = ReadingProgressSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'book_id' # This is fine for Django ORM lookups

    def get_queryset(self):
        # FIX: Changed MongoEngine 'objects()' to Django ORM 'objects.filter()' 
        # and use the User object directly instead of str(ID).
        return ReadingProgress.objects.filter(user=self.request.user)
    
    def get_object(self):
        book_id = self.kwargs.get('book_id')
        
        # FIX: Ensure Book exists using Django ORM syntax
        try:
            book = Book.objects.get(pk=book_id, is_published=True)
        except Book.DoesNotExist:
            return None
        
        # FIX: Converted MongoEngine get_or_create syntax to Django ORM syntax
        progress, created = ReadingProgress.objects.get_or_create(
            user=self.request.user, # Use the User object directly
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
        current_page = request.data.get('current_page', progress.current_page)
        percent = request.data.get('percent', progress.percent)
        time_spent = request.data.get('time_spent', 0)
        
        # Calculate percent from page if book has pages and current_page is provided
        if 'current_page' in request.data and progress.book.pages:
            total_pages = progress.book.pages
            if total_pages > 0:
                percent = (float(current_page) / float(total_pages)) * 100
        
        progress.last_location = last_location
        progress.current_page = int(current_page)
        # Ensure conversion before assignment
        progress.percent = float(percent)
        progress.total_time_seconds += int(time_spent)
        progress.last_opened_at = timezone.now()
        # Auto-complete at 95% or higher
        progress.completed = progress.percent >= 95.0
        progress.updated_at = timezone.now()
        progress.save()
        
        serializer = self.get_serializer(progress)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_dashboard(request):
    """Get user dashboard data"""
    user = request.user
    today = timezone.now().date()
    period = request.query_params.get('period', 'all')
    
    try:
        # Determine start date for period
        start_date = None
        if period == 'today':
            start_date = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == 'week':
            start_date = timezone.now() - timedelta(days=7)
        elif period == 'month':
            start_date = timezone.now() - timedelta(days=30)
        elif period == 'year':
            start_date = timezone.now() - timedelta(days=365)
            
        # Get reading progress (General lists not filtered by period usually, but stats will be)
        in_progress = ReadingProgress.objects.filter(
            user=user,
            completed=False
        ).order_by('-last_opened_at')[:10]
        
        completed = ReadingProgress.objects.filter(
            user=user,
            completed=True
        ).order_by('-updated_at')[:10]
        
        # ... (liked/bookmarked books code unchanged) ...
        liked_books = BookLike.objects.filter(user=user).select_related('book').order_by('-created_at')[:10]
        liked_book_ids = [like.book_id for like in liked_books]
        liked_books_data = Book.objects.filter(pk__in=liked_book_ids, is_published=True).order_by('-created_at')
        
        bookmarked_books_qs = Bookmark.objects.filter(user=user).select_related('book').order_by('-created_at')[:10]
        bookmarked_book_ids = [bookmark.book_id for bookmark in bookmarked_books_qs]
        bookmarked_books_data = Book.objects.filter(pk__in=bookmarked_book_ids, is_published=True)
        
        # Calculate stats
        # Total books read (if period is all, all time. If period specific, in that period)
        completed_qs = ReadingProgress.objects.filter(user=user, completed=True)
        if start_date:
            completed_qs = completed_qs.filter(updated_at__gte=start_date)
        total_books_read = completed_qs.count()
        
        # Total time (sum of sessions in period)
        sessions_qs = ReadingSession.objects.filter(user=user)
        if start_date:
            sessions_qs = sessions_qs.filter(started_at__gte=start_date)
            
        time_sum = sessions_qs.aggregate(Sum('duration_seconds'))
        total_time_seconds = time_sum['duration_seconds__sum'] or 0
        
        # Total pages read
        try:
            # Try specific activity tracking first (requires migration)
            pages_sum = sessions_qs.aggregate(Sum('pages_read'))
            total_pages_read = pages_sum['pages_read__sum'] or 0
        except Exception:
            # Fallback to legacy logic (books completed) if migration missing
            total_pages_read = sum(
                progress.book.pages or 0 for progress in 
                completed_qs.select_related('book')
            )
        
        # ... (streak and other stats) ...
        # Improved Streak Calculation (Streak is generally "current", not dependent on period view usually?)
        # User wants "data according to duration". But streak is "current status". Keep streak as is.
        current_streak_days = 0
        longest_streak = 0
        
        # Get all dates with reading activity (from sessions) - All time needed for streak
        all_sessions = ReadingSession.objects.filter(user=user).order_by('-started_at')
        
        if all_sessions.exists():
            # Get unique dates, sorted descending
            session_dates = sorted(
                list(set(s.started_at.astimezone(timezone.get_current_timezone()).date() for s in all_sessions)), 
                reverse=True
            )
            
            # Calculate Current Streak
            if session_dates and (session_dates[0] == today or session_dates[0] == today - timedelta(days=1)):
                current_streak_days = 1
                expected_date = session_dates[0] - timedelta(days=1)
                
                for date in session_dates[1:]:
                    if date == expected_date:
                        current_streak_days += 1
                        expected_date -= timedelta(days=1)
                    elif date < expected_date:
                        break
            
            # Calculate Longest Streak
            current_sequence = 0
            longest_streak = 0
            if session_dates:
                dates_asc = sorted(session_dates)
                current_sequence = 1
                longest_streak = 1
                for i in range(1, len(dates_asc)):
                    if dates_asc[i] == dates_asc[i-1] + timedelta(days=1):
                        current_sequence += 1
                    else:
                        current_sequence = 1
                    longest_streak = max(longest_streak, current_sequence)

        # ... (Average session, likes, bookmarks) ...
        # Reading goal progress
        books_read_year = ReadingProgress.objects.filter(
            user=user, 
            completed=True, 
            updated_at__year=today.year
        ).count()
        reading_goal_progress = min(books_read_year / 12 * 100, 100)
        
        # Average session duration (in period?)
        avg_session_qs = ReadingSession.objects.filter(user=user, ended_at__isnull=False)
        if start_date:
            avg_session_qs = avg_session_qs.filter(started_at__gte=start_date)
        avg_session = avg_session_qs.aggregate(avg=Avg('duration_seconds'))
        average_session_seconds = avg_session['avg'] or 0
        
        total_likes = BookLike.objects.filter(user=user).count()
        total_bookmarks = Bookmark.objects.filter(user=user).count()
        
        # Favorite Category
        favorite_category = None
        category_counts = {}
        # Use completed books in period for favorite category? Or all time? 
        # Usually "My stats" implies current state. But if filtering... let's filter.
        for progress in completed_qs.select_related('book'):
             if progress.book_id:
                for category in progress.book.categories.all():
                    category_name = category.name
                    if category_name:
                        category_counts[category_name] = category_counts.get(category_name, 0) + 1
        if category_counts:
             favorite_category = max(category_counts, key=category_counts.get)

        # Daily Activity (Last 14 days) - Fixed for chart
        daily_activity = []
        for i in range(14):
            date = today - timedelta(days=i)
            day_sessions = ReadingSession.objects.filter(
                user=user,
                started_at__date=date
            ).aggregate(total_time=Sum('duration_seconds'))
            
            minutes = round((day_sessions['total_time'] or 0) / 60)
            
            daily_activity.append({
                'date': date.strftime('%Y-%m-%d'),
                'minutes': minutes
            })
        daily_activity.reverse()

        # Streak History
        streak_history = []
        for i in range(30):
            date = today - timedelta(days=29-i)
            # Optimize: check if date in session_datesset?
            # Re-querying in loop is okay for 30 items
            has_reading = ReadingSession.objects.filter(
                user=user,
                started_at__date=date
            ).exists()
            streak_history.append({
                'date': date.strftime('%Y-%m-%d'),
                'read': has_reading
            })

        stats = {
            'total_books_read': total_books_read,
            'total_time_seconds': total_time_seconds,
            'total_pages_read': total_pages_read,
            'current_streak_days': current_streak_days,
            'longest_streak_days': longest_streak,
            'favorite_category': favorite_category,
            'reading_goal_progress': reading_goal_progress,
            'total_likes': total_likes,
            'total_bookmarks': total_bookmarks,
            'average_session_seconds': average_session_seconds,
            'daily_activity': daily_activity,
            'streak_history': streak_history,
        }
        
        serializer_context = {'request': request}
        response_data = {
            'in_progress': ReadingProgressSerializer(in_progress, many=True, context=serializer_context).data,
            'completed': ReadingProgressSerializer(completed, many=True, context=serializer_context).data,
            'liked_books': [
                {
                    'id': str(book.id),
                    'title': book.title,
                    'author': book.author.name if book.author else "Unknown",
                    'cover_image': _absolute_media_url(request, book.cover_image),
                    'created_at': book.created_at
                } for book in liked_books_data
            ],
            'bookmarked_books': [
                {
                    'id': str(book.id),
                    'title': book.title,
                    'author': book.author.name if book.author else "Unknown",
                    'cover_image': _absolute_media_url(request, book.cover_image),
                    'location': next((b.location for b in bookmarked_books_qs if b.book_id == book.id), None),
                    'created_at': next((b.created_at for b in bookmarked_books_qs if b.book_id == book.id), None),
                } for book in bookmarked_books_data
            ],
            'stats': stats
        }
        
        return Response(response_data)
    
    except Exception as e:
        # Log the error for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Dashboard error for user {user.id}: {str(e)}", exc_info=True)
        
        # Return a graceful error response
        return Response({
            'error': 'Unable to load dashboard data',
            'in_progress': [],
            'completed': [],
            'liked_books': [],
            'bookmarked_books': [],
            'stats': {
                'total_books_read': 0,
                'total_time_seconds': 0,
                'total_pages_read': 0,
                'current_streak_days': 0,
                'longest_streak_days': 0,
                'favorite_category': None,
                'reading_goal_progress': 0,
                'total_likes': 0,
                'total_bookmarks': 0,
            }
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_reading_session(request, book_id):
    """Start a reading session"""
    # FIX: Use standard get_object_or_404
    book = get_object_or_404(Book, pk=book_id, is_published=True)
    
    # FIX: Converted MongoEngine update logic to Django ORM filter().update()
    # ended_at__exists=False becomes ended_at__isnull=True
    ReadingSession.objects.filter(
        user=request.user, # Use User object
        book=book,
        ended_at__isnull=True
    ).update(ended_at=timezone.now())
    
    # Create BookView record for analytics
    BookView.objects.create(
        user=request.user,
        book=book
    )
    
    # Start new session
    # FIX: Converted MongoEngine create to Django ORM create
    session = ReadingSession.objects.create(
        user=request.user, # Use User object
        book=book,
        started_at=timezone.now()
    )
    
    return Response(ReadingSessionSerializer(session).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def end_reading_session(request, session_id):
    """End a reading session"""
    try:
        # FIX: Converted MongoEngine get() logic to Django ORM get()
        # id=session_id becomes pk=session_id
        # ended_at__exists=False becomes ended_at__isnull=True
        session = ReadingSession.objects.get(
            pk=session_id,
            user=request.user, # Use User object
            ended_at__isnull=True
        )
    except ReadingSession.DoesNotExist:
        return Response({'error': 'Session not found or already ended'}, status=status.HTTP_404_NOT_FOUND)
    
    session.ended_at = timezone.now()
    session.duration_seconds = int((session.ended_at - session.started_at).total_seconds())
    session.save()
    
    return Response(ReadingSessionSerializer(session).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_or_create_active_session(request, book_id):
    """Get active session or create a new one for a book"""
    book = get_object_or_404(Book, pk=book_id, is_published=True)
    
    # Check for existing active session
    active_session = ReadingSession.objects.filter(
        user=request.user,
        book=book,
        ended_at__isnull=True
    ).first()
    
    if active_session:
        return Response(ReadingSessionSerializer(active_session).data)
    
    # Create new session
    session = ReadingSession.objects.create(
        user=request.user,
        book=book,
        started_at=timezone.now()
    )
    
    return Response(ReadingSessionSerializer(session).data, status=status.HTTP_201_CREATED)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_session_progress(request, session_id):
    """Update reading session with current progress"""
    try:
        session = ReadingSession.objects.get(
            pk=session_id,
            user=request.user,
            ended_at__isnull=True
        )
    except ReadingSession.DoesNotExist:
        return Response({'error': 'Active session not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Update session duration
    now = timezone.now()
    # Calculate duration since last update or start
    # We need to be careful not to double count. 
    # Simplest way: Calculate total duration of session and update.
    # But for ReadingProgress, we need the *delta* added since last time?
    # actually, ReadingProgress.total_time_seconds is a cumulative counter.
    # So we should probably add the difference between now and the last time we updated.
    # However, we don't store "last_updated_time" for the session specifically for this calculation in a granular way easily without risk.
    # Better approach: Calculate the new total duration of the session.
    # The contribution of this session to the total book time is (new_duration - old_duration).
    
    old_duration = session.duration_seconds
    new_duration = int((now - session.started_at).total_seconds())
    
    session.duration_seconds = new_duration
    session.save()
    
    # Calculate time delta to add to ReadingProgress
    time_delta = new_duration - old_duration
    
    # Also update reading progress if data provided
    current_page = request.data.get('current_page')
    percent = request.data.get('percent')
    location = request.data.get('location')
    
    # Always update progress time if there is a delta, even if no page change
    # But we need a progress object.
    progress, created = ReadingProgress.objects.get_or_create(
        user=request.user,
        book=session.book,
        defaults={
            'last_location': location or '0',
            'current_page': current_page or 0,
            'percent': percent or 0.0,
            'total_time_seconds': 0
        }
    )
    
    # Calculate Page Delta
    if current_page is not None:
        old_page = progress.current_page
        new_page = int(current_page)
        # Only count forward progress for statistics? 
        # Or count any pages read? Usually "pages read" means volume.
        # But if I flip back and forth, does it count?
        # Let's assume net progress for now to avoid gaming, or just simple absolute difference?
        # Standard: max(0, new - old).
        pages_delta = max(0, new_page - old_page)
        
        if pages_delta > 0:
            session.pages_read += pages_delta
            session.save()
            
    if time_delta > 0:
        progress.total_time_seconds += time_delta

    if not created:
        if location:
            progress.last_location = location
        if current_page is not None:
            progress.current_page = int(current_page)
            # Calculate percent from page if book has pages
            if session.book.pages and session.book.pages > 0:
                progress.percent = (float(current_page) / float(session.book.pages)) * 100
        elif percent is not None:
            progress.percent = float(percent)
        
        progress.last_opened_at = timezone.now()
        progress.completed = progress.percent >= 95.0
        progress.save()
    else:
        # If created, we might still need to save the time_delta if it was > 0 (unlikely on create but possible if logic changes)
        if time_delta > 0:
             progress.save()
    
    return Response(ReadingSessionSerializer(session).data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def book_highlights(request, book_id):
    """Get all highlights for a book or create a new highlight"""
    book = get_object_or_404(Book, pk=book_id, is_published=True)
    
    if request.method == 'GET':
        # Get all highlights for this book by this user
        highlights = Highlight.objects.filter(
            user=request.user,
            book=book
        ).order_by('page_number', 'created_at')
        
        serializer = HighlightSerializer(highlights, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Create a new highlight
        data = request.data.copy()
        data['book'] = book.id
        
        serializer = HighlightSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def highlight_detail(request, highlight_id):
    """Update or delete a specific highlight"""
    try:
        highlight = Highlight.objects.get(
            pk=highlight_id,
            user=request.user
        )
    except Highlight.DoesNotExist:
        return Response(
            {'error': 'Highlight not found or you do not have permission to access it'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'PATCH':
        # Update highlight (note or color)
        serializer = HighlightSerializer(highlight, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Delete highlight
        highlight.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_analytics(request):
    user = request.user
    period = request.query_params.get('period', 'week')
    today = timezone.now().date()
    
    # Determine date range
    if period == 'month':
        start_date = today - timedelta(days=29) # Last 30 days
        days_range = 30
    elif period == 'year':
        start_date = today - timedelta(days=364) # Last 365 days
        days_range = 365
    else: # week
        start_date = today - timedelta(days=6) # Last 7 days
        days_range = 7
        
    # 1. Hourly Distribution (based on period)
    hourly_stats = ReadingSession.objects.filter(
        user=user,
        started_at__date__gte=start_date,
        started_at__isnull=False
    ).annotate(
        hour=ExtractHour('started_at')
    ).values('hour').annotate(
        count=Count('id'),
        total_minutes=Sum('duration_seconds') / 60
    ).order_by('hour')
    
    hourly_data = [{'hour': i, 'minutes': 0} for i in range(24)]
    for stat in hourly_stats:
        hour = stat['hour']
        if 0 <= hour < 24:
            hourly_data[hour]['minutes'] = round(stat['total_minutes'] or 0)
            
    # 2. Daily Distribution (replaces weekly_distribution)
    daily_stats = ReadingSession.objects.filter(
        user=user,
        started_at__date__gte=start_date,
        started_at__isnull=False
    ).annotate(
        date=F('started_at__date')
    ).values('date').annotate(
        total_minutes=Sum('duration_seconds') / 60
    ).order_by('date')
    
    # Create map for easy lookup
    stats_map = {stat['date']: stat['total_minutes'] for stat in daily_stats if stat['date']}
    
    daily_distribution = []
    for i in range(days_range):
        date = start_date + timedelta(days=i)
        minutes = round(stats_map.get(date, 0))
        daily_distribution.append({
            'date': date.strftime('%Y-%m-%d'),
            'day_name': date.strftime('%a'), # Mon, Tue
            'full_day_name': date.strftime('%A'), # Monday, Tuesday
            'minutes': minutes
        })

    # 3. Streak History (Last 30 days always, or match period?)
    streak_history = []
    for i in range(30):
        date = today - timedelta(days=29-i)
        has_reading = ReadingSession.objects.filter(
            user=user,
            started_at__date=date
        ).exists()
        streak_history.append({
            'date': date.strftime('%Y-%m-%d'),
            'read': has_reading
        })
    
    # ... (previous code)

    # 4. Pages Distribution (Daily)
    pages_daily_activity = []
    try:
        pages_stats = ReadingSession.objects.filter(
            user=user,
            started_at__date__gte=start_date,
            started_at__isnull=False
        ).annotate(
            date=F('started_at__date')
        ).values('date').annotate(
            total_pages=Sum('pages_read')
        ).order_by('date')
        
        pages_map = {stat['date']: stat['total_pages'] for stat in pages_stats if stat['date']}
        
        for i in range(days_range):
            date = start_date + timedelta(days=i)
            pages = pages_map.get(date, 0)
            pages_daily_activity.append({
                'date': date.strftime('%Y-%m-%d'),
                'pages': pages
            })
    except Exception:
        pass # Return empty list if migration missing

    # 5. Completion Stats (General)
    total_book_progress = ReadingProgress.objects.filter(user=user)
    total_books = total_book_progress.count()
    completed_books = total_book_progress.filter(completed=True).count()
    completion_rate = (completed_books / total_books * 100) if total_books > 0 else 0
    
    # Total pages read (all time)
    # Using session sum for accuracy if pages_read populated, 
    # but since it's new, we might need fallback or just sum what we have.
    # Older logic used book.pages sum. Let's use that for "Total Pages Read" card consistency
    # or better: sum of pages_read in sessions (accurate activity) + maybe legacy estimate?
    # User wants "accurate". Session sum is accurate for NEW activity. Old activity has 0 pages_read.
    # If we want to show total pages ever read, book.pages for completed books is a fair proxy for old data.
    # But "Pages Read" graph needs session data.
    # Let's provide both or just session sum for graph.
    # The frontend uses `total_pages_read` for the card.
    
    # Calculate total pages read (from sessions)
    try:
        total_pages_read_sessions = ReadingSession.objects.filter(user=user).aggregate(t=Sum('pages_read'))['t'] or 0
    except Exception:
        total_pages_read_sessions = 0
    
    # Calculate total pages read (from completed books - legacy proxy)
    total_pages_read_books = sum(p.book.pages or 0 for p in total_book_progress.filter(completed=True).select_related('book'))
    
    # Use the larger one? or just session one if we migrate?
    # Since we can't migrate old session data easily to pages_read without complex logic, 
    # maybe just return what we have.
    # Let's return `total_pages_read` from `user_dashboard` logic (books based) as `total_pages_read`
    # AND `pages_daily_activity` for the graph.
    
    total_pages_read = total_pages_read_books

    # Categories
    categories_data = []
    try:
        category_counts = {}
        for progress in total_book_progress.filter(completed=True).select_related('book'):
            if progress.book:
                for category in progress.book.categories.all():
                    name = category.name
                    category_counts[name] = category_counts.get(name, 0) + 1
        
        categories_data = [{'name': k, 'value': v} for k, v in category_counts.items()]
        categories_data.sort(key=lambda x: x['value'], reverse=True)
    except Exception:
        categories_data = []

    return Response({
        'hourly_distribution': hourly_data,
        'daily_distribution': daily_distribution,
        'weekly_distribution': daily_distribution,
        'streak_history': streak_history,
        'pages_daily_activity': pages_daily_activity, # New field
        'total_pages_read': total_pages_read, # Included for convenience
        'completion_stats': {
            'rate': round(completion_rate),
            'total': total_books,
            'completed': completed_books,
            'by_category': categories_data
        }
    })
