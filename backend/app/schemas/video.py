from pydantic import BaseModel, Field
from typing import Optional

class VideoUploadResponse(BaseModel):
    video_id: str = Field(..., description="Unique identifier for uploaded video")
    original_filename: str = Field(..., description="Original uploaded filename")
    saved_filename: str = Field(..., description="Server stored filename")
    file_size_bytes: int = Field(..., description="File size in bytes")
    file_size_formatted: str = Field(..., description="Human-readable file size")
    status: str = Field("ready_for_analysis", description="Current pipeline processing status")
    stream_url: Optional[str] = Field(None, description="Static stream/playback URL")
    uploaded_at: str = Field(..., description="Upload timestamp")
    message: str = Field(
        "Video received and securely saved. Processing queue initialized. Computer vision detection (YOLO) will process this in Phase 2."
    )

class VideoJobStatus(BaseModel):
    job_id: str
    video_id: str
    status: str = Field("pending", description="Status: pending | processing | completed | failed")
    progress: int = Field(0, ge=0, le=100, description="Processing percentage (placeholder)")
    cv_engine: str = Field("YOLOv8 + ByteTrack (Future Phase)")
    message: str
