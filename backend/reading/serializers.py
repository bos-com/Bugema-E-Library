from rest_framework import serializers
from .models import ReadingProgress, ReadingSession


class ReadingProgressSerializer(serializers.ModelSerializer):
    """Reading progress serializer"""
    book_title = serializers.CharField(source='book.title', read_only=True)
    book_author = serializers.CharField(source='book.author', read_only=True)
    book_cover = serializers.SerializerMethodField()
    
    class Meta:
        model = ReadingProgress
        fields = [
            'id', 'book', 'book_title', 'book_author', 'book_cover',
            'last_location', 'percent', 'total_time_seconds',
            'last_opened_at', 'completed', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_percent(self, value):
        if not 0 <= value <= 100:
            raise serializers.ValidationError("Percent must be between 0 and 100")
        return value

    def get_book_cover(self, obj):
        book = getattr(obj, 'book', None)
        if not book or not book.cover_image:
            return None
        request = self.context.get('request')
        url = book.cover_image.url if hasattr(book.cover_image, 'url') else book.cover_image
        if request:
            return request.build_absolute_uri(url)
        return url


class ReadingSessionSerializer(serializers.ModelSerializer):
    """Reading session serializer"""
    book_title = serializers.CharField(source='book.title', read_only=True)
    book_author = serializers.CharField(source='book.author', read_only=True)
    
    class Meta:
        model = ReadingSession
        fields = [
            'id', 'book', 'book_title', 'book_author',
            'started_at', 'ended_at', 'duration_seconds', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ReadingStatsSerializer(serializers.Serializer):
    """Reading statistics serializer"""
    total_books_read = serializers.IntegerField()
    total_time_seconds = serializers.IntegerField()
    total_pages_read = serializers.IntegerField()
    current_streak_days = serializers.IntegerField()
    longest_streak_days = serializers.IntegerField()
    favorite_category = serializers.CharField()
    reading_goal_progress = serializers.FloatField()
