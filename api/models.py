import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.orm import relationship
import sys
import os
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    from .database import Base
except (ImportError, ValueError):
    from database import Base


# Universal UUID type decorator to support both Postgres and SQLite gracefully
class GUID(TypeDecorator):
    """Platform-independent GUID/UUID type.
    Uses PostgreSQL's UUID type, otherwise uses CHAR(36), storing as stringified hex values.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return str(uuid.UUID(str(value)))
            else:
                return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(str(value))
            return value


class User(Base):
    __tablename__ = "users"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    handle = Column(String(100), nullable=True)
    avatar_url = Column(String(2048), nullable=True)
    bio = Column(String(500), nullable=True)
    tryon_base_image = Column(String, nullable=True)
    custom_categories = Column(String(1024), nullable=True)
    custom_statuses = Column(String(1024), nullable=True)
    status_icons_json = Column(String(1024), nullable=True)
    custom_occasions = Column(String(1024), nullable=True)
    board_columns_json = Column(String(4096), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    items = relationship("ClothingItem", back_populates="user", cascade="all, delete-orphan")
    outfits = relationship("Outfit", back_populates="user", cascade="all, delete-orphan")
    campaign_tasks = relationship("CampaignTask", back_populates="user", cascade="all, delete-orphan")
    campaign_boards = relationship("CampaignBoard", back_populates="user", cascade="all, delete-orphan")
    avatars = relationship("TryonAvatar", back_populates="user", cascade="all, delete-orphan")

class TryonAvatar(Base):
    __tablename__ = "tryon_avatars"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    image_base64 = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="avatars")

class CampaignBoard(Base):
    __tablename__ = "campaign_boards"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    columns_json = Column(String(8192), default="[]", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="campaign_boards")
    tasks = relationship("CampaignTask", back_populates="board", cascade="all, delete-orphan")


class CampaignTask(Base):
    __tablename__ = "campaign_tasks"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    board_id = Column(GUID, ForeignKey("campaign_boards.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    cells_json = Column(String(8192), default="{}", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="campaign_tasks")
    board = relationship("CampaignBoard", back_populates="tasks")


class ClothingItem(Base):
    __tablename__ = "clothing_items"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    image_url = Column(String(1024), nullable=False)
    category = Column(String(50), nullable=False, index=True)  # Tops, Bottoms, Outerwear, Footwear, Accessories
    brand = Column(String(100), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="Unworn", index=True)  # Unworn, Worn, Posted, Needs Returning
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="items")


class Outfit(Base):
    __tablename__ = "outfits"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(150), nullable=False)
    occasion = Column(String(100), default="Streetwear", nullable=False)
    status = Column(String(100), default="Concepting", nullable=True)
    model_image_url = Column(String(2048), nullable=False)  # Picture of ambassador wearing the outfit
    item_ids = Column(String(1024), default="", nullable=False)  # Comma-separated clothing item UUIDs
    styling_notes = Column(String(1024), nullable=True)
    is_custom_fit_pic = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="outfits")

