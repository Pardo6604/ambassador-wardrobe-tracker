with open('api/schemas.py', 'r') as f:
    content = f.read()

old_resp = """    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime"""

new_resp = """    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    tryon_base_image: Optional[str] = None
    created_at: datetime"""

content = content.replace(old_resp, new_resp)

new_schema = """
class UserTryOnUpdate(BaseModel):
    tryon_base_image: str

"""
content = content.replace("class UserLogin(BaseModel):", new_schema + "class UserLogin(BaseModel):")

with open('api/schemas.py', 'w') as f:
    f.write(content)
