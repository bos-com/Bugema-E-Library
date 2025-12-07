from rest_framework import generics, views, status, permissions
from rest_framework.response import Response
from django.utils import timezone
from .models import SubscriptionPlan, UserSubscription
from .serializers import SubscriptionPlanSerializer, UserSubscriptionSerializer

from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

@method_decorator(cache_page(60 * 15), name='dispatch')
class PlanListView(generics.ListAPIView):
    """
    List all available subscription plans.
    """
    queryset = SubscriptionPlan.objects.all().order_by('price')
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.AllowAny]


class CreateSubscriptionView(views.APIView):
    """
    Mock endpoint to 'Process Payment' and create a subscription.
    In real life, this would handle a webhook or verify a transaction.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        plan_id = request.data.get('plan_id')
        payment_method = request.data.get('payment_method') # 'MM', 'VISA', 'PAYPAL'
        
        if not plan_id or not payment_method:
            return Response({'error': 'Plan ID and Payment Method required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response({'error': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)
            
        # Mock Logic: Payment Successful!
        # Create ACTIVE subscription
        
        # Expire any old active subscriptions?
        UserSubscription.objects.filter(
            user=request.user, 
            status='ACTIVE'
        ).update(status='EXPIRED', end_date=timezone.now())

        # Determine features based on plan (if needed)
        
        sub = UserSubscription.objects.create(
            user=request.user,
            plan=plan,
            payment_method=payment_method,
            amount_paid=plan.price,
            status='ACTIVE', # Automatically active for this simulation
            end_date=timezone.now() + plan.get_duration_delta(),
            payment_reference=f"MOCK-{timezone.now().timestamp()}"
        )
        
        # Update user role to Subscriber if they were just a user?
        # Typically role is fixed, but if they are 'Visitor' they stay visitor but have access.
        
        return Response(UserSubscriptionSerializer(sub).data, status=status.HTTP_201_CREATED)


class MySubscriptionView(generics.RetrieveAPIView):
    """
    Get the current user's active subscription.
    """
    serializer_class = UserSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Return the valid active subscription
        # Or the most recent one if none active
        sub = UserSubscription.objects.filter(
            user=self.request.user,
            status='ACTIVE',
            end_date__gt=timezone.now()
        ).order_by('-end_date').first()
        
        if not sub:
            # Fallback to last subscription
            sub = UserSubscription.objects.filter(user=self.request.user).order_by('-created_at').first()
            
        return sub
