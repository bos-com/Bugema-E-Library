from django.urls import path
from . import views

urlpatterns = [
    path('progress/<str:book_id>/', views.ReadingProgressView.as_view(), name='reading-progress'),
    path('dashboard/', views.user_dashboard, name='user-dashboard'),
    path('analytics/', views.user_analytics, name='user_analytics'),
    path('sessions/<str:book_id>/start/', views.start_reading_session, name='start-reading-session'),
    path('sessions/<str:session_id>/end/', views.end_reading_session, name='end-reading-session'),
    path('sessions/<str:book_id>/active/', views.get_or_create_active_session, name='get-or-create-session'),
    path('sessions/<str:session_id>/update/', views.update_session_progress, name='update-session-progress'),
    path('highlights/<str:book_id>/', views.book_highlights, name='book-highlights'),
    path('highlights/<str:highlight_id>/detail/', views.highlight_detail, name='highlight-detail'),
]
