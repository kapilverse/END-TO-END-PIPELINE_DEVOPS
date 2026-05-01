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
STATIC_DIR = BASE_DIR / "app" / "static"

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

# Static Files for Web UI
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/admin", response_class=HTMLResponse)
async def admin_panel():
    try:
        with open(STATIC_DIR / "admin.html", "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "<h1>Admin Panel File Not Found</h1><p>Please check static/admin.html</p>"

@app.get("/", response_class=HTMLResponse)
async def root():
    try:
        with open(STATIC_DIR / "index.html", "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "<h1>UrbanPulse Pro Web UI Not Found</h1><p>Please check static/index.html</p>"

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(bookings.router, prefix="/bookings", tags=["Bookings"])
app.include_router(providers.router, prefix="/providers", tags=["Providers"])
app.include_router(tracking.router, tags=["Tracking"])
