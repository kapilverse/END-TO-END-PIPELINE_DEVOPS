from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from core import security
from models.database import User, UserRole
# Note: In a real app, you'd use a DB session dependency
# from app.core.db import get_db

router = APIRouter()

# In-memory DB for demo
USERS_DB = {}

@router.post("/signup")
async def signup(user_data: dict):
    phone = user_data.get("phone")
    if phone in USERS_DB:
        raise HTTPException(status_code=400, detail="User already exists")
    
    hashed_password = security.get_password_hash(user_data["password"])
    USERS_DB[phone] = {
        "phone": phone,
        "password": hashed_password,
        "name": user_data.get("name", "Anonymous"),
        "role": user_data.get("role", "user")
    }
    
    # Generate token immediately for signup
    access_token = security.create_access_token(
        data={"sub": phone, "role": USERS_DB[phone]["role"]}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "phone": phone,
        "name": USERS_DB[phone]["name"]
    }

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = USERS_DB.get(form_data.username)
    if not user or not security.verify_password(form_data.password, user["password"]):
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
        "name": user["name"]
    }

