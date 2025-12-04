import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'elibrary.settings')
django.setup()

from catalog.models import Book

def fix_book():
    try:
        # Search for Animal Farm
        books = Book.objects.filter(title__icontains="Animal Farm")
        if not books.exists():
            print("No book found with title 'Animal Farm'")
            return

        for book in books:
            print(f"Updating Book: {book.title} (ID: {book.id})")
            print(f"Old Public ID: {book.cloudinary_public_id}")
            
            # The correct ID from the screenshot
            new_public_id = "media/books/orwellanimalfarm_h1sspp"
            
            # Update the record
            book.cloudinary_public_id = new_public_id
            
            # Also update the file_url if it looks like a Cloudinary URL
            if book.file_url and "cloudinary" in book.file_url:
                # This is a bit hacky, but we just want to ensure consistency
                # We'll just print a warning that the URL might be stale
                print(f"Warning: file_url might be stale: {book.file_url}")
            
            book.save()
            print(f"New Public ID: {book.cloudinary_public_id}")
            print("Successfully updated.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_book()
