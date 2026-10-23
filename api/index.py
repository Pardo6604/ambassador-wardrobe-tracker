import requests
import time
import uuid
import random
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, func

import sys
import os
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    from .database import engine, get_db, Base
    from .models import ClothingItem, User, Outfit, CampaignBoard, CampaignTask, TryonAvatar
    from .schemas import (
        TryOnRequest,
        TryOnJobResponse,
        UserResponse,
        UserTryOnUpdate,
        ClothingItemCreate,
        ClothingItemUpdate,
        ClothingItemResponse,
        OutfitCreate,
        OutfitUpdate,
        OutfitResponse,
        CategoryLiteral,
        StatusLiteral,
        UserCreate,
        UserLogin,
        Token,
        UserProfileUpdate,
        UserPasswordChange,
        TryonAvatarCreate,
        TryonAvatarResponse,
        CampaignColumnUpdate,
        CampaignTaskCreate,
        CampaignTaskUpdate,
        CampaignTaskResponse,
        CampaignBoardCreate,
        CampaignBoardUpdate,
        CampaignBoardResponse,
    )
    from .auth import (
        get_password_hash,
        verify_password,
        create_access_token,
        get_current_user,
        ACCESS_TOKEN_EXPIRE_MINUTES
    )
except (ImportError, ValueError):
    from database import engine, get_db, Base
    from models import ClothingItem, User, Outfit, CampaignBoard, CampaignTask, TryonAvatar
    from schemas import (
        TryOnRequest,
        TryOnJobResponse,
        UserResponse,
        UserTryOnUpdate,
        ClothingItemCreate,
        ClothingItemUpdate,
        ClothingItemResponse,
        OutfitCreate,
        OutfitUpdate,
        OutfitResponse,
        CategoryLiteral,
        StatusLiteral,
        UserCreate,
        UserLogin,
        Token,
        UserProfileUpdate,
        UserPasswordChange,
        TryonAvatarCreate,
        TryonAvatarResponse,
        CampaignColumnUpdate,
        CampaignTaskCreate,
        CampaignTaskUpdate,
        CampaignTaskResponse,
        CampaignBoardCreate,
        CampaignBoardUpdate,
        CampaignBoardResponse,
    )
    from auth import (
        get_password_hash,
        verify_password,
        create_access_token,
        get_current_user,
        ACCESS_TOKEN_EXPIRE_MINUTES
    )
import tempfile
import base64
from gradio_client import Client, handle_file
from dotenv import load_dotenv
load_dotenv()
from datetime import timedelta

# Create tables on startup if they don't exist yet
try:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        if engine.dialect.name == "postgresql":
            conn.execute(text("ALTER TABLE clothing_items ADD COLUMN IF NOT EXISTS description VARCHAR(2048);"))
            conn.execute(text("ALTER TABLE clothing_items ALTER COLUMN status DROP NOT NULL;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_styling_instructions VARCHAR(2048);"))
        elif engine.dialect.name == "sqlite":
            cursor = conn.execute(text("PRAGMA table_info(clothing_items);"))
            columns = [row[1] for row in cursor.fetchall()]
            if "description" not in columns:
                conn.execute(text("ALTER TABLE clothing_items ADD COLUMN description VARCHAR(2048);"))
            
            cursor_u = conn.execute(text("PRAGMA table_info(users);"))
            user_cols = [row[1] for row in cursor_u.fetchall()]
            if "ai_styling_instructions" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN ai_styling_instructions VARCHAR(2048);"))

    # Auto-seed initial demo user if database has 0 users
    with Session(bind=engine) as seed_db:
        if seed_db.query(User).count() == 0:
            demo_user = User(
                id=uuid.uuid4(),
                email="pardo@gmail.com",
                password_hash=get_password_hash("password123"),
                name="Pardo",
                handle="pardo",
                avatar_url=None,
                bio="Brand Ambassador"
            )
            seed_db.add(demo_user)
            seed_db.commit()
            print("Auto-seeded initial demo account: pardo@gmail.com")
except Exception as startup_err:
    print(f"Non-critical database initialization notice: {startup_err}")

app = FastAPI(
    title="ClosetPR Ambassador API",
    description="Python FastAPI backend running on Vercel Serverless Functions for clothing brand ambassador inventory tracking and outfit styling suggestions.",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "connected"
    users_count = 0
    try:
        users_count = db.query(User).count()
    except Exception as e:
        db_status = f"unreachable: {str(e)}"
    return {
        "status": "healthy",
        "service": "ClosetPR FastAPI Vercel Serverless",
        "database": {
            "dialect": engine.dialect.name,
            "status": db_status,
            "user_count": users_count,
            "has_env_db_url": bool(os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL"))
        }
    }


# ==========================================
# CLOTHING ITEMS ENDPOINTS
# ==========================================

@app.get("/api/items", response_model=List[ClothingItemResponse])
def get_items(
    category: Optional[str] = Query(None, description="Filter by category (Tops, Bottoms, Outerwear, Footwear, Accessories)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (Unworn, Worn, Posted, Needs Returning)"),
    brand: Optional[str] = Query(None, description="Search or filter by brand"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch all clothing items for an ambassador with optional filtering."""
    query = db.query(ClothingItem).filter(ClothingItem.user_id == current_user.id)

    if category and category.lower() != "all":
        query = query.filter(ClothingItem.category.ilike(category))

    if status_filter and status_filter.lower() != "all":
        query = query.filter(ClothingItem.status.ilike(status_filter))

    if brand:
        query = query.filter(ClothingItem.brand.ilike(f"%{brand}%"))

    items = query.order_by(ClothingItem.created_at.desc()).all()
    return items


@app.post("/api/items/upload", response_model=ClothingItemResponse, status_code=status.HTTP_201_CREATED)
def upload_item(
    item_in: ClothingItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept clothing item metadata and save to PostgreSQL database."""
    new_item = ClothingItem(
        id=uuid.uuid4(),
        user_id=current_user.id,
        image_url=item_in.image_url,
        category=item_in.category,
        brand=item_in.brand,
        status=item_in.status or "Unworn",
        description=item_in.description
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@app.put("/api/items/{item_id}", response_model=ClothingItemResponse)
def update_item_status(
    item_id: uuid.UUID,
    item_update: ClothingItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update clothing item fields, specifically status and description."""
    item = db.query(ClothingItem).filter(ClothingItem.id == item_id, ClothingItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ClothingItem with id '{item_id}' not found."
        )

    if item_update.status is not None:
        item.status = item_update.status
    if item_update.brand is not None:
        item.brand = item_update.brand
    if item_update.category is not None:
        item.category = item_update.category
    if item_update.image_url is not None:
        item.image_url = item_update.image_url
    if item_update.description is not None:
        item.description = item_update.description

    db.commit()
    db.refresh(item)
    return item


@app.delete("/api/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a clothing item from the wardrobe."""
    item = db.query(ClothingItem).filter(ClothingItem.id == item_id, ClothingItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ClothingItem with id '{item_id}' not found."
        )
    db.delete(item)
    db.commit()
    return None


# ==========================================
# OUTFIT SUGGESTIONS & FIT PIC ENDPOINTS
# ==========================================




@app.put("/api/user/tryon-image", response_model=UserResponse)
def update_tryon_image(update_data: UserTryOnUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.tryon_base_image = update_data.tryon_base_image
    db.commit()
    db.refresh(current_user)
    return current_user

@app.get("/api/user/avatars", response_model=List[TryonAvatarResponse])
def get_avatars(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(TryonAvatar).filter(TryonAvatar.user_id == current_user.id).all()

@app.post("/api/user/avatars", response_model=TryonAvatarResponse)
def create_avatar(avatar_in: TryonAvatarCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_avatar = TryonAvatar(
        id=uuid.uuid4(),
        user_id=current_user.id,
        name=avatar_in.name,
        image_base64=avatar_in.image_base64
    )
    db.add(new_avatar)
    db.commit()
    db.refresh(new_avatar)
    return new_avatar

@app.delete("/api/user/avatars/{avatar_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_avatar(avatar_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    avatar = db.query(TryonAvatar).filter(TryonAvatar.id == avatar_id, TryonAvatar.user_id == current_user.id).first()
    if not avatar:
        raise HTTPException(status_code=404, detail="Avatar not found")
    db.delete(avatar)
    db.commit()
    return None

def curate_outfit_from_closet(
    items: List[ClothingItem], 
    prompt: Optional[str] = None, 
    instructions: Optional[str] = None
):
    """
    Intelligent Fashion Stylist Curation Engine.
    Leverages item descriptions (color, material, silhouette, cut, aesthetic), category, and brand
    alongside editorial styling guidelines and user-defined instructions to assemble the optimal look.
    """
    if not items:
        return [], "Empty Closet", "Casual", "No items available to style."

    p_raw = (prompt or "").strip()
    p_lower = p_raw.lower()
    inst_raw = (instructions or "").strip()
    inst_lower = inst_raw.lower()

    # Determine primary style theme from prompt and instructions
    combined_intent = f"{p_lower} {inst_lower}".strip()

    is_formal = any(w in combined_intent for w in [
        "dinner", "fancy", "formal", "gala", "cocktail", "vip", "evening", 
        "date", "chic", "party", "luxury", "black tie", "night out", "elegant", "upscale"
    ])
    is_streetwear = any(w in combined_intent for w in [
        "street", "streetwear", "urban", "hype", "cargo", "sneaker", "grunge", "edgy", "grwm"
    ])
    is_summer = any(w in combined_intent for w in [
        "summer", "beach", "resort", "warm", "sunny", "vacation", "pool", "linen"
    ])
    is_active = any(w in combined_intent for w in [
        "gym", "workout", "sport", "active", "run", "athletic", "training"
    ])
    is_business = any(w in combined_intent for w in [
        "business", "meeting", "office", "showroom", "work", "presentation"
    ])

    # Instruction flags
    require_outerwear = any(w in inst_lower for w in ["jacket", "coat", "blazer", "layer", "outerwear", "outer"])
    require_accessories = any(w in inst_lower for w in ["accessory", "accessories", "bag", "jewelry", "belt", "sunglasses", "hat", "cap"])
    no_sneakers = any(w in inst_lower for w in ["no sneaker", "no sneakers", "no athletic", "formal shoes", "loafers only", "boots only", "heels only"])
    is_monochrome = any(w in inst_lower for w in ["monochrome", "monochromatic", "ton-sur-ton", "tone on tone", "single color", "all black", "all white", "all cream"])
    is_earth_tones = any(w in inst_lower for w in ["earth tone", "earthy", "brown", "tan", "camel", "olive", "warm tone", "neutral tone"])
    is_high_low = any(w in inst_lower for w in ["high-low", "high low", "contrast", "mix luxury", "casual and formal", "juxtaposition"])
    prioritize_unworn = any(w in inst_lower for w in ["unworn", "seeded", "pr", "new piece", "new pieces"])

    theme = "Editorial Chic"
    if is_formal:
        theme = "Fancy Dinner"
    elif is_streetwear:
        theme = "Streetwear Editorial"
    elif is_business:
        theme = "Showroom & Business"
    elif is_summer:
        theme = "Summer Resort"
    elif is_active:
        theme = "Active / Workout"
    elif p_raw:
        theme = p_raw.title()

    # Fashion vocabulary for color and fabric detection
    COLOR_MAP = {
        "black": ["black", "noir", "charcoal", "onyx"],
        "white": ["white", "ivory", "cream", "bone", "ecru", "pearl"],
        "beige": ["beige", "tan", "camel", "sand", "khaki", "taupe", "nude"],
        "brown": ["brown", "chocolate", "espresso", "cognac", "terracotta", "rust", "caramel"],
        "grey": ["grey", "gray", "slate", "heather", "ash", "silver"],
        "navy": ["navy", "indigo", "midnight blue"],
        "blue": ["blue", "denim", "cobalt", "sky blue", "cyan", "baby blue"],
        "green": ["olive", "sage", "forest green", "emerald", "army green", "moss", "green"],
        "red": ["burgundy", "bordeaux", "maroon", "wine", "crimson", "cherry", "red"],
        "pink": ["pink", "blush", "rose", "magenta", "fuschia"],
        "yellow": ["mustard", "yellow", "gold", "ochre", "butter"],
        "orange": ["orange", "peach", "coral"],
        "purple": ["purple", "lavender", "violet", "plum", "lilac"],
    }

    FABRIC_MAP = {
        "luxury": ["wool", "cashmere", "silk", "satin", "velvet", "crepe", "chiffon", "gabardine"],
        "casual": ["denim", "cotton", "fleece", "terry", "canvas", "corduroy"],
        "summer": ["linen", "viscose", "rayon", "bamboo", "crochet"],
        "leather": ["leather", "suede", "shearling"]
    }

    def detect_colors(text: str) -> List[str]:
        found = []
        t = text.lower()
        for family, keywords in COLOR_MAP.items():
            if any(k in t for k in keywords):
                found.append(family)
        return found

    def detect_fabrics(text: str) -> List[str]:
        found = []
        t = text.lower()
        for group, keywords in FABRIC_MAP.items():
            for k in keywords:
                if k in t:
                    found.append(k)
        return found

    def score_item(item: ClothingItem) -> float:
        desc_val = item.description or ""
        text = f"{item.brand or ''} {item.category or ''} {desc_val}".lower()
        score = 15.0

        # Ambassador PR priority: reward unworn pieces
        if item.status == "Unworn":
            score += 35.0 if prioritize_unworn else 12.0

        # Match occasion prompt keywords
        if p_lower:
            words = [w for w in p_lower.split() if len(w) > 3]
            for w in words:
                if w in text:
                    score += 25.0

        # Match user styling instructions keywords
        if inst_lower:
            inst_words = [w for w in inst_lower.split() if len(w) > 3 and w not in ["always", "never", "with", "only", "should", "could"]]
            for w in inst_words:
                if w in text:
                    score += 30.0

        # Monochrome instruction
        if is_monochrome:
            if "black" in inst_lower and any(c in text for c in ["black", "charcoal", "dark"]):
                score += 40.0
            elif "white" in inst_lower and any(c in text for c in ["white", "ivory", "cream"]):
                score += 40.0
            elif any(c in text for c in ["black", "white", "grey", "cream"]):
                score += 20.0

        # Earth tones instruction
        if is_earth_tones:
            if any(c in text for c in ["brown", "tan", "camel", "olive", "khaki", "cream", "rust", "chocolate"]):
                score += 35.0

        # No sneakers instruction
        if no_sneakers:
            if any(w in text for w in ["sneaker", "running", "athletic", "trainer"]):
                score -= 100.0
            if any(w in text for w in ["loafer", "boot", "oxford", "derby", "heel", "mule"]):
                score += 40.0

        # Formality Rules & Strict Penalties
        if is_formal:
            for b in ["wool", "cashmere", "silk", "satin", "velvet", "blazer", "suit", "tailored", "trouser", "pleat", "crepe", "oxford", "loafer", "heel"]:
                if b in text:
                    score += 20.0
            for pen in ["sweat", "fleece", "tank top", "tank", "jogger", "gym", "running", "athletic", "shorts", "distressed", "track", "hoodie"]:
                if pen in text:
                    score -= 85.0
        elif is_streetwear:
            for b in ["denim", "jean", "leather", "jacket", "cargo", "hoodie", "sneaker", "chunky", "bomber", "cotton", "oversized"]:
                if b in text:
                    score += 20.0
            if "tuxedo" in text or "evening gown" in text:
                score -= 40.0
        elif is_active:
            for b in ["fleece", "sweat", "jogger", "athletic", "tank", "sneaker", "running", "gym", "legging"]:
                if b in text:
                    score += 25.0
            if "blazer" in text or "gown" in text or "suit" in text:
                score -= 70.0
        elif is_business:
            if any(w in text for w in ["blazer", "tailored", "trouser", "knit", "cashmere", "pleat", "shirt"]):
                score += 25.0
            if any(w in text for w in ["sweatpants", "tank", "distressed", "flip flop"]):
                score -= 60.0
        elif is_summer:
            if any(w in text for w in ["linen", "cotton", "short", "sandal", "sunglass", "lightweight", "slip"]):
                score += 25.0
            if any(w in text for w in ["heavy wool", "shearling", "puffer", "down coat"]):
                score -= 70.0

        return score

    # Classify closet into functional wardrobe categories
    dresses = []
    tops = []
    bottoms = []
    outerwear = []
    footwear = []
    accessories = []

    for item in items:
        cat_lower = (item.category or "").lower()
        desc_lower = (item.description or "").lower()
        combined = f"{cat_lower} {desc_lower}"

        if any(w in combined for w in ["dress", "gown", "jumpsuit", "romper"]):
            dresses.append(item)
        elif any(w in cat_lower for w in ["bottom", "pant", "jean", "short", "skirt", "trouser", "legging"]):
            bottoms.append(item)
        elif any(w in cat_lower for w in ["outerwear", "coat", "jacket", "blazer", "trench", "bomber"]):
            outerwear.append(item)
        elif any(w in cat_lower for w in ["footwear", "shoe", "boot", "sneaker", "loafer", "heel", "mule", "sandal"]):
            footwear.append(item)
        elif any(w in cat_lower for w in ["accessories", "bag", "jewelry", "belt", "scarf", "hat", "cap", "sunglasses", "eyewear"]):
            accessories.append(item)
        else:
            tops.append(item)

    # Sort each category by score descending
    dresses.sort(key=score_item, reverse=True)
    tops.sort(key=score_item, reverse=True)
    bottoms.sort(key=score_item, reverse=True)
    outerwear.sort(key=score_item, reverse=True)
    footwear.sort(key=score_item, reverse=True)
    accessories.sort(key=score_item, reverse=True)

    outfit_items = []

    # Priority to pair Tops + Bottoms, or Dress
    if bottoms and tops:
        best_top = tops[0]
        top_colors = detect_colors(f"{best_top.brand} {best_top.category} {best_top.description or ''}")
        
        # Color harmony with bottom: find a bottom that coordinates with best_top
        matched_bottom = bottoms[0]
        if is_monochrome and top_colors:
            for b in bottoms:
                b_colors = detect_colors(f"{b.brand} {b.category} {b.description or ''}")
                if any(c in b_colors for c in top_colors):
                    matched_bottom = b
                    break

        outfit_items = [best_top, matched_bottom]

        # Add outerwear if available and appropriate or required
        outer_threshold = 0.0 if require_outerwear else 18.0
        if outerwear and score_item(outerwear[0]) >= outer_threshold:
            outfit_items.insert(0, outerwear[0])

        # Add footwear
        if footwear:
            outfit_items.append(footwear[0])

        # Add accessories
        acc_threshold = 0.0 if require_accessories else 12.0
        if accessories and score_item(accessories[0]) >= acc_threshold:
            outfit_items.append(accessories[0])

    elif dresses:
        outfit_items = [dresses[0]]
        outer_threshold = 0.0 if require_outerwear else 18.0
        if outerwear and score_item(outerwear[0]) >= outer_threshold:
            outfit_items.insert(0, outerwear[0])
        if footwear:
            outfit_items.append(footwear[0])
        acc_threshold = 0.0 if require_accessories else 12.0
        if accessories and score_item(accessories[0]) >= acc_threshold:
            outfit_items.append(accessories[0])

    elif tops:
        outfit_items = [tops[0]]
        if footwear:
            outfit_items.append(footwear[0])
        if accessories:
            outfit_items.append(accessories[0])
    elif bottoms:
        outfit_items = [bottoms[0]]
        if footwear:
            outfit_items.append(footwear[0])
        if accessories:
            outfit_items.append(accessories[0])
    else:
        outfit_items = [items[0]]

    # Generate bespoke editorial title and styling notes
    brands = list(dict.fromkeys([p.brand for p in outfit_items]))
    brand_str = " × ".join(brands[:3])
    title = f"{theme}: {brand_str} Package"

    piece_summaries = []
    detected_all_fabrics = []
    detected_all_colors = []
    for p in outfit_items:
        detail = p.description.strip() if p.description else f"{p.brand} {p.category}"
        piece_summaries.append(f"{p.brand} {p.category.lower()} ({detail})")
        detected_all_fabrics.extend(detect_fabrics(detail))
        detected_all_colors.extend(detect_colors(detail))

    detected_all_fabrics = list(dict.fromkeys(detected_all_fabrics))
    detected_all_colors = list(dict.fromkeys(detected_all_colors))

    fabric_str = ", ".join(detected_all_fabrics[:3]) if detected_all_fabrics else "harmonious textures"
    color_str = ", ".join(detected_all_colors[:3]) if detected_all_colors else "cohesive palette"

    rationale_parts = [
        f"Curated {theme} Package featuring {', '.join(piece_summaries)}.",
        f"Fabric & Color Interplay: Rooted in a {color_str} scheme balancing textures of {fabric_str}."
    ]

    if inst_raw:
        rationale_parts.append(f"Stylist Directive: Built according to your instructions ({inst_raw}), harmonizing silhouettes and event formality.")

    unworn_curated = [p.brand for p in outfit_items if p.status == "Unworn"]
    if unworn_curated:
        rationale_parts.append(f"Deliverable Focus: Spotlights unworn PR piece(s) from {', '.join(unworn_curated[:2])}.")

    rationale = " ".join(rationale_parts)
    
    return outfit_items, title, theme, rationale

@app.post("/api/outfits/auto-suggest", response_model=OutfitResponse)
def auto_suggest_outfit(
    prompt: Optional[str] = Query(None, description="Styling occasion or aesthetic prompt"),
    instructions: Optional[str] = Query(None, description="Specific instructions on how the AI should build the outfit"),
    avatar_id: Optional[uuid.UUID] = Query(None, description="Optional legacy parameter"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate an AI curated outfit package from clothing piece descriptions
    and styling guidelines/instructions. Returns immediately.
    """
    items = db.query(ClothingItem).filter(ClothingItem.user_id == current_user.id).all()
    if not items:
        raise HTTPException(status_code=400, detail="No clothes found in your closet. Please upload some pieces first.")

    effective_instructions = (instructions or "").strip()
    if not effective_instructions and current_user.ai_styling_instructions:
        effective_instructions = current_user.ai_styling_instructions.strip()

    outfit_items, title, occasion, notes = curate_outfit_from_closet(items, prompt, effective_instructions)

    new_outfit = Outfit(
        id=uuid.uuid4(),
        user_id=current_user.id,
        title=title,
        occasion=occasion,
        model_image_url="",
        item_ids=",".join(str(p.id) for p in outfit_items),
        styling_notes=notes,
        status="Suggested"
    )
    db.add(new_outfit)
    db.commit()
    db.refresh(new_outfit)

    return new_outfit

@app.post("/api/outfits/tryon-job", response_model=TryOnJobResponse)
def create_tryon_job(request: TryOnRequest, current_user: User = Depends(get_current_user)):
    try:
        fal_key = os.environ.get("FAL_KEY")
        pixel_api_key = os.environ.get("PIXEL_API_KEY") or os.environ.get("PIXELAPI_KEY") or os.environ.get("PIXELAPI")
        hf_token = os.environ.get("HF_TOKEN")

        if not (fal_key or pixel_api_key or hf_token):
            raise HTTPException(status_code=500, detail="No VTON API key configured (FAL_KEY, PIXELAPI, or HF_TOKEN)")

        if request.garment_description == "lower_body":
            desc = "lower_body"
            px_cat = "lowerbody"
            hf_cat = "Lower-body"
        elif request.garment_description == "dresses":
            desc = "dresses"
            px_cat = "dress"
            hf_cat = "Dress"
        else:
            desc = "upper_body"
            px_cat = "upperbody"
            hf_cat = "Upper-body"

        if fal_key:
            headers = {"Authorization": f"Key {fal_key}", "Content-Type": "application/json"}
            person_data_url = request.person_image_base64 if request.person_image_base64.startswith("data:image") else f"data:image/png;base64,{request.person_image_base64}"
            garment_data_url = request.garment_image_base64 if request.garment_image_base64.startswith("data:image") else f"data:image/png;base64,{request.garment_image_base64}"
            payload = {
                "human_image_url": person_data_url,
                "garment_image_url": garment_data_url,
                "description": desc,
                "category": desc
            }
            # Enqueue task in Fal.ai queue to decouple from Vercel timeout limits
            res = requests.post("https://queue.fal.run/fal-ai/idm-vton", json=payload, headers=headers)
            if not res.ok:
                raise HTTPException(status_code=500, detail=f"Fal.ai queue error: {res.text}")
            data = res.json()
            request_id = data.get("request_id")
            if not request_id:
                raise HTTPException(status_code=500, detail="Fal.ai queue did not return a request_id")
            return TryOnJobResponse(job_id=request_id, provider="fal", status="processing")

        elif pixel_api_key:
            person_raw = request.person_image_base64.split(",")[1] if "," in request.person_image_base64 else request.person_image_base64
            garment_raw = request.garment_image_base64.split(",")[1] if "," in request.garment_image_base64 else request.garment_image_base64
            headers = {"Authorization": f"Bearer {pixel_api_key}", "Content-Type": "application/json"}
            payload = {"person_image": person_raw, "garment_image": garment_raw, "category": px_cat}
            res = requests.post("https://api.pixelapi.dev/v1/virtual-tryon", json=payload, headers=headers)
            if not res.ok:
                raise HTTPException(status_code=500, detail=f"PixelAPI submit error: {res.text}")
            job_id = res.json().get("job_id")
            if not job_id:
                raise HTTPException(status_code=500, detail="PixelAPI did not return a job_id")
            return TryOnJobResponse(job_id=job_id, provider="pixelapi", status="processing")

        elif hf_token:
            # Fallback for Hugging Face Gradio Client
            client = Client("levihsu/OOTDiffusion", token=hf_token)
            with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as p_file:
                person_data = base64.b64decode(request.person_image_base64.split(",")[1] if "," in request.person_image_base64 else request.person_image_base64)
                p_file.write(person_data)
                person_path = p_file.name

            with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as g_file:
                garment_data = base64.b64decode(request.garment_image_base64.split(",")[1] if "," in request.garment_image_base64 else request.garment_image_base64)
                g_file.write(garment_data)
                garment_path = g_file.name

            try:
                result = client.predict(
                    vton_img=handle_file(person_path),
                    garm_img=handle_file(garment_path),
                    category=hf_cat,
                    n_samples=1,
                    n_steps=20,
                    image_scale=2.0,
                    seed=random.randint(0, 100000),
                    api_name="/process_dc"
                )
                output_path = result[0]['image']
            except Exception as e:
                if "ZeroGPU" in str(e):
                    raise HTTPException(status_code=429, detail="Hugging Face Free GPU quota exceeded. Please try again later.")
                raise HTTPException(status_code=500, detail=f"VTON Model Error: {str(e)}")
            with open(output_path, "rb") as f:
                output_b64 = base64.b64encode(f.read()).decode("utf-8")
            os.remove(person_path)
            os.remove(garment_path)
            return TryOnJobResponse(
                job_id="hf-complete",
                provider="huggingface",
                status="completed",
                result_image_base64=f"data:image/png;base64,{output_b64}"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/outfits/tryon-job/{job_id}", response_model=TryOnJobResponse)
def get_tryon_job_status(job_id: str, provider: Optional[str] = Query(None), current_user: User = Depends(get_current_user)):
    try:
        fal_key = os.environ.get("FAL_KEY")
        pixel_api_key = os.environ.get("PIXEL_API_KEY") or os.environ.get("PIXELAPI_KEY") or os.environ.get("PIXELAPI")

        # Fal.ai provider handling
        if provider == "fal" or (fal_key and provider != "pixelapi"):
            headers = {"Authorization": f"Key {fal_key}"}
            status_res = requests.get(f"https://queue.fal.run/fal-ai/idm-vton/requests/{job_id}/status", headers=headers)
            if not status_res.ok:
                raise HTTPException(status_code=500, detail=f"Fal.ai status check failed: {status_res.text}")
            status_data = status_res.json()
            fal_status = status_data.get("status")

            if fal_status == "COMPLETED":
                res = requests.get(f"https://queue.fal.run/fal-ai/idm-vton/requests/{job_id}", headers=headers)
                if not res.ok:
                    raise HTTPException(status_code=500, detail=f"Failed to fetch completed Fal result: {res.text}")
                output_url = res.json().get("image", {}).get("url")
                img_data = requests.get(output_url).content
                output_b64 = base64.b64encode(img_data).decode("utf-8")
                return TryOnJobResponse(
                    job_id=job_id,
                    provider="fal",
                    status="completed",
                    result_image_base64=f"data:image/png;base64,{output_b64}"
                )
            elif fal_status in ("IN_QUEUE", "IN_PROGRESS"):
                return TryOnJobResponse(job_id=job_id, provider="fal", status="processing")
            else:
                return TryOnJobResponse(job_id=job_id, provider="fal", status="failed", error="Fal.ai job failed or cancelled.")

        # PixelAPI provider handling
        elif provider == "pixelapi" or pixel_api_key:
            headers = {"Authorization": f"Bearer {pixel_api_key}"}
            poll_res = requests.get(f"https://api.pixelapi.dev/v1/virtual-tryon/jobs/{job_id}", headers=headers)
            if not poll_res.ok:
                raise HTTPException(status_code=500, detail=f"PixelAPI poll error: {poll_res.text}")
            poll_data = poll_res.json()
            p_status = poll_data.get("status")

            if p_status == "completed":
                output_b64 = poll_data.get("result_image_b64")
                if not output_b64 and poll_data.get("output_url"):
                    img_data = requests.get(poll_data.get("output_url")).content
                    output_b64 = base64.b64encode(img_data).decode("utf-8")
                return TryOnJobResponse(
                    job_id=job_id,
                    provider="pixelapi",
                    status="completed",
                    result_image_base64=f"data:image/png;base64,{output_b64}"
                )
            elif p_status in ("processing", "pending"):
                return TryOnJobResponse(job_id=job_id, provider="pixelapi", status="processing")
            else:
                return TryOnJobResponse(job_id=job_id, provider="pixelapi", status="failed", error="PixelAPI job failed.")

        return TryOnJobResponse(job_id=job_id, status="failed", error="Unknown provider or missing credentials.")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/outfits/generate-tryon")
def generate_tryon(request: TryOnRequest, current_user: User = Depends(get_current_user)):
    try:
        fal_key = os.environ.get("FAL_KEY")
        pixel_api_key = os.environ.get("PIXEL_API_KEY") or os.environ.get("PIXELAPI_KEY") or os.environ.get("PIXELAPI")
        hf_token = os.environ.get("HF_TOKEN")
        
        if not (fal_key or pixel_api_key or hf_token):
            raise HTTPException(status_code=500, detail="No VTON API key configured (FAL_KEY, PIXELAPI, or HF_TOKEN)")

        if request.garment_description == "lower_body":
            desc = "lower_body"
            px_cat = "lowerbody"
            hf_cat = "Lower-body"
        elif request.garment_description == "dresses":
            desc = "dresses"
            px_cat = "dress"
            hf_cat = "Dress"
        else:
            desc = "upper_body"
            px_cat = "upperbody"
            hf_cat = "Upper-body"

        if fal_key:
            headers = {"Authorization": f"Key {fal_key}", "Content-Type": "application/json"}
            person_data_url = request.person_image_base64 if request.person_image_base64.startswith("data:image") else f"data:image/png;base64,{request.person_image_base64}"
            garment_data_url = request.garment_image_base64 if request.garment_image_base64.startswith("data:image") else f"data:image/png;base64,{request.garment_image_base64}"
            payload = {
                "human_image_url": person_data_url,
                "garment_image_url": garment_data_url,
                "description": desc,
                "category": desc
            }
            res = requests.post("https://fal.run/fal-ai/idm-vton", json=payload, headers=headers)
            if not res.ok:
                raise HTTPException(status_code=500, detail=f"Fal.ai error: {res.text}")
            output_url = res.json().get("image", {}).get("url")
            img_data = requests.get(output_url).content
            output_b64 = base64.b64encode(img_data).decode("utf-8")
            return {"result_image_base64": f"data:image/png;base64,{output_b64}"}
            
        elif pixel_api_key:
            person_raw = request.person_image_base64.split(",")[1] if "," in request.person_image_base64 else request.person_image_base64
            garment_raw = request.garment_image_base64.split(",")[1] if "," in request.garment_image_base64 else request.garment_image_base64
            headers = {"Authorization": f"Bearer {pixel_api_key}", "Content-Type": "application/json"}
            payload = {"person_image": person_raw, "garment_image": garment_raw, "category": px_cat}
            res = requests.post("https://api.pixelapi.dev/v1/virtual-tryon", json=payload, headers=headers)
            if not res.ok:
                raise HTTPException(status_code=500, detail=f"PixelAPI submit error: {res.text}")
            job_id = res.json().get("job_id")
            for _ in range(60):
                time.sleep(2)
                poll_res = requests.get(f"https://api.pixelapi.dev/v1/virtual-tryon/jobs/{job_id}", headers=headers)
                if not poll_res.ok:
                    raise HTTPException(status_code=500, detail=f"PixelAPI poll error: {poll_res.text}")
                poll_data = poll_res.json()
                status = poll_data.get("status")
                if status == "completed":
                    output_b64 = poll_data.get("result_image_b64")
                    if not output_b64 and poll_data.get("output_url"):
                        img_data = requests.get(poll_data.get("output_url")).content
                        output_b64 = base64.b64encode(img_data).decode("utf-8")
                    return {"result_image_base64": f"data:image/png;base64,{output_b64}"}
                elif status == "failed":
                    raise HTTPException(status_code=500, detail="PixelAPI job failed.")
            raise HTTPException(status_code=504, detail="PixelAPI polling timed out")
            
        elif hf_token:
            client = Client("levihsu/OOTDiffusion", token=hf_token)
            with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as p_file:
                person_data = base64.b64decode(request.person_image_base64.split(",")[1] if "," in request.person_image_base64 else request.person_image_base64)
                p_file.write(person_data)
                person_path = p_file.name

            with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as g_file:
                garment_data = base64.b64decode(request.garment_image_base64.split(",")[1] if "," in request.garment_image_base64 else request.garment_image_base64)
                g_file.write(garment_data)
                garment_path = g_file.name
                
            try:
                result = client.predict(
                    vton_img=handle_file(person_path),
                    garm_img=handle_file(garment_path),
                    category=hf_cat,
                    n_samples=1,
                    n_steps=20,
                    image_scale=2.0,
                    seed=random.randint(0, 100000),
                    api_name="/process_dc"
                )
                output_path = result[0]['image']
            except Exception as e:
                if "ZeroGPU" in str(e):
                    raise HTTPException(status_code=429, detail="Hugging Face Free GPU quota exceeded. Please try again later.")
                raise HTTPException(status_code=500, detail=f"VTON Model Error: {str(e)}")
            with open(output_path, "rb") as f:
                output_b64 = base64.b64encode(f.read()).decode("utf-8")
            os.remove(person_path)
            os.remove(garment_path)
            return {"result_image_base64": f"data:image/png;base64,{output_b64}"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/outfits", response_model=List[OutfitResponse])
def get_outfits(
    occasion: Optional[str] = Query(None, description="Filter by occasion"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch suggested outfit combinations with model / try-on pictures."""
    query = db.query(Outfit).filter(Outfit.user_id == current_user.id)
    if occasion and occasion.lower() != "all":
        query = query.filter(Outfit.occasion.ilike(occasion))
    outfits = query.order_by(Outfit.created_at.desc()).all()
    return outfits


@app.post("/api/outfits", response_model=OutfitResponse, status_code=status.HTTP_201_CREATED)
def create_outfit(
    outfit_in: OutfitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save an outfit suggestion or fit picture."""
    new_outfit = Outfit(
        id=uuid.uuid4(),
        user_id=current_user.id,
        title=outfit_in.title,
        occasion=outfit_in.occasion,
        status=outfit_in.status or "Styled",
        model_image_url=outfit_in.model_image_url,
        item_ids=outfit_in.item_ids,
        styling_notes=outfit_in.styling_notes,
        is_custom_fit_pic=outfit_in.is_custom_fit_pic or False
    )
    db.add(new_outfit)
    db.commit()
    db.refresh(new_outfit)
    return new_outfit


@app.put("/api/outfits/{outfit_id}", response_model=OutfitResponse)
def update_outfit(
    outfit_id: uuid.UUID,
    outfit_update: OutfitUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update outfit suggestion, model photo, or styling notes."""
    outfit = db.query(Outfit).filter(Outfit.id == outfit_id, Outfit.user_id == current_user.id).first()
    if not outfit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Outfit with id '{outfit_id}' not found."
        )

    if outfit_update.title is not None:
        outfit.title = outfit_update.title
    if outfit_update.occasion is not None:
        outfit.occasion = outfit_update.occasion
    if outfit_update.status is not None:
        outfit.status = outfit_update.status
    if outfit_update.model_image_url is not None:
        outfit.model_image_url = outfit_update.model_image_url
        if outfit_update.model_image_url.strip():
            outfit.is_custom_fit_pic = True
    if outfit_update.is_custom_fit_pic is not None:
        outfit.is_custom_fit_pic = outfit_update.is_custom_fit_pic
    if outfit_update.item_ids is not None:
        outfit.item_ids = outfit_update.item_ids
    if outfit_update.styling_notes is not None:
        outfit.styling_notes = outfit_update.styling_notes

    db.commit()
    db.refresh(outfit)
    return outfit


@app.delete("/api/outfits/{outfit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_outfit(
    outfit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an outfit suggestion."""
    outfit = db.query(Outfit).filter(Outfit.id == outfit_id, Outfit.user_id == current_user.id).first()
    if not outfit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Outfit with id '{outfit_id}' not found."
        )
    db.delete(outfit)
    db.commit()
    return None


# ==========================================
# USER ACCOUNT MANAGEMENT ENDPOINTS
# ==========================================



@app.post("/api/user/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new ambassador."""
    clean_email = user_in.email.strip().lower()
    existing_user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="This email is already registered. Please sign in instead.")
    
    hashed_password = get_password_hash(user_in.password)
    clean_name = user_in.name.strip() if user_in.name else "Ambassador"
    clean_handle = user_in.handle.strip() if user_in.handle else clean_email.split('@')[0]
    
    new_user = User(
        id=uuid.uuid4(),
        email=clean_email,
        password_hash=hashed_password,
        name=clean_name,
        handle=clean_handle,
        avatar_url=None,
        bio=None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/user/login", response_model=Token)
def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate ambassador and return JWT token."""
    clean_email = login_data.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    
    # Auto-seed pardo demo account on-the-fly if missing (e.g. ephemeral serverless db)
    if not user and clean_email == "pardo@gmail.com":
        try:
            demo_user = User(
                id=uuid.uuid4(),
                email="pardo@gmail.com",
                password_hash=get_password_hash("password123"),
                name="Pardo",
                handle="pardo",
                avatar_url=None,
                bio="Brand Ambassador"
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            user = demo_user
        except Exception:
            db.rollback()
            user = db.query(User).filter(func.lower(User.email) == clean_email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"No account found with email '{clean_email}'. Please register a new account or check spelling.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please verify your password and try again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/user/profile", response_model=UserResponse)
def get_user_profile(current_user: User = Depends(get_current_user)):
    """Fetch current authenticated ambassador account details."""
    return current_user

@app.put("/api/user/profile", response_model=UserResponse)
def update_user_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update ambassador profile name, handle, bio, or avatar picture."""
    if profile_in.name is not None:
        current_user.name = profile_in.name
    if profile_in.email is not None:
        current_user.email = profile_in.email
    if profile_in.handle is not None:
        current_user.handle = profile_in.handle
    if profile_in.bio is not None:
        current_user.bio = profile_in.bio
    if profile_in.avatar_url is not None:
        current_user.avatar_url = profile_in.avatar_url
    if profile_in.custom_categories is not None:
        current_user.custom_categories = profile_in.custom_categories
    if profile_in.custom_statuses is not None:
        current_user.custom_statuses = profile_in.custom_statuses
    if profile_in.custom_occasions is not None:
        current_user.custom_occasions = profile_in.custom_occasions
    if profile_in.status_icons_json is not None:
        current_user.status_icons_json = profile_in.status_icons_json
    if profile_in.ai_styling_instructions is not None:
        current_user.ai_styling_instructions = profile_in.ai_styling_instructions

    db.commit()
    db.refresh(current_user)
    return current_user

@app.put("/api/user/password")
def change_user_password(
    pwd_in: UserPasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change ambassador account password."""
    if not verify_password(pwd_in.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    current_user.password_hash = get_password_hash(pwd_in.new_password)
    db.commit()
    return {"status": "success", "message": "Password changed successfully."}


@app.post("/api/user/logout")
def logout_user():
    """Revoke active session and logout ambassador."""
    return {"status": "success", "message": "Logged out successfully."}


# ==========================================
# CAMPAIGN BOARD ENDPOINTS
# ==========================================

@app.get("/api/boards", response_model=List[CampaignBoardResponse])
def get_campaign_boards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all boards for the current user."""
    boards = db.query(CampaignBoard).filter(CampaignBoard.user_id == current_user.id).order_by(CampaignBoard.created_at.asc()).all()
    if not boards:
        # Create a default board if they have none
        default_board = CampaignBoard(
            id=uuid.uuid4(),
            user_id=current_user.id,
            title="Main Board",
            columns_json="[]"
        )
        db.add(default_board)
        db.commit()
        db.refresh(default_board)
        boards = [default_board]
    return boards

@app.post("/api/boards", response_model=CampaignBoardResponse)
def create_campaign_board(
    board_in: CampaignBoardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new board."""
    new_board = CampaignBoard(
        id=uuid.uuid4(),
        user_id=current_user.id,
        title=board_in.title,
        columns_json="[]"
    )
    db.add(new_board)
    db.commit()
    db.refresh(new_board)
    return new_board

@app.put("/api/boards/{board_id}", response_model=CampaignBoardResponse)
def update_campaign_board(
    board_id: uuid.UUID,
    board_in: CampaignBoardUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update board title or columns."""
    board = db.query(CampaignBoard).filter(CampaignBoard.id == board_id, CampaignBoard.user_id == current_user.id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    if board_in.title is not None:
        board.title = board_in.title
    if board_in.columns_json is not None:
        board.columns_json = board_in.columns_json
    db.commit()
    db.refresh(board)
    return board

@app.delete("/api/boards/{board_id}")
def delete_campaign_board(
    board_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a board."""
    board = db.query(CampaignBoard).filter(CampaignBoard.id == board_id, CampaignBoard.user_id == current_user.id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    db.delete(board)
    db.commit()
    return {"status": "success"}


@app.get("/api/boards/{board_id}/tasks", response_model=List[CampaignTaskResponse])
def get_campaign_tasks(
    board_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all tasks for a specific board."""
    return db.query(CampaignTask).filter(CampaignTask.board_id == board_id, CampaignTask.user_id == current_user.id).order_by(CampaignTask.created_at.desc()).all()

@app.post("/api/boards/tasks", response_model=CampaignTaskResponse)
def create_campaign_task(
    task_in: CampaignTaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new task."""
    new_task = CampaignTask(
        id=uuid.uuid4(),
        user_id=current_user.id,
        board_id=task_in.board_id,
        title=task_in.title,
        cells_json=task_in.cells_json
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@app.put("/api/boards/tasks/{task_id}", response_model=CampaignTaskResponse)
@app.put("/api/board/tasks/{task_id}", response_model=CampaignTaskResponse)
def update_campaign_task(
    task_id: uuid.UUID,
    task_in: CampaignTaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing task."""
    task = db.query(CampaignTask).filter(CampaignTask.id == task_id, CampaignTask.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task_in.title is not None:
        task.title = task_in.title
    if task_in.cells_json is not None:
        task.cells_json = task_in.cells_json

    db.commit()
    db.refresh(task)
    return task

@app.delete("/api/boards/tasks/{task_id}")
@app.delete("/api/board/tasks/{task_id}")
def delete_campaign_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a task."""
    task = db.query(CampaignTask).filter(CampaignTask.id == task_id, CampaignTask.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"status": "success"}

