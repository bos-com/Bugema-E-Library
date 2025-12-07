from rest_framework import serializers
from .models import SubscriptionPlan, UserSubscription

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

class UserSubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    plan_duration = serializers.CharField(source='plan.duration', read_only=True)
    
    class Meta:
        model = UserSubscription
        fields = ['id', 'plan', 'plan_name', 'plan_duration', 'start_date', 'end_date', 'status', 'amount_paid', 'payment_method', 'is_valid', 'created_at']
