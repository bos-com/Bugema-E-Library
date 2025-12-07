from rest_framework import serializers


class OverviewSerializer(serializers.Serializer):
    total_books = serializers.IntegerField()
    total_categories = serializers.IntegerField()
    total_users = serializers.IntegerField()
    total_reads = serializers.IntegerField()
    total_reads_period = serializers.IntegerField(required=False)
    active_users_7d = serializers.IntegerField()
    period = serializers.CharField(required=False)


class MostReadBookSerializer(serializers.Serializer):
    id = serializers.CharField()
    title = serializers.CharField()
    author = serializers.CharField()
    view_count = serializers.IntegerField()
    like_count = serializers.IntegerField()


class MostLikedBookSerializer(serializers.Serializer):
    id = serializers.CharField()
    title = serializers.CharField()
    author = serializers.CharField()
    like_count = serializers.IntegerField()


class CategoryLikesSerializer(serializers.Serializer):
    name = serializers.CharField()
    likes = serializers.IntegerField()


class ReadsPerDaySerializer(serializers.Serializer):
    date = serializers.CharField()
    count = serializers.IntegerField()


class ReadsPerHourSerializer(serializers.Serializer):
    hour = serializers.IntegerField()
    count = serializers.IntegerField()


class SearchTermSerializer(serializers.Serializer):
    term = serializers.CharField()
    count = serializers.IntegerField()


class FavoriteCategorySerializer(serializers.Serializer):
    name = serializers.CharField()
    count = serializers.IntegerField()


class DailyPagesSerializer(serializers.Serializer):
    date = serializers.CharField()
    pages = serializers.IntegerField()


class UserReadingStatsSerializer(serializers.Serializer):
    total_books_read = serializers.IntegerField()
    total_time_seconds = serializers.IntegerField()
    total_pages_read = serializers.IntegerField()
    current_streak_days = serializers.IntegerField()
    longest_streak_days = serializers.IntegerField()
    favorite_category = serializers.CharField(allow_null=True, required=False)
    favorite_categories = FavoriteCategorySerializer(many=True)
    reading_goal_progress = serializers.FloatField()
    books_read_this_year = serializers.IntegerField()
    books_read_this_month = serializers.IntegerField()
    total_time_this_month_seconds = serializers.IntegerField()
    pages_daily_activity = DailyPagesSerializer(many=True, required=False)


class AdminAnalyticsSerializer(serializers.Serializer):
    overview = OverviewSerializer()
    most_read_books = MostReadBookSerializer(many=True)
    most_liked_books = MostLikedBookSerializer(many=True, required=False)
    most_liked_categories = CategoryLikesSerializer(many=True)
    reads_per_day = ReadsPerDaySerializer(many=True)
    reads_per_hour = ReadsPerHourSerializer(many=True)
    top_search_terms = SearchTermSerializer(many=True)
