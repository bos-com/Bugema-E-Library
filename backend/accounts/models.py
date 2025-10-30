from mongoengine import Document, StringField, DateTimeField, ListField, BooleanField
from django.contrib.auth.hashers import make_password, check_password
from datetime import datetime
import uuid


class User(Document):
    """User model for authentication and authorization"""
    
    id = StringField(primary_key=True, default=lambda: str(uuid.uuid4()))
    email = StringField(required=True, unique=True, max_length=255)
    name = StringField(required=True, max_length=255)
    password = StringField(required=True, max_length=255)
    role = StringField(required=True, choices=['USER', 'ADMIN'], default='USER')
    is_active = BooleanField(default=True)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'users',
        'indexes': [
            'email',
            'role',
            'created_at'
        ]
    }
    
    def set_password(self, raw_password):
        """Set password hash"""
        self.password = make_password(raw_password)
        self.updated_at = datetime.utcnow()
    
    def check_password(self, raw_password):
        """Check password"""
        return check_password(raw_password, self.password)
    
    def is_authenticated(self):
        """Required for Django authentication"""
        return True
    
    def is_anonymous(self):
        """Required for Django authentication"""
        return False
    
    def get_username(self):
        """Required for Django authentication"""
        return self.email
    
    def get_full_name(self):
        """Get user's full name"""
        return self.name
    
    def get_short_name(self):
        """Get user's short name"""
        return self.name.split()[0] if self.name else self.email
    
    def __str__(self):
        return f"{self.name} ({self.email})"
