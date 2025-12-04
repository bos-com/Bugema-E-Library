from django.utils import timezone
from django.contrib.auth.models import AnonymousUser

class UpdateLastSeenMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if request.user and not isinstance(request.user, AnonymousUser):
            request.user.last_seen = timezone.now()
            request.user.save(update_fields=['last_seen'])

        return response
