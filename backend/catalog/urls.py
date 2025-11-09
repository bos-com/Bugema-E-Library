from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('books/', views.BookListCreateView.as_view(), name='book-list-create'),
    path('books/<int:id>/', views.BookDetailView.as_view(), name='book-detail'),

# Interaction/Utility Endpoints
    path('books/<int:book_id>/cover/', views.book_cover, name='book-cover'),
    path('books/<int:book_id>/read/stream/', views.book_read_stream, name='book-read-stream'),
    path('books/<int:book_id>/like/', views.toggle_like, name='book-like'),
    path('books/<int:book_id>/bookmark/', views.toggle_bookmark, name='book-bookmark'),
    path('search/suggestions/', views.search_suggestions, name='search-suggestions'),
]
