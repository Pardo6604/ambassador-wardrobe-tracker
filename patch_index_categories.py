import re

with open('api/index.py', 'r') as f:
    content = f.read()

# Fix garment_des logic
old_garment_des = 'garment_des = "lower_body" if piece.category == "Bottoms" else "dresses" if piece.category == "Dresses" else "upper_body"'

new_garment_des = '''cat_lower = piece.category.lower()
            if any(word in cat_lower for word in ["bottom", "pant", "jean", "short", "skirt", "trouser", "legging"]):
                garment_des = "lower_body"
            elif any(word in cat_lower for word in ["dress", "gown", "jumpsuit", "romper"]):
                garment_des = "dresses"
            else:
                garment_des = "upper_body"'''

content = content.replace(old_garment_des, new_garment_des)

# Also fix the top/bottom selection in auto_suggest_outfit
old_tops = 'tops = [i for i in items if i.category in ["Tops", "Outerwear", "Dresses"]]'
new_tops = 'tops = [i for i in items if not any(w in i.category.lower() for w in ["bottom", "pant", "jean", "short", "skirt", "trouser", "legging", "shoe", "foot", "sneaker", "boot"])]'

old_bottoms = 'bottoms = [i for i in items if i.category == "Bottoms"]'
new_bottoms = 'bottoms = [i for i in items if any(w in i.category.lower() for w in ["bottom", "pant", "jean", "short", "skirt", "trouser", "legging"])]'

content = content.replace(old_tops, new_tops)
content = content.replace(old_bottoms, new_bottoms)

old_dress_check = 'if outfit_items and outfit_items[0].category != "Dresses" and bottoms:'
new_dress_check = 'if outfit_items and not any(w in outfit_items[0].category.lower() for w in ["dress", "gown", "jumpsuit", "romper"]) and bottoms:'

content = content.replace(old_dress_check, new_dress_check)

with open('api/index.py', 'w') as f:
    f.write(content)
