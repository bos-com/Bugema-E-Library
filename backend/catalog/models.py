from django.db import models
from django.utils.text import slugify
from django.contrib.auth import get_user_model


# Get the custom User model defined in the 'accounts' app
User = get_user_model()

# Import custom storage
from .storage import RawMediaCloudinaryStorage

# --- Utility Fields ---
class Author(models.Model):
    """Author Model"""
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True, editable=False)
    bio = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Category(models.Model):
    """Category Model"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, editable=False)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

# --- Core Models ---

class Book(models.Model):
    """Book Model"""
    title = models.CharField(max_length=255)
    
    # FIX: Added on_delete=models.CASCADE for the ForeignKey
    author = models.ForeignKey(Author, related_name='books', on_delete=models.CASCADE) 
    description = models.TextField()
    isbn = models.CharField(max_length=13, unique=True)
    year = models.IntegerField(null=True, blank=True)
    pages = models.IntegerField(null=True, blank=True)
    language = models.CharField(max_length=50, default='en')
    file_type = models.CharField(max_length=10, choices=[('PDF', 'PDF'), ('EPUB', 'EPUB'), ('VIDEO','VIDEO')])
    categories = models.ManyToManyField(Category, related_name='books') 
    tags = models.JSONField(default=list, help_text="List of string tags, e.g., ['classic', 'fiction']")

    # File and Image IDs (Using custom storage for files to preserve extensions)
    cover_image = models.ImageField(upload_to='covers/', null=True, blank=True)
    file = models.FileField(upload_to='books/', storage=RawMediaCloudinaryStorage(), null=True, blank=True)
    
    
    cloudinary_public_id = models.CharField(max_length=500, null=True, blank=True, 
                                           help_text="Cloudinary public_id for the file")
    file_url = models.URLField(max_length=500, null=True, blank=True,
                              help_text="Direct Cloudinary URL for the file")
    
    
    view_count = models.PositiveIntegerField(default=0)
    like_count = models.PositiveIntegerField(default=0)
    bookmark_count = models.PositiveIntegerField(default=0)
    
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        """Override save to populate Cloudinary metadata with canonical values"""
        if self.file:
            file_name = getattr(self.file, 'name', '') or ''
            file_url = getattr(self.file, 'url', '') or ''

            if file_name:
                clean_name = file_name.lstrip('/')
                self.cloudinary_public_id = clean_name

            if self.file_url and (not self.cloudinary_public_id or '/' not in self.cloudinary_public_id):
                 try:
                    from urllib.parse import urlparse
                    parsed = urlparse(self.file_url)
                    path_parts = parsed.path.split('/')
                    if 'upload' in path_parts:
                        idx = path_parts.index('upload')
                        # Skip version if present
                        if len(path_parts) > idx + 1 and path_parts[idx+1].startswith('v'):
                            self.cloudinary_public_id = '/'.join(path_parts[idx+2:])
                        else:
                            self.cloudinary_public_id = '/'.join(path_parts[idx+1:])
                 except:
                     pass
        
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class BookLike(models.Model):
    """User's like on a specific book"""
    user = models.ForeignKey(User, related_name='liked_books', on_delete=models.CASCADE) 
    book = models.ForeignKey(Book, related_name='likes', on_delete=models.CASCADE) 
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'book')
        verbose_name = "Book Like"
        verbose_name_plural = "Book Likes"

    def __str__(self):
        return f"{self.user.email} likes {self.book.title}"


class Bookmark(models.Model):
    """User's bookmark/reading location in a book"""
    user = models.ForeignKey(User, related_name='bookmarks', on_delete=models.CASCADE) 
    book = models.ForeignKey(Book, related_name='bookmarks', on_delete=models.CASCADE) 
    location = models.CharField(max_length=255, help_text="Page number, chapter title, or reading location string")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Bookmark"
        verbose_name_plural = "Bookmarks"

    def __str__(self):
        return f"Bookmark in {self.book.title} by {self.user.email} at {self.location}"

