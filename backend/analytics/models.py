from mongoengine import Document, StringField, DateTimeField, DictField, ReferenceField
from datetime import datetime
import uuid


class EventLog(Document):
    """Analytics event logging model"""
    
    EVENT_TYPES = [
        'OPEN_BOOK',
        'LIKE',
        'BOOKMARK',
        'SEARCH',
        'READ_PROGRESS',
        'LOGIN',
        'LOGOUT',
        'REGISTER'
    ]
    
    id = StringField(primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type = StringField(required=True, choices=EVENT_TYPES)
    payload = DictField()  # Flexible data storage
    user = StringField()  # User ID, optional for anonymous events
    ip_address = StringField(max_length=45)  # IPv6 compatible
    user_agent = StringField(max_length=500)
    created_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'event_logs',
        'indexes': [
            'event_type',
            'user',
            'created_at',
            ('event_type', 'created_at'),
            ('user', 'created_at'),
        ]
    }
    
    def __str__(self):
        return f"Event: {self.event_type} by {self.user or 'Anonymous'}"
