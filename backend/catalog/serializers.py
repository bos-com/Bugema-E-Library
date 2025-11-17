from rest_framework import serializers
from .models import Category, Book, BookLike, Bookmark, Author 
from django.contrib.auth import get_user_model

# Get the custom User model defined in your Django project
User = get_user_model()

# --- Utility Serializers ---

class CategorySerializer(serializers.ModelSerializer):
    book_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'book_count', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_book_count(self, obj):
        return obj.books.filter(is_published=True).count()


# --- Book List and Detail Serializers ---

class BookListSerializer(serializers.ModelSerializer):
    author = serializers.CharField(source='author.name', read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    reading_progress = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()
    file = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'description', 'language', 'year', 
            'pages', 'cover_image', 'file', 'file_type', 'is_published',
            'view_count', 'like_count', 'bookmark_count', 'tags',
            'categories', 'is_liked', 'is_bookmarked', 'reading_progress', 'created_at'
        ]
        read_only_fields = fields

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False
    
    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.bookmarks.filter(user=request.user).exists()
        return False
    
    def get_reading_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                from reading.models import ReadingProgress 
                
                progress = ReadingProgress.objects.filter(user=request.user, book=obj).first()
                if progress:
                    return {
                        'percent': progress.percent,
                        'last_location': progress.last_location,
                        'completed': progress.completed
                    }
            except ImportError:
                return None 
        return None

    def _build_absolute_uri(self, obj, field_name):
        field = getattr(obj, field_name, None)
        if not field:
            return None
        url = field.url if hasattr(field, 'url') else field
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(url)
        return url

    def get_cover_image(self, obj):
        return self._build_absolute_uri(obj, 'cover_image')

    def get_file(self, obj):
        return self._build_absolute_uri(obj, 'file')


class BookDetailSerializer(BookListSerializer):
    class Meta(BookListSerializer.Meta):
        fields = BookListSerializer.Meta.fields + ['isbn', 'updated_at']
        read_only_fields = BookListSerializer.Meta.read_only_fields + ['isbn', 'updated_at',]



# --- Book Creation/Update Serializers ---
class BookCreateUpdateSerializer(serializers.ModelSerializer):
    # These fields are for accepting human-readable names during WRITE (Create/Update)
    author_name = serializers.CharField(write_only=True, required=True, max_length=255)
    category_names = serializers.ListField(
        child=serializers.CharField(max_length=100),
        write_only=True,
        required=False
    )

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'description', 'language', 'year', 'isbn', 
            'pages', 'cover_image', 'file', 'file_type', 'is_published', 'tags', 
            'author_name', 'category_names' 
        ]

    # --- create() method is correct and remains as you wrote it ---
    def create(self, validated_data):
        author_name = validated_data.pop('author_name')
        category_names = validated_data.pop('category_names', [])
        
        # 1. Get or create Author
        author_instance, _ = Author.objects.get_or_create(name=author_name, defaults={'name': author_name})
        
        # 2. Create the Book instance (handles all remaining fields, including 'file')
        book = Book.objects.create(author=author_instance, **validated_data)
        
        # 3. Get or create Categories and set the relationship
        category_instances = []
        for name in category_names:
            category_instance, _ = Category.objects.get_or_create(name=name, defaults={'name': name})
            category_instances.append(category_instance)
        
        if category_instances:
            book.categories.set(category_instances)
        
        return book

    # --- MOVED and FIXED update() method ---
    def update(self, instance, validated_data):
        # Pop the custom fields from the validated data
        author_name = validated_data.pop('author_name', None)
        category_names = validated_data.pop('category_names', None)

        # Handle Author update
        if author_name is not None:
            author_instance, _ = Author.objects.get_or_create(name=author_name, defaults={'name': author_name})
            instance.author = author_instance

        # Handle Categories update
        if category_names is not None:
            category_instances = []
            for name in category_names:
                category_instance, _ = Category.objects.get_or_create(name=name, defaults={'name': name})
                category_instances.append(category_instance)
            
            instance.categories.set(category_instances)

        # Handle all standard fields, including 'cover_image' and 'file'
        # If a new file is provided in the request, Django/DRF handles replacing the old file.
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance


# --- Interaction Serializers (Like/Bookmark) ---

class BookLikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookLike
        fields = ['id', 'book', 'created_at'] 
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {'book': {'write_only': True, 'required': True}}


class BookmarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bookmark
        fields = ['id', 'location', 'book', 'created_at']
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {'book': {'write_only': True, 'required': True}}