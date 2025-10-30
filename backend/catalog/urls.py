from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('books/', views.BookListView.as_view(), name='book-list'),
    path('books/<str:book_id>/', views.BookDetailView.as_view(), name='book-detail'),
    path('books/<str:book_id>/cover/', views.book_cover, name='book-cover'),
    path('books/<str:book_id>/read/stream/', views.book_read_stream, name='book-read-stream'),
    path('books/<str:book_id>/read/token/', views.get_read_token, name='book-read-token'),
    path('books/<str:book_id>/like/', views.toggle_like, name='book-like'),
    path('books/<str:book_id>/bookmark/', views.toggle_bookmark, name='book-bookmark'),
    path('search/suggestions/', views.search_suggestions, name='search-suggestions'),
]
