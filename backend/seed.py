#!/usr/bin/env python
"""
Seed script to populate the database with sample data
"""
import os
import sys
import django
from datetime import datetime, timedelta
import random

from catalog.models import Category, Book, BookLike, Bookmark
from reading.models import ReadingProgress, ReadingSession
from analytics.models import EventLog
from accounts.models import User


# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'elibrary.settings')
django.setup()

from accounts.models import User
from catalog.models import Category, Book, BookLike, Bookmark
from reading.models import ReadingProgress, ReadingSession
from analytics.models import EventLog


def create_sample_categories():
    """Create sample categories"""
    categories_data = [
        {
            'name': 'Fiction',
            'slug': 'fiction',
            'description': 'Novels, short stories, and other fictional works'
        },
        {
            'name': 'Science Fiction',
            'slug': 'science-fiction',
            'description': 'Speculative fiction dealing with futuristic concepts'
        },
        {
            'name': 'Mystery',
            'slug': 'mystery',
            'description': 'Crime and detective stories'
        },
        {
            'name': 'Romance',
            'slug': 'romance',
            'description': 'Love stories and romantic fiction'
        },
        {
            'name': 'Fantasy',
            'slug': 'fantasy',
            'description': 'Fantasy and magical fiction'
        },
        {
            'name': 'Non-Fiction',
            'slug': 'non-fiction',
            'description': 'Biographies, history, and factual works'
        },
        {
            'name': 'Biography',
            'slug': 'biography',
            'description': 'Life stories of notable people'
        },
        {
            'name': 'History',
            'slug': 'history',
            'description': 'Historical accounts and analysis'
        },
        {
            'name': 'Technology',
            'slug': 'technology',
            'description': 'Books about technology and programming'
        },
        {
            'name': 'Self-Help',
            'slug': 'self-help',
            'description': 'Personal development and improvement books'
        }
    ]
    
    categories = []
    for cat_data in categories_data:
        existing = Category.objects(slug=cat_data['slug']).first()
        if existing:
            category, created = existing, False
        else:
            category = Category(**cat_data).save()
            created = True
        categories.append(category)
        print(f"{'Created' if created else 'Found'} category: {category.name}")

    return categories

def create_sample_books(categories):
    """Create sample books"""
    books_data = [
        {
            'title': 'The Great Gatsby',
            'author': 'F. Scott Fitzgerald',
            'description': 'A classic American novel set in the Jazz Age, following the mysterious Jay Gatsby and his obsession with the beautiful Daisy Buchanan.',
            'categories': ['fiction'],
            'tags': ['classic', 'american', 'jazz age'],
            'language': 'en',
            'year': 1925,
            'isbn': '9780743273565',
            'pages': 180,
            'file_type': 'PDF'
        },
        {
            'title': '1984',
            'author': 'George Orwell',
            'description': 'A dystopian social science fiction novel about totalitarian control and surveillance.',
            'categories': ['science-fiction', 'fiction'],
            'tags': ['dystopian', 'totalitarian', 'surveillance'],
            'language': 'en',
            'year': 1949,
            'isbn': '9780452284234',
            'pages': 328,
            'file_type': 'PDF'
        },
        {
            'title': 'To Kill a Mockingbird',
            'author': 'Harper Lee',
            'description': 'A novel about racial injustice and childhood innocence in the American South.',
            'categories': ['fiction'],
            'tags': ['classic', 'american', 'racial justice'],
            'language': 'en',
            'year': 1960,
            'isbn': '9780061120085',
            'pages': 281,
            'file_type': 'PDF'
        },
        {
            'title': 'Pride and Prejudice',
            'author': 'Jane Austen',
            'description': 'A romantic novel about Elizabeth Bennet and Mr. Darcy in Georgian England.',
            'categories': ['romance', 'fiction'],
            'tags': ['classic', 'romance', 'british'],
            'language': 'en',
            'year': 1813,
            'isbn': '9780141439518',
            'pages': 432,
            'file_type': 'EPUB'
        },
        {
            'title': 'The Hobbit',
            'author': 'J.R.R. Tolkien',
            'description': 'A fantasy novel about Bilbo Baggins and his unexpected journey.',
            'categories': ['fantasy', 'fiction'],
            'tags': ['fantasy', 'adventure', 'middle-earth'],
            'language': 'en',
            'year': 1937,
            'isbn': '9780547928227',
            'pages': 310,
            'file_type': 'EPUB'
        },
        {
            'title': 'The Catcher in the Rye',
            'author': 'J.D. Salinger',
            'description': 'A coming-of-age story about teenager Holden Caulfield.',
            'categories': ['fiction'],
            'tags': ['coming-of-age', 'teenager', 'american'],
            'language': 'en',
            'year': 1951,
            'isbn': '9780316769174',
            'pages': 277,
            'file_type': 'PDF'
        },
        {
            'title': 'The Lord of the Rings',
            'author': 'J.R.R. Tolkien',
            'description': 'An epic high-fantasy novel about the quest to destroy the One Ring.',
            'categories': ['fantasy', 'fiction'],
            'tags': ['fantasy', 'epic', 'middle-earth', 'adventure'],
            'language': 'en',
            'year': 1954,
            'isbn': '9780544003415',
            'pages': 1216,
            'file_type': 'EPUB'
        },
        {
            'title': 'The Da Vinci Code',
            'author': 'Dan Brown',
            'description': 'A mystery thriller about symbologist Robert Langdon.',
            'categories': ['mystery', 'fiction'],
            'tags': ['thriller', 'conspiracy', 'art', 'religion'],
            'language': 'en',
            'year': 2003,
            'isbn': '9780307474278',
            'pages': 689,
            'file_type': 'PDF'
        },
        {
            'title': 'The Alchemist',
            'author': 'Paulo Coelho',
            'description': 'A philosophical novel about a young shepherd named Santiago.',
            'categories': ['fiction', 'self-help'],
            'tags': ['philosophy', 'spiritual', 'journey', 'wisdom'],
            'language': 'en',
            'year': 1988,
            'isbn': '9780061120084',
            'pages': 163,
            'file_type': 'EPUB'
        },
        {
            'title': 'Sapiens',
            'author': 'Yuval Noah Harari',
            'description': 'A brief history of humankind from the Stone Age to the present.',
            'categories': ['non-fiction', 'history'],
            'tags': ['history', 'anthropology', 'evolution', 'civilization'],
            'language': 'en',
            'year': 2011,
            'isbn': '9780062316097',
            'pages': 443,
            'file_type': 'PDF'
        },
        {
            'title': 'Clean Code',
            'author': 'Robert C. Martin',
            'description': 'A handbook of agile software craftsmanship.',
            'categories': ['technology'],
            'tags': ['programming', 'software', 'clean code', 'best practices'],
            'language': 'en',
            'year': 2008,
            'isbn': '9780132350884',
            'pages': 464,
            'file_type': 'PDF'
        },
        {
            'title': 'The Lean Startup',
            'author': 'Eric Ries',
            'description': 'How constant innovation creates radically successful businesses.',
            'categories': ['technology', 'self-help'],
            'tags': ['startup', 'business', 'innovation', 'entrepreneurship'],
            'language': 'en',
            'year': 2011,
            'isbn': '9780307887894',
            'pages': 336,
            'file_type': 'EPUB'
        },
        {
            'title': 'Steve Jobs',
            'author': 'Walter Isaacson',
            'description': 'The exclusive biography of Steve Jobs.',
            'categories': ['biography', 'technology'],
            'tags': ['biography', 'steve jobs', 'apple', 'technology'],
            'language': 'en',
            'year': 2011,
            'isbn': '9781451648539',
            'pages': 656,
            'file_type': 'PDF'
        },
        {
            'title': 'Atomic Habits',
            'author': 'James Clear',
            'description': 'An easy and proven way to build good habits and break bad ones.',
            'categories': ['self-help'],
            'tags': ['habits', 'productivity', 'self-improvement', 'psychology'],
            'language': 'en',
            'year': 2018,
            'isbn': '9780735211292',
            'pages': 320,
            'file_type': 'EPUB'
        },
        {
            'title': 'The Psychology of Money',
            'author': 'Morgan Housel',
            'description': 'Timeless lessons on wealth, greed, and happiness.',
            'categories': ['self-help', 'non-fiction'],
            'tags': ['money', 'psychology', 'wealth', 'finance'],
            'language': 'en',
            'year': 2020,
            'isbn': '9780857197689',
            'pages': 256,
            'file_type': 'PDF'
        }
    ]
    


    books = []
    for book_data in books_data:
        # Get category objects
        category_objects = []
        for cat_slug in book_data['categories']:
            try:
                category = Category.objects.get(slug=cat_slug)
                category_objects.append(category)
            except Category.DoesNotExist:
                print(f"Warning: Category '{cat_slug}' not found for book '{book_data['title']}'")
        
        # Create book
        book = Book.objects.create(
            title=book_data['title'],
            author=book_data['author'],
            description=book_data['description'],
            categories=category_objects,
            tags=book_data['tags'],
            language=book_data['language'],
            year=book_data['year'],
            isbn=book_data['isbn'],
            pages=book_data['pages'],
            file_type=book_data['file_type'],
            is_published=True,
            # Generate fake GridFS IDs for demo
            cover_image=f"cover_{book_data['isbn']}.jpg",
            file=f"book_{book_data['isbn']}.{book_data['file_type'].lower()}"
        )
        books.append(book)
        print(f"Created book: {book.title}")
    
    return books


def create_sample_users():
    users_data = [
        {"email": "admin@elibrary.com", "name": "Admin User", "role": "ADMIN"},
        {"email": "john.doe@example.com", "name": "John Doe", "role": "USER"},
        {"email": "jane.smith@example.com", "name": "Jane Smith", "role": "USER"},
        {"email": "bob.wilson@example.com", "name": "Bob Wilson", "role": "USER"},
    ]

    users = []
    for data in users_data:
        existing = User.objects(email=data["email"]).first()
        if existing:
            user, created = existing, False
        else:
            user = User(
                email=data["email"],
                name=data["name"],
                role=data["role"],
            )
            if hasattr(user, "set_password"):
                user.set_password("password123")  # sets user.password
            else:
                user.password = "password123"     # fallback if plain field
            user.save()
            created = True

        users.append(user)
        print(f"{'Created' if created else 'Found'} user: {user.name}")

    return users



def create_sample_interactions(users, books):
    """Create sample user interactions"""
    # Likes
    for user in users[1:]:
        liked_books = random.sample(books, random.randint(3, 8))
        for book in liked_books:
            existing = BookLike.objects(user=str(user.id), book=book).first()
            if not existing:
                BookLike(user=str(user.id), book=book).save()
                book.like_count += 1
                book.save()

    # Bookmarks
    for user in users[1:]:
        bookmarked_books = random.sample(books, random.randint(2, 5))
        for book in bookmarked_books:
            loc = str(random.randint(1, book.pages or 100))
            existing = Bookmark.objects(user=str(user.id), book=book, location=loc).first()
            if not existing:
                Bookmark(user=str(user.id), book=book, location=loc).save()
                book.bookmark_count += 1
                book.save()

    # Reading progress
    for user in users[1:]:
        read_books = random.sample(books, random.randint(2, 6))
        for book in read_books:
            progress = ReadingProgress.objects(user=str(user.id), book=book).first()
            if not progress:
                progress = ReadingProgress(
                    user=str(user.id),
                    book=book,
                    last_location=str(random.randint(1, book.pages or 100)),
                    percent=random.uniform(0, 100),
                    total_time_seconds=random.randint(300, 7200),
                    completed=random.choice([True, False]),
                ).save()
                book.view_count += random.randint(1, 10)
                book.save()

    print("Created sample user interactions")


def create_sample_analytics(users, books):
    """Create sample analytics events"""
    event_types = ['OPEN_BOOK', 'LIKE', 'BOOKMARK', 'SEARCH', 'READ_PROGRESS']
    search_terms = ['fiction', 'mystery', 'romance', 'fantasy', 'technology', 'history', 'biography']
    
    # Create events for the last 30 days
    for i in range(30):
        date = datetime.utcnow() - timedelta(days=i)
        
        # Create 5-20 events per day
        num_events = random.randint(5, 20)
        for _ in range(num_events):
            user = random.choice(users[1:])  # Skip admin
            book = random.choice(books)
            event_type = random.choice(event_types)
            
            payload = {
                'book_id': str(book.id),
                'book_title': book.title
            }
            
            if event_type == 'SEARCH':
                payload['query'] = random.choice(search_terms)
            elif event_type == 'READ_PROGRESS':
                payload['percent'] = random.uniform(0, 100)
                payload['location'] = str(random.randint(1, book.pages or 100))
            
            EventLog.objects.create(
                event_type=event_type,
                payload=payload,
                user=str(user.id),
                created_at=date
            )
    
    print("Created sample analytics events")


def main():
    """Main seed function"""
    print("Starting database seeding...")

    # Clear existing data
    print("Clearing existing data (dropping collections)...")
    EventLog.drop_collection()
    ReadingSession.drop_collection()
    ReadingProgress.drop_collection()
    Bookmark.drop_collection()
    BookLike.drop_collection()
    Book.drop_collection()
    Category.drop_collection()
    User.drop_collection()   # ✅ align with the others

    # Create sample data
    print("Creating categories...")
    categories = create_sample_categories()
    
    print("Creating books...")
    books = create_sample_books(categories)
    
    print("Creating users...")
    users = create_sample_users()
    
    print("Creating user interactions...")
    create_sample_interactions(users, books)
    
    print("Creating analytics events...")
    create_sample_analytics(users, books)
    
    print("Database seeding completed!")
    print(f"Created {len(categories)} categories")
    print(f"Created {len(books)} books")
    print(f"Created {len(users)} users")
    print(f"Created {EventLog.objects.count()} analytics events")


if __name__ == '__main__':
    main()
