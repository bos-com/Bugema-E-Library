from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter


router = DefaultRouter()
router.register(r'books', views.BookViewSet, basename='book')

urlpatterns = [
    # Include the router URLs
    path('', include(router.urls)),

    path('categories/', views.CategoryListView.as_view(), name='category-list'),

# Interaction/Utility Endpoints
    path('books/<int:book_id>/cover/', views.book_cover, name='book-cover'),
    path('books/<int:book_id>/read/stream/', views.book_read_stream, name='book-read-stream'),
    path('books/<int:book_id>/read/token/', views.book_read_token, name='book-read-token'),
    path('books/<int:book_id>/like/', views.toggle_like, name='book-like'),
    path('books/<int:book_id>/bookmark/', views.toggle_bookmark, name='book-bookmark'),
    path('search/suggestions/', views.search_suggestions, name='search-suggestions'),
]
