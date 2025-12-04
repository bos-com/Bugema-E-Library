from urllib.parse import urlparse

def get_public_id(file_url):
    try:
        parsed_url = urlparse(file_url)
        path_parts = parsed_url.path.split('/')
        # Find 'upload' and take everything after the version (v123...)
        if 'upload' in path_parts:
            upload_idx = path_parts.index('upload')
            # Check if next part is version (starts with v)
            if len(path_parts) > upload_idx + 1 and path_parts[upload_idx+1].startswith('v'):
                public_id = '/'.join(path_parts[upload_idx+2:])
            else:
                public_id = '/'.join(path_parts[upload_idx+1:])
            return public_id
    except Exception as e:
        return None

# Test cases
test_url_1 = "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg"
expected_1 = "sample.jpg"

test_url_2 = "https://res.cloudinary.com/cloudname/raw/upload/v12345678/media/books/orwellanimalfarm_h1sspp.pdf"
expected_2 = "media/books/orwellanimalfarm_h1sspp.pdf"

test_url_3 = "https://res.cloudinary.com/cloudname/raw/upload/media/books/nobver.pdf"
expected_3 = "media/books/nobver.pdf"

print(f"Test 1: {get_public_id(test_url_1)} (Expected: {expected_1})")
print(f"Test 2: {get_public_id(test_url_2)} (Expected: {expected_2})")
print(f"Test 3: {get_public_id(test_url_3)} (Expected: {expected_3})")

assert get_public_id(test_url_1) == expected_1
assert get_public_id(test_url_2) == expected_2
assert get_public_id(test_url_3) == expected_3
print("All tests passed!")
