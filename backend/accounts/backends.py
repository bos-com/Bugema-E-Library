from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

class EmailOrIdBackend(ModelBackend):
    """
    Custom backend to authenticate users via:
    1. Email
    2. Registration Number (Student)
    3. Staff ID (Staff)
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)
        
        try:
            # Check against email, registration_number, or staff_id
            # Case-insensitive search for flexibility
            user = User.objects.get(
                Q(email__iexact=username) | 
                Q(registration_number__iexact=username) | 
                Q(staff_id__iexact=username)
            )
        except User.DoesNotExist:
            return None
        except User.MultipleObjectsReturned:
            # Should not happen given constraints, but fail safe
            return None
        
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
