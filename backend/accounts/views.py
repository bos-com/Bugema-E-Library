from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django.utils import timezone
from datetime import timedelta
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .models import User
from .serializers import UserSerializer, UserRegistrationSerializer, CustomTokenObtainPairSerializer


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

class AdminUserListView(generics.ListAPIView):
    """List all users with online status for admins"""
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    queryset = User.objects.all().order_by('-created_at')

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            
            # Add online status
            data = serializer.data
            now = timezone.now()
            threshold = now - timedelta(minutes=5)
            
            for user_data in data:
                try:
                    user = User.objects.get(id=user_data['id'])
                    # Check if user was active recently (using last_login as proxy for now)
                    # Ideally we'd have a middleware updating 'last_activity'
                    is_online = user.last_login and user.last_login > threshold
                    user_data['is_online'] = bool(is_online)
                except User.DoesNotExist:
                    user_data['is_online'] = False
                
            return Response(data)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Admin user list error: {str(e)}", exc_info=True)
            
            return Response(
                {'error': 'Failed to fetch users', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_update_user_role(request, user_id):
    """Promote or demote a user"""
    try:
        user = User.objects.get(id=user_id)
        new_role = request.data.get('role')
        
        if new_role not in ['ADMIN', 'USER']:
            return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.role = new_role
        user.is_staff = (new_role == 'ADMIN')
        user.save()
        
        return Response(UserSerializer(user).data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Admin update user role error for user {user_id}: {str(e)}", exc_info=True)
        
        return Response(
            {'error': 'Failed to update user role', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_delete_user(request, user_id):
    """Delete a user"""
    try:
        user = User.objects.get(id=user_id)
        # Prevent deleting self
        if user.id == request.user.id:
             return Response({'error': 'Cannot delete yourself'}, status=status.HTTP_400_BAD_REQUEST)
             
        user.delete()
        return Response({'message': 'User deleted successfully'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Admin delete user error for user {user_id}: {str(e)}", exc_info=True)
        
        return Response(
            {'error': 'Failed to delete user', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
