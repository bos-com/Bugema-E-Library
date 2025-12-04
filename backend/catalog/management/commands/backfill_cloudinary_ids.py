from django.core.management.base import BaseCommand
from django.utils import timezone

from catalog.models import Book


class Command(BaseCommand):
    help = (
        "Normalize Book.cloudinary_public_id and file_url so they match the actual file "
        "stored in Cloudinary (folder + filename)."
    )

    def handle(self, *args, **options):
        updated = 0
        for book in Book.objects.all():
            if not book.file:
                continue

            file_name = getattr(book.file, 'name', '') or ''
            file_url = getattr(book.file, 'url', '') or ''

            update_kwargs = {}

            if file_name:
                canonical_id = file_name.lstrip('/')
                if book.cloudinary_public_id != canonical_id:
                    update_kwargs['cloudinary_public_id'] = canonical_id

            if file_url and book.file_url != file_url:
                update_kwargs['file_url'] = file_url

            if update_kwargs:
                update_kwargs['updated_at'] = timezone.now()
                Book.objects.filter(pk=book.pk).update(**update_kwargs)
                updated += 1

        self.stdout.write(self.style.SUCCESS(f"Backfilled {updated} book(s)."))

