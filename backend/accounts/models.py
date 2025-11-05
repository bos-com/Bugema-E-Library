# accounts/models.py (Adjusted)

from django.db import models
# Import necessary base classes and manager for custom authentication
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin 
from django.contrib.auth.hashers import make_password, check_password # Still used for backward compatibility with your methods
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
        
        # Ensure staff/superuser fields are set
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        
        return self.create_user(email, password, **extra_fields)


# --- User Model (Inherits AbstractBaseUser and PermissionsMixin) ---
class User(AbstractBaseUser, PermissionsMixin):
    """User model for authentication and authorization"""

    # --- REQUIRED AUTH CONSTANTS (The Fix) ---
    USERNAME_FIELD = 'email' # <-- FIX 1: Defines the field used for unique login
    REQUIRED_FIELDS = ['name'] # <-- FIX 2: Fields required when creating a user (via createsuperuser)
    objects = CustomUserManager() # <-- FIX 3: Sets the custom manager
    
    # --- MODEL FIELDS ---
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False) 
    # Changed to EmailField for robustness, though CharField works if unique=True
    email = models.EmailField(max_length=255, unique=True) 
    name = models.CharField(max_length=255) 
    # The 'password' field is automatically managed by AbstractBaseUser, 
    # but we'll keep the CharField definition for compatibility with your existing code logic.
    password = models.CharField(max_length=255) 

    # Role field
    class Role(models.TextChoices):
        USER = 'USER', 'User'
        ADMIN = 'ADMIN', 'Admin'
    
    role = models.CharField(
        max_length=5,
        choices=Role.choices,
        default=Role.USER,
    )
    
    # --- Permissions and Status Fields (The Fix) ---
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)    # <-- FIX 4: Required by Django Admin (for logging in)
    is_superuser = models.BooleanField(default=False) # <-- FIX 5: Required for top-level admin checks
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) 

    # --- METHODS ---
    # We remove the custom set_password/check_password methods as AbstractBaseUser provides them,
    # but the logic for these functions is fine if you prefer to keep them.
    # We also remove the custom has_perm/has_module_perms/is_authenticated/is_anonymous methods
    # as PermissionsMixin and AbstractBaseUser provide them.
    
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