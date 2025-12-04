import os

def fix_public_id(public_id, resource_type, file_name, file_type):
    if resource_type == "raw":
        base, ext = os.path.splitext(public_id)
        if not ext:
            # Try to get extension from file name or file_type
            if file_name:
                _, file_ext = os.path.splitext(file_name)
                if file_ext:
                    public_id = f"{public_id}{file_ext}"
            
            # If still no extension, guess from file_type
            if not os.path.splitext(public_id)[1]:
                if file_type == "PDF":
                    public_id = f"{public_id}.pdf"
                elif file_type == "EPUB":
                    public_id = f"{public_id}.epub"
    return public_id

# Test cases
# Case 1: Raw file without extension in ID, but has it in filename
id1 = "media/books/orwellanimalfarm_h1sspp"
res1 = "raw"
name1 = "orwellanimalfarm.pdf"
type1 = "PDF"
expected1 = "media/books/orwellanimalfarm_h1sspp.pdf"

# Case 2: Raw file with extension already
id2 = "media/books/file.pdf"
res2 = "raw"
name2 = "file.pdf"
type2 = "PDF"
expected2 = "media/books/file.pdf"

# Case 3: Image file (should not change)
id3 = "media/books/cover"
res3 = "image"
name3 = "cover.jpg"
type3 = "PDF" # Sometimes PDFs are images
expected3 = "media/books/cover"

print(f"Test 1: {fix_public_id(id1, res1, name1, type1)} (Expected: {expected1})")
print(f"Test 2: {fix_public_id(id2, res2, name2, type2)} (Expected: {expected2})")
print(f"Test 3: {fix_public_id(id3, res3, name3, type3)} (Expected: {expected3})")

assert fix_public_id(id1, res1, name1, type1) == expected1
assert fix_public_id(id2, res2, name2, type2) == expected2
assert fix_public_id(id3, res3, name3, type3) == expected3
print("All tests passed!")
