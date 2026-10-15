with open('api/schemas.py', 'r') as f:
    content = f.read()

new_schema = """
class TryOnRequest(BaseModel):
    person_image_base64: str
    garment_image_base64: str
    garment_description: str = "A clothing item"

"""

# Insert before UserResponse
content = content.replace("class UserResponse(BaseModel):", new_schema + "class UserResponse(BaseModel):")

with open('api/schemas.py', 'w') as f:
    f.write(content)
