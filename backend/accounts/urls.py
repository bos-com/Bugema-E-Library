from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.AdminUserViewSet, basename='admin-users')

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('refresh/', views.RefreshView.as_view(), name='token_refresh'),
    path('me/', views.me, name='me'),
    path('profile/', views.update_profile, name='update_profile'),
    path('logout/', views.logout, name='logout'),
    
    # Password reset routes
    path('password-reset/request/', views.request_password_reset, name='password_reset_request'),
    path('password-reset/verify/', views.verify_reset_code, name='password_reset_verify'),
    path('password-reset/complete/', views.complete_password_reset, name='password_reset_complete'),
    path('password-reset/resend/', views.resend_reset_code, name='password_reset_resend'),
    
    # Admin routes (via router)
    path('', include(router.urls)),
]

