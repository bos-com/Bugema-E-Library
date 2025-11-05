#!/usr/bin/env python
"""
Seed script to populate the database with sample data using Django ORM (PostgreSQL)
"""
import os
import sys
import django
from datetime import datetime, timedelta
import random

# --- Django Setup ---
# Must be done before importing Django models
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'elibrary.settings')
try:
    django.setup()
except Exception as e:
    print(f"Error setting up Django: {e}")
    sys.exit(1)

# --- Model Imports ---
# NOTE: Ensure 'reading' and 'analytics' apps are installed if these imports cause errors
from django.contrib.auth import get_user_model
from catalog.models import Category, Book, BookLike, Bookmark
# Import models from other apps (assuming they have also been converted to Django ORM)
from reading.models import ReadingProgress, ReadingSession
from analytics.models import EventLog

User = get_user_model()


# --- Sample Data Definitions (Moved Author extraction logic here) ---

BOOKS_DATA = [
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

CATEGORY_DATA = [
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

USER_DATA = [
    {"email": "admin@elibrary.com", "name": "Admin User", "role": "ADMIN", "is_staff": True, "is_superuser": True},
    {"email": "john.doe@example.com", "name": "John Doe", "role": "USER"},
    {"email": "jane.smith@example.com", "name": "Jane Smith", "role": "USER"},
    {"email": "bob.wilson@example.com", "name": "Bob Wilson", "role": "USER"},
]


# --- Seeding Functions ---

def create_sample_authors(books_data):
    """Create Author objects based on book data"""
    author_names = sorted(list(set(d['author'] for d in books_data)))
    authors = []
    
    for name in author_names:
        author, created = Author.objects.get_or_create(
            name=name,
            defaults={'bio': f"Biography of the famous author {name}."}
        )
        authors.append(author)
        print(f"{'Created' if created else 'Found'} author: {author.name}")

    return {a.name: a for a in authors}


def create_sample_categories():
    """Create sample categories using Django ORM"""
    categories = []
    for cat_data in CATEGORY_DATA:
        # Use get_or_create for transactional safety and idempotency
        category, created = Category.objects.get_or_create(
            slug=cat_data['slug'],
            defaults=cat_data
        )
        categories.append(category)
        print(f"{'Created' if created else 'Found'} category: {category.name}")

    return categories


def create_sample_books(categories, authors_map):
    """Create sample books and assign relationships using Django ORM"""
    category_map = {c.slug: c for c in categories}
    books = []

    for book_data in BOOKS_DATA:
        author_name = book_data.pop('author')
        category_slugs = book_data.pop('categories')
        
        author_instance = authors_map.get(author_name)
        if not author_instance:
            print(f"Error: Author '{author_name}' not found in map. Skipping book: {book_data['title']}")
            continue

        # Check if book already exists by title and author
        existing_book = Book.objects.filter(
            title=book_data['title'], 
            author=author_instance
        ).first()

        if existing_book:
            book = existing_book
            created = False
        else:
            # Create the Book instance (without M2M fields)
            book = Book.objects.create(
                author=author_instance,
                is_published=True,
                cover_image=f"cover_{book_data['isbn']}.jpg",
                file=f"book_{book_data['isbn']}.{book_data['file_type'].lower()}",
                **book_data
            )
            created = True

        # Handle ManyToMany relationship (categories) - only on create or if needed on update
        if created:
            category_objects = [category_map[slug] for slug in category_slugs if slug in category_map]
            book.categories.set(category_objects)
        
        books.append(book)
        print(f"{'Created' if created else 'Found'} book: {book.title}")
    
    return books


def create_sample_users():
    """Create sample users using Django ORM create_user/create_superuser"""
    users = []
    for data in USER_DATA:
        # Use email as the lookup key
        existing_user = User.objects.filter(email=data["email"]).first()
        
        if existing_user:
            user, created = existing_user, False
        else:
            is_staff = data.get("is_staff", False)
            is_superuser = data.get("is_superuser", False)
            
            if is_superuser:
                # Use create_superuser for admin
                user = User.objects.create_superuser(
                    email=data["email"],
                    name=data["name"],
                    password="password123"
                )
            else:
                # Use create_user for regular users
                user = User.objects.create_user(
                    email=data["email"],
                    name=data["name"],
                    password="password123",
                    role=data["role"]
                )
            created = True

        users.append(user)
        print(f"{'Created' if created else 'Found'} user: {user.name}")

    return users


def create_sample_interactions(users, books):
    """Create sample user interactions using Django ORM"""
    
    # Map users to ensure we use the actual object, not ID string
    user_pool = users[1:] 
    
    # Likes
    for user in user_pool:
        liked_books = random.sample(books, random.randint(3, 8))
        for book in liked_books:
            # Check existence using ORM
            if not BookLike.objects.filter(user=user, book=book).exists():
                BookLike.objects.create(user=user, book=book)
                # Manually update denormalized counter field (matching original script's intent)
                book.like_count = book.likes.count() # Recalculate based on relationship
                book.save(update_fields=['like_count'])

    # Bookmarks
    for user in user_pool:
        bookmarked_books = random.sample(books, random.randint(2, 5))
        for book in bookmarked_books:
            # Add a location
            loc = str(random.randint(1, book.pages or 100))
            
            # Check existence using ORM (unique constraint might be on user+book)
            if not Bookmark.objects.filter(user=user, book=book).exists():
                Bookmark.objects.create(user=user, book=book, location=loc)
                # Manually update denormalized counter field
                book.bookmark_count = book.bookmarks.count() # Recalculate based on relationship
                book.save(update_fields=['bookmark_count'])

    # Reading progress
    for user in user_pool:
        read_books = random.sample(books, random.randint(2, 6))
        for book in read_books:
            # Check existence using ORM
            if not ReadingProgress.objects.filter(user=user, book=book).exists():
                ReadingProgress.objects.create(
                    user=user,
                    book=book,
                    last_location=str(random.randint(1, book.pages or 100)),
                    percent=random.uniform(0, 100),
                    total_time_seconds=random.randint(300, 7200),
                    completed=random.choice([True, False]),
                )
                # Manually update denormalized counter field
                book.view_count += random.randint(1, 10)
                book.save(update_fields=['view_count'])

    print("Created sample user interactions")


def create_sample_analytics(users, books):
    """Create sample analytics events using Django ORM"""
    event_types = ['OPEN_BOOK', 'LIKE', 'BOOKMARK', 'SEARCH', 'READ_PROGRESS']
    search_terms = ['fiction', 'mystery', 'romance', 'fantasy', 'technology', 'history', 'biography']
    
    # Create events for the last 30 days
    for i in range(30):
        # Create a past date for the event
        date = datetime.now() - timedelta(days=i, minutes=random.randint(1, 1440))
        
        # Create 5-20 events per day
        num_events = random.randint(5, 20)
        for _ in range(num_events):
            user = random.choice(users[1:])  # Skip admin
            book = random.choice(books)
            event_type = random.choice(event_types)
            
            payload = {
                'book_id': str(book.id), # Store UUID as string in payload (JSONField)
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
                # Store the user object if the field is a ForeignKey, or user.id if it's a CharField (assuming CharField for User ID storage in EventLog for flexibility)
                user_id=user.id, 
                created_at=date
            )
    
    print("Created sample analytics events")


def main():
    """Main seed function"""
    print("Starting database seeding (PostgreSQL/Django ORM)...")

    # Clear existing data (using ORM .all().delete())
    print("Clearing existing data...")
    EventLog.objects.all().delete()
    ReadingSession.objects.all().delete()
    ReadingProgress.objects.all().delete()
    Bookmark.objects.all().delete()
    BookLike.objects.all().delete()
    Book.objects.all().delete()
    Category.objects.all().delete()
    Author.objects.all().delete() # New model to clear
    User.objects.all().delete()

    # Create sample data
    print("-" * 20)
    
    print("Creating authors...")
    authors_map = create_sample_authors(BOOKS_DATA)
    
    print("Creating categories...")
    categories = create_sample_categories()
    
    print("Creating users...")
    users = create_sample_users()
    
    print("Creating books...")
    books = create_sample_books(categories, authors_map)
    
    print("Creating user interactions...")
    # NOTE: This relies on the Book model's like_count/bookmark_count fields being manually updated
    create_sample_interactions(users, books)
    
    print("Creating analytics events...")
    # NOTE: Assuming EventLog has a user_id CharField or ForeignKey to User
    create_sample_analytics(users, books)
    
    print("-" * 20)
    print("Database seeding completed!")
    print(f"Created {Author.objects.count()} authors")
    print(f"Created {Category.objects.count()} categories")
    print(f"Created {Book.objects.count()} books")
    print(f"Created {User.objects.count()} users")
    print(f"Created {EventLog.objects.count()} analytics events")


if __name__ == '__main__':
    main()
