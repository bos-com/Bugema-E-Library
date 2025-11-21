# accounts/serializers.py
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User 
from django.db import models


class UserSerializer(serializers.ModelSerializer):
    """User serializer for API responses (Django ORM/PostgreSQL)"""
    id = serializers.UUIDField(read_only=True) 
    email = serializers.EmailField()
    name = serializers.CharField()
    role = serializers.CharField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
       
        fields = ['id', 'email', 'name', 'role', 'is_active', 'created_at', 'profile_picture']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """User registration serializer (Django ORM/PostgreSQL)"""
    email = serializers.EmailField()
    name = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['email', 'name', 'password', 'password_confirm']

    def validate(self, attrs):
        # Ensure 'password_confirm' is present before comparison
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({"password_confirm": "Passwords don't match."})
        return attrs

    def validate_email(self, value):
        # Django ORM style (uses .filter().exists() or .filter().first() is also fine)
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value

    def create(self, validated_data):
        # Remove the confirmation field before saving
        validated_data.pop('password_confirm')
        # Create and save the new user instance
        user = User(
            email=validated_data['email'],
            name=validated_data['name'],
            # Do not set password directly, use the set_password method
        )
        user.set_password(validated_data['password'])
        user.save()
        
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer with user data"""
    def validate(self, attrs):
        data = super().validate(attrs)
        # self.user is set by the parent's validate method
        
        # Nest tokens to match the RegisterView response structure and frontend expectation
        return {
            'user': UserSerializer(self.user).data,
            'tokens': {
                'access': data['access'],
                'refresh': data['refresh']
            }
        }