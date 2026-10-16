import requests
import time
import uuid
import random
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

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
Base.metadata.create_all(bind=engine)

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
def health_check():
    return {
        "status": "healthy",
        "service": "ClosetPR FastAPI Vercel Serverless",
        "endpoints": [
            "GET /api/items",
            "POST /api/items/upload",
            "PUT /api/items/{id}",
            "DELETE /api/items/{id}",
            "GET /api/outfits",
            "POST /api/outfits",
            "PUT /api/outfits/{id}",
            "DELETE /api/outfits/{id}"
        ]
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
        status=item_in.status
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
    """Update clothing item fields, specifically status."""
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

@app.post("/api/outfits/auto-suggest", response_model=OutfitResponse)
def auto_suggest_outfit(avatar_id: Optional[uuid.UUID] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    person_base64 = current_user.tryon_base_image
    
    if avatar_id:
        avatar = db.query(TryonAvatar).filter(TryonAvatar.id == avatar_id, TryonAvatar.user_id == current_user.id).first()
        if not avatar:
            raise HTTPException(status_code=404, detail="Selected avatar not found.")
        person_base64 = avatar.image_base64
    else:
        # Fallback to first avatar if no default tryon_base_image
        if not person_base64:
            first_avatar = db.query(TryonAvatar).filter(TryonAvatar.user_id == current_user.id).first()
            if first_avatar:
                person_base64 = first_avatar.image_base64

    if not person_base64:
        raise HTTPException(status_code=400, detail="Please upload a Default Try-On Avatar in your profile first.")

    # Get items
    items = db.query(ClothingItem).filter(ClothingItem.user_id == current_user.id).all()
    if not items:
        raise HTTPException(status_code=400, detail="No clothes found in your closet.")

    # Try to build a full outfit: Top + Bottom
    tops = [i for i in items if not any(w in i.category.lower() for w in ["bottom", "pant", "jean", "short", "skirt", "trouser", "legging", "shoe", "foot", "sneaker", "boot"])]
    bottoms = [i for i in items if any(w in i.category.lower() for w in ["bottom", "pant", "jean", "short", "skirt", "trouser", "legging"])]
    
    outfit_items = []
    
    # Add bottoms FIRST, then tops, so tops drape over bottoms during VTON
    if bottoms:
        unworn_bottoms = [i for i in bottoms if i.status == "Unworn"]
        outfit_items.append(random.choice(unworn_bottoms) if unworn_bottoms else random.choice(bottoms))

    if tops:
        unworn_tops = [i for i in tops if i.status == "Unworn"]
        outfit_items.append(random.choice(unworn_tops) if unworn_tops else random.choice(tops))
        
    # Filter out bottoms if top is a dress
    if any(w in i.category.lower() for i in outfit_items for w in ["dress", "gown", "jumpsuit", "romper"]):
        outfit_items = [i for i in outfit_items if not any(w in i.category.lower() for w in ["bottom", "pant", "jean", "short", "skirt", "trouser", "legging"])]

    if not outfit_items:
        # Fallback to any item if no tops or bottoms
        outfit_items.append(random.choice(items))

    try:
        fal_key = os.environ.get("FAL_KEY")
        pixel_api_key = os.environ.get("PIXEL_API_KEY") or os.environ.get("PIXELAPI_KEY") or os.environ.get("PIXELAPI")
        hf_token = os.environ.get("HF_TOKEN")
        
        if not (fal_key or pixel_api_key or hf_token):
            raise HTTPException(status_code=500, detail="No VTON API key configured (FAL_KEY, PIXELAPI, or HF_TOKEN)")
        
        current_person_b64 = person_base64
        
        # Apply each piece sequentially
        for piece in outfit_items:
            cat_lower = piece.category.lower()
            if any(word in cat_lower for word in ["bottom", "pant", "jean", "short", "skirt", "trouser", "legging"]):
                desc = "lower_body"
                px_cat = "lowerbody"
                hf_cat = "Lower-body"
            elif any(word in cat_lower for word in ["dress", "gown", "jumpsuit", "romper"]):
                desc = "dresses"
                px_cat = "dress"
                hf_cat = "Dress"
            else:
                desc = "upper_body"
                px_cat = "upperbody"
                hf_cat = "Upper-body"
                
            if fal_key:
                headers = {"Authorization": f"Key {fal_key}", "Content-Type": "application/json"}
                person_data_url = current_person_b64 if current_person_b64.startswith("data:image") else f"data:image/png;base64,{current_person_b64}"
                garment_data_url = piece.image_url if piece.image_url.startswith("data:image") else f"data:image/png;base64,{piece.image_url}"
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
                current_person_b64 = f"data:image/png;base64,{output_b64}"
                
            elif pixel_api_key:
                person_raw = current_person_b64.split(",")[1] if "," in current_person_b64 else current_person_b64
                garment_raw = piece.image_url.split(",")[1] if "," in piece.image_url else piece.image_url
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
                        current_person_b64 = f"data:image/png;base64,{output_b64}"
                        break
                    elif status == "failed":
                        raise HTTPException(status_code=500, detail="PixelAPI job failed.")
                else:
                    raise HTTPException(status_code=504, detail="PixelAPI polling timed out")
                    
            elif hf_token:
                # Fallback to HF Client
                client = Client("levihsu/OOTDiffusion", token=hf_token)
                with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as p_file:
                    person_data = base64.b64decode(current_person_b64.split(",")[1] if "," in current_person_b64 else current_person_b64)
                    p_file.write(person_data)
                    person_path = p_file.name

                with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as g_file:
                    garment_base64 = piece.image_url
                    garment_data = base64.b64decode(garment_base64.split(",")[1] if "," in garment_base64 else garment_base64)
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
                current_person_b64 = f"data:image/png;base64,{output_b64}"

        final_image_url = current_person_b64
        
        # Determine title and styling notes based on brands
        brands = [p.brand for p in outfit_items]
        brand_str = " + ".join(list(set(brands)))
        title = f"AI Suggestion: {brand_str} Look"
        notes = f"Auto-generated layered look featuring {brand_str}."
        
        # Determine occasion based on the items
        occasion = "Casual"
        if any("suit" in p.category.lower() or "gown" in p.category.lower() for p in outfit_items):
            occasion = "Formal Event"
        elif any("athletic" in p.category.lower() or "sport" in p.category.lower() for p in outfit_items):
            occasion = "Workout"
        
        new_outfit = Outfit(
            id=uuid.uuid4(),
            user_id=current_user.id,
            title=title,
            occasion=occasion,
            model_image_url=final_image_url,
            styling_notes=notes
        )
        db.add(new_outfit)
        db.commit()
        db.refresh(new_outfit)

        # Record associations
        for piece in outfit_items:
            db.execute(
                Outfit.__table__.metadata.tables['outfit_items'].insert().values(
                    outfit_id=new_outfit.id,
                    clothing_item_id=piece.id
                )
            )
            # Mark worn
            piece.status = "Worn"
            piece.last_worn = datetime.utcnow()
        
        db.commit()
        
        return new_outfit

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to auto-suggest outfit: {str(e)}")

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
        model_image_url=outfit_in.model_image_url,
        item_ids=outfit_in.item_ids,
        styling_notes=outfit_in.styling_notes
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
    if outfit_update.model_image_url is not None:
        outfit.model_image_url = outfit_update.model_image_url
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
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        id=uuid.uuid4(),
        email=user_in.email,
        password_hash=hashed_password,
        name=user_in.name,
        handle=user_in.handle,
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
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
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

