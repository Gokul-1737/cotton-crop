"""
FastAPI main application entry point.
Cotton Leaf Disease Identification — MORPH-CNN Backend
"""
import sys
import os
from pathlib import Path

# Ensure project root is on sys.path for model imports
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from db.database import init_db
from routers import predict, model, dataset, history

# ------------------------------------------------------------------
# App setup
# ------------------------------------------------------------------
app = FastAPI(
    title="MORPH-CNN Cotton Disease API",
    description="Backend API for Cotton Leaf Disease Identification using MORPH-CNN",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173",
                   "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# Static files — serve results images
# ------------------------------------------------------------------
RESULTS_DIR = PROJECT_ROOT / "results"
if RESULTS_DIR.exists():
    app.mount("/results", StaticFiles(directory=str(RESULTS_DIR)), name="results")

UPLOADS_DIR = Path(__file__).parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# ------------------------------------------------------------------
# Routers
# ------------------------------------------------------------------
app.include_router(predict.router)
app.include_router(model.router)
app.include_router(dataset.router)
app.include_router(history.router)


# ------------------------------------------------------------------
# Startup
# ------------------------------------------------------------------
@app.on_event("startup")
def on_startup():
    init_db()
    # Pre-load model on startup to avoid cold-start delay on first request
    try:
        from services.model_service import get_model_service
        svc = get_model_service()
        print(f"[startup] MORPH-CNN loaded. Classes: {svc.classes}")
        print(f"[startup] Device: {svc.device}")
    except Exception as e:
        print(f"[startup] WARNING: Model load failed — {e}")


@app.get("/")
def root():
    return {
        "app": "MORPH-CNN Cotton Disease API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    try:
        from services.model_service import get_model_service
        svc = get_model_service()
        return {"status": "ok", "model": "loaded", "classes": svc.classes}
    except Exception as e:
        return {"status": "degraded", "model": "error", "detail": str(e)}

