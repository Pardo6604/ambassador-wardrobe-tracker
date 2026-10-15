with open('api/index.py', 'r') as f:
    content = f.read()

content = content.replace("from .models import ClothingItem, User, Outfit", "from .models import ClothingItem, User, Outfit, OutfitItemAssociation")
content = content.replace("from .schemas import (", "from .schemas import (\n    ItemResponse,")

with open('api/index.py', 'w') as f:
    f.write(content)
