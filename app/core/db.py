from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Prefer DATABASE_URL env var (set this to your Supabase Postgres connection string in production).
# Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Fix for Render/Heroku postgres URLs (they use postgres:// but sqlalchemy needs postgresql://)
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Fallback to local SQLite for development if no DATABASE_URL is set
if not SQLALCHEMY_DATABASE_URL:
    print("⚠️  WARNING: DATABASE_URL not set. Falling back to local SQLite (data will not persist across restarts).")
    print("   To use Supabase, add DATABASE_URL to your app/.env file.")
    SQLALCHEMY_DATABASE_URL = "sqlite:///./urbanpulse.db"

# SQLite needs check_same_thread=False; Postgres does not
engine_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
