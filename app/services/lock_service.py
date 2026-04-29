import redis
import time
from typing import Optional
import os

# Connect to Redis (using environment variables)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
r = redis.from_url(REDIS_URL)

class LockService:
    @staticmethod
    def acquire_booking_lock(provider_id: int, time_slot: str, expire_seconds: int = 300) -> bool:
        """
        Acquire a lock for a specific provider and time slot.
        Returns True if lock acquired, False otherwise.
        """
        lock_key = f"lock:booking:{provider_id}:{time_slot}"
        # setnx (set if not exists)
        return r.set(lock_key, "locked", ex=expire_seconds, nx=True)

    @staticmethod
    def release_booking_lock(provider_id: int, time_slot: str):
        """Release the lock manually if needed."""
        lock_key = f"lock:booking:{provider_id}:{time_slot}"
        r.delete(lock_key)

    @staticmethod
    def is_slot_locked(provider_id: int, time_slot: str) -> bool:
        lock_key = f"lock:booking:{provider_id}:{time_slot}"
        return r.exists(lock_key) > 0
