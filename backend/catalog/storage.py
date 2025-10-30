import os
import mimetypes
from datetime import datetime, timedelta
from django.conf import settings
from django.http import HttpResponse, Http404, FileResponse
from django.core.files.storage import Storage
from django.core.files.base import ContentFile
from pymongo import MongoClient
import gridfs
import hashlib
import hmac
import base64
from urllib.parse import quote


class GridFSStorage(Storage):
    """Custom storage class for GridFS"""
    
    def __init__(self, location=None, base_url=None):
        self.location = location or settings.MEDIA_ROOT
        self.base_url = base_url or settings.MEDIA_URL
        self.client = MongoClient(settings.MONGODB_URI)
        self.db = self.client.get_default_database()
        self.fs = gridfs.GridFS(self.db)
    
    def _open(self, name, mode='rb'):
        """Open file from GridFS"""
        try:
            file_id = self._get_file_id(name)
            return self.fs.get(file_id)
        except:
            raise FileNotFoundError(f"File {name} not found")
    
    def _save(self, name, content):
        """Save file to GridFS"""
        file_id = self.fs.put(
            content.read(),
            filename=name,
            content_type=getattr(content, 'content_type', None) or mimetypes.guess_type(name)[0]
        )
        return str(file_id)
    
    def delete(self, name):
        """Delete file from GridFS"""
        try:
            file_id = self._get_file_id(name)
            self.fs.delete(file_id)
        except:
            pass
    
    def exists(self, name):
        """Check if file exists in GridFS"""
        try:
            file_id = self._get_file_id(name)
            return self.fs.exists(file_id)
        except:
            return False
    
    def listdir(self, path):
        """List directory contents"""
        files = []
        for grid_out in self.fs.find():
            files.append(grid_out.filename)
        return [], files
    
    def size(self, name):
        """Get file size"""
        try:
            file_id = self._get_file_id(name)
            return self.fs.get(file_id).length
        except:
            return 0
    
    def url(self, name):
        """Get file URL"""
        return f"{self.base_url}{name}"
    
    def _get_file_id(self, name):
        """Get file ID from filename or ID"""
        if name.startswith('ObjectId(') and name.endswith(')'):
            return name[9:-1]  # Remove 'ObjectId(' and ')'
        return name


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
            if file_id_from_token != file_id or user_id_from_token != user_id:
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


def serve_file_from_gridfs(file_id, filename=None, content_type=None, inline=True):
    """Serve file from GridFS with proper headers"""
    try:
        client = MongoClient(settings.MONGODB_URI)
        db = client.get_default_database()
        fs = gridfs.GridFS(db)
        
        file_obj = fs.get(file_id)
        
        if not filename:
            filename = file_obj.filename or 'file'
        
        if not content_type:
            content_type = file_obj.content_type or 'application/octet-stream'
        
        response = HttpResponse(
            file_obj.read(),
            content_type=content_type
        )
        
        disposition = 'inline' if inline else 'attachment'
        response['Content-Disposition'] = f'{disposition}; filename="{quote(filename)}"'
        response['Accept-Ranges'] = 'bytes'
        response['Cache-Control'] = 'private, max-age=3600'
        response['X-Accel-Buffering'] = 'no'
        
        return response
    except:
        raise Http404("File not found")


def serve_file_stream(file_id, request, filename=None, content_type=None):
    """Serve file with range support for streaming"""
    try:
        client = MongoClient(settings.MONGODB_URI)
        db = client.get_default_database()
        fs = gridfs.GridFS(db)
        
        file_obj = fs.get(file_id)
        file_size = file_obj.length
        
        if not filename:
            filename = file_obj.filename or 'file'
        
        if not content_type:
            content_type = file_obj.content_type or 'application/octet-stream'
        
        # Handle range requests
        range_header = request.META.get('HTTP_RANGE')
        if range_header:
            range_match = range_header.replace('bytes=', '').split('-')
            start = int(range_match[0]) if range_match[0] else 0
            end = int(range_match[1]) if range_match[1] else file_size - 1
            
            if start >= file_size or end >= file_size:
                return HttpResponse(status=416)
            
            content_length = end - start + 1
            file_obj.seek(start)
            content = file_obj.read(content_length)
            
            response = HttpResponse(
                content,
                status=206,
                content_type=content_type
            )
            response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
            response['Content-Length'] = str(content_length)
        else:
            content = file_obj.read()
            response = HttpResponse(
                content,
                content_type=content_type
            )
            response['Content-Length'] = str(file_size)
        
        response['Accept-Ranges'] = 'bytes'
        response['Content-Disposition'] = f'inline; filename="{quote(filename)}"'
        response['Cache-Control'] = 'private, max-age=3600'
        response['X-Accel-Buffering'] = 'no'
        
        return response
    except:
        raise Http404("File not found")
