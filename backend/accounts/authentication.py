from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed

class SingleSessionJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication that enforces single session per user.
    """
    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        
        # Check if session_token in token matches user's current session_token
        token_session = validated_token.get('session_token')
        
        # If user has a session_token set in DB, we enforce it.
        if user.session_token:
            if not token_session:
                # Token predates the session mechanism or is spoofed
                raise AuthenticationFailed('Invalid session token.', code='token_not_valid')
            
            if token_session != user.session_token:
                raise AuthenticationFailed('This session has expired. You are logged in on another device.', code='token_not_valid')
            
        return user
