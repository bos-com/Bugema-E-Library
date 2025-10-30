from rest_framework import serializers
from .models import Category, Book, BookLike, Bookmark
from datetime import datetime
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from bson import ObjectId


class CategorySerializer(serializers.ModelSerializer):
    """Category serializer"""
    book_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'cover_image', 'book_count', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_book_count(self, obj):
        return Book.objects(categories__in=[obj], is_published=True).count()


class BookListSerializer(serializers.Serializer):
    """Book list serializer for catalog view"""
    id = serializers.CharField(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    reading_progress = serializers.SerializerMethodField()


    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user and hasattr(request.user, 'id'):
            return BookLike.objects(user=request.user.id, book=obj).first() is not None
        return False
    
    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user and hasattr(request.user, 'id'):
            return Bookmark.objects(user=request.user.id, book=obj).first() is not None
        return False
    
    def get_reading_progress(self, obj):
        request = self.context.get('request')
        if request and request.user and hasattr(request.user, 'id'):
            from reading.models import ReadingProgress
            progress = ReadingProgress.objects(user=request.user.id, book=obj).first()
            if progress:
                return {
                    'percent': progress.percent,
                    'last_location': progress.last_location,
                    'completed': progress.completed
                }
        return None


class BookDetailSerializer(BookListSerializer):
    """Book detail serializer"""
    id = serializers.CharField(read_only=True)
    isbn = serializers.CharField(read_only=True)


class BookCreateUpdateSerializer(serializers.Serializer):
    """Book create/update serializer for admin"""
    id = serializers.CharField(read_only=True)
    categories = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )

    def create(self, validated_data):
        categories_data = validated_data.pop('categories', [])
        book = Book.objects.create(**validated_data)
        
        # Add categories
        if categories_data:
            category_objects = Category.objects(id__in=categories_data)
            book.categories = list(category_objects)
            book.save()
        
        return book
    
    def update(self, instance, validated_data):
        categories_data = validated_data.pop('categories', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if categories_data is not None:
            category_objects = Category.objects(id__in=categories_data)
            instance.categories = list(category_objects)
        
        instance.save()
        return instance


class BookLikeSerializer(serializers.Serializer):
    """Book like serializer"""
    id = serializers.CharField(read_only=True)


class BookmarkSerializer(serializers.Serializer):
    """Book bookmark serializer"""
    id = serializers.CharField(read_only=True)
