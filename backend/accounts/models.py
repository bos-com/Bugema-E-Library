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

    # Role field
    class Role(models.TextChoices):
        USER = 'USER', 'User'
        ADMIN = 'ADMIN', 'Admin'
    
    role = models.CharField(
        max_length=5,
        choices=Role.choices,
        default=Role.USER,
    )
    
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
    
    def __str__(self):
        return f"{self.name} ({self.email})"
    
    class Meta:
        db_table = 'users' 
        indexes = [
            models.Index(fields=['email']),
        ]