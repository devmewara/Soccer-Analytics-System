"""
PitchVision AI - Real Computer Vision Pipeline Service

This module implements the production computer vision and tracking engine:
  1. Object Detection: Ultralytics YOLO (yolo11n.pt / yolov8n.pt) on COCO classes:
     - Person (Class ID 0) -> Soccer players, officials, goalkeepers
     - Sports ball (Class ID 32) -> Match football
  2. Multi-Object Tracking: ByteTrack via Ultralytics (tracker='bytetrack.yaml')
     Assigns persistent tracking IDs across consecutive frames.
  3. Video Annotation: OpenCV writes annotated frames with clean tactical bounding
     boxes, tracking IDs, confidence scores, and broadcast telemetry HUD.
  4. Real Analytics Computation: Computes frame counts, player presence duration,
     detection frequencies, and saves verifiable JSON metrics.
"""

import os
import time
import json
import yaml
import shutil
import logging
import subprocess
import threading
from types import SimpleNamespace
from pathlib import Path
from typing import Dict, Any, Optional, List
from collections import Counter

import cv2
import numpy as np

from app.core.config import settings

logger = logging.getLogger("pitchvision.cv_pipeline")
logging.basicConfig(level=logging.INFO)

# Path to tuned ByteTrack configuration for soccer analytics
TRACKER_CONFIG_PATH = Path(__file__).parent.parent / "core" / "soccer_bytetrack.yaml"


class VideoJobManager:
    """Thread-safe manager for tracking video CV processing jobs."""

    def __init__(self):
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def set_job(self, video_id: str, data: Dict[str, Any]):
        with self._lock:
            self._jobs[video_id] = data

    def update_job(self, video_id: str, **kwargs):
        with self._lock:
            if video_id in self._jobs:
                self._jobs[video_id].update(kwargs)
            else:
                self._jobs[video_id] = kwargs

    def get_job(self, video_id: str, upload_dir: Optional[Path] = None) -> Optional[Dict[str, Any]]:
        with self._lock:
            job = self._jobs.get(video_id)
            if job:
                return dict(job)

        # Check if completed artifacts already exist on disk
        if upload_dir:
            analytics_file = upload_dir / f"{video_id}_analytics.json"
            if analytics_file.exists():
                try:
                    with open(analytics_file, "r") as f:
                        data = json.load(f)
                    summary = data.get("summary_metrics", {})
                    meta = data.get("video_metadata", {})
                    restored_job = {
                        "job_id": f"job_{video_id[:8]}",
                        "video_id": video_id,
                        "status": "completed",
                        "progress": 100,
                        "processed_frames": summary.get("total_frames_analyzed", 0),
                        "total_frames": summary.get("total_frames_analyzed", 0),
                        "current_fps": summary.get("avg_inference_fps", 0.0),
                        "annotated_video_url": meta.get("stream_url"),
                        "error_message": None,
                        "message": "Analysis completed successfully.",
                    }
                    with self._lock:
                        self._jobs[video_id] = restored_job
                    return restored_job
                except Exception as e:
                    logger.warning(f"Failed to read existing analytics file for {video_id}: {e}")

        return None


class ComputerVisionPipelineService:
    """Production service for YOLO detection, ByteTrack tracking, and video processing."""

    PERSON_CLASS_ID = 0
    BALL_CLASS_ID = 32

    # Tactical color palette (BGR format for OpenCV)
    COLOR_TEAM_A_BOX = (248, 189, 56)       # Sky Blue #38BDF8
    COLOR_TEAM_A_LABEL_BG = (248, 189, 56)
    COLOR_TEAM_A_TEXT = (0, 0, 0)
    HEX_TEAM_A = "#38BDF8"

    COLOR_TEAM_B_BOX = (94, 63, 244)        # Rose / Coral #F43F5E
    COLOR_TEAM_B_LABEL_BG = (94, 63, 244)
    COLOR_TEAM_B_TEXT = (255, 255, 255)
    HEX_TEAM_B = "#F43F5E"

    COLOR_OFFICIAL_BOX = (21, 204, 250)     # Amber / Yellow #FACC15
    COLOR_OFFICIAL_LABEL_BG = (21, 204, 250)
    COLOR_OFFICIAL_TEXT = (0, 0, 0)
    HEX_OFFICIAL = "#FACC15"

    COLOR_UNKNOWN_BOX = (184, 163, 148)     # Slate #94A3B8
    COLOR_UNKNOWN_LABEL_BG = (184, 163, 148)
    COLOR_UNKNOWN_TEXT = (0, 0, 0)
    HEX_UNKNOWN = "#94A3B8"

    COLOR_PLAYER_BOX = (129, 185, 16)       # Fallback Emerald/Teal #10B981
    COLOR_PLAYER_TEXT = (0, 0, 0)           # Black text
    COLOR_PLAYER_LABEL_BG = (129, 185, 16)  # Emerald background
    COLOR_BALL_BOX = (0, 215, 255)          # Bright Amber #FFD700
    COLOR_BALL_TEXT = (0, 0, 0)
    COLOR_HUD_BG = (16, 23, 34)             # Dark Navy #101722
    COLOR_HUD_BORDER = (68, 50, 37)         # Slate border
    COLOR_HUD_TEXT = (240, 245, 250)        # Clean White

    def __init__(self, model_weights: str = "yolo11n.pt", imgsz: int = 1280, device: str = "auto"):
        self.model_weights = model_weights
        self.imgsz = imgsz
        self.device_pref = device
        self._model = None
        self._model_lock = threading.Lock()
        self._inference_lock = threading.Lock()
        self.job_manager = VideoJobManager()

    def _resolve_inference_device(self) -> str:
        """Selects best available inference device (CUDA -> Apple Silicon MPS -> CPU) safely."""
        pref = (self.device_pref or "auto").strip().lower()
        if pref in ("cpu", "cuda", "mps"):
            return pref
        try:
            import torch
            if torch.cuda.is_available():
                return "cuda"
            if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                return "mps"
        except Exception as err:
            logger.warning(f"Device auto-detection fallback to CPU: {err}")
        return "cpu"

    def _predict_safe(self, model, frame: np.ndarray, classes: List[int], conf: float, imgsz: int, device: str):
        """Runs YOLO prediction with automatic CPU fallback if MPS/GPU throws a runtime error."""
        try:
            res = model.predict(
                source=frame,
                classes=classes,
                conf=conf,
                imgsz=imgsz,
                device=device,
                verbose=False,
            )[0]
            return res, device
        except Exception as err:
            if device != "cpu":
                logger.warning(f"Inference failed on device='{device}' ({err}); falling back safely to CPU.")
                res = model.predict(
                    source=frame,
                    classes=classes,
                    conf=conf,
                    imgsz=imgsz,
                    device="cpu",
                    verbose=False,
                )[0]
                return res, "cpu"
            raise

    def _create_tracker(self):
        """Instantiates an isolated per-job BYTETracker from soccer_bytetrack.yaml."""
        from ultralytics.trackers.byte_tracker import BYTETracker

        default_cfg = {
            "tracker_type": "bytetrack",
            "track_high_thresh": 0.30,
            "track_low_thresh": 0.10,
            "new_track_thresh": 0.40,
            "track_buffer": 90,
            "match_thresh": 0.85,
            "fuse_score": True,
        }
        if TRACKER_CONFIG_PATH.exists():
            try:
                with open(TRACKER_CONFIG_PATH, "r") as f:
                    loaded = yaml.safe_load(f) or {}
                default_cfg.update(loaded)
            except Exception as err:
                logger.warning(f"Could not load {TRACKER_CONFIG_PATH}: {err}; using defaults.")
        return BYTETracker(args=SimpleNamespace(**default_cfg))

    def _get_model(self):
        """Thread-safe lazy loader for Ultralytics YOLO model."""
        if self._model is None:
            with self._model_lock:
                if self._model is None:
                    from ultralytics import YOLO
                    try:
                        weights_path = self.model_weights
                        if not Path(weights_path).exists() and (settings.BASE_DIR / weights_path).exists():
                            weights_path = str(settings.BASE_DIR / weights_path)
                        logger.info(f"Loading YOLO model with weights: {weights_path}")
                        self._model = YOLO(weights_path)
                    except Exception as err:
                        logger.warning(f"Failed to load {self.model_weights}: {err}. Falling back to yolov8n.pt")
                        self._model = YOLO("yolov8n.pt")
        return self._model

    def check_readiness(self) -> Dict[str, Any]:
        """Returns readiness status of the computer vision stack."""
        try:
            model = self._get_model()
            return {
                "cv_initialized": True,
                "yolo_detection": f"Ready ({model.model_name})",
                "bytetrack_tracking": "Ready (ByteTrack yaml)",
                "ready_for_inference": True,
                "supported_classes": {
                    "person": self.PERSON_CLASS_ID,
                    "sports_ball": self.BALL_CLASS_ID,
                },
            }
        except Exception as err:
            return {
                "cv_initialized": False,
                "error": str(err),
                "ready_for_inference": False,
            }

    def start_background_analysis(
        self,
        video_id: str,
        input_video_path: Path,
        output_video_path: Path,
        analytics_path: Path,
        conf_threshold: float = 0.25,
        force: bool = False,
    ) -> Dict[str, Any]:
        """
        Launches video tracking pipeline in a separate background daemon thread.
        Returns immediate confirmation and job token.
        If force=True, ignores any previously cached completed jobs and re-runs.
        """
        existing_job = self.job_manager.get_job(video_id, upload_dir=input_video_path.parent)
        if existing_job and existing_job.get("status") in ("queued", "processing"):
            return existing_job

        if not force and existing_job and existing_job.get("status") == "completed" and output_video_path.exists():
            return existing_job

        # Initialize job in manager
        initial_job = {
            "job_id": f"job_{video_id[:8]}",
            "video_id": video_id,
            "status": "queued",
            "progress": 0,
            "processed_frames": 0,
            "total_frames": 0,
            "current_fps": 0.0,
            "annotated_video_url": None,
            "error_message": None,
            "message": "Video queued for YOLO object detection and ByteTrack tracking.",
        }
        self.job_manager.set_job(video_id, initial_job)

        thread = threading.Thread(
            target=self._process_video_worker,
            args=(video_id, input_video_path, output_video_path, analytics_path, conf_threshold),
            daemon=True,
            name=f"CVWorker-{video_id[:8]}",
        )
        thread.start()

        return initial_job

    def _extract_pitch_contour(self, frame: np.ndarray) -> tuple[Optional[np.ndarray], float]:
        """
        Extracts the actual playing-field grass contour in HSV color space (without convexHull
        inflation). Runs at 4x downscale for fast M1 execution, strips neon broadcast logos
        (e.g. FIFA+) via saturation/value caps + morphological opening, and closes pitch lines.
        Returns (contour_float32, pitch_area_ratio).
        """
        h, w = frame.shape[:2]
        sw, sh = max(1, w // 4), max(1, h // 4)
        small = cv2.resize(frame, (sw, sh))
        hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
        # Natural pitch grass range (excludes hyper-saturated neon broadcast graphics)
        grass_mask = cv2.inRange(hsv, (32, 35, 35), (85, 215, 220))
        # Morphological opening removes isolated green logos/banners before closing pitch lines
        opened = cv2.morphologyEx(
            grass_mask,
            cv2.MORPH_OPEN,
            cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7)),
        )
        closed = cv2.morphologyEx(
            opened,
            cv2.MORPH_CLOSE,
            cv2.getStructuringElement(cv2.MORPH_RECT, (25, 25)),
        )
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return None, 0.0
        pitch_contour = max(contours, key=cv2.contourArea)
        area_ratio = cv2.contourArea(pitch_contour) / float(sw * sh)
        if area_ratio < 0.15:
            return None, area_ratio
        eps = 0.003 * cv2.arcLength(pitch_contour, True)
        approx = cv2.approxPolyDP(pitch_contour, eps, True)
        scaled = (approx * 4).astype(np.float32)
        return scaled, area_ratio

    def _is_on_pitch_person(
        self,
        frame: np.ndarray,
        x1: int,
        y1: int,
        x2: int,
        y2: int,
        pitch_contour: Optional[np.ndarray],
        pitch_area_ratio: float,
    ) -> bool:
        """
        Validates whether a detected person's ground contact point (feet) lies inside
        the actual playing field, rejecting upper stands, ad-board stewards, and
        foreground sideline personnel (e.g. truncated bottom-border dugout/crowd figures).
        """
        if pitch_contour is None or pitch_area_ratio < 0.25:
            # Close-up / zoom camera shot where players dominate frame
            return True

        height, width = frame.shape[:2]
        cx = float((x1 + x2) / 2.0)
        feet = (cx, float(y2))
        dist = cv2.pointPolygonTest(pitch_contour, feet, True)

        # Measure local natural grass around feet (20x30 px patch)
        fy1, fy2 = max(0, y2 - 10), min(height, y2 + 10)
        fx1, fx2 = max(0, int(cx) - 15), min(width, int(cx) + 15)
        feet_patch = frame[fy1:fy2, fx1:fx2]
        feet_grass = 0.0
        if feet_patch.size > 0:
            fp_hsv = cv2.cvtColor(feet_patch, cv2.COLOR_BGR2HSV)
            fp_grass = cv2.inRange(fp_hsv, (32, 35, 35), (85, 220, 225))
            feet_grass = float(np.count_nonzero(fp_grass)) / float(fp_grass.size)

        # Allow genuine players right at left/right broadcast frame edges
        if x1 <= 8 or x2 >= width - 8:
            return dist >= -5.0 and feet_grass >= 0.30

        # Standard wide-angle pitch requirement: strictly inside grass boundary with grass at feet
        return dist >= 15.0 and feet_grass >= 0.15

    def _team_style(self, team_name: str) -> tuple[tuple, tuple, tuple, str]:
        """Returns (box_color, label_bg, text_color, hex_color) for a team label."""
        if team_name == "Team A":
            return self.COLOR_TEAM_A_BOX, self.COLOR_TEAM_A_LABEL_BG, self.COLOR_TEAM_A_TEXT, self.HEX_TEAM_A
        if team_name == "Team B":
            return self.COLOR_TEAM_B_BOX, self.COLOR_TEAM_B_LABEL_BG, self.COLOR_TEAM_B_TEXT, self.HEX_TEAM_B
        if team_name == "Referee":
            return self.COLOR_OFFICIAL_BOX, self.COLOR_OFFICIAL_LABEL_BG, self.COLOR_OFFICIAL_TEXT, self.HEX_OFFICIAL
        return self.COLOR_UNKNOWN_BOX, self.COLOR_UNKNOWN_LABEL_BG, self.COLOR_UNKNOWN_TEXT, self.HEX_UNKNOWN

    def _smooth_team_label(self, votes: List[str], window: int = 15) -> str:
        """
        Temporally smooths per-frame overlay team labels over the recent sliding window
        to eliminate 1-2 frame occlusion flickers without hiding genuinely Unknown tracks.
        """
        if not votes:
            return "Unknown"
        recent = votes[-window:]
        confident = [v for v in recent if v in ("Team A", "Team B", "Referee")]
        if len(confident) >= 3:
            top_team, top_cnt = Counter(confident).most_common(1)[0]
            if (top_cnt / len(confident)) >= 0.55:
                return top_team
        return Counter(recent).most_common(1)[0][0]

    def _extract_torso_color(self, frame: np.ndarray, x1: int, y1: int, x2: int, y2: int) -> Optional[np.ndarray]:
        """Extracts median BGR color from the upper torso of a player, masking out pitch grass."""
        w = x2 - x1
        h = y2 - y1
        if h <= 0 or w <= 0:
            return None

        # Torso crop: 18% to 50% of box height, 18% to 82% of box width
        ty1 = max(0, y1 + int(h * 0.18))
        ty2 = min(frame.shape[0], y1 + int(h * 0.50))
        tx1 = max(0, x1 + int(w * 0.18))
        tx2 = min(frame.shape[1], x2 - int(w * 0.18))

        if ty2 <= ty1 or tx2 <= tx1:
            return None

        torso = frame[ty1:ty2, tx1:tx2]
        if torso.size == 0:
            return None

        # Filter out green pitch grass in HSV space
        hsv = cv2.cvtColor(torso, cv2.COLOR_BGR2HSV)
        grass_mask = cv2.inRange(hsv, (35, 30, 30), (85, 255, 255))
        non_grass = torso[grass_mask == 0]

        if len(non_grass) < 15:
            non_grass = torso.reshape(-1, 3)

        return np.median(non_grass, axis=0).astype(np.float32)

    def _calibrate_team_clusters(
        self,
        cap: cv2.VideoCapture,
        total_frames: int,
        model,
        device: str = "cpu",
    ) -> tuple[np.ndarray, np.ndarray, str, str, str]:
        """Pre-samples frames across video to calibrate Team A and Team B jersey color clusters using K-Means, excluding referees and off-pitch personnel."""
        sample_indices = np.linspace(
            max(1, int(total_frames * 0.05)),
            max(1, int(total_frames * 0.95)),
            12,
            dtype=int
        )
        jersey_samples = []
        current_pos = cap.get(cv2.CAP_PROP_POS_FRAMES)
        active_device = device

        for sf in sample_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, sf)
            ret, frame = cap.read()
            if not ret or frame is None:
                continue

            pitch_contour, pitch_area_ratio = self._extract_pitch_contour(frame)

            res, active_device = self._predict_safe(
                model,
                frame,
                classes=[self.PERSON_CLASS_ID],
                conf=0.35,
                imgsz=self.imgsz,
                device=active_device,
            )
            boxes = res.boxes
            if boxes is not None:
                xyxy = boxes.xyxy.cpu().numpy().astype(int)
                for box in xyxy:
                    x1, y1, x2, y2 = box
                    w = x2 - x1
                    h = y2 - y1
                    if h <= 0 or (w / h) > 1.15 or h < 32:
                        continue

                    # Strictly require on-pitch players (excludes stands, stewards, & sideline staff)
                    if not self._is_on_pitch_person(frame, x1, y1, x2, y2, pitch_contour, pitch_area_ratio):
                        continue

                    color = self._extract_torso_color(frame, x1, y1, x2, y2)
                    if color is not None:
                        # Exclude referee uniforms (high-saturation red / neon yellow) from team clustering
                        pix_hsv = cv2.cvtColor(np.uint8([[color.astype(np.uint8)]]), cv2.COLOR_BGR2HSV)[0][0]
                        ph, ps, pv = int(pix_hsv[0]), int(pix_hsv[1]), int(pix_hsv[2])
                        if ((ph < 15 or ph > 165) or (25 <= ph <= 40)) and ps > 95 and pv > 80:
                            continue

                        jersey_samples.append(color)

        # Restore position
        cap.set(cv2.CAP_PROP_POS_FRAMES, current_pos)

        if len(jersey_samples) >= 10:
            data = np.array(jersey_samples, dtype=np.float32)
            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.2)
            _, labels, centers = cv2.kmeans(data, 2, None, criteria, 10, cv2.KMEANS_PP_CENTERS)
            c0 = centers[0]
            c1 = centers[1]

            # Sort deterministically: darker kit is Team A, lighter kit is Team B
            lum0 = 0.299 * c0[2] + 0.587 * c0[1] + 0.114 * c0[0]
            lum1 = 0.299 * c1[2] + 0.587 * c1[1] + 0.114 * c1[0]
            c_team_a = c0 if lum0 <= lum1 else c1
            c_team_b = c1 if lum0 <= lum1 else c0

            c_a_rgb = c_team_a[::-1].astype(int)
            c_b_rgb = c_team_b[::-1].astype(int)
            c_a_hex = f"#{c_a_rgb[0]:02x}{c_a_rgb[1]:02x}{c_a_rgb[2]:02x}"
            c_b_hex = f"#{c_b_rgb[0]:02x}{c_b_rgb[1]:02x}{c_b_rgb[2]:02x}"
            logger.info(
                f"Calibrated Team Clusters (device={active_device}, imgsz={self.imgsz}, "
                f"samples={len(jersey_samples)}): Team A RGB={c_a_rgb.tolist()}, Team B RGB={c_b_rgb.tolist()}"
            )
            return c_team_a, c_team_b, c_a_hex, c_b_hex, active_device
        else:
            logger.warning("Insufficient jersey samples for K-Means calibration; using defaults.")
            c0 = np.array([60, 50, 45], dtype=np.float32)
            c1 = np.array([200, 190, 180], dtype=np.float32)
            return c0, c1, "#2D3748", "#E2E8F0", active_device

    def _classify_player_team(
        self,
        bgr_color: Optional[np.ndarray],
        centroid_a: np.ndarray,
        centroid_b: np.ndarray,
    ) -> tuple[str, tuple, tuple, tuple, str]:
        """
        Classifies a player's jersey into Team A, Team B, Referee, or Unknown.
        Avoids forcing ambiguous detections or outliers into Team A or Team B.
        """
        if bgr_color is None:
            return "Unknown", self.COLOR_UNKNOWN_BOX, self.COLOR_UNKNOWN_LABEL_BG, self.COLOR_UNKNOWN_TEXT, self.HEX_UNKNOWN

        hsv = cv2.cvtColor(np.uint8([[bgr_color.astype(np.uint8)]]), cv2.COLOR_BGR2HSV)[0][0]
        h, s, v = int(hsv[0]), int(hsv[1]), int(hsv[2])

        d0 = np.linalg.norm(bgr_color - centroid_a)
        d1 = np.linalg.norm(bgr_color - centroid_b)

        # 1. High saturation red or neon yellow with distance from both team centroids = Referee
        if (((h < 15 or h > 165) or (25 <= h <= 40)) and s > 95 and v > 80 and d0 > 60 and d1 > 60):
            return "Referee", self.COLOR_OFFICIAL_BOX, self.COLOR_OFFICIAL_LABEL_BG, self.COLOR_OFFICIAL_TEXT, self.HEX_OFFICIAL

        # 2. Confident Team A match
        if d0 <= 65 and (d1 - d0) >= 35:
            return "Team A", self.COLOR_TEAM_A_BOX, self.COLOR_TEAM_A_LABEL_BG, self.COLOR_TEAM_A_TEXT, self.HEX_TEAM_A

        # 3. Confident Team B match
        if d1 <= 65 and (d0 - d1) >= 35:
            return "Team B", self.COLOR_TEAM_B_BOX, self.COLOR_TEAM_B_LABEL_BG, self.COLOR_TEAM_B_TEXT, self.HEX_TEAM_B

        # 4. Uncertain / ambiguous / non-referee outlier = Unknown
        return "Unknown", self.COLOR_UNKNOWN_BOX, self.COLOR_UNKNOWN_LABEL_BG, self.COLOR_UNKNOWN_TEXT, self.HEX_UNKNOWN

    def _process_video_worker(
        self,
        video_id: str,
        input_path: Path,
        output_path: Path,
        analytics_path: Path,
        conf_threshold: float = 0.25,
    ):
        """Worker thread executing sequential video frame inference."""
        logger.info(f"Starting CV inference worker for video {video_id} ({input_path.name})")

        # Serialize video inference jobs with thread lock to ensure thread safety,
        # clean tracker state resetting, and deterministic multi-object tracking.
        with self._inference_lock:
            self._process_video_core(video_id, input_path, output_path, analytics_path, conf_threshold)

    def _process_video_core(
        self,
        video_id: str,
        input_path: Path,
        output_path: Path,
        analytics_path: Path,
        conf_threshold: float = 0.25,
    ):
        start_time = time.time()

        if not input_path.exists():
            self.job_manager.update_job(
                video_id,
                status="failed",
                error_message=f"Input video file not found at {input_path}",
                message="Video file not found.",
            )
            return

        cap = cv2.VideoCapture(str(input_path))
        if not cap.isOpened():
            self.job_manager.update_job(
                video_id,
                status="failed",
                error_message=f"OpenCV could not open video stream from {input_path}",
                message="Unable to decode video format.",
            )
            return

        try:
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

            if width <= 0 or height <= 0:
                width, height = 1280, 720

            # Guard against invalid or 0 frame counts
            if total_frames <= 0:
                total_frames = 100

            duration_seconds = total_frames / fps if fps > 0 else 0.0

            # Try avc1 (H.264), fallback to mp4v
            fourcc = cv2.VideoWriter_fourcc(*"avc1")
            writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))
            if not writer.isOpened():
                logger.info("avc1 codec not available, falling back to mp4v")
                fourcc = cv2.VideoWriter_fourcc(*"mp4v")
                writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))

            if not writer.isOpened():
                raise RuntimeError("Could not open OpenCV VideoWriter with avc1 or mp4v.")

            self.job_manager.update_job(
                video_id,
                status="processing",
                progress=0,
                processed_frames=0,
                total_frames=total_frames,
                message="Detecting players and sports ball...",
            )

            model = self._get_model()
            active_device = self._resolve_inference_device()
            logger.info(
                f"Starting inference on video {video_id} with device={active_device}, imgsz={self.imgsz}"
            )

            # Calibrate Team A and Team B jersey color clusters across sampled video frames
            self.job_manager.update_job(
                video_id,
                message="Calibrating Team A & Team B jersey color clusters via K-Means...",
            )
            centroid_a, centroid_b, hex_team_a, hex_team_b, active_device = self._calibrate_team_clusters(
                cap, total_frames, model, device=active_device
            )

            # Create a fresh, isolated per-job BYTETracker instance (zero cross-video state leakage)
            tracker = self._create_tracker()
            logger.info(f"Initialized isolated BYTETracker for video job {video_id}")

            # Tracking statistics accumulation
            player_stats: Dict[int, Dict[str, Any]] = {}
            total_player_detections = 0
            total_ball_detections = 0
            timeline: List[Dict[str, Any]] = []

            frame_idx = 0
            inference_durations: List[float] = []
            prev_hist = None
            shot_cut_indices: List[int] = []

            while True:
                ret, frame = cap.read()
                if not ret or frame is None:
                    break

                t_frame_start = time.time()

                # Camera shot transition (cut) detection
                small_frame = cv2.resize(frame, (160, 90))
                small_hsv = cv2.cvtColor(small_frame, cv2.COLOR_BGR2HSV)
                curr_hist = cv2.calcHist([small_hsv], [0, 1], None, [16, 16], [0, 180, 0, 256])
                cv2.normalize(curr_hist, curr_hist)

                if prev_hist is not None:
                    diff = cv2.compareHist(prev_hist, curr_hist, cv2.HISTCMP_BHATTACHARYYA)
                    if diff > 0.42:
                        shot_cut_indices.append(frame_idx)
                        logger.info(f"Camera shot cut detected at frame {frame_idx} (diff={diff:.3f})")
                        # Clear active & lost tracks so tracks don't cross cut boundaries
                        tracker.tracked_stracks = []
                        tracker.lost_stracks = []
                        tracker.removed_stracks = []
                prev_hist = curr_hist

                # Extract tight playing-field grass contour (excludes neon broadcast logos & ad boards)
                pitch_contour, pitch_area_ratio = self._extract_pitch_contour(frame)
                is_wide_shot = pitch_contour is not None and pitch_area_ratio >= 0.25

                # Single-pass YOLO detection for BOTH persons (COCO 0) and football (COCO 32).
                # Decoupling prediction from ByteTrack ensures:
                #   1. Ball detections are NEVER silently suppressed by ByteTrack thresholds.
                #   2. Off-pitch spectators/sideline staff NEVER enter ByteTrack or consume track IDs.
                results, active_device = self._predict_safe(
                    model,
                    frame,
                    classes=[self.PERSON_CLASS_ID, self.BALL_CLASS_ID],
                    conf=0.10,
                    imgsz=self.imgsz,
                    device=active_device,
                )

                frame_players_count = 0
                frame_ball_detected = False
                best_ball = None  # (conf, x1, y1, x2, y2)

                boxes = results.boxes
                if boxes is not None and len(boxes) > 0:
                    boxes_np = boxes.cpu().numpy()
                    xyxy_all = boxes_np.xyxy
                    classes_all = boxes_np.cls.astype(int)
                    confs_all = boxes_np.conf

                    valid_person_mask = np.zeros(len(boxes_np), dtype=bool)

                    for i in range(len(boxes_np)):
                        cls_id = int(classes_all[i])
                        conf = float(confs_all[i])
                        x1, y1, x2, y2 = map(int, xyxy_all[i])
                        x1, y1 = max(0, x1), max(0, y1)
                        x2, y2 = min(width - 1, x2), min(height - 1, y2)
                        box_w = x2 - x1
                        box_h = y2 - y1
                        if box_w <= 0 or box_h <= 0:
                            continue

                        if cls_id == self.PERSON_CLASS_ID:
                            # 1. Geometric filters: reject ad banners (w/h > 1.15) and tiny noise (< 24px h)
                            if (box_w / box_h) > 1.15 or box_h < 24 or (box_w * box_h) < 180:
                                continue
                            # 2. Strict actual-pitch contour filter (rejects stands, stewards, sideline staff)
                            if not self._is_on_pitch_person(
                                frame, x1, y1, x2, y2, pitch_contour, pitch_area_ratio
                            ):
                                continue
                            valid_person_mask[i] = True

                        elif cls_id == self.BALL_CLASS_ID:
                            # Independent ball validation (never touches ByteTrack or player stats)
                            aspect = box_w / box_h
                            if is_wide_shot:
                                # Strict wide-shot confidence, size & actual-pitch interior check
                                # Rejects painted pitch dots (e.g. center spot at 0.15/12x8) and LED ad-board logos
                                if conf < 0.22:
                                    continue
                                if not (10 <= box_w <= 60 and 10 <= box_h <= 60 and 0.65 <= aspect <= 1.55):
                                    continue
                                cx, cy = float((x1 + x2) / 2.0), float((y1 + y2) / 2.0)
                                dist = cv2.pointPolygonTest(pitch_contour, (cx, cy), True)
                                if dist < 15.0:
                                    continue
                            else:
                                # Close-up / zoom shot allows lower conf & larger apparent football size
                                if conf < 0.15:
                                    continue
                                if not (8 <= box_w <= 350 and 8 <= box_h <= 350 and 0.45 <= aspect <= 2.2):
                                    continue

                            if best_ball is None or conf > best_ball[0]:
                                best_ball = (conf, x1, y1, x2, y2)

                    # Feed ONLY validated on-pitch person detections into ByteTrack
                    person_boxes = boxes_np[valid_person_mask]
                    tracks = tracker.update(person_boxes, frame)
                else:
                    # Advance tracker state cleanly on empty frames
                    tracks = np.empty((0, 8), dtype=np.float32)

                # Process tracked on-pitch players
                if tracks is not None and len(tracks) > 0:
                    for row in tracks:
                        x1, y1, x2, y2 = map(int, row[:4])
                        track_id = int(row[4])
                        conf = float(row[5])
                        x1, y1 = max(0, x1), max(0, y1)
                        x2, y2 = min(width - 1, x2), min(height - 1, y2)
                        box_w = x2 - x1
                        box_h = y2 - y1
                        if box_w <= 0 or box_h <= 0:
                            continue

                        frame_players_count += 1
                        total_player_detections += 1

                        # Extract upper torso jersey color and classify team
                        torso_bgr = self._extract_torso_color(frame, x1, y1, x2, y2)
                        raw_team_label, _, _, _, _ = self._classify_player_team(
                            torso_bgr, centroid_a, centroid_b
                        )

                        # Accumulate per-player tracking data first so overlay can use smoothed team label
                        if track_id not in player_stats:
                            player_stats[track_id] = {
                                "track_id": track_id,
                                "label": f"Player #{track_id}",
                                "detections_count": 0,
                                "first_frame": frame_idx,
                                "last_frame": frame_idx,
                                "confidences": [],
                                "widths": [],
                                "heights": [],
                                "last_bbox": [x1, y1, x2, y2],
                                "team_votes": [],
                                "jersey_colors": [],
                            }
                        stat = player_stats[track_id]
                        stat["detections_count"] += 1
                        stat["last_frame"] = frame_idx
                        stat["confidences"].append(conf)
                        stat["widths"].append(box_w)
                        stat["heights"].append(box_h)
                        stat["last_bbox"] = [x1, y1, x2, y2]
                        stat["team_votes"].append(raw_team_label)
                        if torso_bgr is not None:
                            stat["jersey_colors"].append(torso_bgr)

                        # Smooth displayed team label over recent frames to suppress crossing flickers
                        display_team = self._smooth_team_label(stat["team_votes"])
                        box_color, label_bg, text_color, _ = self._team_style(display_team)
                        label_text = f"{display_team} #{track_id} ({conf:.2f})"

                        cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, 2)
                        self._draw_label_pill(
                            frame,
                            label_text,
                            x1,
                            y1,
                            bg_color=label_bg,
                            text_color=text_color,
                        )

                # Render validated on-pitch ball (at most one per frame, separate from player stats)
                if best_ball is not None:
                    b_conf, bx1, by1, bx2, by2 = best_ball
                    frame_ball_detected = True
                    total_ball_detections += 1
                    cv2.rectangle(frame, (bx1, by1), (bx2, by2), self.COLOR_BALL_BOX, 2)
                    self._draw_label_pill(
                        frame,
                        f"Ball ({b_conf:.2f})",
                        bx1,
                        by1,
                        bg_color=self.COLOR_BALL_BOX,
                        text_color=self.COLOR_BALL_TEXT,
                    )

                # Record timeline sample (every frame or sample rate)
                timeline.append({
                    "frame": frame_idx,
                    "timestamp_sec": round(frame_idx / fps, 2),
                    "players_detected": frame_players_count,
                    "ball_detected": frame_ball_detected,
                })

                # Draw top HUD watermark badge on output video
                self._draw_hud_overlay(
                    frame,
                    frame_idx=frame_idx,
                    total_frames=total_frames,
                    player_count=frame_players_count,
                    ball_detected=frame_ball_detected,
                    unique_players_count=len(player_stats),
                )

                writer.write(frame)

                frame_idx += 1
                t_frame_end = time.time()
                inference_durations.append(t_frame_end - t_frame_start)

                # Update job progress periodically
                if frame_idx % 5 == 0 or frame_idx == total_frames:
                    pct = int(min(99, (frame_idx / total_frames) * 100))
                    avg_fps = (
                        len(inference_durations) / sum(inference_durations)
                        if sum(inference_durations) > 0
                        else 0.0
                    )
                    self.job_manager.update_job(
                        video_id,
                        status="processing",
                        progress=pct,
                        processed_frames=frame_idx,
                        total_frames=max(frame_idx, total_frames),
                        current_fps=round(avg_fps, 1),
                        message=f"Tracking frame {frame_idx}/{total_frames} ({pct}%)...",
                    )

            # Cleanup video handles
            cap.release()
            writer.release()

            # Ensure H.264 browser-playable MP4 when ffmpeg is available (essential on headless Linux servers)
            self._ensure_web_playable_h264(output_path)

            total_processing_time = time.time() - start_time
            actual_processed_frames = max(1, frame_idx)
            avg_inference_fps = (
                actual_processed_frames / total_processing_time
                if total_processing_time > 0
                else 0.0
            )

            # Threshold to distinguish confirmed, sustained player tracks from transient detection noise
            # At 38.06 fps, 25 frames = ~0.66s of sustained tracking
            MIN_CONFIRMED_FRAMES = 25

            # Compile per-player metrics
            all_players = []
            for trk_id in sorted(player_stats.keys()):
                p = player_stats[trk_id]
                duration_sec = (p["last_frame"] - p["first_frame"] + 1) / fps
                is_confirmed = p["detections_count"] >= MIN_CONFIRMED_FRAMES

                # Determine final team assignment by majority vote across observed frames
                team_votes = p.get("team_votes", [])
                if team_votes:
                    vote_counts = Counter(team_votes)
                    most_common_team, count = vote_counts.most_common(1)[0]
                    total_votes = len(team_votes)
                    # Require at least 45% plurality to assign to Team A or Team B, else Unknown
                    if most_common_team in ["Team A", "Team B"] and (count / total_votes) < 0.45:
                        team_name = "Unknown"
                    else:
                        team_name = most_common_team
                else:
                    team_name = "Unknown"

                if team_name == "Team A":
                    team_color = self.HEX_TEAM_A
                elif team_name == "Team B":
                    team_color = self.HEX_TEAM_B
                elif team_name == "Referee":
                    team_color = self.HEX_OFFICIAL
                else:
                    team_color = self.HEX_UNKNOWN

                # Representative jersey RGB color
                if p.get("jersey_colors"):
                    mean_bgr = np.mean(p["jersey_colors"], axis=0).astype(int)
                    jersey_rgb = [int(mean_bgr[2]), int(mean_bgr[1]), int(mean_bgr[0])]
                else:
                    if team_name == "Team A":
                        jersey_rgb = [56, 189, 248]
                    elif team_name == "Team B":
                        jersey_rgb = [244, 63, 94]
                    elif team_name == "Referee":
                        jersey_rgb = [250, 204, 21]
                    else:
                        jersey_rgb = [148, 163, 184]

                all_players.append({
                    "track_id": trk_id,
                    "label": f"{team_name} #{trk_id}",
                    "detections_count": p["detections_count"],
                    "first_frame": p["first_frame"],
                    "last_frame": p["last_frame"],
                    "visibility_duration_seconds": round(duration_sec, 2),
                    "avg_confidence": round(float(np.mean(p["confidences"])), 3) if p["confidences"] else 0.0,
                    "avg_bbox_width": round(float(np.mean(p["widths"])), 1) if p["widths"] else 0.0,
                    "avg_bbox_height": round(float(np.mean(p["heights"])), 1) if p["heights"] else 0.0,
                    "last_known_bbox": p["last_bbox"],
                    "is_confirmed": is_confirmed,
                    "team": team_name,
                    "team_color": team_color,
                    "jersey_color_rgb": jersey_rgb,
                })

            confirmed_players = [p for p in all_players if p["is_confirmed"]]
            transient_players = [p for p in all_players if not p["is_confirmed"]]

            team_a_count = sum(1 for p in confirmed_players if p["team"] == "Team A")
            team_b_count = sum(1 for p in confirmed_players if p["team"] == "Team B")
            officials_count = sum(1 for p in confirmed_players if p["team"] == "Referee")
            unknown_count = sum(1 for p in confirmed_players if p["team"] == "Unknown")
            camera_shots_count = len(shot_cut_indices) + 1

            # Calculate match detection summary metrics
            avg_players_per_frame = round(total_player_detections / actual_processed_frames, 2)
            ball_frames_count = sum(1 for t in timeline if t["ball_detected"])
            ball_detection_rate_pct = round((ball_frames_count / actual_processed_frames) * 100, 1)

            confirmed_durations = [p["visibility_duration_seconds"] for p in confirmed_players]
            avg_track_duration_seconds = (
                round(sum(confirmed_durations) / len(confirmed_durations), 2)
                if confirmed_durations
                else 0.0
            )

            analytics_data = {
                "video_id": video_id,
                "status": "completed",
                "model": "Ultralytics YOLO11n (COCO Pretrained)",
                "tracker": "ByteTrack Multi-Object Tracking (Soccer Tuned)",
                "video_metadata": {
                    "original_filename": input_path.name,
                    "annotated_filename": output_path.name,
                    "stream_url": f"/uploads/{output_path.name}",
                    "width": width,
                    "height": height,
                    "fps": round(fps, 2),
                    "total_frames": actual_processed_frames,
                    "duration_seconds": round(actual_processed_frames / fps, 2),
                },
                "summary_metrics": {
                    "total_frames_analyzed": actual_processed_frames,
                    "unique_players_count": len(confirmed_players),  # Headline confirmed players matching player roster
                    "confirmed_players_count": len(confirmed_players),
                    "total_unique_track_ids": len(player_stats),
                    "short_lived_tracks_count": len(transient_players),
                    "min_frames_threshold": MIN_CONFIRMED_FRAMES,
                    "avg_track_duration_seconds": avg_track_duration_seconds,
                    "team_a_name": "Team A",
                    "team_b_name": "Team B",
                    "team_a_count": team_a_count,
                    "team_b_count": team_b_count,
                    "officials_count": officials_count,
                    "unknown_count": unknown_count,
                    "team_a_color": self.HEX_TEAM_A,
                    "team_b_color": self.HEX_TEAM_B,
                    "unknown_color": self.HEX_UNKNOWN,
                    "camera_shots_detected": camera_shots_count,
                    "pitch_filter_applied": True,
                    "total_player_detections": total_player_detections,
                    "total_ball_detections": total_ball_detections,
                    "avg_players_per_frame": avg_players_per_frame,
                    "ball_detection_rate_pct": ball_detection_rate_pct,
                    "processing_time_seconds": round(total_processing_time, 2),
                    "avg_inference_fps": round(avg_inference_fps, 1),
                },
                "players": confirmed_players,  # Confirmed player roster (aligns 1:1 with summary cards)
                "transient_tracks": transient_players,  # Available for audit and transparency
                "timeline": timeline,
                "disclaimers": {
                    "homography": "Metric physical speed (km/h) and real pitch distance (meters) require 4-point homography camera calibration to map 2D video pixel coordinates onto standard 105m × 68m FIFA pitch coordinates.",
                    "team_classification": "Automated team classification performs upper-torso jersey color extraction with green pitch masking and K-Means clustering, separating Team A, Team B, Match Officials, and Unknown/ambiguous uniforms.",
                    "track_count_derivation": "Confirmed track count represents persistent tracked instances across the video. In broadcast soccer, camera cuts and framing changes cause 2D trackers to spawn separate sequential track IDs for the same visible players across different camera shots (e.g., Shot 1 vs Shot 3). Average simultaneously visible on-pitch players per frame is measured directly.",
                },
            }

            # Persist analytics JSON to disk
            with open(analytics_path, "w") as f:
                json.dump(analytics_data, f, indent=2)

            # Update job status to completed
            self.job_manager.update_job(
                video_id,
                status="completed",
                progress=100,
                processed_frames=actual_processed_frames,
                total_frames=actual_processed_frames,
                current_fps=round(avg_inference_fps, 1),
                annotated_video_url=f"/uploads/{output_path.name}",
                error_message=None,
                message=f"Analysis completed: {len(confirmed_players)} confirmed players tracked across {actual_processed_frames} frames ({len(player_stats)} total tracklets).",
            )
            logger.info(f"Video {video_id} processing completed in {total_processing_time:.2f}s")

        except Exception as exc:
            logger.exception(f"Error processing video {video_id}: {exc}")
            if 'cap' in locals() and cap.isOpened():
                cap.release()
            if 'writer' in locals() and writer.isOpened():
                writer.release()

            self.job_manager.update_job(
                video_id,
                status="failed",
                error_message=str(exc),
                message=f"Inference pipeline failed: {str(exc)}",
            )

    def _draw_label_pill(
        self,
        frame: np.ndarray,
        text: str,
        x: int,
        y: int,
        bg_color: tuple,
        text_color: tuple,
    ):
        """Draws a clean, rounded-looking pill badge for player or ball labels."""
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.42
        thickness = 1
        (label_w, label_h), baseline = cv2.getTextSize(text, font, font_scale, thickness)

        pill_y1 = max(0, y - label_h - 8)
        pill_y2 = pill_y1 + label_h + 8
        pill_x1 = max(0, x)
        pill_x2 = pill_x1 + label_w + 10

        # Draw filled background rectangle
        cv2.rectangle(frame, (pill_x1, pill_y1), (pill_x2, pill_y2), bg_color, -1)
        # Draw dark border
        cv2.rectangle(frame, (pill_x1, pill_y1), (pill_x2, pill_y2), (0, 0, 0), 1)

        # Draw label text
        text_x = pill_x1 + 5
        text_y = pill_y2 - 4
        cv2.putText(
            frame,
            text,
            (text_x, text_y),
            font,
            font_scale,
            text_color,
            thickness,
            cv2.LINE_AA,
        )

    def _draw_hud_overlay(
        self,
        frame: np.ndarray,
        frame_idx: int,
        total_frames: int,
        player_count: int,
        ball_detected: bool,
        unique_players_count: int,
    ):
        """Draws a subtle, high-tech top-left telemetry HUD banner on the output video."""
        hud_w = 340
        hud_h = 36
        x1, y1 = 16, 16
        x2, y2 = x1 + hud_w, y1 + hud_h

        # Semi-transparent overlay box
        sub_img = frame[y1:y2, x1:x2]
        dark_rect = np.full(sub_img.shape, 18, dtype=np.uint8)
        cv2.addWeighted(sub_img, 0.25, dark_rect, 0.75, 0, sub_img)
        frame[y1:y2, x1:x2] = sub_img

        cv2.rectangle(frame, (x1, y1), (x2, y2), (68, 50, 37), 1)

        # Telemetry text
        ball_str = "YES" if ball_detected else "NO"
        hud_text_1 = "PitchVision AI  |  YOLO11 + ByteTrack"
        hud_text_2 = f"F: {frame_idx + 1}/{total_frames}  |  Plyrs: {player_count}  |  Trk: #{unique_players_count}  |  Ball: {ball_str}"

        font = cv2.FONT_HERSHEY_SIMPLEX
        cv2.putText(frame, hud_text_1, (x1 + 8, y1 + 14), font, 0.36, (16, 185, 129), 1, cv2.LINE_AA)
        cv2.putText(frame, hud_text_2, (x1 + 8, y1 + 28), font, 0.34, (200, 210, 220), 1, cv2.LINE_AA)


    def _ensure_web_playable_h264(self, video_path: Path) -> None:
        """
        Transcodes OpenCV output to web-playable H.264 (yuv420p + faststart) when ffmpeg
        is available on the host. On headless Linux servers, OpenCV often falls back to mp4v,
        which modern browsers cannot play natively in HTML5 <video> elements.
        """
        ffmpeg_bin = shutil.which("ffmpeg")
        if not ffmpeg_bin or not video_path.exists():
            return

        tmp_path = video_path.with_name(f"{video_path.stem}_h264_tmp.mp4")
        try:
            cmd = [
                ffmpeg_bin,
                "-y",
                "-i", str(video_path),
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "23",
                "-pix_fmt", "yuv420p",
                "-movflags", "+faststart",
                "-an",
                str(tmp_path),
            ]
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=300,
                check=False,
            )
            if result.returncode == 0 and tmp_path.exists() and tmp_path.stat().st_size > 0:
                tmp_path.replace(video_path)
                logger.info(f"Transcoded {video_path.name} to browser-playable H.264 via ffmpeg.")
            else:
                logger.warning(f"ffmpeg H.264 transcode skipped (exit {result.returncode}); keeping OpenCV output.")
                if tmp_path.exists():
                    tmp_path.unlink()
        except Exception as err:
            logger.warning(f"ffmpeg transcode error (keeping OpenCV output): {err}")
            if tmp_path.exists():
                tmp_path.unlink()


# Global singleton instance of the production CV Pipeline
cv_pipeline_service = ComputerVisionPipelineService(
    model_weights=settings.YOLO_MODEL_PATH,
    imgsz=settings.YOLO_IMGSZ,
    device=settings.YOLO_DEVICE,
)
