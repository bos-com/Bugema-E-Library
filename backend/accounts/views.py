from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .models import User
from .serializers import UserSerializer, UserRegistrationSerializer, CustomTokenObtainPairSerializer
from .permissions import IsAdminRole

from rest_framework import viewsets
from rest_framework.decorators import action
from .serializers import AdminUserListSerializer

# Email & Settings imports
from django.core.mail import send_mail
from django.conf import settings
from .models import PasswordResetToken


class RegisterView(generics.CreateAPIView):
    """User registration view"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            # Log the error for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Registration error: {str(e)}", exc_info=True)
            
            # Return user-friendly error message
            error_message = str(e) if hasattr(e, 'detail') else 'Registration failed. Please try again.'
            return Response(
                {'error': error_message, 'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class LoginView(TokenObtainPairView):
    """User login view using JWT pair serializer"""
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class RefreshView(TokenRefreshView):
    """Refresh JWT access token"""
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        tokens = {
            'access': data.get('access'),
            'refresh': data.get('refresh') or request.data.get('refresh')
        }
        return Response({'tokens': tokens}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Get current user profile"""
    return Response(UserSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout user (blacklist refresh token)"""
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Successfully logged out'})
    except Exception:
        # Even if the token is invalid/expired, we consider the user logged out
        return Response({'message': 'Successfully logged out'})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update user profile"""
    try:
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Profile update error for user {request.user.id}: {str(e)}", exc_info=True)
        
        return Response(
            {'error': 'Failed to update profile', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# --- ADMIN VIEWS ---

class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for managing users.
    Supports listing, updating roles, and deleting users.
    """
    queryset = User.objects.all().order_by('role', 'name')
    serializer_class = AdminUserListSerializer
    permission_classes = [IsAdminRole]
    pagination_class = None  # Disable pagination to return plain array
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        # Ensure Admins are first. 
        # If 'role' is just a string, 'ADMIN' comes before 'USER'.
        return User.objects.all().order_by('role', 'name')

    @action(detail=True, methods=['patch'])
    def assign_role(self, request, pk=None):
        """Assign a new role to a user"""
        user = self.get_object()
        new_role = request.data.get('role')
        
        if new_role not in ['ADMIN', 'USER']:
            return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Prevent demoting the last admin or self-demotion if needed (optional safety)
        if user.id == request.user.id and new_role != 'ADMIN':
             return Response({'error': 'Cannot demote yourself'}, status=status.HTTP_400_BAD_REQUEST)

        user.role = new_role
        user.is_staff = (new_role == 'ADMIN')
        user.is_superuser = (new_role == 'ADMIN') # Optional: Grant superuser if admin
        user.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Delete a user"""
        user = self.get_object()
        if user.id == request.user.id:
            return Response({'error': 'Cannot delete yourself'}, status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)


# --- PASSWORD RESET VIEWS ---

from django.core.mail import send_mail
from django.conf import settings
from .models import PasswordResetToken


@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """
    Step 1: Request password reset - sends 6-digit code to email
    Expects: { "email": "user@example.com" }
    """
    email = request.data.get('email', '').strip().lower()
    
    if not email:
        return Response(
            {'error': 'Email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Don't reveal if email exists - still return success
        return Response({
            'message': 'If an account exists with this email, you will receive a reset code.',
            'email': email
        })
    
    # Create reset token
    reset_token = PasswordResetToken.create_for_user(user)
    
    # Send email with code
    try:
        subject = 'Bugema E-Library - Password Reset Code'
        message = f"""
Hello {user.name},

You requested a password reset for your Bugema E-Library account.

Your verification code is: {reset_token.token}

This code will expire in 2 minutes.

If you did not request this reset, please ignore this email.

Best regards,
Bugema E-Library Team
        """
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        
        return Response({
            'message': 'Reset code sent to your email',
            'email': email,
            'expires_in_seconds': 120  # 2 minutes
        })
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send password reset email: {str(e)}", exc_info=True)
        
        return Response(
            {'error': 'Failed to send email. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_code(request):
    """
    Step 2: Verify the 6-digit code
    Expects: { "email": "user@example.com", "code": "123456" }
    """
    email = request.data.get('email', '').strip().lower()
    code = request.data.get('code', '').strip()
    
    if not email or not code:
        return Response(
            {'error': 'Email and code are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid email or code'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Find valid token
    token = PasswordResetToken.objects.filter(
        user=user,
        token=code,
        is_used=False
    ).first()
    
    if not token:
        return Response(
            {'error': 'Invalid or expired code'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not token.is_valid():
        return Response(
            {'error': 'Code has expired. Please request a new one.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    return Response({
        'message': 'Code verified successfully',
        'valid': True
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def complete_password_reset(request):
    """
    Step 3: Complete password reset with new password
    Expects: { "email": "user@example.com", "code": "123456", "password": "newpassword" }
    """
    email = request.data.get('email', '').strip().lower()
    code = request.data.get('code', '').strip()
    new_password = request.data.get('password', '')
    
    if not email or not code or not new_password:
        return Response(
            {'error': 'Email, code, and new password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(new_password) < 6:
        return Response(
            {'error': 'Password must be at least 6 characters'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid email or code'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Find and validate token
    token = PasswordResetToken.objects.filter(
        user=user,
        token=code,
        is_used=False
    ).first()
    
    if not token or not token.is_valid():
        return Response(
            {'error': 'Invalid or expired code'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Update password
    user.set_password(new_password)
    user.save()
    
    # Mark token as used
    token.is_used = True
    token.save()
    
    return Response({
        'message': 'Password reset successfully. You can now login with your new password.'
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_reset_code(request):
    """
    Resend password reset code
    Expects: { "email": "user@example.com" }
    """
    # Just call the request_password_reset function
    return request_password_reset(request)
