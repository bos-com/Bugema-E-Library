from django.utils.deprecation import MiddlewareMixin
from .models import EventLog


class AnalyticsMiddleware(MiddlewareMixin):
    """Middleware to log analytics events"""
    
    def process_request(self, request):
        """Process incoming request for analytics"""
        # Skip analytics for certain paths
        skip_paths = [
            '/admin/',
            '/static/',
            '/media/',
            '/api/schema/',
            '/api/docs/',
        ]
        
        if any(request.path.startswith(path) for path in skip_paths):
            return None
        
        # Log search events
        if request.path == '/api/catalog/books/' and request.method == 'GET':
            query = request.GET.get('query', '').strip()
            if query:
                user_id = None
                if hasattr(request, 'user') and request.user and hasattr(request.user, 'id'):
                    user_id = str(request.user.id)
                
                EventLog.objects.create(
                    event_type='SEARCH',
                    payload={'query': query},
                    user=user_id,
                    ip_address=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT')
                )
        
        return None
