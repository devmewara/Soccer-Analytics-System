# PitchVision AI — AI-Powered Soccer Match Analytics

A computer-vision-powered soccer match analytics platform built with **FastAPI** (Python), **Ultralytics YOLO11**, **ByteTrack**, **OpenCV**, and **React** (Vite + Tailwind CSS + Chart.js).

Designed for football broadcast video ingestion, deep-learning player and ball detection, multi-object tracking, jersey-colour team classification, and verifiable match telemetry.

---

## Implemented Capabilities

1. **Object Detection (`Ultralytics YOLO11n`)**:
   - Detects **Players & Officials (COCO Class 0)** and **Sports Ball (COCO Class 32)**.
   - Filters false positives with aspect-ratio, minimum-size, and ball-geometry heuristics.
2. **Pitch-Region Filtering (`OpenCV`)**:
   - Segments green pitch grass in HSV space, computes a morphologically closed convex pitch hull, and excludes off-pitch spectator / advertising-board detections before tracking and team clustering.
3. **Multi-Object Tracking & Camera-Cut Handling (`ByteTrack`)**:
   - Soccer-tuned ByteTrack configuration ([backend/app/core/soccer_bytetrack.yaml](backend/app/core/soccer_bytetrack.yaml)) maintains track continuity across brief occlusions (`track_buffer: 90`).
   - Detects broadcast camera cuts via HSV histogram Bhattacharyya distance and clears active/lost tracker buffers across shot cuts to prevent cross-shot ID leakage.
   - Resets tracker state cleanly before every video job and isolates short-lived transient tracklets (`< 25` frames) from confirmed tracks.
4. **Jersey-Colour Team Classification (`OpenCV K-Means`)**:
   - Extracts upper-torso pixels (`18%–50%` height, `18%–82%` width) with green-grass HSV masking.
   - Calibrates two team kit centroids via K-Means (excluding referees and off-pitch detections).
   - Classifies tracks into **Team A**, **Team B**, **Referee**, or **Unknown** (ambiguous detections are labeled `Unknown` rather than forced into a team).
5. **Annotated Video Generation & Fullscreen Playback**:
   - Renders team-colored bounding boxes, track IDs, confidence scores, ball markers, and a top-left telemetry HUD directly onto the output video.
   - Transcodes annotated output to browser-native H.264 MP4 when `ffmpeg` is available (built into the production Docker image).
   - Supports side-by-side Annotated AI vs. Raw toggling and native Fullscreen playback.
6. **Scientific Integrity**:
   - Distinguishes directly measured telemetry (frames, detections/frame, track durations, camera shots, ball sightings) from derived estimates (K-Means team clusters).
   - Physical speed (`km/h`) and metric pitch distance (`m`) require 4-point homography calibration and are intentionally not fabricated for uploaded footage.
   - Sample Demo Sandbox data is explicitly isolated and labeled as demo data.

---

## System Architecture

```text
Soccer-Analytics-System/
├── backend/
│   ├── Dockerfile               # Production Docker image (Python 3.11 + CPU PyTorch + ffmpeg + pre-cached YOLO11n)
│   ├── .dockerignore
│   ├── .env.example
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, static /uploads mount
│   │   ├── core/
│   │   │   ├── config.py        # Environment-driven settings (CORS, CORS regex, upload limits, model path)
│   │   │   └── soccer_bytetrack.yaml
│   │   ├── schemas/             # Pydantic response models (health, video, analytics)
│   │   ├── services/
│   │   │   └── cv_pipeline.py   # YOLO11 + ByteTrack + Pitch Filter + Camera Cut + K-Means Team Classifier
│   │   └── api/
│   │       ├── router.py
│   │       └── endpoints/
│   │           ├── health.py    # GET /api/health
│   │           ├── video.py     # POST upload, POST {id}/analyze, GET status/{id}, GET recent
│   │           └── analytics.py # GET {video_id} (real CV metrics), GET overview (demo)
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

## Local Development Setup

### Prerequisites
- **Python**: 3.10+ (tested on 3.11 and 3.13)
- **Node.js**: 18+ and **npm** 9+

### 1. Start the Backend (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- API Root: `http://localhost:8000`
- Swagger Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/health`

### 2. Start the Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

- Dashboard: `http://localhost:5173`

---

## Cloud Deployment Guide (Vercel + Render / Railway)

Because the backend executes real PyTorch + Ultralytics YOLO11 + OpenCV video inference, the recommended production architecture decouples the static frontend from a containerized Python backend:

- **Frontend**: **Vercel** (Global CDN, free tier, instant Vite builds)
- **Backend**: **Render (Docker Web Service)** or **Railway (Docker Service)** — runs independently of your local machine

### Resource & Storage Considerations
- **RAM**: PyTorch + YOLO11n + OpenCV video processing uses **~1.0–1.5 GB RAM** during active video analysis. **Render Free (512 MB RAM) will run out of memory** during inference. Use **Render Standard (2 GB RAM)** or **Railway Hobby/Pro (up to 8 GB RAM)**.
- **Single Worker**: `backend/Dockerfile` intentionally runs `uvicorn ... --workers 1` so in-memory job progress (`VideoJobManager`) stays consistent and PyTorch memory is not duplicated across workers.
- **Model Weights**: `backend/Dockerfile` pre-downloads `yolo11n.pt` into `/app/models/yolo11n.pt` at image build time using CPU-only PyTorch wheels, avoiding multi-GB CUDA downloads and cold-start weight fetches.
- **Browser Video Codec**: `backend/Dockerfile` installs `ffmpeg`. After OpenCV finishes rendering, the pipeline automatically transcodes output videos to browser-compatible H.264 MP4 (`libx264`, `yuv420p`, `+faststart`).
- **Storage**: Cloud container filesystems are ephemeral by default (uploaded/annotated clips clear on redeploy/restart). For persistent clips on Render, uncomment the `disk` block in [render.yaml](render.yaml) (mounts a persistent disk at `/app/uploads`).

### Step 1: Push Repository to GitHub
Create a new GitHub repository (if not already created) and push the `main` branch. `.gitignore` already excludes `venv/`, `node_modules/`, `backend/uploads/*`, `.env*`, and `*.pt` model weights.

```bash
git remote add origin https://github.com/<your-username>/Soccer-Analytics-System.git
git push -u origin main
```

### Step 2: Deploy the Backend on Render (Docker)
Option A — **Using Blueprint (`render.yaml`)**:
1. Go to [dashboard.render.com](https://dashboard.render.com) → **New +** → **Blueprint**.
2. Connect your GitHub repository. Render reads [render.yaml](render.yaml) automatically.
3. Confirm plan (**Standard**, 2 GB RAM recommended for YOLO inference) and click **Apply**.

Option B — **Manual Web Service on Render** (or **Railway**):
1. Create a new **Web Service** from your GitHub repo.
2. Set **Root Directory** to `backend` and **Runtime** to **Docker** (uses `backend/Dockerfile`).
3. Set Health Check Path to `/api/health`.
4. Configure Environment Variables:
   - `DEBUG=False`
   - `YOLO_MODEL_PATH=/app/models/yolo11n.pt`
   - `UPLOAD_DIR=uploads`
   - `MAX_UPLOAD_SIZE_MB=200`
   - `CORS_ORIGINS=https://<your-vercel-domain>.vercel.app,http://localhost:5173`
   - `CORS_ORIGIN_REGEX=https://.*\.vercel\.app`
5. Wait for the Docker build to finish and verify `GET https://<your-backend-domain>/api/health` returns `"status": "healthy"`.

### Step 3: Deploy the Frontend on Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repository.
2. Set **Root Directory** to `frontend` (Vercel automatically detects Vite and reads `frontend/vercel.json`).
3. Add Environment Variable:
   - `VITE_API_URL=https://<your-backend-domain>/api`
   - *(Optional)* `VITE_SERVER_URL=https://<your-backend-domain>` (automatically derived from `VITE_API_URL` if omitted)
4. Click **Deploy**.
5. Copy your final Vercel URL (e.g. `https://pitchvision-ai.vercel.app`) and update `CORS_ORIGINS` on Render/Railway if you are not using `CORS_ORIGIN_REGEX`.

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
| `GET` | `/uploads/{filename}` | Static video stream for raw and annotated match clips |
