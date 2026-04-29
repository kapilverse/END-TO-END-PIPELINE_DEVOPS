from fastapi import APIRouter, Depends, Query
from typing import List
from services.matching import MatchingService
from sqlalchemy.orm import Session
# from app.db import get_db

router = APIRouter()

@router.get("/discover")
async def discover_providers(
    lat: float, 
    lng: float, 
    service_id: int, 
    user_id: int = Query(None)
):
    """
    Finds and ranks providers near the user using the matching algorithm
    and AI-based preference simulation.
    """
    user_loc = {"lat": lat, "lng": lng}
    
    # Mock data for demonstration
    # In production, this would be a DB query
    mock_providers = [
        {"id": 1, "name": "John Plumber", "rating": 4.8, "location": {"lat": lat+0.01, "lng": lng+0.01}, "price": 500},
        {"id": 2, "name": "Quick Fix Inc", "rating": 4.2, "location": {"lat": lat+0.02, "lng": lng-0.01}, "price": 400},
        {"id": 3, "name": "Expert Electrics", "rating": 4.9, "location": {"lat": lat+0.05, "lng": lng+0.03}, "price": 800},
    ]
    
    # Apply Matching & Ranking
    ranked = MatchingService.rank_providers(user_loc, mock_providers)
    
    # AI Recommendation (Simple simulation)
    # If user_id is provided, we could prioritize providers they've used before
    for p in ranked:
        if p['rating'] > 4.5:
            p['is_ai_recommended'] = True
        else:
            p['is_ai_recommended'] = False
            
    return {"results": ranked}

@router.get("/earnings/{provider_id}")
async def get_earnings(provider_id: int):
    """Calculates total earnings for a provider."""
    # Simulation of DB aggregation
    return {
        "provider_id": provider_id,
        "total_earnings": 15400.50,
        "currency": "INR",
        "bookings_completed": 12,
        "period": "Last 30 Days"
    }
