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
        Validate Student Registration Number format.
        Format: YY/DEPT/BU/R/XXXX (e.g., 22/BSE/BU/R/0000)
        
        LOCATION: backend/accounts/serializers.py - UserRegistrationSerializer.validate_registration_number
        EDIT HERE: Modify the regex pattern if you need to change the format
        """
        import re
        if value and value.strip():
            value = value.strip().upper()  # Normalize to uppercase
            # Format: 22/BSE/BU/R/0000 (2-4 letter department codes allowed)
            pattern = r'^\d{2}/[A-Z]{2,4}/BU/R/\d{4}$'
            if not re.match(pattern, value):
                raise serializers.ValidationError(
                    "Invalid format. Use: YY/DEPT/BU/R/XXXX (e.g., 22/BSE/BU/R/0000). "
                    "Year: 2 digits, Department: 2-4 letters, then /BU/R/ followed by 4 digits."
                )
            if User.objects.filter(registration_number=value).exists():
                raise serializers.ValidationError("This registration number is already registered.")
        return value

    def validate_staff_id(self, value):
        """
        Validate Staff ID format.
        Format: STF/BU/XXX (e.g., STF/BU/000)
        
        LOCATION: backend/accounts/serializers.py - UserRegistrationSerializer.validate_staff_id
        EDIT HERE: Modify the regex pattern if you need to change the format
        """
        import re
        if value and value.strip():
            value = value.strip().upper()  # Normalize to uppercase
            # Format: STF/BU/000 (3-4 digits allowed)
            pattern = r'^STF/BU/\d{3,4}$'
            if not re.match(pattern, value):
                raise serializers.ValidationError(
                    "Invalid format. Use: STF/BU/XXX (e.g., STF/BU/000). "
                    "Start with STF/BU/ followed by 3-4 digits."
                )
            if User.objects.filter(staff_id=value).exists():
                raise serializers.ValidationError("This staff ID is already registered.")
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
        
        # Convert empty strings to None to avoid unique constraint violations
        # PostgreSQL allows multiple NULL values but not multiple empty strings in unique columns
        reg_no = validated_data.get('registration_number') or None
        staff_id = validated_data.get('staff_id') or None
        
        # Normalize to uppercase and strip whitespace if present
        if reg_no:
            reg_no = reg_no.strip().upper()
        if staff_id:
            staff_id = staff_id.strip().upper()
        
        # All users default to USER role - admin assigns roles manually
        # The registration_number/staff_id only determine user TYPE for free access
        # They don't affect the role - admin must promote to ADMIN manually
        role = 'USER'
            
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
    user_type = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role', 'last_seen', 'is_online', 'profile_picture', 'user_type', 'created_at']

    def get_is_online(self, obj):
        if obj.last_seen:
            # User is online if last_seen is within the last 5 minutes
            return timezone.now() - obj.last_seen < timedelta(minutes=5)
        return False

    def get_profile_picture(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url
        return None

    def get_user_type(self, obj):
        """Return user type based on registration_number or staff_id"""
        if obj.registration_number:
            return 'Student'
        elif obj.staff_id:
            return 'Staff'
        else:
            return 'Visitor'
