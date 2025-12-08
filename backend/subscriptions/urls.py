from django.urls import path
from .views import PlanListView, CreateSubscriptionView, MySubscriptionView, AdminSubscriptionListView, AdminSubscriptionRevenueView

urlpatterns = [
    path('plans/', PlanListView.as_view(), name='plan-list'),
    path('subscribe/', CreateSubscriptionView.as_view(), name='subscription-create'),
    path('me/', MySubscriptionView.as_view(), name='subscription-me'),
    # Admin endpoints
    path('admin/list/', AdminSubscriptionListView.as_view(), name='admin-subscription-list'),
    path('admin/revenue/', AdminSubscriptionRevenueView.as_view(), name='admin-subscription-revenue'),
]

