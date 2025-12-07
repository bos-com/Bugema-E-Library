from django.db import models
from django.contrib.auth import get_user_model
import uuid
from django.core.validators import MinValueValidator, MaxValueValidator

# Get the custom User model (assuming it's in the accounts app or default)
User = get_user_model()

class ReadingProgress(models.Model):
    """
    Reading progress tracking model.
    Tracks a user's current reading location and overall completion of a book.
    """
    # Django ORM automatically provides an 'id' (BigIntegerField) as primary key.
    # To match your previous UUID string PK, we define it explicitly.
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique ID for this progress record."
    )

    # ForeignKey relationship to the User model.
    # If the User is deleted, the progress record is deleted (CASCADE).
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reading_progresses',
        help_text="The user who owns this progress record."
    )

    # ForeignKey relationship to the Book model (assumed to be in 'catalog' app).
    # If the Book is deleted, the progress record is deleted (CASCADE).
    book = models.ForeignKey(
        'catalog.Book',
        on_delete=models.CASCADE,
        related_name='reading_progresses',
        help_text="The book being tracked."
    )

    last_location = models.CharField(
        max_length=255,
        help_text="Page number, chapter title, or CFI (for EPUB)."
    )
    
    current_page = models.IntegerField(
        default=0,
        help_text="Current page number (0-based for tracking)."
    )
    
    # FloatField equivalent with validators for 0% to 100%.
    percent = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Reading completion percentage (0.0 to 100.0)."
    )
    
    total_time_seconds = models.IntegerField(
        default=0,
        help_text="Total accumulated reading time for this book (in seconds)."
    )
    
    last_opened_at = models.DateTimeField(
        auto_now=True, # Automatically updates on save
        help_text="The last time the user opened this book."
    )
    
    completed = models.BooleanField(
        default=False,
        help_text="True if the user has finished the book."
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    # NOTE: We use auto_now=True for last_opened_at, replacing the need for a separate 'updated_at' 
    # field if it serves the same purpose. We keep a standard updated_at for general model updates.
    updated_at = models.DateTimeField(auto_now=True) 

    class Meta:
        # Enforces the 'user' and 'book' combination to be unique (one progress record per user/book)
        unique_together = ('user', 'book')
        verbose_name_plural = "Reading Progresses"
        ordering = ['-last_opened_at'] # Sort by most recently opened

    def __str__(self):
        # The 'book' object must be accessed to get its title
        book_title = self.book.title if hasattr(self.book, 'title') else "N/A"
        return f"Progress: {self.user} -> {book_title} ({self.percent:.2f}%)"


class ReadingSession(models.Model):
    """
    Reading session tracking model.
    Tracks individual reading periods for a book.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # ForeignKey to User (CASCADE on delete)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reading_sessions'
    )
    
    # ForeignKey to Book (CASCADE on delete)
    book = models.ForeignKey(
        'catalog.Book',
        on_delete=models.CASCADE,
        related_name='reading_sessions'
    )
    
    started_at = models.DateTimeField(
        auto_now_add=True, 
        help_text="The moment the reading session began."
    )
    
    ended_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="The moment the reading session ended (can be NULL if ongoing)."
    )
    
    duration_seconds = models.IntegerField(
        default=0,
        help_text="Calculated duration of the session in seconds."
    )
    
    pages_read = models.IntegerField(
        default=0,
        help_text="Number of pages read during this session."
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Reading Sessions"
        ordering = ['-started_at']

    def __str__(self):
        book_title = self.book.title if hasattr(self.book, 'title') else "N/A"
        return f"Session: {self.user} -> {book_title} ({self.duration_seconds}s)"


class Highlight(models.Model):
    """
    Highlight and annotation tracking model.
    Stores user highlights from books with position, color, and optional notes.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique ID for this highlight."
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='highlights',
        help_text="The user who created this highlight."
    )
    
    book = models.ForeignKey(
        'catalog.Book',
        on_delete=models.CASCADE,
        related_name='highlights',
        help_text="The book containing this highlight."
    )
    
    page_number = models.IntegerField(
        help_text="Page number where the highlight is located."
    )
    
    text_content = models.TextField(
        help_text="The highlighted text content."
    )
    
    color = models.CharField(
        max_length=20,
        default='yellow',
        help_text="Highlight color (yellow, green, blue, pink, etc.)."
    )
    
    position_data = models.JSONField(
        help_text="JSON data containing position rectangles and coordinates."
    )
    
    note = models.TextField(
        blank=True,
        null=True,
        help_text="Optional user note/annotation for this highlight."
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Highlights"
        ordering = ['page_number', 'created_at']
        indexes = [
            models.Index(fields=['user', 'book']),
            models.Index(fields=['book', 'page_number']),
        ]
    
    def __str__(self):
        book_title = self.book.title if hasattr(self.book, 'title') else "N/A"
        preview = self.text_content[:50] + "..." if len(self.text_content) > 50 else self.text_content
        return f"Highlight: {self.user} -> {book_title} (p{self.page_number}): {preview}"