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


from rest_framework import viewsets
from rest_framework.decorators import action
from .serializers import AdminUserListSerializer

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
