from mongoengine import Document, StringField, DateTimeField, IntField, ReferenceField, FloatField, BooleanField
from datetime import datetime
import uuid


class ReadingProgress(Document):
    """Reading progress tracking model"""
    
    id = StringField(primary_key=True, default=lambda: str(uuid.uuid4()))
    user = StringField(required=True)  # User ID
    book = ReferenceField('Book', required=True)
    last_location = StringField(required=True)  # Page number for PDF or CFI for EPUB
    percent = FloatField(required=True, min_value=0, max_value=100)
    total_time_seconds = IntField(default=0)
    last_opened_at = DateTimeField(default=datetime.utcnow)
    completed = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'reading_progress',
        'indexes': [
            ('user', 'book'),  # Unique constraint
            'user',
            'book',
            'completed',
            'last_opened_at'
        ]
    }
    
    def __str__(self):
        return f"Progress: {self.user} -> {self.book.title} ({self.percent}%)"


class ReadingSession(Document):
    """Reading session tracking model"""
    
    id = StringField(primary_key=True, default=lambda: str(uuid.uuid4()))
    user = StringField(required=True)  # User ID
    book = ReferenceField('Book', required=True)
    started_at = DateTimeField(required=True, default=datetime.utcnow)
    ended_at = DateTimeField()
    duration_seconds = IntField(default=0)
    created_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'reading_sessions',
        'indexes': [
            'user',
            'book',
            'started_at',
            'ended_at'
        ]
    }
    
    def __str__(self):
        return f"Session: {self.user} -> {self.book.title} ({self.duration_seconds}s)"
