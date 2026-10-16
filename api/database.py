import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

# Read Vercel Postgres or custom database URL
DATABASE_URL = (
    os.getenv("POSTGRES_URL")
    or os.getenv("DATABASE_URL")
    or ("sqlite:////tmp/closet_pr.db" if os.getenv("VERCEL") else "sqlite:///./closet_pr.db")
)

# Fix for Vercel/Heroku postgres:// vs postgresql:// SQLAlchemy standard
# Ensure psycopg2 driver is used if generic postgresql:// is provided
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

# Handle SQLite vs Postgres connect_args
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for obtaining a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
