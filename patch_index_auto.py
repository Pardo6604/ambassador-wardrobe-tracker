import re

with open('api/index.py', 'r') as f:
    content = f.read()

# Make sure random is imported
if "import random" not in content:
    content = content.replace("import uuid", "import uuid\nimport random")

endpoints = """
@app.put("/api/user/tryon-image", response_model=UserResponse)
def update_tryon_image(update_data: UserTryOnUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.tryon_base_image = update_data.tryon_base_image
    db.commit()
    db.refresh(current_user)
    return current_user

@app.post("/api/outfits/auto-suggest", response_model=OutfitResponse)
def auto_suggest_outfit(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.tryon_base_image:
        raise HTTPException(status_code=400, detail="Please upload a Default Try-On Avatar in your profile first.")

    # Get items
    items = db.query(ClothingItem).filter(ClothingItem.owner_id == current_user.id).all()
    if not items:
        raise HTTPException(status_code=400, detail="No clothes found in your closet.")

    # Select a statement piece (Top, Outerwear, or Dress)
    candidates = [i for i in items if i.category in ["Tops", "Outerwear", "Dresses"]]
    if not candidates:
        candidates = items # Fallback to any item if they don't have tops
    
    # Try to pick an unworn one if possible
    unworn = [i for i in candidates if i.status == "Unworn"]
    chosen_item = random.choice(unworn) if unworn else random.choice(candidates)

    # We also want to group a bottom if it's a top/outerwear so the outfit is complete in data
    outfit_items = [chosen_item]
    if chosen_item.category in ["Tops", "Outerwear"]:
        bottoms = [i for i in items if i.category == "Bottoms"]
        if bottoms:
            outfit_items.append(random.choice(bottoms))
        shoes = [i for i in items if i.category == "Footwear"]
        if shoes:
            outfit_items.append(random.choice(shoes))

    try:
        # VTON Process
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as p_file:
            person_base64 = current_user.tryon_base_image
            person_data = base64.b64decode(person_base64.split(",")[1] if "," in person_base64 else person_base64)
            p_file.write(person_data)
            person_path = p_file.name

        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as g_file:
            garment_base64 = chosen_item.image_url
            garment_data = base64.b64decode(garment_base64.split(",")[1] if "," in garment_base64 else garment_base64)
            g_file.write(garment_data)
            garment_path = g_file.name

        hf_token = os.environ.get("HF_TOKEN")
        client = Client("yisol/IDM-VTON", token=hf_token)

        result = client.predict(
            dict={"background": handle_file(person_path), "layers": [], "composite": None},
            garm_img=handle_file(garment_path),
            garment_des=f"A {chosen_item.brand} {chosen_item.category}",
            is_checked=True,
            is_checked_crop=False,
            denoise_steps=30,
            seed=42,
            api_name="/tryon"
        )
        
        output_path = result[0]
        with open(output_path, "rb") as f:
            output_b64 = base64.b64encode(f.read()).decode("utf-8")
        
        os.remove(person_path)
        os.remove(garment_path)

        final_image_url = f"data:image/png;base64,{output_b64}"

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to generate AI image: " + str(e))

    # Save outfit
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
    db.refresh(new_outfit)

    # Need to load the items for the response
    outfit_resp = OutfitResponse(
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
    )
    return outfit_resp

"""

# Insert endpoints near the end, right before the standard error handlers or last endpoint
content = content.replace('@app.post("/api/outfits/generate-tryon")', endpoints + '\n@app.post("/api/outfits/generate-tryon")')

# Need to import UserTryOnUpdate
content = content.replace("from .schemas import (", "from .schemas import (\n    UserTryOnUpdate,")

with open('api/index.py', 'w') as f:
    f.write(content)
