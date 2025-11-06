from rest_framework import serializers
from .models import Category, Book, BookLike, Bookmark, Author 
from django.contrib.auth import get_user_model
from django.db.models import Count

# Get the custom User model defined in your Django project
User = get_user_model()

# --- Utility Serializers ---

class CategorySerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    book_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'book_count', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_book_count(self, obj):
        return obj.books.filter(is_published=True).count()


# --- Book List and Detail Serializers ---

class BookListSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    reading_progress = serializers.SerializerMethodField()

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


class BookDetailSerializer(BookListSerializer):
    class Meta(BookListSerializer.Meta):
        fields = BookListSerializer.Meta.fields + ['isbn', 'updated_at']
        read_only_fields = BookListSerializer.Meta.read_only_fields + ['isbn', 'updated_at',]


# --- Book Creation/Update Serializers ---
class BookCreateUpdateSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    
# NEW (Corrected)
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
            'author_name', 'category_names' # Use the new fields in Meta
        ]

    def create(self, validated_data):
        author_name = validated_data.pop('author_name')
        category_names = validated_data.pop('category_names', [])
        

        author_instance, created = Author.objects.get_or_create(
            name=author_name,
            defaults={'name': author_name}
        )

        # 3. Create the Book instance
        book = Book.objects.create(author=author_instance, **validated_data)
        
        category_instances = []
        for name in category_names:
            category_instance, created = Category.objects.get_or_create(
                name=name,
                defaults={'name': name}
            )
            category_instances.append(category_instance)
        
        if category_instances:
            book.categories.set(category_instances)
        
        return book


def update(self, instance, validated_data):
        # 1. Pop the new name-based fields from the validated data
        author_name = validated_data.pop('author_name', None)
        category_names = validated_data.pop('category_names', None)

        # 2. Handle Author update by name (if provided)
        if author_name is not None:
            # Get or create the Author instance
            author_instance, _ = Author.objects.get_or_create(
                name=author_name,
                defaults={'name': author_name}
            )
            instance.author = author_instance

        # 3. Handle Categories update by name (if provided)
        if category_names is not None:
            category_instances = []
            for name in category_names:
                # Get or create the Category instance
                category_instance, _ = Category.objects.get_or_create(
                    name=name,
                    defaults={'name': name}
                )
                category_instances.append(category_instance)
            
            # Set the ManyToMany relationship
            instance.categories.set(category_instances)

        # 4. Handle all other standard fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

# --- Interaction Serializers (Like/Bookmark) ---

class BookLikeSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    
    class Meta:
        model = BookLike
        fields = ['id', 'book', 'created_at'] 
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {'book': {'write_only': True, 'required': True}}


class BookmarkSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    
    class Meta:
        model = Bookmark
        fields = ['id', 'location', 'book', 'created_at']
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {'book': {'write_only': True, 'required': True}}