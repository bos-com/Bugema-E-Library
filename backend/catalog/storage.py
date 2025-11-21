import os
import mimetypes
from datetime import datetime, timedelta
from django.conf import settings
from django.http import HttpResponse, Http404, FileResponse
from django.core.files.storage import default_storage # Import Django's default storage
from django.core.files.base import ContentFile
# Removed pymongo and gridfs imports
import hashlib
import hmac
import base64
from urllib.parse import quote
from django.shortcuts import get_object_or_404
# You'll need to import your Book model (or whatever model holds the file)
# Example: from .models import Book 


# --- Storage Class (DEPRECATED/REMOVED) ---
# When using PostgreSQL/ORM, you typically use Django's default FileSystemStorage 
# for local files or a third-party package for S3/Cloud storage.
# The custom GridFSStorage class is no longer needed.


# --- Signed URL Generator (RETAINS LOGIC) ---
# This class for token generation/verification is entirely agnostic to the storage 
# backend (GridFS, S3, local, etc.) as it only validates access permissions.
class SignedURLGenerator:
    """Generate signed URLs for secure file access"""
    
    def __init__(self, secret_key=None):
        self.secret_key = secret_key or settings.SECRET_KEY
    
    def generate_token(self, file_id, user_id, expires_in=3600):
        """Generate signed token for file access"""
        timestamp = str(int((datetime.utcnow() + timedelta(seconds=expires_in)).timestamp()))
        message = f"{file_id}:{user_id}:{timestamp}"
        signature = hmac.new(
            self.secret_key.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        token = base64.urlsafe_b64encode(f"{message}:{signature}".encode()).decode()
        return token
    
    def verify_token(self, token, file_id, user_id):
        """Verify signed token"""
        try:
            decoded = base64.urlsafe_b64decode(token.encode()).decode()
            message, signature = decoded.rsplit(':', 1)
            file_id_from_token, user_id_from_token, timestamp = message.split(':')
            
            # Check if token is for correct file and user
            if str(file_id_from_token) != str(file_id) or str(user_id_from_token) != str(user_id):
                return False
            
            # Check if token is expired
            if datetime.utcnow().timestamp() > int(timestamp):
                return False
            
            # Verify signature
            expected_signature = hmac.new(
                self.secret_key.encode(),
                message.encode(),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(signature, expected_signature)
        except:
            return False


# --- File Serving Functions (MODIFIED) ---

def serve_file_from_orm(book_instance, request, inline=True):
    """
    Serve file using Django's FileResponse, leveraging the file's internal open() method.
    
    NOTE: You must pass the entire model instance (e.g., Book.objects.get(pk=3)) 
    or the FileField object itself.
    """
    try:
        # Get the actual File object from the model instance
        file_field = book_instance.file # Assuming 'file' is the name of your FileField
        
        # Check if the file actually exists in the storage
        if not file_field:
            raise Http404("File reference not found on model.")

        # Use the storage's open method to get a file handle
        file_handle = file_field.open('rb')

        filename = os.path.basename(file_field.name)
        content_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'
        
        # Use FileResponse for efficient streaming
        response = FileResponse(
            file_handle, 
            content_type=content_type
        )
        
        disposition = 'inline' if inline else 'attachment'
        response['Content-Disposition'] = f'{disposition}; filename="{quote(filename)}"'
        response['Accept-Ranges'] = 'bytes'
        response['Content-Length'] = file_field.size # Use file field's size property
        response['Cache-Control'] = 'private, max-age=3600'
        response['X-Accel-Buffering'] = 'no'
        
        return response
    except Exception as e:
        # Log the error (optional)
        print(f"Error serving file: {e}")
        raise Http404("File not found")


def serve_file_stream(book_instance, request):
    """
    Serve file with range support for streaming, based on Django's FileField.
    This replaces your GridFS-specific implementation with a more generic approach.
    """
    try:
        file_field = book_instance.file # Assuming 'file' is the name of your FileField
        
        if not file_field or not file_field.storage.exists(file_field.name):
            raise Http404("File not found in storage.")
            
        file_handle = file_field.open('rb')
        file_size = file_field.size
        
        filename = os.path.basename(file_field.name)
        content_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'
        
        # Handle range requests
        range_header = request.META.get('HTTP_RANGE')
        if range_header:
            range_match = range_header.replace('bytes=', '').split('-')
            start = int(range_match[0]) if range_match[0] else 0
            end = int(range_match[1]) if range_match[1] else file_size - 1
            
            if start >= file_size or end >= file_size:
                return HttpResponse(status=416)
            
            content_length = end - start + 1
            file_handle.seek(start)
            content = file_handle.read(content_length)
            
            response = HttpResponse(
                content,
                status=206,
                content_type=content_type
            )
            response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
            response['Content-Length'] = str(content_length)
        else:
            # Full file response
            response = FileResponse(
                file_handle,
                content_type=content_type
            )
            response['Content-Length'] = str(file_size)
        
        response['Accept-Ranges'] = 'bytes'
        response['Content-Disposition'] = f'inline; filename="{quote(filename)}"'
        response['Cache-Control'] = 'private, max-age=3600'
        response['X-Accel-Buffering'] = 'no'
        
        return response
    except Exception as e:
        # Log the error (optional)
        print(f"Error streaming file: {e}")
        raise Http404("File not found")