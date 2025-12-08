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


# --- ADMIN VIEWS ---

from accounts.permissions import IsAdminRole
from .serializers import AdminSubscriptionSerializer
from django.db.models import Sum
from django.db.models.functions import TruncDate, TruncMonth, TruncYear
from datetime import timedelta


class AdminSubscriptionListView(generics.ListAPIView):
    """
    Admin view to list all subscriptions with user details.
    Supports filtering by period: week, month, year
    """
    serializer_class = AdminSubscriptionSerializer
    permission_classes = [IsAdminRole]
    
    def get_queryset(self):
        queryset = UserSubscription.objects.select_related('user', 'plan').order_by('-created_at')
        
        # Optional filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())
        
        # Period filter (week, month, year)
        period = self.request.query_params.get('period')
        if period:
            now = timezone.now()
            if period == 'week':
                # Start of current week (Monday)
                start_of_week = now - timedelta(days=now.weekday())
                start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
                queryset = queryset.filter(created_at__gte=start_of_week)
            elif period == 'month':
                start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                queryset = queryset.filter(created_at__gte=start_of_month)
            elif period == 'year':
                start_of_year = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                queryset = queryset.filter(created_at__gte=start_of_year)
        
        return queryset


class AdminSubscriptionRevenueView(views.APIView):
    """
    Admin view to get subscription revenue stats.
    Returns revenue for today, this month, and this year in UGX.
    """
    permission_classes = [IsAdminRole]
    
    def get(self, request):
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Revenue today
        revenue_today = UserSubscription.objects.filter(
            status='ACTIVE',
            created_at__gte=today_start
        ).aggregate(total=Sum('amount_paid'))['total'] or 0
        
        # Revenue this month
        revenue_month = UserSubscription.objects.filter(
            status='ACTIVE',
            created_at__gte=month_start
        ).aggregate(total=Sum('amount_paid'))['total'] or 0
        
        # Revenue this year
        revenue_year = UserSubscription.objects.filter(
            status='ACTIVE',
            created_at__gte=year_start
        ).aggregate(total=Sum('amount_paid'))['total'] or 0
        
        # Total revenue all time
        revenue_total = UserSubscription.objects.filter(
            status='ACTIVE'
        ).aggregate(total=Sum('amount_paid'))['total'] or 0
        
        # Active subscribers count
        active_count = UserSubscription.objects.filter(
            status='ACTIVE',
            end_date__gt=now
        ).count()
        
        return Response({
            'currency': 'UGX',
            'revenue_today': float(revenue_today),
            'revenue_month': float(revenue_month),
            'revenue_year': float(revenue_year),
            'revenue_total': float(revenue_total),
            'active_subscribers': active_count
        })

