from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from prometheus_client import make_asgi_app, Counter
import time
from pathlib import Path

# Import routes
from api import auth, bookings, tracking, providers

BASE_DIR = Path(__file__).resolve().parent
# React Frontend Build Directory
REACT_DIST_DIR = BASE_DIR / "web" / "dist"

app = FastAPI(
    title="UrbanPulse Marketplace API",
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

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(bookings.router, prefix="/bookings", tags=["Bookings"])
app.include_router(providers.router, prefix="/providers", tags=["Providers"])
app.include_router(tracking.router, tags=["Tracking"])

# Serve Vite static assets
import os
from fastapi.responses import FileResponse

if (REACT_DIST_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(REACT_DIST_DIR / "assets")), name="assets")

# Catch-all route for React SPA
@app.api_route("/{path_name:path}", methods=["GET"])
async def catch_all(path_name: str):
    index_file = REACT_DIST_DIR / "index.html"
    
    # Check if a specific file like vite.svg is requested
    requested_file = REACT_DIST_DIR / path_name
    if path_name and requested_file.exists() and requested_file.is_file():
        return FileResponse(requested_file)

    # Otherwise return the React index.html
    if index_file.exists():
        return FileResponse(index_file)
    
    return {"message": "UrbanPulse API is running. React frontend not built yet. Run 'npm run build' in the 'web' folder."}
