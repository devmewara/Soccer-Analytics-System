# PitchVision AI — AI-Powered Soccer Match Analytics

A computer-vision-powered soccer match analytics platform built with **FastAPI** (Python), **Ultralytics YOLO11**, **ByteTrack**, **OpenCV**, and **React** (Vite + Tailwind CSS + Chart.js).

Designed for football broadcast video ingestion, deep-learning player and ball detection, multi-object tracking, jersey-colour team classification, and verifiable match telemetry.

---

## Key Features & Capabilities

1. **High-Resolution Object Detection (`Ultralytics YOLO11n`)**:
   - Detects **Players & Match Officials (COCO Class 0)** and **Sports Ball (COCO Class 32)** at `imgsz=1280` single-pass inference.
   - Automatically utilizes Apple Silicon **MPS** (Metal Performance Shaders) on macOS M1/M2/M3 for 2.7x faster inference (~12–19 FPS), with automatic fallback to NVIDIA CUDA or CPU.
   - Strict wide-shot ball filtering eliminates false positives from ad boards and white pitch markers.

2. **Tight Pitch-Region Filtering (`OpenCV`)**:
   - Segments green grass in HSV color space (`(32, 35, 35)` to `(85, 215, 220)`), applies morphological opening and closing, and computes a tight polygonal grass contour.
   - Rejects off-pitch spectators, coaching staff, and advertising hoardings by validating player ground-contact points (`x_mid, y_bottom`) inside the active pitch contour.

3. **Multi-Object Tracking & Camera-Cut Handling (`ByteTrack`)**:
   - Soccer-tuned ByteTrack configuration ([backend/app/core/soccer_bytetrack.yaml](backend/app/core/soccer_bytetrack.yaml)) maintains track persistence across sprints and occlusions (`track_buffer: 90`, `match_thresh: 0.85`).
   - Detects broadcast camera cuts via HSV histogram Bhattacharyya distance (`threshold: 0.55`) and clears active/lost tracker state across shot cuts to prevent cross-shot tracklet hopping.
   - Fresh per-job `BYTETracker` instance prevents tracker state leakage between jobs.
   - Isolates transient tracklets (`< 25` frames) from confirmed players.

4. **Jersey-Colour Team Classification (`OpenCV K-Means`)**:
   - Extracts upper-torso pixels (`18%–50%` height, `18%–82%` width) with green-grass HSV masking.
   - Calibrates team kit centroids via K-Means (excluding referees and off-pitch detections).
   - Classifies tracks into **Team A**, **Team B**, **Referee**, or **Unknown** with temporal sliding-window smoothing (`15` frames) to eliminate single-frame classification flicker.

5. **Annotated Video Generation & Fullscreen Playback**:
   - Renders team-colored bounding boxes, track IDs, confidence scores, ball markers, and a top-left telemetry HUD directly onto the output video.
   - Produces browser-native H.264 MP4 (`avc1`) playable in Safari, Chrome, and Edge, with HTTP 206 Partial Content byte-range seeking supported.
   - Supports side-by-side Annotated AI vs. Raw toggling and native Fullscreen playback.

6. **Scientific Integrity**:
   - Distinguishes directly measured telemetry (frames, detections/frame, track durations, camera shots, ball sightings) from derived estimates (K-Means team clusters).
   - Clearly labels "Confirmed Track IDs" alongside directly measured "Average Visible Players / Frame" to transparently reflect 2D tracking across camera cuts.
   - Physical speed (`km/h`) and metric pitch distance (`m`) require 4-point homography calibration and are intentionally not fabricated for uploaded footage.
   - Sample Demo Sandbox data is explicitly isolated and labeled as demo data.

---

## Technology Stack

- **Backend**: Python 3.11 / 3.13, FastAPI, Uvicorn, Pydantic v2
- **Computer Vision**: Ultralytics YOLO11n, ByteTrack, OpenCV (`opencv-python-headless`), NumPy, SciPy, Lapx
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Chart.js, react-chartjs-2, Axios
- **Deployment**: Docker, Vercel (Frontend), Render / Railway (Backend)

---

## System Architecture

```text
Soccer-Analytics-System/
├── backend/
│   ├── Dockerfile               # Production Docker image (Python 3.11 + CPU PyTorch + ffmpeg + pre-cached YOLO11n)
│   ├── .dockerignore
│   ├── .env.example             # Backend environment template
│   ├── requirements.txt         # Python dependencies
│   ├── test_e2e_api.py          # Automated End-to-End API integration test suite
│   ├── test_tracking_quality.py # Continuity, ball detection & video validation audit
│   ├── test_repeatability.py    # Determinism & ID leak repeatability test
│   ├── yolo11n.pt               # Pre-downloaded YOLO11n model weights
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, static /uploads mount
│   │   ├── core/
│   │   │   ├── config.py        # Settings (CORS regex, resolution, device, upload limits)
│   │   │   └── soccer_bytetrack.yaml # High-resolution soccer tracker tuning
│   │   ├── schemas/             # Pydantic models (health, video, analytics)
│   │   ├── services/
│   │   │   └── cv_pipeline.py   # YOLO11 + ByteTrack + Pitch Filter + Team Classifier
│   │   └── api/
│   │       ├── router.py
│   │       └── endpoints/
│   │           ├── health.py    # GET /api/health
│   │           ├── video.py     # POST upload, POST analyze, GET status, GET recent
│   │           └── analytics.py # GET {video_id} (real CV), GET overview (demo)
│   └── uploads/                 # Raw & annotated match videos (gitignored except .gitkeep)
│
├── frontend/
│   ├── vercel.json              # Vercel Vite SPA routing config
│   ├── .env.example             # VITE_API_URL / VITE_SERVER_URL template
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── api/client.js        # Axios client with auto-derived SERVER_BASE_URL
│       ├── constants/mockData.js
│       └── components/
│           ├── home/HomePage.jsx
│           ├── analysis/AnalysisWorkspace.jsx
│           └── views/
│               ├── MatchAnalysisView.jsx
│               ├── PlayerTrackingView.jsx
│               ├── TeamAnalyticsView.jsx
│               └── HeatmapsView.jsx
│
├── render.yaml                  # Render Blueprint for Docker backend deployment
└── README.md
```

---

## Local Development Setup (macOS / Apple Silicon M1/M2/M3)

### Prerequisites
- **Python**: 3.10+ (tested on Python 3.11 and 3.13)
- **Node.js**: 18+ and **npm** 9+
- **macOS M1/M2/M3**: Metal (MPS) is enabled automatically by `YOLO_DEVICE=auto`.

### 1. Start the Backend (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```

- **Backend API Root**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`
- **Health Check Endpoint**: `http://localhost:8000/api/health`

### 2. Start the Frontend (React + Vite)

In a separate terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite local development server
npm run dev
```

- **Frontend Application Dashboard**: `http://localhost:5173`

---

## How to Upload and Analyze a Match Video

1. Open `http://localhost:5173` in your browser.
2. In the **Match Video Ingestion** card on the home screen, click **Select Match Video** or drag and drop a `.mp4` or `.mov` clip (e.g. broadcast footage).
3. Click **Upload & Open Workspace**.
4. In the Analysis Workspace control banner, click **Start AI Video Analysis**.
5. The progress bar tracks real-time frame processing, current inference FPS, and status.
6. Once complete:
   - **Video Analysis Tab**: Watch the annotated H.264 stream with bounding boxes, player track IDs, team colors, ball marker, and telemetry HUD. Click **Annotated AI / Raw** to compare footage. Click **Fullscreen** for presentation display.
   - **Player Tracking Tab**: Inspect confirmed tracking IDs, detection counts, lifespan durations, and bounding coordinates. Toggle **Transient Tracks** to inspect filtered short-lived detections.
   - **Team Analytics Tab**: View the head-to-head squad breakdown, K-Means kit color clustering, and match officials count.
   - **Heatmaps Tab**: Inspect spatial pitch occupancy KDE preview (modeled pending homography).
   - **Demo Sandbox**: Click **Preview in Demo Sandbox** at any time to inspect simulated full 90-minute telemetry without uploading footage.

---

## Running Automated Verification Tests

### 1. Backend End-to-End API Test Suite
Validates health check, demo overview, recent video listings, real analytics payload structure, job status, video streaming with HTTP 206 byte-range seeking, and synthetic video upload:

```bash
PYTHONPATH=backend backend/venv/bin/python backend/test_e2e_api.py
```

### 2. Computer Vision Tracking Quality Audit
Examines track continuity density, beginning/middle/end representative frames, ball detection independence, and annotated video playable stream verification:

```bash
backend/venv/bin/python backend/test_tracking_quality.py
```

### 3. Frontend Production Build
Verifies that the React + Vite application compiles cleanly with zero bundle errors:

```bash
cd frontend && npm run build
```

---

## API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Service info and liveness endpoint |
| `GET` | `/api/health` | Backend and YOLO11 CV readiness check |
| `POST` | `/api/video/upload` | Multipart video upload (`.mp4`, `.mov`, `.avi`, `.mkv`, size-validated) |
| `POST` | `/api/video/{video_id}/analyze?conf=0.25&force=false` | Trigger asynchronous YOLO11 + ByteTrack + Team Clustering pipeline |
| `GET` | `/api/video/status/{video_id}` | Live job progress, frame count, inference FPS, and output URL |
| `GET` | `/api/video/recent` | List uploaded videos and processing status |
| `GET` | `/api/analytics/{video_id}` | Verified computed CV analytics JSON (confirmed tracks, transient tracks, teams, timeline) |
| `GET` | `/api/analytics/overview` | Explicitly labeled sample dataset for Demo Sandbox |
| `GET` | `/uploads/{filename}` | Static video stream for raw and annotated match clips (HTTP 206 range support) |

---

## Known Limitations & Scientific Honesty

1. **Camera Cuts & 2D Tracklet Counts**:
   In broadcast soccer footage, television director cuts switch between wide camera views, close-ups, and replays. Without metric 3D facial/jersey re-identification, a 2D tracker treats players re-entering a new camera shot as new track IDs. PitchVision AI handles this transparently:
   - Detects camera cuts and clears tracking buffers across cuts to prevent ID hopping.
   - Reports both **Confirmed Track IDs** (cumulative persistent tracklets) and directly measured **Average Visible Players / Frame** (simultaneous headcount, e.g. ~21.3 on full pitch views).
2. **Speed & Physical Distance (Homography Calibration)**:
   Estimating physical speed (`km/h`) and metric distance (`meters`) requires establishing a 4-point homography matrix mapping 2D video pixel coordinates onto standard 105m × 68m FIFA pitch coordinates. PitchVision AI does **not** fabricate speeds or distances for uploaded footage; these are marked as *Pending Calibration*.
3. **Single-Worker Process Model**:
   The backend uses `uvicorn --workers 1` to ensure thread-safe in-memory job coordination (`VideoJobManager`) and prevent multi-process PyTorch memory replication.
4. **Cloud Ephemeral Storage**:
   Cloud container platforms (Render, Railway) use ephemeral container filesystems by default. Videos stored in `backend/uploads/` will reset on container restart unless a persistent volume disk is attached.

---

## Cloud Deployment Guide (Vercel + Render / Railway)

Because the backend executes real PyTorch + Ultralytics YOLO11 + OpenCV video inference, the production architecture decouples the static frontend from a containerized Python backend:

- **Frontend**: **Vercel** (Global CDN, free Hobby tier, instant Vite builds)
- **Backend**: **Render (Docker Web Service)** or **Railway (Docker Service)**

### Resource & Storage Requirements
- **RAM**: PyTorch + YOLO11n + OpenCV video processing uses **~1.1–1.5 GB RAM** during active video analysis at `imgsz=1280`. **Render Free (512 MB RAM) will trigger OOM kills**. A minimum of **2 GB RAM** (Render Standard or Railway Hobby/Pro) is required.
- **Model Weights**: `backend/Dockerfile` pre-downloads `yolo11n.pt` into `/app/models/yolo11n.pt` during image build time using CPU-only PyTorch wheels.
- **Browser Video Codec**: `backend/Dockerfile` installs `ffmpeg`. After OpenCV finishes rendering, the pipeline automatically transcodes output videos to browser-compatible H.264 MP4 (`libx264`, `yuv420p`, `+faststart`).
- **Storage**: For persistent clips on Render, uncomment the `disk` block in [render.yaml](render.yaml) (mounts a persistent disk at `/app/uploads`).

### Step 1: Push Repository to GitHub
```bash
git remote add origin https://github.com/<your-username>/Soccer-Analytics-System.git
git push -u origin main
```

### Step 2: Deploy Backend on Render (Docker)
1. Go to [dashboard.render.com](https://dashboard.render.com) → **New +** → **Blueprint** (or Web Service).
2. Connect your GitHub repository.
3. Select **Render Standard (2 GB RAM)** plan.
4. Configure Environment Variables:
   - `DEBUG=False`
   - `YOLO_MODEL_PATH=/app/models/yolo11n.pt`
   - `YOLO_IMGSZ=1280`
   - `YOLO_DEVICE=auto`
   - `UPLOAD_DIR=uploads`
   - `MAX_UPLOAD_SIZE_MB=500`
   - `CORS_ORIGINS=https://<your-vercel-domain>.vercel.app,http://localhost:5173`
   - `CORS_ORIGIN_REGEX=https://.*\.vercel\.app`

### Step 3: Deploy Frontend on Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repository.
2. Set **Root Directory** to `frontend`.
3. Add Environment Variable:
   - `VITE_API_URL=https://<your-backend-domain>/api`
   - *(Optional)* `VITE_SERVER_URL=https://<your-backend-domain>`
4. Click **Deploy**.
