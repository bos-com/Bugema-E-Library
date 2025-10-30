from django.urls import path
from . import views

urlpatterns = [
    path('admin/overview/', views.admin_analytics_overview, name='admin-analytics-overview'),
    path('user/stats/', views.user_reading_stats, name='user-reading-stats'),
]
