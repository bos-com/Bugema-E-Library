"""
Management command to populate cloudinary_public_id and file_url for existing books
"""
from django.core.management.base import BaseCommand
from catalog.models import Book


class Command(BaseCommand):
    help = 'Populate cloudinary_public_id and file_url for existing books'

    def handle(self, *args, **options):
        books = Book.objects.filter(file__isnull=False)
        updated_count = 0
        
        self.stdout.write(self.style.WARNING(f'Found {books.count()} books with files'))
        
        for book in books:
            try:
                # Get the public_id from file.name (strip extension for Cloudinary)
                if book.file and book.file.name:
                    # Store the file.name as cloudinary_public_id (without extension)
                    public_id = book.file.name
                    if '.' in public_id:
                        public_id = public_id.rsplit('.', 1)[0]
                    
                    book.cloudinary_public_id = public_id
                    
                    # Get the URL
                    if hasattr(book.file, 'url'):
                        book.file_url = book.file.url
                    
                    # Save without triggering the save override (to avoid issues)
                    Book.objects.filter(pk=book.pk).update(
                        cloudinary_public_id=book.cloudinary_public_id,
                        file_url=book.file_url
                    )
                    
                    updated_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ Updated book {book.id}: {book.title} - public_id: {public_id}'
                        )
                    )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'✗ Failed to update book {book.id}: {book.title} - Error: {str(e)}'
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Successfully updated {updated_count} out of {books.count()} books'
            )
        )
