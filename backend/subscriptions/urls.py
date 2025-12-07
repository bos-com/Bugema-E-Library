from django.urls import path
from .views import PlanListView, CreateSubscriptionView, MySubscriptionView

urlpatterns = [
    path('plans/', PlanListView.as_view(), name='plan-list'),
    path('subscribe/', CreateSubscriptionView.as_view(), name='subscription-create'),
    path('me/', MySubscriptionView.as_view(), name='subscription-me'),
]
