import re
with open('api/index.py', 'r') as f:
    content = f.read()

old_resp = """    outfit_resp = OutfitResponse(
        id=new_outfit.id,
        title=new_outfit.title,
        occasion=new_outfit.occasion,
        model_image_url=new_outfit.model_image_url,
        items=[ItemResponse(
            id=i.id, category=i.category, brand=i.brand, size=i.size,
            status=i.status, image_url=i.image_url, notes=i.notes,
            created_at=i.created_at
        ) for i in outfit_items],
        styling_notes=new_outfit.styling_notes,
        is_custom_fit_pic=new_outfit.is_custom_fit_pic,
        created_at=new_outfit.created_at
    )"""

new_resp = """    outfit_resp = OutfitResponse(
        id=new_outfit.id,
        user_id=new_outfit.user_id,
        title=new_outfit.title,
        occasion=new_outfit.occasion,
        model_image_url=new_outfit.model_image_url,
        item_ids=new_outfit.item_ids,
        styling_notes=new_outfit.styling_notes,
        created_at=new_outfit.created_at
    )"""

content = content.replace(old_resp, new_resp)

with open('api/index.py', 'w') as f:
    f.write(content)
