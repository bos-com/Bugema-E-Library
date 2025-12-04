import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'elibrary.settings')
django.setup()

from catalog.models import Book

def check_book():
    try:
        # Search for Animal Farm
        books = Book.objects.filter(title__icontains="Animal Farm")
        if not books.exists():
            print("No book found with title 'Animal Farm'")
            return

        for book in books:
            print(f"--- Book ID: {book.id} ---")
            print(f"Title: {book.title}")
            print(f"File Field: {book.file}")
            print(f"File Name: {book.file.name if book.file else 'None'}")
            print(f"File URL (Model Field): {book.file_url}")
            print(f"Cloudinary Public ID: {book.cloudinary_public_id}")
            if book.file:
                try:
                    print(f"File URL (Storage): {book.file.url}")
                except Exception as e:
                    print(f"Error getting file.url: {e}")
            print("-------------------------")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_book()
