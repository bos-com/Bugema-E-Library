from urllib.parse import urlparse

def get_cloudinary_info(file_url):
    public_id = None
    resource_type = "raw" # Default
    
    try:
        parsed_url = urlparse(file_url)
        path_parts = parsed_url.path.split('/')
        
        # Detect Resource Type
        if 'image' in path_parts:
            resource_type = 'image'
        elif 'video' in path_parts:
            resource_type = 'video'
        elif 'raw' in path_parts:
            resource_type = 'raw'
        
        # Extract Public ID
        if 'upload' in path_parts:
            upload_idx = path_parts.index('upload')
            start_idx = upload_idx + 1
            if len(path_parts) > start_idx and path_parts[start_idx].startswith('v'):
                start_idx += 1
            
            extracted_id = '/'.join(path_parts[start_idx:])
            if extracted_id:
                public_id = extracted_id
                
    except Exception as e:
        pass
        
    return public_id, resource_type

# Test cases
test_url_1 = "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg"
expected_1 = ("sample.jpg", "image")

test_url_2 = "https://res.cloudinary.com/cloudname/raw/upload/v12345678/media/books/orwellanimalfarm_h1sspp.pdf"
expected_2 = ("media/books/orwellanimalfarm_h1sspp.pdf", "raw")

test_url_3 = "https://res.cloudinary.com/cloudname/image/upload/v1234/media/books/somebook.pdf"
expected_3 = ("media/books/somebook.pdf", "image")

print(f"Test 1: {get_cloudinary_info(test_url_1)} (Expected: {expected_1})")
print(f"Test 2: {get_cloudinary_info(test_url_2)} (Expected: {expected_2})")
print(f"Test 3: {get_cloudinary_info(test_url_3)} (Expected: {expected_3})")

assert get_cloudinary_info(test_url_1) == expected_1
assert get_cloudinary_info(test_url_2) == expected_2
assert get_cloudinary_info(test_url_3) == expected_3
print("All tests passed!")
