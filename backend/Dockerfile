# Production Docker image for PitchVision AI FastAPI + YOLO11 + ByteTrack Backend
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    YOLO_CONFIG_DIR=/tmp/ultralytics \
    YOLO_MODEL_PATH=/app/models/yolo11n.pt \
    HOST=0.0.0.0 \
    PORT=8000 \
    DEBUG=False

WORKDIR /app

# Install minimal system dependencies for OpenCV headless and H.264 web video transcoding
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install CPU-only PyTorch wheels first to avoid multi-GB CUDA downloads in cloud containers
RUN pip install --upgrade pip && \
    pip install --index-url https://download.pytorch.org/whl/cpu torch torchvision

# Install remaining backend and CV dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy backend source code
COPY app ./app
RUN mkdir -p /app/uploads /app/models

# Pre-download YOLO11n weights during build so container startup is fast and deterministic
RUN python -c "from ultralytics import YOLO; YOLO('/app/models/yolo11n.pt')"

EXPOSE 8000

# Single worker is intentional: keeps in-memory VideoJobManager state consistent and
# avoids multiplying PyTorch memory footprint across processes.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
