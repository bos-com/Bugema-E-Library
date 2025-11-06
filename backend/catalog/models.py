from django.db import models
from django.utils.text import slugify
from django.contrib.auth import get_user_model

# Get the custom User model defined in the 'accounts' app
User = get_user_model()

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
    file_type = models.CharField(max_length=10, choices=[('PDF', 'PDF'), ('EPUB', 'EPUB')])
    
    # FIX: Changed to ManyToManyField, which is appropriate for multiple categories per book
    categories = models.ManyToManyField(Category, related_name='books') 
    
    tags = models.JSONField(default=list, help_text="List of string tags, e.g., ['classic', 'fiction']")

    # File and Image IDs (Assuming simple storage paths for Postgres)
    cover_image = models.CharField(max_length=255, blank=True, null=True)
    file = models.CharField(max_length=255, blank=True, null=True)
    
    # Denormalized counters (to match the logic in the seed script)
    view_count = models.PositiveIntegerField(default=0)
    like_count = models.PositiveIntegerField(default=0)
    bookmark_count = models.PositiveIntegerField(default=0)
    
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class BookLike(models.Model):
    """User's like on a specific book"""
    # FIX: Added on_delete=models.CASCADE
    user = models.ForeignKey(User, related_name='liked_books', on_delete=models.CASCADE) 
    # FIX: Added on_delete=models.CASCADE
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
    # FIX: Added on_delete=models.CASCADE
    user = models.ForeignKey(User, related_name='bookmarks', on_delete=models.CASCADE) 
    # FIX: Added on_delete=models.CASCADE
    book = models.ForeignKey(Book, related_name='bookmarks', on_delete=models.CASCADE) 
    location = models.CharField(max_length=255, help_text="Page number, chapter title, or reading location string")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Assuming multiple bookmarks per user/book is allowed (e.g., for different sections)
    # If only one bookmark per book is allowed, add: unique_together = ('user', 'book')

    class Meta:
        verbose_name = "Bookmark"
        verbose_name_plural = "Bookmarks"

    def __str__(self):
        return f"Bookmark in {self.book.title} by {self.user.email} at {self.location}"
