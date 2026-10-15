import re

with open('api/index.py', 'r') as f:
    content = f.read()

content = content.replace("is_checked_crop=False", "is_checked_crop=True")

# Also change garment_des to be cleaner
content = content.replace('garment_des = f"{piece.category.lower()}: {piece.brand}"', 'garment_des = "lower_body" if piece.category == "Bottoms" else "dresses" if piece.category == "Dresses" else "upper_body"')

with open('api/index.py', 'w') as f:
    f.write(content)

