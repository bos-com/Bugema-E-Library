from rest_framework import serializers
from .models import Category, Book, BookLike, Bookmark
from django.contrib.auth import get_user_model
from django.db.models import Count

# Get the custom User model defined in your Django project
User = get_user_model()

# --- Utility Serializers ---

class CategorySerializer(serializers.ModelSerializer):
    """Category serializer - Converted to use Django ORM"""
    id = serializers.UUIDField(read_only=True)
    book_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        # Added slug for completeness
        fields = ['id', 'name', 'slug', 'description', 'book_count', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_book_count(self, obj):
        # to count published books belonging to this category.
        return obj.books.filter(is_published=True).count()


# --- Book List and Detail Serializers ---

class BookListSerializer(serializers.ModelSerializer):
    """Book list serializer for catalog view - Converted to ModelSerializer"""
    id = serializers.UUIDField(read_only=True)
    categories = CategorySerializer(many=True, read_only=True) # Nested serializer for ManyToMany
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    reading_progress = serializers.SerializerMethodField() # Requires the 'reading' app

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'description', 'language', 'year', 
            'pages', 'cover_image', 'file', 'file_type', 'is_published',
            'view_count', 'like_count', 'bookmark_count', 'tags',
            'categories', 'is_liked', 'is_bookmarked', 'reading_progress', 'created_at'
        ]
        read_only_fields = fields # All fields are read-only for the List view

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # ORM query: Check existence of a like by the current user for this book
            return obj.likes.filter(user=request.user).exists()
        return False
    
    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # ORM query: Check existence of a bookmark by the current user for this book
            return obj.bookmarks.filter(user=request.user).exists()
        return False
    
    def get_reading_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                # Assuming 'ReadingProgress' has also been converted to Django ORM
                from reading.models import ReadingProgress 
                
                # ORM query: Get reading progress for the current user and book
                progress = ReadingProgress.objects.filter(user=request.user, book=obj).first()
                if progress:
                    return {
                        'percent': progress.percent,
                        'last_location': progress.last_location,
                        'completed': progress.completed
                    }
            except ImportError:
                # This handles cases where the 'reading' app is not yet available
                return None 
        return None


class BookDetailSerializer(BookListSerializer):
    """Book detail serializer - Inherits List fields and adds specific detail fields"""
    class Meta(BookListSerializer.Meta):
        # Explicitly add fields that were missing or are important for detail view
        fields = BookListSerializer.Meta.fields + ['isbn', 'updated_at']
        read_only_fields = BookListSerializer.Meta.read_only_fields + ['isbn', 'updated_at',]


# --- Book Creation/Update Serializers (Admin/Author View) ---

class BookCreateUpdateSerializer(serializers.ModelSerializer):
    """Book create/update serializer for admin - Converted to use Django ORM and relations"""
    id = serializers.UUIDField(read_only=True)
    
    # categories: Accepts a list of Category UUIDs (write-only)
    categories = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False,
        help_text="List of Category UUIDs."
    )
    
    # author: Accepts a single Author UUID (write-only)
    author = serializers.UUIDField(write_only=True, help_text="Author UUID.")

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'description', 'language', 'year', 'isbn', 'author', 'pages',
            'cover_image', 'file', 'file_type', 'is_published', 'tags',
            'author', 'categories'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'view_count', 'like_count', 'bookmark_count']

    def validate_author(self, value):
        # Validate that the provided Author UUID exists
        try:
            return Author.objects.get(id=value)
        except Author.DoesNotExist:
            raise serializers.ValidationError(f"Author with ID {value} does not exist.")

    def create(self, validated_data):
        categories_data = validated_data.pop('categories', [])
        author_instance = validated_data.pop('author') # This is the Author object returned by validate_author

        # 1. Create the book instance
        book = Book.objects.create(author=author_instance, **validated_data)
        
        # 2. Handle ManyToMany relationship (categories)
        if categories_data:
            category_objects = Category.objects.filter(id__in=categories_data)
            book.categories.set(category_objects) # .set() handles the M2M assignment
        
        return book
    
    def update(self, instance, validated_data):
        categories_data = validated_data.pop('categories', None)
        author_instance = validated_data.pop('author', None)

        # Update Author relationship if provided
        if author_instance is not None:
            instance.author = author_instance
        
        # Update scalar fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update ManyToMany relationship (categories) if provided
        if categories_data is not None:
            category_objects = Category.objects.filter(id__in=categories_data)
            instance.categories.set(category_objects)
        
        instance.save()
        return instance

# --- Interaction Serializers (Like/Bookmark) ---

class BookLikeSerializer(serializers.ModelSerializer):
    """
    Book like serializer. Only needs to handle the creation of the relationship.
    User and Book FKs will be set by the view.
    """
    id = serializers.UUIDField(read_only=True)
    
    class Meta:
        model = BookLike
        # Fields for reading/creating. On create, only a POST is needed, other fields are set by view.
        fields = ['id', 'book', 'created_at'] 
        read_only_fields = ['id', 'created_at']
        # The book field must be writable on creation, but the user didn't specify it in the original
        extra_kwargs = {'book': {'write_only': True, 'required': True}}


class BookmarkSerializer(serializers.ModelSerializer):
    """Book bookmark serializer. 'location' is the only required field on creation."""
    id = serializers.UUIDField(read_only=True)
    
    class Meta:
        model = Bookmark
        fields = ['id', 'location', 'book', 'created_at']
        read_only_fields = ['id', 'created_at']
        # The book field must be writable on creation, but the user didn't specify it in the original
        extra_kwargs = {'book': {'write_only': True, 'required': True}}
