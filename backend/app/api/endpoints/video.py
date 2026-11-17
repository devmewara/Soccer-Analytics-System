import os
import uuid
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any

from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.core.config import settings
from app.schemas.video import VideoUploadResponse, VideoJobStatus
from app.services.cv_pipeline import cv_pipeline_service

router = APIRouter()


def format_bytes(num_bytes: int) -> str:
    """Format bytes into human-readable string (KB, MB, GB)."""
    for unit in ["B", "KB", "MB", "GB"]:
        if abs(num_bytes) < 1024.0:
            return f"{num_bytes:3.1f} {unit}"
        num_bytes /= 1024.0
    return f"{num_bytes:.1f} TB"


@router.post("/upload", response_model=VideoUploadResponse)
async def upload_video(file: UploadFile = File(...)):
    """
    Accepts match video uploads, validates file extension and constraints,
    stores the raw footage in the designated storage directory, and prepares
    the pipeline job for future YOLO/ByteTrack processing.
    """
    # 1. Validate file presence
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided in upload request."
        )

    # 2. Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in settings.ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported video format '{file_ext}'. Allowed formats: "
                f"{', '.join(sorted(settings.ALLOWED_VIDEO_EXTENSIONS))}"
            )
        )

    # 3. Generate secure unique identifier & target destination
    video_id = str(uuid.uuid4())
    safe_filename = f"{video_id}{file_ext}"
    target_path = settings.UPLOAD_DIR / safe_filename

    # 4. Stream file contents to disk and enforce size guard
    bytes_written = 0
    try:
        with open(target_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                bytes_written += len(chunk)
                if bytes_written > settings.MAX_UPLOAD_SIZE_BYTES:
                    buffer.close()
                    if target_path.exists():
                        target_path.unlink()
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=(
                            f"File size exceeds maximum limit of "
                            f"{settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB."
                        )
                    )
                buffer.write(chunk)
    except HTTPException:
        raise
    except Exception as exc:
        if target_path.exists():
            target_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save video: {str(exc)}"
        )

    return VideoUploadResponse(
        video_id=video_id,
        original_filename=file.filename,
        saved_filename=safe_filename,
        file_size_bytes=bytes_written,
        file_size_formatted=format_bytes(bytes_written),
        status="ready_for_analysis",
        stream_url=f"/uploads/{safe_filename}",
        uploaded_at=datetime.now(timezone.utc).isoformat(),
        message="Video uploaded successfully and stored in backend/uploads. Awaiting CV Phase 2 for YOLO & tracking inference."
    )


@router.get("/recent", response_model=List[Dict[str, Any]])
async def list_recent_videos():
    """
    Returns list of recently uploaded match videos stored on the server.
    """
    videos = []
    if settings.UPLOAD_DIR.exists():
        for item in settings.UPLOAD_DIR.iterdir():
            if item.is_file() and item.suffix.lower() in settings.ALLOWED_VIDEO_EXTENSIONS:
                stat = item.stat()
                videos.append({
                    "filename": item.name,
                    "stream_url": f"/uploads/{item.name}",
                    "file_size_formatted": format_bytes(stat.st_size),
                    "created_at": datetime.fromtimestamp(stat.st_ctime, tz=timezone.utc).isoformat(),
                    "status": "Ready for CV Pipeline"
                })
    # Sort descending by creation date
    videos.sort(key=lambda x: x["created_at"], reverse=True)
    return videos


@router.get("/status/{video_id}", response_model=VideoJobStatus)
async def get_video_processing_status(video_id: str):
    """
    Returns current computer vision processing status for a given video.
    """
    return VideoJobStatus(
        job_id=f"job_{video_id[:8]}",
        video_id=video_id,
        status="pending",
        progress=0,
        cv_engine="YOLOv8 + ByteTrack (Future Phase)",
        message="CV pipeline inference not yet triggered. Foundation is awaiting Phase 2 implementation."
    )
