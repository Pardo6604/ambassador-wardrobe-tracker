import uuid
from datetime import datetime
from typing import Optional, Literal, List
from pydantic import BaseModel, Field

try:
    import email_validator
    from pydantic import EmailStr
except ImportError:
    EmailStr = str  # Fallback to standard string if email-validator is not installed

CategoryLiteral = Literal["Tops", "Bottoms", "Outerwear", "Footwear", "Accessories"]
StatusLiteral = Literal["Unworn", "Worn", "Posted", "Needs Returning"]


class ClothingItemBase(BaseModel):
    image_url: str = Field(..., description="URL of the uploaded clothing image")
    category: str = Field(..., description="Category: Tops, Bottoms, Outerwear, Footwear, Accessories")
    brand: str = Field(..., min_length=1, max_length=100, description="Brand name of the item")
    status: Optional[str] = Field(default="Unworn", description="Status: Unworn, Worn, Posted, Needs Returning")
    description: Optional[str] = Field(default=None, description="Detailed piece description: color, material, cut, aesthetic vibe")


class ClothingItemCreate(ClothingItemBase):
    user_id: Optional[uuid.UUID] = None


class ClothingItemUpdate(BaseModel):
    status: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None


class ClothingItemResponse(ClothingItemBase):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OutfitBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    occasion: str = Field(default="Streetwear", max_length=100)
    status: Optional[str] = Field(default="Concepting", max_length=100)
    model_image_url: str = Field(..., description="Image URL of ambassador wearing the outfit")
    item_ids: str = Field(default="", description="Comma-separated IDs of clothing items")
    styling_notes: Optional[str] = None


class OutfitCreate(OutfitBase):
    user_id: Optional[uuid.UUID] = None


class OutfitUpdate(BaseModel):
    title: Optional[str] = None
    occasion: Optional[str] = None
    status: Optional[str] = None
    model_image_url: Optional[str] = None
    item_ids: Optional[str] = None
    styling_notes: Optional[str] = None


class OutfitResponse(OutfitBase):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=1)
    handle: Optional[str] = None


class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    handle: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = None
    custom_categories: Optional[str] = None
    custom_statuses: Optional[str] = None
    status_icons_json: Optional[str] = None
    custom_occasions: Optional[str] = None


class UserPasswordChange(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)



class TryOnRequest(BaseModel):
    person_image_base64: str
    garment_image_base64: str
    garment_description: str = "A clothing item"

class TryOnJobResponse(BaseModel):
    job_id: Optional[str] = None
    provider: Optional[str] = None
    status: str
    result_image_base64: Optional[str] = None
    error: Optional[str] = None

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    handle: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    tryon_base_image: Optional[str] = None
    custom_categories: Optional[str] = None
    custom_statuses: Optional[str] = None
    status_icons_json: Optional[str] = None
    custom_occasions: Optional[str] = None
    board_columns_json: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str


class UserTryOnUpdate(BaseModel):
    tryon_base_image: str

class TryonAvatarCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    image_base64: str

class TryonAvatarResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    image_base64: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class CampaignColumnUpdate(BaseModel):
    board_columns_json: str

class CampaignBoardCreate(BaseModel):
    title: str

class CampaignBoardUpdate(BaseModel):
    title: Optional[str] = None
    columns_json: Optional[str] = None

class CampaignBoardResponse(BaseModel):
    id: uuid.UUID
    title: str
    columns_json: str
    created_at: datetime

    class Config:
        from_attributes = True

class CampaignTaskCreate(BaseModel):
    board_id: uuid.UUID
    title: str = Field(..., description="Name of the task/deliverable")
    cells_json: str = Field(default="{}", description="JSON string of cell values")

class CampaignTaskUpdate(BaseModel):
    title: Optional[str] = None
    cells_json: Optional[str] = None

class CampaignTaskResponse(BaseModel):
    id: uuid.UUID
    board_id: uuid.UUID
    title: str
    cells_json: str
    created_at: datetime

    class Config:
        from_attributes = True
