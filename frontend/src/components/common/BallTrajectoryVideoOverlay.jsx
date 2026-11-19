import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { calculateVideoContentRect } from '../../utils/videoGeometry';
import { TEAM_COLORS } from '../../utils/ballTrajectoryEstimator';

/**
 * BallTrajectoryVideoOverlay
 *
 * Renders a live, synchronized ball trajectory trail and ball location marker
 * directly over the HTML5 video player.
 *
 * Features:
 * - Dynamic comet-tail trail behind the detected ball with smooth taper and quadratic opacity fade.
 * - Team-specific attribution colors: Team A (#38BDF8), Team B (#F43F5E), Unknown (#94A3B8).
 * - High-contrast broadcast ball marker highlighting the latest ball position.
 * - Handles short interpolated gaps with dashed, faded styling.
 * - Discontinuity breaks across long gaps (> 0.35s) or camera cuts (never connects disjoint points).
 * - Automatically hides when ball position is unavailable.
 * - Correct positioning with object-contain letterboxing/pillarboxing compensation.
 * - pointer-events-none to prevent intercepting video clicks or controls.
 */
export const BallTrajectoryVideoOverlay = ({
  videoRef,
  frameRecord,
  currentTime,
  trajectoryEngine,
  trailWindowSec = 1.0,
  isFullscreen = false,
  viewMode = 'split',
}) => {
  const [videoRect, setVideoRect] = useState(null);

  // Compute rendered video content rectangle (letterbox / pillarbox aware)
  const updateRect = useCallback(() => {
    if (!videoRef?.current) return;
    const rect = calculateVideoContentRect(videoRef.current);
    if (rect) {
      setVideoRect((prev) => {
        if (
          prev &&
          prev.left === rect.left &&
          prev.top === rect.top &&
          prev.width === rect.width &&
          prev.height === rect.height
        ) {
          return prev;
        }
        return rect;
      });
    }
  }, [videoRef]);

  useEffect(() => {
    updateRect();
    const rafId = requestAnimationFrame(updateRect);
    const timeoutId = setTimeout(updateRect, 100);

    const videoEl = videoRef?.current;
    if (!videoEl) {
      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(timeoutId);
      };
    }

    videoEl.addEventListener('loadedmetadata', updateRect);
    window.addEventListener('resize', updateRect);

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateRect();
      });
      resizeObserver.observe(videoEl);
    }

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      videoEl.removeEventListener('loadedmetadata', updateRect);
      window.removeEventListener('resize', updateRect);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [videoRef, isFullscreen, viewMode, updateRect]);

  // Resolve current active ball position
  const currentBall = useMemo(() => {
    if (!trajectoryEngine) return null;

    // 1. Check current frame record first
    if (frameRecord && typeof frameRecord.frame === 'number') {
      const pt = trajectoryEngine.getBallAtFrame(frameRecord.frame);
      if (pt) return pt;
    }

    // 2. Fallback to temporal lookup around currentTime
    if (typeof currentTime === 'number' && !isNaN(currentTime)) {
      return trajectoryEngine.getBallAtTime(currentTime, 0.15);
    }

    return null;
  }, [trajectoryEngine, frameRecord, currentTime]);

  // Compute active trailing points and line segments leading to current ball
  const trailSegments = useMemo(() => {
    // If current ball position is unavailable, do NOT display any trail
    if (!currentBall || !videoRect || !trajectoryEngine) {
      return [];
    }

    const { width, height } = videoRect;
    if (width <= 0 || height <= 0) return [];

    // Query trailing points within trailWindowSec leading up to current ball
    const windowSec = Math.max(0.2, trailWindowSec);
    const rawTrail = trajectoryEngine.getActiveTrail(currentBall.t, windowSec);

    // Filter points strictly up to the current ball time
    const filteredPoints = rawTrail.filter((p) => p.t <= currentBall.t);

    // Ensure the current ball is the final terminal point of the active trail
    if (
      filteredPoints.length === 0 ||
      filteredPoints[filteredPoints.length - 1].frame !== currentBall.frame
    ) {
      filteredPoints.push(currentBall);
    }

    if (filteredPoints.length < 2) {
      return [];
    }

    const segments = [];
    const totalCount = filteredPoints.length;

    for (let i = 0; i < totalCount - 1; i++) {
      const p1 = filteredPoints[i];
      const p2 = filteredPoints[i + 1];

      // Never connect across long detection gaps, camera cuts or tracking breaks
      if (p1.gapAfter) {
        continue;
      }

      // Convert normalized screen percentages (0-100) to exact pixel coordinates
      const x1 = (p1.x / 100) * width;
      const y1 = (p1.y / 100) * height;
      const x2 = (p2.x / 100) * width;
      const y2 = (p2.y / 100) * height;

      // u ranges from ~0 (oldest tail point) to 1.0 (latest point at ball head)
      const u = (i + 1) / (totalCount - 1);

      // Progressive taper: narrow at tail (~1.6px), wide near ball (~4.6px)
      const strokeWidth = +(1.6 + 3.0 * u).toFixed(2);

      // Smooth quadratic opacity fade: tail dissolves softly into the background
      const isInterp = Boolean(p1.isInterpolated || p2.isInterpolated);
      const baseAlpha = isInterp ? 0.45 : 1.0;
      const opacity = +(Math.max(0.12, (0.18 + 0.78 * (u * u)) * baseAlpha)).toFixed(2);

      // Segment color follows the attributing team of the leading point
      let color = TEAM_COLORS.UNKNOWN;
      if (p2.color) {
        color = p2.color;
      } else if (p2.team === 'Team A') {
        color = TEAM_COLORS.TEAM_A;
      } else if (p2.team === 'Team B') {
        color = TEAM_COLORS.TEAM_B;
      }

      segments.push({
        id: `seg_${i}_${p1.frame}_${p2.frame}`,
        x1: +x1.toFixed(1),
        y1: +y1.toFixed(1),
        x2: +x2.toFixed(1),
        y2: +y2.toFixed(1),
        color,
        strokeWidth,
        opacity,
        isInterpolated: isInterp,
      });
    }

    return segments;
  }, [currentBall, videoRect, trajectoryEngine, trailWindowSec]);

  // If ball position is unavailable or video rect has not been computed, render nothing
  if (!videoRect || !currentBall) {
    return null;
  }

  const ballPxX = +((currentBall.x / 100) * videoRect.width).toFixed(1);
  const ballPxY = +((currentBall.y / 100) * videoRect.height).toFixed(1);
  const ballColor = currentBall.color || TEAM_COLORS.UNKNOWN;
  const isBallInterpolated = Boolean(currentBall.isInterpolated);

  return (
    <div
      className="absolute pointer-events-none overflow-hidden select-none z-15"
      style={{
        left: `${videoRect.left}px`,
        top: `${videoRect.top}px`,
        width: `${videoRect.width}px`,
        height: `${videoRect.height}px`,
      }}
    >
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        width={videoRect.width}
        height={videoRect.height}
        viewBox={`0 0 ${videoRect.width} ${videoRect.height}`}
      >
        <defs>
          {/* Subtle soft blur filter for outer luminous trail glow */}
          <filter id="ball-trail-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Trailing Glow Pass (Luminous background halo for high broadcast visibility) */}
        <g opacity="0.6">
          {trailSegments.map((seg) => (
            <line
              key={`glow_${seg.id}`}
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke={seg.color}
              strokeWidth={seg.strokeWidth + 3.5}
              strokeOpacity={seg.opacity * 0.35}
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* 2. Main Trajectory Trail Lines (Tapered, colored, gap-aware) */}
        <g>
          {trailSegments.map((seg) => (
            <line
              key={`line_${seg.id}`}
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke={seg.color}
              strokeWidth={seg.strokeWidth}
              strokeOpacity={seg.opacity}
              strokeDasharray={seg.isInterpolated ? '4 3' : undefined}
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* 3. Ball Position Marker at the Latest Position */}
        <g transform={`translate(${ballPxX}, ${ballPxY})`}>
          {/* Outer Pulsing Glow Ring */}
          <circle
            cx="0"
            cy="0"
            r={isBallInterpolated ? 6.5 : 8.5}
            fill={ballColor}
            fillOpacity={0.22}
            stroke={ballColor}
            strokeWidth={1.5}
            strokeDasharray={isBallInterpolated ? '2.5 2' : undefined}
            className="animate-pulse"
          />

          {/* Crisp High-Contrast Core Ball (Visible against grass and kit colors) */}
          <circle
            cx="0"
            cy="0"
            r={4.2}
            fill="#FFFFFF"
            stroke="#080B10"
            strokeWidth={1.4}
          />

          {/* Center Team Pip */}
          <circle
            cx="0"
            cy="0"
            r={1.8}
            fill={ballColor}
          />
        </g>
      </svg>
    </div>
  );
};

export default BallTrajectoryVideoOverlay;
