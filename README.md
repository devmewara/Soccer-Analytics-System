# AI-Powered Soccer Match Analytics System

An enterprise-grade, computer-vision-ready soccer analytics platform built with **FastAPI** (Python) and **React** (Vite + Tailwind CSS + Chart.js).

Designed for tactical video ingestion, player kinematics, pitch homography calibration, and match intelligence.

---

## Current Status: Phase 1 (Project Foundation)

> **Important Notice Regarding Data & Future Modules:**
> In accordance with Phase 1 design requirements, all match statistics and tactical metrics displayed on the dashboard are **explicitly labeled demo placeholders** for UI and architectural validation. 
> 
> Computer vision inference modules (**Ultralytics YOLOv8**, **ByteTrack**, and **OpenCV Homography**) will be integrated in **Phase 2** upon phase approval.

---

## System Architecture

```text
Soccer-Analytics-System/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application, CORS, and router bindings
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py        # Centralized settings (CORS, file size, paths)
│   │   ├── schemas/             # Pydantic data validation schemas
│   │   │   ├── __init__.py
│   │   │   ├── health.py        # Health check response model
│   │   │   ├── video.py         # Video upload & job status models
│   │   │   └── analytics.py     # Match, player, & team stats models
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   └── cv_pipeline.py   # Modular contract stub for future YOLO/ByteTrack
│   │   └── api/
│   │       ├── __init__.py
│   │       ├── router.py        # API v1 route aggregator
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── health.py    # GET /api/health
│   │           ├── video.py     # POST /api/video/upload, GET /api/video/recent
│   │           └── analytics.py # GET /api/analytics/overview (labeled demo data)
│   ├── uploads/                 # Destination folder for raw match videos
│   ├── requirements.txt         # FastAPI, Uvicorn, Pydantic, Python-multipart
│   └── .env.example             # Server configuration template
│
├── frontend/
│   ├── index.html               # PitchVision AI HTML entry
│   ├── package.json             # React, Vite, Tailwind, Chart.js, Lucide
│   ├── vite.config.js           # Vite server configuration
│   ├── tailwind.config.js       # Dark navy & pitch green theme
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx             # React DOM entry
│       ├── App.jsx              # Main view manager & API poller
│       ├── index.css            # Dark pitch styling & Tailwind directives
│       ├── api/
│       │   └── client.js        # Axios API client with progress monitoring
│       ├── constants/
│       │   └── mockData.js      # Explicitly labeled demo match dataset
│       └── components/
│           ├── common/
│           │   ├── DemoBadge.jsx  # [DEMO DATA] indicator badge
│           │   ├── DemoBanner.jsx # Sticky phase notice banner
│           │   └── StatCard.jsx   # Metrics card component
│           ├── layout/
│           │   ├── Sidebar.jsx    # 5-item navigation with live API health status
│           │   └── Navbar.jsx     # Top status bar & upload trigger
│           ├── dashboard/
│           │   ├── OverviewTab.jsx          # KPI grid, upload, charts, player table
│           │   ├── VideoUploadSection.jsx   # Drag-and-drop video uploader
│           │   └── PossessionChart.jsx      # Chart.js line & bar visualizers
│           └── views/
│               ├── MatchAnalysisView.jsx    # 2D pitch zones & pass networks
│               ├── PlayerTrackingView.jsx   # ByteTrack telemetry & pipeline preview
│               ├── TeamAnalyticsView.jsx    # Formations & tactical shape
│               └── HeatmapsView.jsx         # 2D pitch spatial density visualizer
│
└── README.md
```

---

## Prerequisites

- **Python**: 3.10 or higher (Tested with Python 3.13)
- **Node.js**: v18.0 or higher
- **npm**: v9.0 or higher

---

## Quick Start Guide

### 1. Start the Backend (FastAPI)

Open a terminal and navigate to the `backend` folder:

```bash
cd backend

# Create virtual environment (if not already created)
python3 -m venv venv

# Activate virtual environment
# On macOS / Linux:
source venv/bin/activate
# On Windows (cmd / powershell):
# venv\Scripts\activate

# Install required dependencies
pip install -r requirements.txt

# Start the development server
uvicorn app.main:app --reload --port 8000
```

- **Backend API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Health Check Endpoint**: `http://localhost:8000/api/health`

---

### 2. Start the Frontend (React + Vite)

Open a **separate** terminal window and navigate to the `frontend` folder:

```bash
cd frontend

# Install npm packages
npm install

# Start Vite development server
npm run dev
```

- **Frontend Dashboard**: `http://localhost:5173`

---

## Implemented Features (Phase 1)

1. **Dashboard UI**:
   - Modern dark navy/black sports analytics aesthetic (`#070A0F`, `#0D131F`).
   - Pitch emerald green accents (`#10B981`) and neon glows.
   - Responsive multi-tab sidebar navigation:
     - **Overview**
     - **Match Analysis**
     - **Player Tracking**
     - **Team Analytics**
     - **Heatmaps**

2. **Frontend-Backend Integration**:
   - Live backend health connectivity indicator in Sidebar and Navbar.
   - Real video upload via `POST /api/video/upload` with live percentage progress bar.
   - Uploaded files safely validated (`.mp4`, `.avi`, `.mov`, `.mkv`) and stored in `backend/uploads/`.
   - List of uploaded match footage automatically queried via `GET /api/video/recent`.
   - Dynamic synchronization of demo overview metrics via `GET /api/analytics/overview`.

3. **Data Integrity & Labeling**:
   - Every simulated number is explicitly labeled with `[DEMO DATA]` badges and alert banners.
   - Clear distinction between Phase 1 (foundation) and Phase 2 (computer vision inference).

---

## Upcoming Implementation: Phase 2 (Pending Approval)

- [ ] **Ultralytics YOLOv8**: Real-time object detection for players, goalkeepers, referees, and the ball.
- [ ] **ByteTrack Tracker**: Association algorithm for multi-object identity persistence across video frames.
- [ ] **OpenCV Pitch Homography**: Calibration matrix to convert camera pixel coordinates into metric pitch positions (meters).
- [ ] **Kinematic Engine**: Calculation of authentic instantaneous player speeds ($km/h$), cumulative distances, sprint events, and continuous 2D position heatmaps.
