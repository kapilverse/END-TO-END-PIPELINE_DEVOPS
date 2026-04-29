from typing import List
from geopy.distance import geodesic

class MatchingService:
    @staticmethod
    def calculate_provider_score(
        user_loc: dict, 
        provider_loc: dict, 
        rating: float, 
        availability_score: float = 1.0
    ) -> float:
        """
        Matching Algorithm:
        score = (distance_factor * 0.5) + (rating_factor * 0.3) + (availability * 0.2)
        """
        # Calculate distance in KM
        dist = geodesic((user_loc['lat'], user_loc['lng']), (provider_loc['lat'], provider_loc['lng'])).km
        
        # Normalize distance (max radius 20km for local services)
        distance_factor = max(0, 1 - (dist / 20))
        
        # Rating factor (0 to 1)
        rating_factor = rating / 5.0
        
        # Combined Weighted Score
        score = (distance_factor * 0.5) + (rating_factor * 0.3) + (availability_score * 0.2)
        return round(score, 4)

    @staticmethod
    def calculate_dynamic_price(base_price: float, demand_factor: float) -> float:
        """
        Dynamic Pricing Logic (Surge Pricing):
        Increases price if demand is high (e.g., many active bookings in the area).
        """
        if demand_factor > 0.8: # Very high demand
            return round(base_price * 1.5, 2)
        elif demand_factor > 0.5: # Moderate surge
            return round(base_price * 1.2, 2)
        return base_price

    @staticmethod
    def rank_providers(user_loc: dict, providers: List[dict]) -> List[dict]:
        for p in providers:
            p['score'] = MatchingService.calculate_provider_score(
                user_loc, p['location'], p['rating']
            )
        
        # Sort by score descending
        return sorted(providers, key=lambda x: x['score'], reverse=True)
