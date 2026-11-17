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
        "Video received and securely saved. Ready for YOLO & ByteTrack computer vision analysis."
    )

class VideoJobStatus(BaseModel):
    job_id: str
    video_id: str
    status: str = Field("pending", description="Status: queued | processing | completed | failed | ready_for_analysis")
    progress: int = Field(0, ge=0, le=100, description="Processing percentage (0-100)")
    processed_frames: int = Field(0, description="Number of frames processed so far")
    total_frames: int = Field(0, description="Total frames in video")
    current_fps: Optional[float] = Field(None, description="Current inference frame rate")
    cv_engine: str = Field("Ultralytics YOLO11n + ByteTrack", description="Active CV/tracking engine")
    annotated_video_url: Optional[str] = Field(None, description="URL path to annotated output video")
    error_message: Optional[str] = Field(None, description="Error explanation if status is failed")
    message: str

class StartAnalysisResponse(BaseModel):
    video_id: str
    job_id: str
    status: str
    message: str
    progress: int = 0
