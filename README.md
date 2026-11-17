# PitchVision AI — AI-Powered Soccer Match Analytics

An enterprise-grade, computer-vision-powered soccer analytics platform built with **FastAPI** (Python), **Ultralytics YOLO11**, **ByteTrack**, and **React** (Vite + Tailwind CSS + Chart.js).

Designed for tactical football video ingestion, deep-learning player and ball detection, multi-object tracking, and verifiable match telemetry.

---

## Current Status: Phase 2 Active (Real Computer Vision & Tracking)

The system now runs authentic computer vision and multi-object tracking:

1. **Object Detection**: Pretrained **Ultralytics YOLO11n** detects:
   - **Person (COCO Class 0)**: Soccer players, officials, goalkeepers
   - **Sports Ball (COCO Class 32)**: Match football
2. **Multi-Object Tracking (MOT)**: **ByteTrack** (`tracker="bytetrack.yaml"`) maintains persistent tracklet identities (`Player #1`, `Player #2`, etc.) across consecutive video frames using Kalman filter motion prediction and Hungarian bipartite matching.
3. **OpenCV Video Annotation**: Writes tactical bounding boxes, track IDs, confidence ratings, and a broadcast-style telemetry HUD directly onto the video frames.
4. **Authentic Metric Engine**: Calculates verified detection counts, player visibility durations, ball presence coverage, and inference FPS, persisting results to JSON.
5. **Scientific Integrity**: Speed in $km/h$ and physical distance in meters require 4-point homography perspective calibration (camera pixel coordinates $\to$ 105m × 68m FIFA pitch dimensions). In accordance with engineering standards, uncalibrated speed metrics are **not** fabricated.

---

## System Architecture

```text
Soccer-Analytics-System/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app, CORS, static uploads mount
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py        # Centralized settings (CORS, file size, paths)
│   │   ├── schemas/             # Pydantic data validation schemas
│   │   │   ├── __init__.py
│   │   │   ├── health.py        # HealthCheckResponse model
│   │   │   ├── video.py         # VideoUploadResponse, VideoJobStatus, StartAnalysisResponse
│   │   │   └── analytics.py     # RealVideoAnalyticsResponse, OverviewStatsResponse
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   └── cv_pipeline.py   # Ultralytics YOLO11n + ByteTrack CV pipeline & JobManager
│   │   └── api/
│   │       ├── __init__.py
│   │       ├── router.py        # API v1 route aggregator
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── health.py    # GET /api/health (CV readiness check)
│   │           ├── video.py     # POST upload, POST {id}/analyze, GET status/{id}, GET recent
│   │           └── analytics.py # GET {video_id} (real CV metrics), GET overview (demo)
│   ├── uploads/                 # Storage for raw match footage and annotated videos
│   ├── requirements.txt         # FastAPI, Ultralytics, OpenCV, NumPy, Pandas, Scipy, Lapx
│   └── .env.example             # Server configuration template
│
├── frontend/
│   ├── index.html               # PitchVision AI HTML entry
│   ├── package.json             # React 18, Vite, Tailwind CSS, Chart.js, Lucide
│   ├── vite.config.js           # Vite server & build configuration
│   ├── tailwind.config.js       # Sports technology dark theme palette
│   └── src/
│       ├── main.jsx             # React DOM entry
│       ├── App.jsx              # Application router & toast notification manager
│       ├── api/
│       │   └── client.js        # Axios API client (uploads, analyze, polling, streams)
│       ├── constants/
│       │   └── mockData.js      # Explicitly labeled demo sandbox dataset
│       └── components/
│           ├── common/
│           │   ├── DemoBadge.jsx     # [DEMO SANDBOX] badge
│           │   ├── DemoBanner.jsx    # Disclaimer banner
│           │   └── PitchCanvas.jsx   # Interactive 2D FIFA football pitch (105m × 68m)
│           ├── layout/
│           │   └── Navbar.jsx        # Horizontal top navigation & backend health status
│           ├── home/
│           │   └── HomePage.jsx      # Upload-first hero console & recent match files
│           ├── analysis/
│           │   └── AnalysisWorkspace.jsx # AI inference control banner, progress bar, & tabs
│           └── views/
│               ├── MatchAnalysisView.jsx # Split/video player with annotated vs raw toggle
│               ├── PlayerTrackingView.jsx# ByteTrack player roster & real frame telemetry
│               ├── TeamAnalyticsView.jsx # Formations & tactical shape (Pending clustering)
│               └── HeatmapsView.jsx      # 2D pitch spatial density (Pending homography)
│
└── README.md
```

---

## Prerequisites

- **Python**: 3.10 or higher (Tested on Python 3.13 macOS Apple Silicon arm64)
- **Node.js**: v18.0 or higher (Tested on Node v26)
- **npm**: v9.0 or higher

---

## Quick Start Guide

### 1. Start the Backend (FastAPI + YOLO + ByteTrack)

Open a terminal and navigate to the `backend` directory:

```bash
cd backend

# Create virtual environment (if not already created)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate
# On Windows: venv\Scripts\activate

# Install dependencies (FastAPI, Ultralytics, OpenCV, NumPy, Pandas, Scipy, Lapx)
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```

- **Backend API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Health Check Endpoint**: `http://localhost:8000/api/health`

---

### 2. Start the Frontend (React + Vite)

Open a **separate** terminal window and navigate to the `frontend` directory:

```bash
cd frontend

# Install npm packages
npm install

# Start Vite development server
npm run dev
```

- **Frontend Dashboard**: `http://localhost:5173`

---

## Complete Video Analysis Workflow

1. **Upload Match Video**:
   - Open `http://localhost:5173`.
   - Drag and drop a football match clip (`.mp4`, `.avi`, `.mov`, `.mkv` up to 500MB) onto the upload console.
   - The video is streamed to `backend/uploads/` and opens in the **Analysis Workspace**.
2. **Start AI Analysis**:
   - In the **Analysis Workspace**, click **"Start AI Video Analysis"**.
   - The backend runs Ultralytics YOLO11n + ByteTrack in an asynchronous daemon worker.
   - Live progress, current frame index (`Frame 45/180`), and inference FPS are displayed in real time.
3. **Inspect Annotated Video & Telemetry**:
   - **Video Analysis Tab**: Toggle between **"Annotated AI"** (with YOLO boxes and ByteTrack IDs) and **"Raw Footage"**. Inspect real telemetry cards (Unique Players Tracked, Ball Sightings, Avg Players/Frame, Inference Speed).
   - **Player Tracking Tab**: Select individual tracked players (`Player #1`, `Player #2`, etc.) to view active frame spans, visibility duration, and bounding box coordinates.
   - **Match Overview Tab**: View comprehensive detection summary metrics.
4. **Explore Demo Sandbox**:
   - Click **"Launch Demo Showcase"** to preview full 22-player modeled telemetry, speed profiles, and 2D tactical pitch boards.

---

## API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend and CV pipeline readiness check (`yolo11n.pt`) |
| `POST` | `/api/video/upload` | Multipart video upload with extension and size validation |
| `POST` | `/api/video/{video_id}/analyze` | Trigger asynchronous YOLO + ByteTrack background processing |
| `GET` | `/api/video/status/{video_id}` | Live job status, progress percentage, frame counter, and FPS |
| `GET` | `/api/video/recent` | List of uploaded match recordings stored on disk |
| `GET` | `/api/analytics/{video_id}` | Authentic computed computer vision metrics in JSON format |
| `GET` | `/api/analytics/overview` | Synthesized match dataset for the demo sandbox |
| `GET` | `/uploads/{filename}` | Direct static streaming route for uploaded and annotated videos |
