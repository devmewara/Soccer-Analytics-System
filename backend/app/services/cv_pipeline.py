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
import shutil
import logging
import subprocess
import threading
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

    def __init__(self, model_weights: str = "yolo11n.pt"):
        self.model_weights = model_weights
        self._model = None
        self._model_lock = threading.Lock()
        self._inference_lock = threading.Lock()
        self.job_manager = VideoJobManager()

    def _get_model(self):
        """Thread-safe lazy loader for Ultralytics YOLO model."""
        if self._model is None:
            with self._model_lock:
                if self._model is None:
                    from ultralytics import YOLO
                    try:
                        logger.info(f"Loading YOLO model with weights: {self.model_weights}")
                        self._model = YOLO(self.model_weights)
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

    def _extract_pitch_hull(self, frame: np.ndarray) -> Optional[np.ndarray]:
        """Extracts the convex hull of the green playing field in HSV color space."""
        h, w = frame.shape[:2]
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        grass_mask = cv2.inRange(hsv, (32, 35, 35), (85, 255, 255))
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 25))
        closed = cv2.morphologyEx(grass_mask, cv2.MORPH_CLOSE, kernel)
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return None
        pitch_contour = max(contours, key=cv2.contourArea)
        # Only use pitch contour if it represents a meaningful portion of the frame (>= 15%)
        if cv2.contourArea(pitch_contour) < (w * h * 0.15):
            return None
        return cv2.convexHull(pitch_contour)

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

    def _calibrate_team_clusters(self, cap: cv2.VideoCapture, total_frames: int, model) -> tuple[np.ndarray, np.ndarray, str, str]:
        """Pre-samples frames across video to calibrate Team A and Team B jersey color clusters using K-Means, excluding referees and off-pitch spectators."""
        sample_indices = np.linspace(
            max(1, int(total_frames * 0.05)),
            max(1, int(total_frames * 0.95)),
            12,
            dtype=int
        )
        jersey_samples = []
        current_pos = cap.get(cv2.CAP_PROP_POS_FRAMES)

        for sf in sample_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, sf)
            ret, frame = cap.read()
            if not ret or frame is None:
                continue

            pitch_hull = self._extract_pitch_hull(frame)

            res = model.predict(source=frame, classes=[self.PERSON_CLASS_ID], conf=0.35, verbose=False)[0]
            boxes = res.boxes
            if boxes is not None:
                xyxy = boxes.xyxy.cpu().numpy().astype(int)
                for box in xyxy:
                    x1, y1, x2, y2 = box
                    w = x2 - x1
                    h = y2 - y1
                    if h <= 0 or (w / h) > 1.15 or h < 32:
                        continue

                    # Filter out off-pitch detections (spectator stands / ad boards)
                    feet = (float((x1 + x2) / 2), float(y2))
                    if pitch_hull is not None:
                        dist = cv2.pointPolygonTest(pitch_hull.astype(np.float32), feet, True)
                        if dist < -45:
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
            logger.info(f"Calibrated Team Clusters (excluding referees & off-pitch): Team A RGB={c_a_rgb.tolist()}, Team B RGB={c_b_rgb.tolist()}")
            return c_team_a, c_team_b, c_a_hex, c_b_hex
        else:
            logger.warning("Insufficient jersey samples for K-Means calibration; using defaults.")
            c0 = np.array([60, 50, 45], dtype=np.float32)
            c1 = np.array([200, 190, 180], dtype=np.float32)
            return c0, c1, "#2D3748", "#E2E8F0"

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

            # Calibrate Team A and Team B jersey color clusters across sampled video frames
            self.job_manager.update_job(
                video_id,
                message="Calibrating Team A & Team B jersey color clusters via K-Means...",
            )
            centroid_a, centroid_b, hex_team_a, hex_team_b = self._calibrate_team_clusters(cap, total_frames, model)

            # Clean tracker state initialization before every video processing job
            # Prevents track ID leakage and Kalman filter state carryover across videos
            try:
                from ultralytics.trackers.basetrack import BaseTrack
                BaseTrack.reset_id()
                if hasattr(model, "predictor") and model.predictor is not None:
                    model.predictor.trackers = []
                logger.info(f"Reset ByteTrack ID counter and predictor trackers for video job {video_id}")
            except Exception as reset_err:
                logger.warning(f"Could not reset ByteTrack state: {reset_err}")

            # Tracking statistics accumulation
            player_stats: Dict[int, Dict[str, Any]] = {}
            total_player_detections = 0
            total_ball_detections = 0
            timeline: List[Dict[str, Any]] = []

            frame_idx = 0
            inference_durations: List[float] = []
            prev_hist = None
            shot_cut_indices: List[int] = []

            tracker_cfg = str(TRACKER_CONFIG_PATH) if TRACKER_CONFIG_PATH.exists() else "bytetrack.yaml"

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
                        try:
                            if hasattr(model, "predictor") and model.predictor is not None:
                                for trk in getattr(model.predictor, "trackers", []):
                                    trk.tracked_stracks = []
                                    trk.lost_stracks = []
                                    trk.removed_stracks = []
                        except Exception as trk_err:
                            logger.debug(f"Could not clear tracker lists on shot cut: {trk_err}")
                prev_hist = curr_hist

                # Extract playing field pitch hull
                pitch_hull = self._extract_pitch_hull(frame)

                # Run YOLO tracking with soccer-tuned ByteTrack
                # conf=0.10 feeds low-confidence detections into ByteTrack stage-2 association for occluded players
                results = model.track(
                    source=frame,
                    persist=True,
                    tracker=tracker_cfg,
                    classes=[self.PERSON_CLASS_ID, self.BALL_CLASS_ID],
                    conf=0.10,
                    device="cpu",
                    verbose=False,
                )[0]

                frame_players_count = 0
                frame_ball_detected = False

                boxes = results.boxes
                if boxes is not None and len(boxes) > 0:
                    xyxy = boxes.xyxy.cpu().numpy()
                    classes = boxes.cls.cpu().numpy().astype(int)
                    confs = boxes.conf.cpu().numpy()
                    track_ids = (
                        boxes.id.cpu().numpy().astype(int)
                        if boxes.id is not None
                        else None
                    )

                    for i in range(len(boxes)):
                        cls_id = classes[i]
                        conf = float(confs[i])
                        x1, y1, x2, y2 = map(int, xyxy[i])
                        # Bound within frame boundaries
                        x1, y1 = max(0, x1), max(0, y1)
                        x2, y2 = min(width - 1, x2), min(height - 1, y2)
                        box_w = x2 - x1
                        box_h = y2 - y1

                        track_id = int(track_ids[i]) if track_ids is not None else None

                        if cls_id == self.PERSON_CLASS_ID:
                            # Geometric heuristic filters for soccer broadcast video:
                            # 1. Reject unnatural horizontal aspect ratios (ad banners, pitch text: w/h > 1.15)
                            # 2. Reject microscopic noise boxes (< 24px height or < 180px area)
                            if box_h <= 0 or (box_w / box_h) > 1.15 or box_h < 24 or (box_w * box_h) < 180:
                                continue

                            # 3. Spatial pitch-boundary filter:
                            # Exclude detections located in spectator stands or behind ad boards
                            feet = (float((x1 + x2) / 2), float(y2))
                            if pitch_hull is not None:
                                dist_to_pitch = cv2.pointPolygonTest(pitch_hull.astype(np.float32), feet, True)
                                if dist_to_pitch < -45:
                                    fy1 = max(0, y2 - 15)
                                    fy2 = min(height, y2 + 15)
                                    fx1 = max(0, int(feet[0]) - 15)
                                    fx2 = min(width, int(feet[0]) + 15)
                                    feet_patch = frame[fy1:fy2, fx1:fx2]
                                    if feet_patch.size > 0:
                                        fp_hsv = cv2.cvtColor(feet_patch, cv2.COLOR_BGR2HSV)
                                        fp_grass = cv2.inRange(fp_hsv, (32, 35, 35), (85, 255, 255))
                                        grass_pct = np.count_nonzero(fp_grass) / fp_grass.size
                                        if grass_pct < 0.05:
                                            # Spectator in the stands / ad board area: skip
                                            continue

                            frame_players_count += 1
                            total_player_detections += 1

                            # Extract upper torso jersey color and classify team
                            torso_bgr = self._extract_torso_color(frame, x1, y1, x2, y2)
                            team_label, box_color, label_bg, text_color, hex_col = self._classify_player_team(
                                torso_bgr, centroid_a, centroid_b
                            )

                            label_text = (
                                f"{team_label} #{track_id} ({conf:.2f})"
                                if track_id is not None
                                else f"{team_label} ({conf:.2f})"
                            )

                            # Draw player bounding box with team tactical color
                            cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, 2)

                            # Draw tactical label pill with team background color
                            self._draw_label_pill(
                                frame,
                                label_text,
                                x1,
                                y1,
                                bg_color=label_bg,
                                text_color=text_color,
                            )

                            # Accumulate per-player tracking data
                            if track_id is not None:
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
                                stat["team_votes"].append(team_label)
                                if torso_bgr is not None:
                                    stat["jersey_colors"].append(torso_bgr)

                        elif cls_id == self.BALL_CLASS_ID:
                            # Ball heuristic filter: confidence >= 0.15, roughly circular/square aspect ratio,
                            # and maximum dimension scaled for high-res broadcast video (<= 350px)
                            if conf < 0.15 or box_w > 350 or box_h > 350 or box_h <= 0 or not (0.4 <= (box_w / box_h) <= 2.5):
                                continue

                            frame_ball_detected = True
                            total_ball_detections += 1

                            label_text = f"Ball ({conf:.2f})"

                            # Draw ball circle / box
                            cv2.rectangle(frame, (x1, y1), (x2, y2), self.COLOR_BALL_BOX, 2)
                            self._draw_label_pill(
                                frame,
                                label_text,
                                x1,
                                y1,
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
cv_pipeline_service = ComputerVisionPipelineService(model_weights=settings.YOLO_MODEL_PATH)
