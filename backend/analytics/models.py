from django.db import models
from django.contrib.auth import get_user_model

# Get the custom User model (assuming it's in the accounts app)
User = get_user_model()

# We use a string reference ('catalog.Book') since 'catalog' may not be fully loaded yet.

class BookView(models.Model):
    """Tracks a single view of a book by a user."""
    # If the user is deleted, the view record is deleted (CASCADE)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='book_views',
        verbose_name='Viewer'
    )
    # If the book is deleted, the view record is deleted (CASCADE)
    book = models.ForeignKey(
        'catalog.Book',
        on_delete=models.CASCADE,
        related_name='views',
        verbose_name='Book'
    )
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Book View"
        verbose_name_plural = "Book Views"
        ordering = ['-viewed_at']
        # You may want to ensure a user can only have one "latest" view recorded
        # For simple analytics, we allow multiple views.

    def __str__(self):
        return f"{self.user.email} viewed {self.book.title}"

class SearchQuery(models.Model):
    """Tracks user search terms."""
    # If the user is deleted, the search query is kept, but the user field is set to NULL (SET_NULL)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True, # Allows NULL when SET_NULL is used
        blank=True,
        related_name='search_queries'
    )
    query = models.CharField(max_length=255, help_text="The actual search term.")
    searched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Search Query"
        verbose_name_plural = "Search Queries"
        ordering = ['-searched_at']

    def __str__(self):
        user_info = self.user.email if self.user else 'Anonymous'
        return f"'{self.query}' by {user_info}"