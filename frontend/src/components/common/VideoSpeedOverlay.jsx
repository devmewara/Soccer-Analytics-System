import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { resolvePlayerSpeed } from '../../utils/speedEstimator';
import { calculateVideoContentRect } from '../../utils/videoGeometry';

export { calculateVideoContentRect };

/**
 * Checks if two bounding boxes overlap in normalized coordinates (0-100%).
 */
function boxesOverlap(a, b) {
  return !(a.x2 < b.x1 || a.x1 > b.x2 || a.y2 < b.y1 || a.y1 > b.y2);
}

/**
 * Extracts or estimates a player's bounding box in normalized percentages (0-100%).
 */
function getPlayerBox(p) {
  if (Array.isArray(p.bbox) && p.bbox.length === 4) {
    return {
      x1: p.bbox[0],
      y1: p.bbox[1],
      x2: p.bbox[2],
      y2: p.bbox[3],
    };
  }
  // Fallback for legacy data without bbox (typical broadcast player width ~2.8%, height ~7.5%)
  return {
    x1: Math.max(0, p.x - 1.4),
    y1: Math.max(0, p.y - 7.5),
    x2: Math.min(100, p.x + 1.4),
    y2: Math.min(100, p.y),
  };
}

/**
 * VideoSpeedOverlay
 * Renders live player movement speeds as compact circular badges directly over the actual video.
 *
 * Collision-Avoidance Placement:
 * Positions badges strictly OUTSIDE the player's body (beside the bounding box or below feet)
 * without covering the player or nearby players. If a scene is too crowded to place a badge safely,
 * hides the badge rather than covering a player.
 */
export const VideoSpeedOverlay = ({
  videoRef,
  frameRecord,
  speedData = null,
  playerSpeedData = null,
  selectedPlayerId = null,
  isFullscreen = false,
  viewMode = 'split',
}) => {
  const [videoRect, setVideoRect] = useState(null);

  const activeSpeedEngine = speedData || playerSpeedData;

  const updateRect = useCallback(() => {
    if (!videoRef?.current) return;
    const rect = calculateVideoContentRect(videoRef.current);
    if (rect) {
      setVideoRect((prev) => {
        // Prevent unnecessary state updates if dimensions haven't changed
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

  // Compute collision-free circular badge placements for all visible players
  const playerBadges = useMemo(() => {
    if (!frameRecord || !Array.isArray(frameRecord.players) || frameRecord.players.length === 0) {
      return [];
    }

    const players = frameRecord.players;
    const allPlayerBoxes = players.map((p) => ({ id: p.id, box: getPlayerBox(p) }));
    const placedBadgeBoxes = [];
    const badges = [];

    // Approximate circular badge radius in normalized percentage space
    // Assumes badge diameter is ~26-28px on a typical 900-1200px width frame
    const rx = 1.4; // half-width in %
    const ry = 2.4; // half-height in %
    const gap = 0.8; // gap between bounding box and circular badge in %

    for (const p of players) {
      if (p.x == null || p.y == null) continue;

      const speedInfo = resolvePlayerSpeed(activeSpeedEngine, frameRecord, p.id);
      const isSelected = p.id === selectedPlayerId;
      const pBox = getPlayerBox(p);
      const yMid = pBox.y1 + 0.55 * (pBox.y2 - pBox.y1);

      // Candidate positions strictly OUTSIDE player body in priority order:
      // 1. Right side of bounding box
      // 2. Left side of bounding box
      // 3. Lower-right beside feet
      // 4. Lower-left beside feet
      // 5. Just below feet
      // 6. Just above head
      const candidates = [
        { name: 'right', x: pBox.x2 + gap + rx, y: yMid },
        { name: 'left', x: pBox.x1 - gap - rx, y: yMid },
        { name: 'lower-right', x: pBox.x2 + gap + rx, y: Math.min(97, pBox.y2 - ry) },
        { name: 'lower-left', x: pBox.x1 - gap - rx, y: Math.min(97, pBox.y2 - ry) },
        { name: 'below-feet', x: (pBox.x1 + pBox.x2) / 2, y: pBox.y2 + gap + ry },
        { name: 'above-head', x: (pBox.x1 + pBox.x2) / 2, y: pBox.y1 - gap - ry },
      ];

      let bestPlacement = null;

      for (const c of candidates) {
        const badgeBox = {
          x1: c.x - rx,
          y1: c.y - ry,
          x2: c.x + rx,
          y2: c.y + ry,
        };

        // 1. Must stay strictly within video content boundaries
        if (badgeBox.x1 < 1.0 || badgeBox.x2 > 99.0 || badgeBox.y1 < 1.0 || badgeBox.y2 > 99.0) {
          continue;
        }

        // 2. Must NOT cover ANY player's body
        const coversPlayer = allPlayerBoxes.some((other) => boxesOverlap(badgeBox, other.box));
        if (coversPlayer) {
          continue;
        }

        // 3. Avoid overlapping other already-placed speed badges
        const coversBadge = placedBadgeBoxes.some((placed) => boxesOverlap(badgeBox, placed));
        if (coversBadge) {
          continue;
        }

        bestPlacement = { x: c.x, y: c.y, box: badgeBox };
        break;
      }

      // If no candidate is completely free of player collisions, safely hide badge in this frame
      if (!bestPlacement) {
        continue;
      }

      placedBadgeBoxes.push(bestPlacement.box);

      badges.push({
        id: p.id,
        team: p.team,
        speedVal: speedInfo.speedVal,
        tier: speedInfo.tier,
        label: speedInfo.label,
        isSelected,
        posX: bestPlacement.x,
        posY: bestPlacement.y,
      });
    }

    return badges;
  }, [frameRecord, activeSpeedEngine, selectedPlayerId]);

  if (!videoRect || !frameRecord) return null;

  return (
    <div
      className="absolute pointer-events-none overflow-hidden select-none z-20"
      style={{
        left: `${videoRect.left}px`,
        top: `${videoRect.top}px`,
        width: `${videoRect.width}px`,
        height: `${videoRect.height}px`,
      }}
    >
      {/* Single Speed Unit Notice declared once on video */}
      <div
        className={`absolute ${
          isFullscreen ? 'top-16 right-3 sm:right-6' : 'top-2.5 right-2.5'
        } flex items-center gap-1.5 bg-[#080B10]/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-[#253244] text-[9.5px] font-mono text-slate-300 pointer-events-none shadow-md z-30 transition-all`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
        <span className="text-white font-medium">Movement Speed</span>
        <span className="text-slate-500">·</span>
        <span className="text-slate-400">%/s (screen-space estimate)</span>
      </div>

      {/* Collision-Free Circular Speed Badges Positioned Outside Player Bodies */}
      {playerBadges.map((badge) => {
        const isTeamA = badge.team === 'Team A';
        const isTeamB = badge.team === 'Team B';
        const isReferee = badge.team === 'Referee';
        const isFast = badge.tier === 'fast';
        const isMoving = badge.tier === 'moving';

        // Circular Badge Styling:
        // Light, translucent background + dark high-contrast text + thin subtle border
        let circleStyle = 'bg-slate-100/90 text-slate-800 border-slate-300/80';

        if (isFast) {
          // Fast movement: light amber background with dark amber text
          circleStyle = 'bg-amber-200/95 text-amber-950 font-extrabold border-amber-400/90 shadow-sm';
        } else if (isMoving) {
          // Moving: light team-associated color
          if (isTeamA) {
            circleStyle = 'bg-sky-100/90 text-sky-950 font-bold border-sky-300/90 shadow-sm';
          } else if (isTeamB) {
            circleStyle = 'bg-rose-100/90 text-rose-950 font-bold border-rose-300/90 shadow-sm';
          } else if (isReferee) {
            circleStyle = 'bg-amber-100/90 text-amber-950 font-bold border-amber-300/90 shadow-sm';
          } else {
            circleStyle = 'bg-slate-200/90 text-slate-900 font-bold border-slate-300/90 shadow-sm';
          }
        } else {
          // Idle: subtle neutral / light grey
          circleStyle = 'bg-slate-100/90 text-slate-800 font-medium border-slate-300/80';
        }

        return (
          <div
            key={badge.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-100 ease-linear z-20 pointer-events-none"
            style={{ left: `${badge.posX}%`, top: `${badge.posY}%` }}
          >
            {/* Perfectly circular badge showing only numerical speed */}
            <div
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-mono text-[8.5px] sm:text-[9.5px] tracking-tight border ${circleStyle} ${
                badge.isSelected ? 'ring-2 ring-emerald-500 scale-110 z-30' : ''
              }`}
              title={`${badge.team} #${badge.id} — Speed: ${badge.speedVal}`}
            >
              {badge.speedVal}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VideoSpeedOverlay;
