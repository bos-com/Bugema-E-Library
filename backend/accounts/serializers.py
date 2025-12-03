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
       
        fields = ['id', 'email', 'name', 'role', 'is_active', 'created_at', 'profile_picture']

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

    class Meta:
        model = User
        fields = ['email', 'name', 'password', 'password_confirm']

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({"password_confirm": "Passwords don't match."})
        return attrs

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User(
            email=validated_data['email'],
            name=validated_data['name'],
        )
        user.set_password(validated_data['password'])
        user.save()
        
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer with user data"""
    def validate(self, attrs):
        data = super().validate(attrs)
       
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
