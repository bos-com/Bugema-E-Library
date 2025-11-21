from django.urls import path
from . import views

urlpatterns = [
    path('progress/<str:book_id>/', views.ReadingProgressView.as_view(), name='reading-progress'),
    path('dashboard/', views.user_dashboard, name='user-dashboard'),
    path('sessions/<str:book_id>/start/', views.start_reading_session, name='start-reading-session'),
    path('sessions/<str:session_id>/end/', views.end_reading_session, name='end-reading-session'),
]
