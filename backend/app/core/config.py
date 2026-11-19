import os
from pathlib import Path
from typing import List, Optional

# Base directory for the backend project
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings:
    PROJECT_NAME: str = "AI Soccer Match Analytics API"
    VERSION: str = "0.1.0-alpha"
    DESCRIPTION: str = (
        "REST API backend for AI-Powered Soccer Match Analytics System. "
        "Provides video ingestion and analytics endpoints for CV/DL inference pipeline."
    )
    
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1")
    
    # CORS settings (strip whitespace and trailing slashes to avoid origin mismatches)
    CORS_ORIGINS: List[str] = [
        origin.strip().rstrip("/")
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
        ).split(",")
        if origin.strip()
    ]
    CORS_ORIGIN_REGEX: Optional[str] = os.getenv("CORS_ORIGIN_REGEX", "").strip() or None
    
    # Computer vision model settings
    YOLO_MODEL_PATH: str = os.getenv("YOLO_MODEL_PATH", "yolo11n.pt")
    YOLO_IMGSZ: int = int(os.getenv("YOLO_IMGSZ", "1280"))
    YOLO_DEVICE: str = os.getenv("YOLO_DEVICE", "auto")
    
    # Upload settings
    UPLOAD_DIR: Path = BASE_DIR / os.getenv("UPLOAD_DIR", "uploads")
    MAX_UPLOAD_SIZE_BYTES: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "500")) * 1024 * 1024
    ALLOWED_VIDEO_EXTENSIONS: set = {".mp4", ".avi", ".mov", ".mkv"}

settings = Settings()

# Ensure uploads directory exists
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
