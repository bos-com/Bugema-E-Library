from django.utils.deprecation import MiddlewareMixin

from .models import SearchQuery


class AnalyticsMiddleware(MiddlewareMixin):
    """Middleware to log analytics events"""
    
    def process_request(self, request):
        """Process incoming request for analytics"""
        skip_paths = [
            '/admin/',
            '/static/',
            '/media/',
            '/api/schema/',
            '/api/docs/',
        ]
        
        if any(request.path.startswith(path) for path in skip_paths):
            return None
        
        if request.path.startswith('/api/catalog/books') and request.method == 'GET':
            query = request.GET.get('search') or request.GET.get('query') or ''
            query = query.strip()
            if query:
                SearchQuery.objects.create(
                    user=request.user if getattr(request, 'user', None) and request.user.is_authenticated else None,
                    query=query
                )
        
        return None
