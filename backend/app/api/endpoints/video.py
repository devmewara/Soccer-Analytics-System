import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.core.config import settings
from app.schemas.video import VideoUploadResponse, VideoJobStatus, StartAnalysisResponse
from app.services.cv_pipeline import cv_pipeline_service

router = APIRouter()


def format_bytes(num_bytes: int) -> str:
    """Format bytes into human-readable string (KB, MB, GB)."""
    for unit in ["B", "KB", "MB", "GB"]:
        if abs(num_bytes) < 1024.0:
            return f"{num_bytes:3.1f} {unit}"
        num_bytes /= 1024.0
    return f"{num_bytes:.1f} TB"


def find_video_file(video_id: str) -> Optional[Path]:
    """Finds the stored video file for a given video_id."""
    if not settings.UPLOAD_DIR.exists():
        return None
    for item in settings.UPLOAD_DIR.iterdir():
        if item.is_file() and not item.name.startswith("annotated_"):
            if item.stem == video_id or item.name == video_id:
                return item
    return None


@router.post("/upload", response_model=VideoUploadResponse)
async def upload_video(file: UploadFile = File(...)):
    """
    Accepts match video uploads, validates format and constraints,
    stores the raw footage in backend/uploads, and returns video_id.
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
        message="Video uploaded successfully. Ready for YOLO & ByteTrack computer vision analysis."
    )


@router.post("/{video_id}/analyze", response_model=StartAnalysisResponse)
async def analyze_video(video_id: str, conf: float = 0.25, force: bool = False):
    """
    Triggers asynchronous computer vision detection (Ultralytics YOLO) and
    multi-object tracking (ByteTrack) on the uploaded video file.
    If force=True, forces re-analysis even if a previous completed job exists.
    """
    video_file = find_video_file(video_id)
    if not video_file or not video_file.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video with ID '{video_id}' not found in uploads directory."
        )

    output_filename = f"annotated_{video_id}.mp4"
    output_path = settings.UPLOAD_DIR / output_filename
    analytics_path = settings.UPLOAD_DIR / f"{video_id}_analytics.json"

    # Start background thread execution
    job_info = cv_pipeline_service.start_background_analysis(
        video_id=video_id,
        input_video_path=video_file,
        output_video_path=output_path,
        analytics_path=analytics_path,
        conf_threshold=conf,
        force=force,
    )

    return StartAnalysisResponse(
        video_id=video_id,
        job_id=job_info.get("job_id", f"job_{video_id[:8]}"),
        status=job_info.get("status", "processing"),
        message=job_info.get("message", "Computer vision tracking pipeline started in background."),
        progress=job_info.get("progress", 0),
    )


@router.get("/status/{video_id}", response_model=VideoJobStatus)
async def get_video_processing_status(video_id: str):
    """
    Returns live computer vision processing status, frame progress, and output URLs for a given video.
    """
    job = cv_pipeline_service.job_manager.get_job(video_id, upload_dir=settings.UPLOAD_DIR)
    if job:
        return VideoJobStatus(
            job_id=job.get("job_id", f"job_{video_id[:8]}"),
            video_id=video_id,
            status=job.get("status", "processing"),
            progress=job.get("progress", 0),
            processed_frames=job.get("processed_frames", 0),
            total_frames=job.get("total_frames", 0),
            current_fps=job.get("current_fps"),
            cv_engine="Ultralytics YOLO11n + ByteTrack",
            annotated_video_url=job.get("annotated_video_url"),
            error_message=job.get("error_message"),
            message=job.get("message", "Processing in progress..."),
        )

    # Check if raw video exists
    video_file = find_video_file(video_id)
    if video_file and video_file.exists():
        return VideoJobStatus(
            job_id=f"job_{video_id[:8]}",
            video_id=video_id,
            status="ready_for_analysis",
            progress=0,
            processed_frames=0,
            total_frames=0,
            cv_engine="Ultralytics YOLO11n + ByteTrack",
            message="Video is stored and ready for computer vision analysis.",
        )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Video with ID '{video_id}' not found."
    )


@router.get("/recent", response_model=List[Dict[str, Any]])
async def list_recent_videos():
    """
    Returns list of recently uploaded match videos stored on the server.
    """
    videos = []
    if settings.UPLOAD_DIR.exists():
        for item in settings.UPLOAD_DIR.iterdir():
            if item.is_file() and item.suffix.lower() in settings.ALLOWED_VIDEO_EXTENSIONS and not item.name.startswith("annotated_"):
                stat = item.stat()
                video_id = item.stem
                # Check if annotated version exists (.mp4 preferred, fallback to legacy extension)
                annotated_mp4 = settings.UPLOAD_DIR / f"annotated_{video_id}.mp4"
                annotated_legacy = settings.UPLOAD_DIR / f"annotated_{item.name}"
                annotated_file = annotated_mp4 if annotated_mp4.exists() else annotated_legacy
                analytics_file = settings.UPLOAD_DIR / f"{video_id}_analytics.json"
                is_processed = annotated_file.exists() and analytics_file.exists()

                videos.append({
                    "video_id": video_id,
                    "filename": item.name,
                    "stream_url": f"/uploads/{item.name}",
                    "annotated_stream_url": f"/uploads/{annotated_file.name}" if is_processed else None,
                    "file_size_formatted": format_bytes(stat.st_size),
                    "created_at": datetime.fromtimestamp(stat.st_ctime, tz=timezone.utc).isoformat(),
                    "status": "Analyzed" if is_processed else "Ready for Analysis",
                    "is_analyzed": is_processed,
                })
    # Sort descending by creation date
    videos.sort(key=lambda x: x["created_at"], reverse=True)
    return videos
