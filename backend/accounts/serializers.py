# accounts/serializers.py
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User 
from django.db import models
from django.utils import timezone
from datetime import timedelta


class UserSerializer(serializers.ModelSerializer):
    """User serializer for API responses (Django ORM/PostgreSQL)"""
    id = serializers.UUIDField(read_only=True) 
    email = serializers.EmailField()
    name = serializers.CharField()
    role = serializers.CharField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
       
        fields = ['id', 'email', 'name', 'role', 'is_active', 'created_at', 'profile_picture', 'registration_number', 'staff_id']

    def get_profile_picture(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url
        return None


class UserRegistrationSerializer(serializers.ModelSerializer):
    """User registration serializer (Django ORM/PostgreSQL)"""
    email = serializers.EmailField()
    name = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    # Optional fields for student/staff registration
    registration_number = serializers.CharField(required=False, allow_blank=True)
    staff_id = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['email', 'name', 'password', 'password_confirm', 'registration_number', 'staff_id']

    def validate_registration_number(self, value):
        """
        USER: Define structure for Registration Number here.
        Example: 
        import re
        if value and not re.match(r'^REG/\d{4}/\d{5}$', value):
            raise serializers.ValidationError("Invalid Registration Number format.")
        """
        if value and User.objects.filter(registration_number=value).exists():
            raise serializers.ValidationError("Registration number already in use.")
        return value

    def validate_staff_id(self, value):
        """
        USER: Define structure for Staff ID here.
        Example:
        import re
        if value and not re.match(r'^STAFF-\d{3}$', value):
            raise serializers.ValidationError("Invalid Staff ID format.")
        """
        if value and User.objects.filter(staff_id=value).exists():
             raise serializers.ValidationError("Staff ID already in use.")
        return value

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({"password_confirm": "Passwords don't match."})
        
        # Ensure only one ID type is provided
        reg_no = attrs.get('registration_number')
        staff_id = attrs.get('staff_id')
        
        if reg_no and staff_id:
            raise serializers.ValidationError("Cannot provide both Registration Number and Staff ID.")
            
        return attrs

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        
        reg_no = validated_data.get('registration_number')
        staff_id = validated_data.get('staff_id')
        
        # Determine Role
        role = User.Role.SUBSCRIBER # Default
        if reg_no:
            role = User.Role.STUDENT
        elif staff_id:
            role = User.Role.STAFF
            
        user = User(
            email=validated_data['email'],
            name=validated_data['name'],
            registration_number=reg_no,
            staff_id=staff_id,
            role=role
        )
        user.set_password(validated_data['password'])
        user.save()
        
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer with user data and single-session enforcement"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add session_token to token payload
        if user.session_token:
            token['session_token'] = user.session_token
            
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Generate new session token to invalidate old sessions
        import uuid
        new_session_token = str(uuid.uuid4())
        self.user.session_token = new_session_token
        self.user.save(update_fields=['session_token'])
        
        # Regenerate tokens to include the new session_token
        refresh = self.get_token(self.user)
        
        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)
        
        return {
            'user': UserSerializer(self.user).data,
            'tokens': {
                'access': data['access'],
                'refresh': data['refresh']
            }
        }

class AdminUserListSerializer(serializers.ModelSerializer):
    """Serializer for Admin to view user list with online status"""
    is_online = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role', 'last_seen', 'is_online', 'profile_picture']

    def get_is_online(self, obj):
        if obj.last_seen:
            # User is online if last_seen is within the last 5 minutes
            return timezone.now() - obj.last_seen < timedelta(minutes=5)
        return False

    def get_profile_picture(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url
        return None
