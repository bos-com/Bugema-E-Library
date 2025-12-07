from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

class SubscriptionPlan(models.Model):
    class Duration(models.TextChoices):
        HOURLY = 'HOURLY', '1 Hour'
        DAILY = 'DAILY', '1 Day'
        WEEKLY = 'WEEKLY', '1 Week'
        MONTHLY = 'MONTHLY', '1 Month'
        YEARLY = 'YEARLY', '1 Year'

    name = models.CharField(max_length=100)
    duration = models.CharField(max_length=20, choices=Duration.choices)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    features = models.JSONField(default=list, blank=True) # List of features strings
    
    def get_duration_delta(self):
        now = timezone.now()
        if self.duration == self.Duration.HOURLY:
            return timedelta(hours=1)
        elif self.duration == self.Duration.DAILY:
            return timedelta(days=1)
        elif self.duration == self.Duration.WEEKLY:
            return timedelta(weeks=1)
        elif self.duration == self.Duration.MONTHLY:
            return timedelta(days=30)
        elif self.duration == self.Duration.YEARLY:
            return timedelta(days=365)
        return timedelta(0)

    def __str__(self):
        return f"{self.name} ({self.price})"

class UserSubscription(models.Model):
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('EXPIRED', 'Expired'),
        ('PENDING', 'Pending Payment'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    payment_method = models.CharField(max_length=50, blank=True) # 'MM', 'VISA', 'PAYPAL'
    payment_reference = models.CharField(max_length=100, blank=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.plan and not self.end_date and self.status == 'ACTIVE':
            self.end_date = timezone.now() + self.plan.get_duration_delta()
        super().save(*args, **kwargs)

    @property
    def is_valid(self):
        return self.status == 'ACTIVE' and self.end_date and self.end_date > timezone.now()

    def __str__(self):
        return f"{self.user} - {self.plan} ({self.status})"
