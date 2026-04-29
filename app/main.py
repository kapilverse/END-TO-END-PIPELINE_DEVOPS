from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app, Counter
import time

app = FastAPI(
    title="UrbanService Marketplace API",
    description="Production-grade API for Local Services Marketplace",
    version="1.0.0"
)

# Prometheus Monitoring
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
REQUEST_COUNT = Counter("http_requests_total", "Total HTTP Requests", ["method", "endpoint", "status"])

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to UrbanService Pro API", "status": "online"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

# Import routes
from app.api import auth, bookings, tracking, providers

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(bookings.router, prefix="/bookings", tags=["Bookings"])
app.include_router(providers.router, prefix="/providers", tags=["Providers"])
app.include_router(tracking.router, tags=["Tracking"])
