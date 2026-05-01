from fastapi import APIRouter, HTTPException, status
from core import security

router = APIRouter()

# In-memory store is only for demo/dev. For production, wire up the real DB:
#   from core.db import get_db
#   from models.database import User
#   from fastapi import Depends
#   from sqlalchemy.orm import Session
USERS_DB = {}


@router.post("/signup")
async def signup(user_data: dict):
    phone = user_data.get("phone")
    if not phone or not user_data.get("password"):
        raise HTTPException(status_code=422, detail="phone and password are required")

    if phone in USERS_DB:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_password = security.get_password_hash(user_data["password"])
    USERS_DB[phone] = {
        "phone": phone,
        "password": hashed_password,
        "name": user_data.get("name", "Anonymous"),
        "role": user_data.get("role", "user"),
    }

    access_token = security.create_access_token(
        data={"sub": phone, "role": USERS_DB[phone]["role"]}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "phone": phone,
        "name": USERS_DB[phone]["name"],
    }


@router.post("/login")
async def login(user_data: dict):
    """
    Accepts JSON body: {"phone": "...", "password": "..."}
    The frontend sends JSON (not form-data), so we accept a plain dict.
    """
    phone = user_data.get("phone")
    password = user_data.get("password")

    if not phone or not password:
        raise HTTPException(status_code=422, detail="phone and password are required")

    user = USERS_DB.get(phone)
    if not user or not security.verify_password(password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = security.create_access_token(
        data={"sub": user["phone"], "role": user["role"]}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "phone": user["phone"],
        "name": user["name"],
    }
