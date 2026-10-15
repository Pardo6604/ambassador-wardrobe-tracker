with open('api/index.py', 'r') as f:
    content = f.read()

# Fix imports
content = content.replace("from .models import ClothingItem, User, Outfit, OutfitItemAssociation", "from .models import ClothingItem, User, Outfit")

# Rewrite the saving block in auto_suggest_outfit
old_block = """    # Save outfit
    new_outfit = Outfit(
        id=uuid.uuid4(),
        owner_id=current_user.id,
        title=f"AI Suggestion: {chosen_item.brand} Look",
        occasion="AI Auto-Suggested",
        model_image_url=final_image_url,
        styling_notes=f"Auto-generated look featuring {chosen_item.brand}.",
        is_custom_fit_pic=True
    )
    db.add(new_outfit)
    
    # Associate items
    for item in outfit_items:
        assoc = OutfitItemAssociation(outfit_id=new_outfit.id, item_id=item.id)
        db.add(assoc)

    db.commit()
    db.refresh(new_outfit)"""

new_block = """    # Save outfit
    new_outfit = Outfit(
        id=uuid.uuid4(),
        user_id=current_user.id,
        title=f"AI Suggestion: {chosen_item.brand} Look",
        occasion="AI Auto-Suggested",
        model_image_url=final_image_url,
        styling_notes=f"Auto-generated look featuring {chosen_item.brand}.",
        item_ids=",".join([str(i.id) for i in outfit_items])
    )
    db.add(new_outfit)
    db.commit()
    db.refresh(new_outfit)"""

content = content.replace(old_block, new_block)

with open('api/index.py', 'w') as f:
    f.write(content)
