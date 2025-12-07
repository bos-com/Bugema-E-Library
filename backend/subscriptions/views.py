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
    Users with registration_number or staff_id get free access (no subscription needed).
    Visitors need a paid subscription.
    
    LOCATION: backend/subscriptions/views.py - MySubscriptionView
    EDIT HERE: Modify this logic if you need to change how free access is determined
    """
    serializer_class = UserSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        user = self.request.user
        
        # Check if user has free access (has registration_number or staff_id)
        # LOCATION: This checks User.has_free_access property
        # EDIT: Modify User.has_free_access in backend/accounts/models.py if needed
        if user.has_free_access:
            # Return a virtual subscription object for free access users
            # This allows the frontend to treat them as having valid subscription
            from rest_framework.exceptions import NotFound
            try:
                # Try to get or create a virtual subscription for free access users
                # We'll return None and handle it in the serializer
                return None
            except:
                return None
        
        # For visitors (no registration_number or staff_id), check for paid subscription
        sub = UserSubscription.objects.filter(
            user=user,
            status='ACTIVE',
            end_date__gt=timezone.now()
        ).order_by('-end_date').first()
        
        if not sub:
            # Fallback to last subscription
            sub = UserSubscription.objects.filter(user=user).order_by('-created_at').first()
            
        return sub
    
    def retrieve(self, request, *args, **kwargs):
        """
        Override retrieve to handle free access users who don't have a subscription record.
        """
        user = request.user
        
        # If user has free access, return a virtual subscription response
        if user.has_free_access:
            from rest_framework.response import Response
            return Response({
                'id': None,
                'plan': None,
                'plan_name': 'Free Access',
                'plan_duration': 'LIFETIME',
                'start_date': user.created_at.isoformat() if user.created_at else None,
                'end_date': None,
                'status': 'ACTIVE',
                'amount_paid': '0.00',
                'payment_method': 'FREE',
                'is_valid': True,
                'created_at': user.created_at.isoformat() if user.created_at else None
            })
        
        # For visitors, use the default behavior
        return super().retrieve(request, *args, **kwargs)
