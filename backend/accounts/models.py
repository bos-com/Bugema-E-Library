# accounts/models.py (Adjusted)

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin 
from django.contrib.auth.hashers import make_password, check_password
from cloudinary.models import CloudinaryField
import uuid


# --- Custom User Manager (Handles object creation) ---
class CustomUserManager(BaseUserManager):
    """
    Custom user model manager where email is the unique identifiers.
    """
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', 'ADMIN')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        
        return self.create_user(email, password, **extra_fields)


# --- User Model (Inherits AbstractBaseUser and PermissionsMixin) ---
class User(AbstractBaseUser, PermissionsMixin):
    """User model for authentication and authorization"""

    USERNAME_FIELD = 'email' 
    REQUIRED_FIELDS = ['name']
    objects = CustomUserManager() 
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False) 
    email = models.EmailField(max_length=255, unique=True) 
    name = models.CharField(max_length=255) 
    password = models.CharField(max_length=255) 
    
    # Profile picture stored in Cloudinary
    profile_picture = CloudinaryField('profile_pictures', null=True, blank=True)

    # Identification fields for specific roles
    # USER to define structure here: e.g. validators=[RegexValidator(regex=r'^...')]
    registration_number = models.CharField(max_length=50, unique=True, null=True, blank=True, help_text="For Students")
    staff_id = models.CharField(max_length=50, unique=True, null=True, blank=True, help_text="For Staff")

    # Role field
    class Role(models.TextChoices):
        STUDENT = 'STUDENT', 'Student'
        STAFF = 'STAFF', 'Staff'
        SUBSCRIBER = 'SUBSCRIBER', 'Subscriber'
        ADMIN = 'ADMIN', 'Admin'
    
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.SUBSCRIBER, # Defaulting to Subscriber for "outsiders" until they pay/register
    )
    
    # Security: Single session enforcement
    session_token = models.CharField(max_length=255, null=True, blank=True)

    # --- Permissions and Status Fields 
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)    
    is_superuser = models.BooleanField(default=False) 
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) 
    last_seen = models.DateTimeField(null=True, blank=True)

    def get_full_name(self):
        return self.name
    
    def get_short_name(self):
        return self.name.split()[0] if self.name else self.email
    
    @property
    def has_free_access(self):
        """
        Check if user has free access based on having registration_number or staff_id.
        Users with registration_number (students) or staff_id (staff) get free access.
        Visitors (no registration_number or staff_id) need subscriptions.
        
        LOCATION: backend/accounts/models.py - User.has_free_access property
        EDIT HERE: Modify this logic if you need to change free access criteria
        """
        return bool(self.registration_number or self.staff_id)
    
    def __str__(self):
        return f"{self.name} ({self.email})"
    
    class Meta:
        db_table = 'users' 
        indexes = [
            models.Index(fields=['email']),
        ]


class PasswordResetToken(models.Model):
    """Password reset token for forgot password flow"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.CharField(max_length=6)  # 6-digit code
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = 'password_reset_tokens'
        ordering = ['-created_at']

    def is_valid(self):
        """Check if token is still valid (not expired and not used)"""
        from django.utils import timezone
        return not self.is_used and self.expires_at > timezone.now()

    @classmethod
    def create_for_user(cls, user):
        """Create a new reset token for a user"""
        import random
        from django.utils import timezone
        from datetime import timedelta
        
        # Invalidate any existing tokens
        cls.objects.filter(user=user, is_used=False).update(is_used=True)
        
        # Generate 6-digit code
        token = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # Set expiry to 2 minutes from now
        expires_at = timezone.now() + timedelta(minutes=2)
        
        return cls.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )

    def __str__(self):
        return f"Reset token for {self.user.email}"