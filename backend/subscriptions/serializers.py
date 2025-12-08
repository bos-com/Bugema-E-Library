from rest_framework import serializers
from .models import SubscriptionPlan, UserSubscription

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

class UserSubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    plan_duration = serializers.CharField(source='plan.duration', read_only=True)
    is_valid = serializers.SerializerMethodField()
    
    class Meta:
        model = UserSubscription
        fields = ['id', 'plan', 'plan_name', 'plan_duration', 'start_date', 'end_date', 'status', 'amount_paid', 'payment_method', 'is_valid', 'created_at']
    
    def get_is_valid(self, obj):
        """
        Determine if subscription is valid.
        Users with registration_number or staff_id get free access (always valid).
        Other users need an active paid subscription.
        
        LOCATION: backend/subscriptions/serializers.py - UserSubscriptionSerializer.get_is_valid
        EDIT HERE: Modify this logic if you need to change how free access is determined
        """
        # Handle None case (free access users)
        if obj is None:
            return True
        
        # Check if user has free access (has registration_number or staff_id)
        if obj.user.has_free_access:
            return True
        
        # For visitors, check if they have an active paid subscription
        from django.utils import timezone
        return obj.status == 'ACTIVE' and obj.end_date and obj.end_date > timezone.now()


class AdminSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for admin to view all subscriptions with user details"""
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    plan_duration = serializers.CharField(source='plan.duration', read_only=True)
    is_active = serializers.SerializerMethodField()
    
    class Meta:
        model = UserSubscription
        fields = ['id', 'user_name', 'user_email', 'plan_name', 'plan_duration', 
                  'start_date', 'end_date', 'status', 'amount_paid', 'payment_method', 
                  'is_active', 'created_at']
    
    def get_is_active(self, obj):
        from django.utils import timezone
        return obj.status == 'ACTIVE' and obj.end_date and obj.end_date > timezone.now()

