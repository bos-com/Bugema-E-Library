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
    
    # Cloudinary metadata - explicitly store public_id and URL for easier retrieval
    cloudinary_public_id = models.CharField(max_length=500, null=True, blank=True, 
                                           help_text="Cloudinary public_id for the file")
    file_url = models.URLField(max_length=500, null=True, blank=True,
                              help_text="Direct Cloudinary URL for the file")
    
    # Denormalized counters (to match the logic in the seed script)
    view_count = models.PositiveIntegerField(default=0)
    like_count = models.PositiveIntegerField(default=0)
    bookmark_count = models.PositiveIntegerField(default=0)
    
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        """Override save to populate Cloudinary metadata"""
        # If a file is attached, extract and store Cloudinary metadata
        if self.file:
            # The file.name contains the path stored in Cloudinary
            # For our custom storage, this will be like 'media/books/filename.pdf'
            self.cloudinary_public_id = self.file.name
            
            # Get the full Cloudinary URL
            if hasattr(self.file, 'url'):
                self.file_url = self.file.url
        
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
