with open('api/models.py', 'r') as f:
    content = f.read()

old_col = "bio = Column(String(500), nullable=True)"
new_col = "bio = Column(String(500), nullable=True)\n    tryon_base_image = Column(String, nullable=True)"

content = content.replace(old_col, new_col)

with open('api/models.py', 'w') as f:
    f.write(content)
