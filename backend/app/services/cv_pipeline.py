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
import logging
import threading
from pathlib import Path
from typing import Dict, Any, Optional, List

import cv2
import numpy as np

logger = logging.getLogger("pitchvision.cv_pipeline")
logging.basicConfig(level=logging.INFO)


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
    COLOR_PLAYER_BOX = (129, 185, 16)      # Emerald/Teal #10B981
    COLOR_PLAYER_TEXT = (0, 0, 0)          # Black text
    COLOR_PLAYER_LABEL_BG = (129, 185, 16) # Emerald background
    COLOR_BALL_BOX = (0, 215, 255)         # Bright Amber #FFD700
    COLOR_BALL_TEXT = (0, 0, 0)
    COLOR_HUD_BG = (16, 23, 34)            # Dark Navy #101722
    COLOR_HUD_BORDER = (68, 50, 37)        # Slate border
    COLOR_HUD_TEXT = (240, 245, 250)       # Clean White

    def __init__(self, model_weights: str = "yolo11n.pt"):
        self.model_weights = model_weights
        self._model = None
        self._model_lock = threading.Lock()
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
    ) -> Dict[str, Any]:
        """
        Launches video tracking pipeline in a separate background daemon thread.
        Returns immediate confirmation and job token.
        """
        existing_job = self.job_manager.get_job(video_id, upload_dir=input_video_path.parent)
        if existing_job and existing_job.get("status") == "processing":
            return existing_job

        if existing_job and existing_job.get("status") == "completed" and output_video_path.exists():
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

            # Tracking statistics accumulation
            player_stats: Dict[int, Dict[str, Any]] = {}
            total_player_detections = 0
            total_ball_detections = 0
            timeline: List[Dict[str, Any]] = []

            frame_idx = 0
            inference_durations: List[float] = []

            while True:
                ret, frame = cap.read()
                if not ret or frame is None:
                    break

                t_frame_start = time.time()

                # Run YOLO tracking with ByteTrack
                results = model.track(
                    source=frame,
                    persist=True,
                    tracker="bytetrack.yaml",
                    classes=[self.PERSON_CLASS_ID, self.BALL_CLASS_ID],
                    conf=conf_threshold,
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

                        track_id = int(track_ids[i]) if track_ids is not None else None

                        if cls_id == self.PERSON_CLASS_ID:
                            frame_players_count += 1
                            total_player_detections += 1

                            label_text = (
                                f"Player #{track_id} ({conf:.2f})"
                                if track_id is not None
                                else f"Player ({conf:.2f})"
                            )

                            # Draw player bounding box
                            cv2.rectangle(frame, (x1, y1), (x2, y2), self.COLOR_PLAYER_BOX, 2)

                            # Draw tactical label pill
                            self._draw_label_pill(
                                frame,
                                label_text,
                                x1,
                                y1,
                                bg_color=self.COLOR_PLAYER_LABEL_BG,
                                text_color=self.COLOR_PLAYER_TEXT,
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
                                    }
                                stat = player_stats[track_id]
                                stat["detections_count"] += 1
                                stat["last_frame"] = frame_idx
                                stat["confidences"].append(conf)
                                stat["widths"].append(x2 - x1)
                                stat["heights"].append(y2 - y1)
                                stat["last_bbox"] = [x1, y1, x2, y2]

                        elif cls_id == self.BALL_CLASS_ID:
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

            total_processing_time = time.time() - start_time
            actual_processed_frames = max(1, frame_idx)
            avg_inference_fps = (
                actual_processed_frames / total_processing_time
                if total_processing_time > 0
                else 0.0
            )

            # Compile per-player metrics
            sorted_players = []
            for trk_id in sorted(player_stats.keys()):
                p = player_stats[trk_id]
                duration_sec = (p["last_frame"] - p["first_frame"] + 1) / fps
                sorted_players.append({
                    "track_id": trk_id,
                    "label": p["label"],
                    "detections_count": p["detections_count"],
                    "first_frame": p["first_frame"],
                    "last_frame": p["last_frame"],
                    "visibility_duration_seconds": round(duration_sec, 2),
                    "avg_confidence": round(float(np.mean(p["confidences"])), 3) if p["confidences"] else 0.0,
                    "avg_bbox_width": round(float(np.mean(p["widths"])), 1) if p["widths"] else 0.0,
                    "avg_bbox_height": round(float(np.mean(p["heights"])), 1) if p["heights"] else 0.0,
                    "last_known_bbox": p["last_bbox"],
                })

            # Calculate match detection summary metrics
            avg_players_per_frame = round(total_player_detections / actual_processed_frames, 2)
            ball_frames_count = sum(1 for t in timeline if t["ball_detected"])
            ball_detection_rate_pct = round((ball_frames_count / actual_processed_frames) * 100, 1)

            analytics_data = {
                "video_id": video_id,
                "status": "completed",
                "model": "Ultralytics YOLO11n (COCO Pretrained)",
                "tracker": "ByteTrack Multi-Object Tracking",
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
                    "unique_players_count": len(player_stats),
                    "total_player_detections": total_player_detections,
                    "total_ball_detections": total_ball_detections,
                    "avg_players_per_frame": avg_players_per_frame,
                    "ball_detection_rate_pct": ball_detection_rate_pct,
                    "processing_time_seconds": round(total_processing_time, 2),
                    "avg_inference_fps": round(avg_inference_fps, 1),
                },
                "players": sorted_players,
                "timeline": timeline,
                "disclaimers": {
                    "homography": "Metric physical speed (km/h) and real pitch distance (meters) require 4-point homography camera calibration to map 2D video pixel coordinates onto standard 105m × 68m FIFA pitch coordinates.",
                    "team_classification": "Automated team assignment requires jersey color clustering or fine-tuned team classifiers, scheduled for future tactical releases.",
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
                message=f"Analysis completed: {len(player_stats)} unique players tracked across {actual_processed_frames} frames.",
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


# Global singleton instance of the production CV Pipeline
cv_pipeline_service = ComputerVisionPipelineService()
