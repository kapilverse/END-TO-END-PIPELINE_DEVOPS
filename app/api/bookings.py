from fastapi import APIRouter, Depends, HTTPException
from services.lock_service import LockService
from datetime import datetime

router = APIRouter()

# In-memory DB for demo
BOOKINGS_DB = []

@router.post("/create")
async def create_booking(provider_id: int, slot: str, user_id: int):
    # For demo, we ignore the Redis Lock if it's not running
    try:
        lock_acquired = LockService.acquire_booking_lock(provider_id, slot)
    except:
        lock_acquired = True
    
    if not lock_acquired:
        raise HTTPException(
            status_code=400, 
            detail="This slot is currently being booked by someone else."
        )
    
    new_booking = {
        "id": len(BOOKINGS_DB) + 1,
        "provider_id": provider_id,
        "slot": slot,
        "user_id": user_id,
        "status": "confirmed", # For demo, we auto-confirm
        "created_at": datetime.now().isoformat()
    }
    BOOKINGS_DB.append(new_booking)
    
    return {
        "status": "confirmed",
        "booking": new_booking
    }

@router.get("/list/{user_id}")
async def list_bookings(user_id: int):
    return [b for b in BOOKINGS_DB if b["user_id"] == user_id]

