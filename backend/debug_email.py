
import os
import sys
import django
from pathlib import Path
from dotenv import load_dotenv

# Setup Django environment
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "elibrary.settings")

# Manually load .env to compare
env_path = BASE_DIR / 'elibrary' / '.env'
print(f"Loading .env from: {env_path}")
load_dotenv(env_path)

django.setup()
from django.conf import settings

def check_settings():
    print("\n--- DEBUGGING EMAIL SETTINGS ---")
    
    email = os.getenv('EMAIL_HOST_USER')
    password = os.getenv('EMAIL_HOST_PASSWORD')
    
    print(f"EMAIL_HOST_USER (length={len(email) if email else 0}): '{email}'")
    print(f"EMAIL_HOST_PASSWORD (length={len(password) if password else 0}): '{password}'")
    
    if email and email.strip() != email:
        print("⚠️  WARNING: Your email has hidden trailing spaces!")
        
    if password and password.strip() != password:
        print("⚠️  WARNING: Your password has hidden trailing spaces!")
        
    print("-" * 30)
    
    # Try sending a test email
    from django.core.mail import send_mail
    print("Attempting to send test email...")
    try:
        send_mail(
            'Test Email',
            'This is a test.',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        print("✅ SUCCESS! Email sent successfully.")
    except Exception as e:
        print(f"❌ FAILED: {e}")

if __name__ == "__main__":
    check_settings()
