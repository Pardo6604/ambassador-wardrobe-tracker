import re

with open('api/index.py', 'r') as f:
    content = f.read()

# Replace get_items
get_items_old = """@app.get("/api/items", response_model=List[ClothingItemResponse])
def get_items(
    category: Optional[str] = Query(None, description="Filter by category (Tops, Bottoms, Outerwear, Footwear, Accessories)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (Unworn, Worn, Posted, Needs Returning)"),
    brand: Optional[str] = Query(None, description="Search or filter by brand"),
    user_id: Optional[uuid.UUID] = Query(None, description="Filter items by user UUID"),
    db: Session = Depends(get_db)
):
    \"\"\"Fetch all clothing items for an ambassador with optional filtering.\"\"\"
    query = db.query(ClothingItem)

    if user_id:
        query = query.filter(ClothingItem.user_id == user_id)"""

get_items_new = """@app.get("/api/items", response_model=List[ClothingItemResponse])
def get_items(
    category: Optional[str] = Query(None, description="Filter by category (Tops, Bottoms, Outerwear, Footwear, Accessories)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (Unworn, Worn, Posted, Needs Returning)"),
    brand: Optional[str] = Query(None, description="Search or filter by brand"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    \"\"\"Fetch all clothing items for an ambassador with optional filtering.\"\"\"
    query = db.query(ClothingItem).filter(ClothingItem.user_id == current_user.id)"""
content = content.replace(get_items_old, get_items_new)

# Replace upload_item
upload_item_old = """@app.post("/api/items/upload", response_model=ClothingItemResponse, status_code=status.HTTP_201_CREATED)
def upload_item(
    item_in: ClothingItemCreate,
    db: Session = Depends(get_db)
):
    \"\"\"Accept clothing item metadata and save to PostgreSQL database.\"\"\"
    new_item = ClothingItem(
        id=uuid.uuid4(),
        user_id=item_in.user_id,"""
upload_item_new = """@app.post("/api/items/upload", response_model=ClothingItemResponse, status_code=status.HTTP_201_CREATED)
def upload_item(
    item_in: ClothingItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    \"\"\"Accept clothing item metadata and save to PostgreSQL database.\"\"\"
    new_item = ClothingItem(
        id=uuid.uuid4(),
        user_id=current_user.id,"""
content = content.replace(upload_item_old, upload_item_new)

# Replace update_item_status
update_item_old = """@app.put("/api/items/{item_id}", response_model=ClothingItemResponse)
def update_item_status(
    item_id: uuid.UUID,
    item_update: ClothingItemUpdate,
    db: Session = Depends(get_db)
):
    \"\"\"Update clothing item fields, specifically status.\"\"\"
    item = db.query(ClothingItem).filter(ClothingItem.id == item_id).first()
    if not item:"""
update_item_new = """@app.put("/api/items/{item_id}", response_model=ClothingItemResponse)
def update_item_status(
    item_id: uuid.UUID,
    item_update: ClothingItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    \"\"\"Update clothing item fields, specifically status.\"\"\"
    item = db.query(ClothingItem).filter(ClothingItem.id == item_id, ClothingItem.user_id == current_user.id).first()
    if not item:"""
content = content.replace(update_item_old, update_item_new)

# Replace delete_item
delete_item_old = """@app.delete("/api/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    \"\"\"Delete a clothing item from the wardrobe.\"\"\"
    item = db.query(ClothingItem).filter(ClothingItem.id == item_id).first()
    if not item:"""
delete_item_new = """@app.delete("/api/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    \"\"\"Delete a clothing item from the wardrobe.\"\"\"
    item = db.query(ClothingItem).filter(ClothingItem.id == item_id, ClothingItem.user_id == current_user.id).first()
    if not item:"""
content = content.replace(delete_item_old, delete_item_new)

# Replace get_outfits
get_outfits_old = """@app.get("/api/outfits", response_model=List[OutfitResponse])
def get_outfits(
    occasion: Optional[str] = Query(None, description="Filter by occasion"),
    user_id: Optional[uuid.UUID] = Query(None, description="Filter by user UUID"),
    db: Session = Depends(get_db)
):
    \"\"\"Fetch suggested outfit combinations with model / try-on pictures.\"\"\"
    query = db.query(Outfit)
    if user_id:
        query = query.filter(Outfit.user_id == user_id)"""
get_outfits_new = """@app.get("/api/outfits", response_model=List[OutfitResponse])
def get_outfits(
    occasion: Optional[str] = Query(None, description="Filter by occasion"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    \"\"\"Fetch suggested outfit combinations with model / try-on pictures.\"\"\"
    query = db.query(Outfit).filter(Outfit.user_id == current_user.id)"""
content = content.replace(get_outfits_old, get_outfits_new)

# Replace create_outfit
create_outfit_old = """@app.post("/api/outfits", response_model=OutfitResponse, status_code=status.HTTP_201_CREATED)
def create_outfit(
    outfit_in: OutfitCreate,
    db: Session = Depends(get_db)
):
    \"\"\"Save an outfit suggestion or fit picture.\"\"\"
    new_outfit = Outfit(
        id=uuid.uuid4(),
        user_id=outfit_in.user_id,"""
create_outfit_new = """@app.post("/api/outfits", response_model=OutfitResponse, status_code=status.HTTP_201_CREATED)
def create_outfit(
    outfit_in: OutfitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    \"\"\"Save an outfit suggestion or fit picture.\"\"\"
    new_outfit = Outfit(
        id=uuid.uuid4(),
        user_id=current_user.id,"""
content = content.replace(create_outfit_old, create_outfit_new)

# Replace update_outfit
update_outfit_old = """@app.put("/api/outfits/{outfit_id}", response_model=OutfitResponse)
def update_outfit(
    outfit_id: uuid.UUID,
    outfit_update: OutfitUpdate,
    db: Session = Depends(get_db)
):
    \"\"\"Update outfit suggestion, model photo, or styling notes.\"\"\"
    outfit = db.query(Outfit).filter(Outfit.id == outfit_id).first()
    if not outfit:"""
update_outfit_new = """@app.put("/api/outfits/{outfit_id}", response_model=OutfitResponse)
def update_outfit(
    outfit_id: uuid.UUID,
    outfit_update: OutfitUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    \"\"\"Update outfit suggestion, model photo, or styling notes.\"\"\"
    outfit = db.query(Outfit).filter(Outfit.id == outfit_id, Outfit.user_id == current_user.id).first()
    if not outfit:"""
content = content.replace(update_outfit_old, update_outfit_new)

# Replace delete_outfit
delete_outfit_old = """@app.delete("/api/outfits/{outfit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_outfit(
    outfit_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    \"\"\"Delete an outfit suggestion.\"\"\"
    outfit = db.query(Outfit).filter(Outfit.id == outfit_id).first()
    if not outfit:"""
delete_outfit_new = """@app.delete("/api/outfits/{outfit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_outfit(
    outfit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    \"\"\"Delete an outfit suggestion.\"\"\"
    outfit = db.query(Outfit).filter(Outfit.id == outfit_id, Outfit.user_id == current_user.id).first()
    if not outfit:"""
content = content.replace(delete_outfit_old, delete_outfit_new)

with open('api/index.py', 'w') as f:
    f.write(content)

