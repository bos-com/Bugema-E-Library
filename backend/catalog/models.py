from mongoengine import Document, StringField, DateTimeField, ListField, BooleanField, IntField, ReferenceField, FloatField
from datetime import datetime
import uuid


class Category(Document):
    """Book category model"""
    
    id = StringField(primary_key=True, default=lambda: str(uuid.uuid4()))
    name = StringField(required=True, max_length=255)
    slug = StringField(required=True, unique=True, max_length=255)
    description = StringField(max_length=1000)
    cover_image = StringField(max_length=255)  # GridFS file ID
    created_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'categories',
        'indexes': [
            'slug',
            'name',
            'created_at'
        ]
    }
    
    def __str__(self):
        return self.name


class Book(Document):
    """Book model"""
    
    id = StringField(primary_key=True, default=lambda: str(uuid.uuid4()))
    title = StringField(required=True, max_length=500)
    author = StringField(required=True, max_length=255)
    description = StringField(max_length=2000)
    categories = ListField(ReferenceField(Category))
    tags = ListField(StringField(max_length=50))
    language = StringField(max_length=10, default='en')
    year = IntField()
    isbn = StringField(max_length=20, unique=True, sparse=True)
    pages = IntField()
    cover_image = StringField(max_length=255)  # GridFS file ID
    file = StringField(required=True, max_length=255)  # GridFS file ID
    file_type = StringField(required=True, choices=['PDF', 'EPUB'], default='PDF')
    is_published = BooleanField(default=True)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    
    # Analytics fields
    view_count = IntField(default=0)
    like_count = IntField(default=0)
    bookmark_count = IntField(default=0)
    
    meta = {
        'collection': 'books',
        'indexes': [
            'title',
            'author',
            'isbn',
            'is_published',
            'created_at',
            'view_count',
            'like_count',
            ('title', 'author', 'description', 'tags'),  # Text search index
        ]
    }
    
    def __str__(self):
        return f"{self.title} by {self.author}"


class BookLike(Document):
    """Book like model"""
    
    id = StringField(primary_key=True, default=lambda: str(uuid.uuid4()))
    user = StringField(required=True)  # User ID
    book = ReferenceField(Book, required=True)
    created_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'book_likes',
        'indexes': [
            {'fields': ('user', 'book'), 'unique': True},  # Unique constraint
            'user',
            'book',
            'created_at'
        ]
    }
    
    def __str__(self):
        return f"Like: {self.user} -> {self.book.title}"


class Bookmark(Document):
    """Book bookmark model"""
    
    id = StringField(primary_key=True, default=lambda: str(uuid.uuid4()))
    user = StringField(required=True)  # User ID
    book = ReferenceField(Book, required=True)
    location = StringField(required=True)  # Page number for PDF or CFI for EPUB
    created_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'bookmarks',
        'indexes': [
            {'fields': ('user', 'book'), 'unique': True},   # Unique constraint
            'user',
            'book',
            'created_at'
        ]
    }
    
    def __str__(self):
        return f"Bookmark: {self.user} -> {self.book.title} at {self.location}"
