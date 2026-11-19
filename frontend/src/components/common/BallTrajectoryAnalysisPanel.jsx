import React, { useState, useMemo, useCallback } from 'react';
import {
  Activity,
  Compass,
  Layers,
  Info,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { TEAM_COLORS } from '../../utils/ballTrajectoryEstimator';

function formatTimecode(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00.0';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
}

const PITCH_BOUNDS = Object.freeze({
  x: 40,
  y: 40,
  width: 970,
  height: 600,
});

/**
 * Maps normalized coordinates (0-100%) to SVG pitch bounds.
 */
function mapToPitch(normX, normY) {
  if (normX == null || normY == null) return null;
  const clampedX = Math.max(0, Math.min(100, normX));
  const clampedY = Math.max(0, Math.min(100, normY));
  return {
    x: +(PITCH_BOUNDS.x + (clampedX / 100) * PITCH_BOUNDS.width).toFixed(1),
    y: +(PITCH_BOUNDS.y + (clampedY / 100) * PITCH_BOUNDS.height).toFixed(1),
  };
}

/**
 * BallTrajectoryAnalysisPanel
 *
 * Professional 2D soccer pitch trajectory analysis dashboard.
 * Displays top-down pitch with continuous ball trajectory trace,
 * directional flight flow arrows, live synchronized ball position marker,
 * interactive click-to-seek, and conservative possession metrics.
 */
export const BallTrajectoryAnalysisPanel = ({
  trajectoryEngine = null,
  currentTime = 0,
  duration = 90,
  isPlaying = false,
  frameRecord = null,
  onSeekToTime = null,
  teamAName = 'Team A',
  teamBName = 'Team B',
  className = '',
}) => {
  // Display filter mode: 'all' (entire clip trace) | 'playhead' (trace up to current timestamp)
  const [traceMode, setTraceMode] = useState('all');
  // Team filter: 'all' | 'Team A' | 'Team B' | 'Unknown'
  const [teamFilter, setTeamFilter] = useState('all');
  // Hovered trajectory point state
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Active ball position at current playback time/frame
  const currentBall = useMemo(() => {
    if (!trajectoryEngine) return null;

    if (
      frameRecord &&
      typeof frameRecord.frame === 'number' &&
      typeof trajectoryEngine.getBallAtFrame === 'function'
    ) {
      const pt = trajectoryEngine.getBallAtFrame(frameRecord.frame);
      if (pt) return pt;
    }

    if (
      typeof currentTime === 'number' &&
      !isNaN(currentTime) &&
      typeof trajectoryEngine.getBallAtTime === 'function'
    ) {
      return trajectoryEngine.getBallAtTime(currentTime, 0.15);
    }

    return null;
  }, [trajectoryEngine, frameRecord, currentTime]);

  const summary = useMemo(() => {
    if (!trajectoryEngine || typeof trajectoryEngine.getSummaryStats !== 'function') {
      return null;
    }
    const raw = trajectoryEngine.getSummaryStats();
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const rawPossessionPoints = raw.possessionPoints || raw.possessionFrames || {};
    const rawPossessionPct = raw.possessionPct || {};

    return {
      totalFrames: typeof raw.totalFrames === 'number' ? raw.totalFrames : 0,
      detectedBallFrames: typeof raw.detectedBallFrames === 'number' ? raw.detectedBallFrames : 0,
      interpolatedBallFrames: typeof raw.interpolatedBallFrames === 'number' ? raw.interpolatedBallFrames : 0,
      totalTrajectoryPoints: typeof raw.totalTrajectoryPoints === 'number' ? raw.totalTrajectoryPoints : 0,
      detectionRatePct: typeof raw.detectionRatePct === 'number' ? raw.detectionRatePct : 0.0,
      segmentsCount: typeof raw.segmentsCount === 'number' ? raw.segmentsCount : 0,
      possessionFrames: {
        'Team A': rawPossessionPoints['Team A'] ?? 0,
        'Team B': rawPossessionPoints['Team B'] ?? 0,
        'Unknown': rawPossessionPoints['Unknown'] ?? 0,
      },
      possessionPoints: {
        'Team A': rawPossessionPoints['Team A'] ?? 0,
        'Team B': rawPossessionPoints['Team B'] ?? 0,
        'Unknown': rawPossessionPoints['Unknown'] ?? 0,
      },
      possessionPct: {
        'Team A': rawPossessionPct['Team A'] ?? 0.0,
        'Team B': rawPossessionPct['Team B'] ?? 0.0,
        'Unknown': rawPossessionPct['Unknown'] ?? 0.0,
      },
    };
  }, [trajectoryEngine]);

  const segments = useMemo(() => {
    if (!trajectoryEngine || !Array.isArray(trajectoryEngine.segments)) {
      return [];
    }
    return trajectoryEngine.segments;
  }, [trajectoryEngine]);

  // Precompute polyline segments and direction arrows for the top-down pitch
  const { renderedSegments, directionArrows } = useMemo(() => {
    if (!trajectoryEngine || segments.length === 0) {
      return { renderedSegments: [], directionArrows: [] };
    }

    const resSegments = [];
    const resArrows = [];

    for (let sIdx = 0; sIdx < segments.length; sIdx++) {
      const seg = segments[sIdx];
      if (teamFilter !== 'all' && seg.team !== teamFilter) {
        continue;
      }

      // Filter points if traceMode is 'playhead' (up to current time)
      const rawPoints = seg.points || [];
      const pts = traceMode === 'playhead'
        ? rawPoints.filter((p) => p.t <= currentTime + 0.05)
        : rawPoints;

      if (pts.length === 0) continue;

      // Group into sub-lines (detected vs interpolated, breaking on gapAfter)
      let currentSubPath = [];
      let isCurrentInterp = false;

      for (let i = 0; i < pts.length; i++) {
        const pt = pts[i];
        const svgPos = mapToPitch(pt.x, pt.y);
        if (!svgPos) continue;

        const node = {
          ...pt,
          svgX: svgPos.x,
          svgY: svgPos.y,
        };

        if (currentSubPath.length === 0) {
          currentSubPath.push(node);
          isCurrentInterp = Boolean(pt.isInterpolated);
        } else {
          const ptInterp = Boolean(pt.isInterpolated);
          if (ptInterp !== isCurrentInterp) {
            // Push transition point to connect line continuously
            currentSubPath.push(node);
            resSegments.push({
              id: `${seg.id}_sub_${resSegments.length}`,
              team: seg.team,
              color: seg.color,
              isInterpolated: isCurrentInterp,
              points: currentSubPath,
            });
            currentSubPath = [node];
            isCurrentInterp = ptInterp;
          } else {
            currentSubPath.push(node);
          }
        }

        if (pt.gapAfter) {
          if (currentSubPath.length >= 2) {
            resSegments.push({
              id: `${seg.id}_sub_${resSegments.length}`,
              team: seg.team,
              color: seg.color,
              isInterpolated: isCurrentInterp,
              points: currentSubPath,
            });
          }
          currentSubPath = [];
        }
      }

      if (currentSubPath.length >= 2) {
        resSegments.push({
          id: `${seg.id}_sub_${resSegments.length}`,
          team: seg.team,
          color: seg.color,
          isInterpolated: isCurrentInterp,
          points: currentSubPath,
        });
      }

      // Compute directional arrows along the segment
      let anchorPt = pts[0];
      let anchorIndex = 0;

      for (let i = 1; i < pts.length; i++) {
        const pt = pts[i];
        const prevPt = pts[i - 1];

        if (prevPt.gapAfter) {
          anchorPt = pt;
          anchorIndex = i;
          continue;
        }

        const dist = Math.hypot(pt.x - anchorPt.x, pt.y - anchorPt.y);
        const frameGap = i - anchorIndex;

        // Space arrows every ~6% displacement and >= 3 frames
        if (dist >= 6.0 && frameGap >= 3) {
          const midX = (anchorPt.x + pt.x) / 2;
          const midY = (anchorPt.y + pt.y) / 2;
          const svgPos = mapToPitch(midX, midY);
          const angleDeg = Math.round(
            (Math.atan2(pt.y - anchorPt.y, pt.x - anchorPt.x) * 180) / Math.PI
          );

          resArrows.push({
            id: `arrow_${seg.id}_${i}`,
            frame: pt.frame,
            t: pt.t,
            team: seg.team,
            color: seg.color || TEAM_COLORS.UNKNOWN,
            svgX: svgPos.x,
            svgY: svgPos.y,
            angleDeg,
          });

          anchorPt = pt;
          anchorIndex = i;
        }
      }
    }

    return { renderedSegments: resSegments, directionArrows: resArrows };
  }, [trajectoryEngine, segments, teamFilter, traceMode, currentTime]);

  // Click on Pitch Canvas -> Seek video to closest trajectory timestamp
  const handlePitchClick = useCallback(
    (e) => {
      if (!onSeekToTime || !trajectoryEngine || trajectoryEngine.points.length === 0) {
        return;
      }
      const svgEl = e.currentTarget;
      const rect = svgEl.getBoundingClientRect();
      const clickPxX = ((e.clientX - rect.left) / rect.width) * 1050;
      const clickPxY = ((e.clientY - rect.top) / rect.height) * 680;

      // Convert from SVG pitch coordinates back to normalized percentage
      const normX = ((clickPxX - PITCH_BOUNDS.x) / PITCH_BOUNDS.width) * 100;
      const normY = ((clickPxY - PITCH_BOUNDS.y) / PITCH_BOUNDS.height) * 100;

      let closestPt = null;
      let minDistance = Infinity;

      for (const pt of trajectoryEngine.points) {
        const dist = Math.hypot(pt.x - normX, pt.y - normY);
        if (dist < minDistance) {
          minDistance = dist;
          closestPt = pt;
        }
      }

      // If clicked reasonably close to trajectory (within 12% screen radius)
      if (closestPt && minDistance <= 12.0) {
        onSeekToTime(closestPt.t);
      }
    },
    [onSeekToTime, trajectoryEngine]
  );

  const hasTracking = Boolean(
    trajectoryEngine &&
    Array.isArray(trajectoryEngine.points) &&
    trajectoryEngine.points.length > 0
  );

  return (
    <div
      className={`bg-[#101722] border border-[#253244] rounded-2xl p-4 sm:p-5 shadow-panel space-y-4 ${className}`}
    >
      {/* 1. Header Section with Title, Legend & Mode Toggles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3.5 border-b border-[#253244] gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Ball Trajectory Analysis</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                2D Pitch Trace
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Top-down pitch reconstruction with conservative team possession attribution & directional flow.
          </p>
        </div>

        {/* Legend & Filter Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Team Attribution Color Legend */}
          <div className="flex items-center gap-2 bg-[#080B10] px-3 py-1.5 rounded-xl border border-[#253244] text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]"></span>
              <span className="text-slate-300 font-medium">{teamAName}</span>
            </div>
            <span className="text-slate-600">·</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]"></span>
              <span className="text-slate-300 font-medium">{teamBName}</span>
            </div>
            <span className="text-slate-600">·</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]"></span>
              <span className="text-slate-400">Contested / Open</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">·</span>
            <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
              <span className="w-3 border-b-2 border-dashed border-slate-400"></span>
              <span>Interpolated</span>
            </div>
          </div>

          {/* Trace Mode Toggle */}
          <div className="flex items-center bg-[#080B10] p-1 rounded-xl border border-[#253244] text-[10px] font-mono">
            <button
              onClick={() => setTraceMode('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-semibold ${
                traceMode === 'all'
                  ? 'bg-emerald-500 text-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Display entire match clip trajectory"
            >
              Full Clip
            </button>
            <button
              onClick={() => setTraceMode('playhead')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-semibold ${
                traceMode === 'playhead'
                  ? 'bg-emerald-500 text-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Display trajectory up to current playback timestamp"
            >
              To Playhead
            </button>
          </div>

          {/* Optional Team Filter */}
          <div className="hidden md:flex items-center bg-[#080B10] p-1 rounded-xl border border-[#253244] text-[10px] font-mono">
            {['all', 'Team A', 'Team B', 'Unknown'].map((t) => (
              <button
                key={t}
                onClick={() => setTeamFilter(t)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  teamFilter === t
                    ? 'bg-[#17212E] text-white font-bold border border-[#253244]'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t === 'all' ? 'All' : t === 'Team A' ? teamAName : t === 'Team B' ? teamBName : 'Unknown'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Soccer Pitch Canvas Area */}
      {hasTracking ? (
        <div className="relative w-full rounded-2xl overflow-hidden border border-[#253244] bg-[#07150E] shadow-inner select-none">
          {/* Subtle turf stripe background */}
          <div className="absolute inset-0 opacity-80 pointer-events-none bg-gradient-to-b from-[#06140E] via-[#091D14] to-[#06140E]"></div>

          <svg
            viewBox="0 0 1050 680"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-auto max-h-[380px] sm:max-h-[420px] md:max-h-[460px] cursor-crosshair relative z-10"
            onClick={handlePitchClick}
          >
            <defs>
              {/* Alternating Pitch Grass Stripes */}
              <pattern id="turf-stripes" width="105" height="680" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="52.5" height="680" fill="rgba(16, 185, 129, 0.02)" />
                <rect x="52.5" y="0" width="52.5" height="680" fill="transparent" />
              </pattern>
            </defs>

            {/* Mowed Turf Pattern */}
            <rect x="40" y="40" width="970" height="600" fill="url(#turf-stripes)" />

            {/* ---------------- PITCH MARKINGS ---------------- */}
            <g stroke="rgba(255, 255, 255, 0.32)" strokeWidth="2.0" fill="none">
              {/* Outer Boundary */}
              <rect x="40" y="40" width="970" height="600" rx="3" />

              {/* Halfway Line */}
              <line x1="525" y1="40" x2="525" y2="640" strokeWidth="2.0" />

              {/* Center Circle & Spot */}
              <circle cx="525" cy="340" r="85" />
              <circle cx="525" cy="340" r="3.5" fill="rgba(255, 255, 255, 0.7)" />

              {/* Left Penalty Area (18-yard box) */}
              <rect x="40" y="188" width="152" height="304" />
              {/* Left Goal Area (6-yard box) */}
              <rect x="40" y="265" width="51" height="150" />
              {/* Left Penalty Spot & Arc */}
              <circle cx="142" cy="340" r="3.5" fill="rgba(255, 255, 255, 0.7)" />
              <path d="M 192,284 A 85,85 0 0,1 192,396" />

              {/* Right Penalty Area (18-yard box) */}
              <rect x="858" y="188" width="152" height="304" />
              {/* Right Goal Area (6-yard box) */}
              <rect x="959" y="265" width="51" height="150" />
              {/* Right Penalty Spot & Arc */}
              <circle cx="908" cy="340" r="3.5" fill="rgba(255, 255, 255, 0.7)" />
              <path d="M 858,284 A 85,85 0 0,0 858,396" />

              {/* Corner Arcs */}
              <path d="M 40,54 A 14,14 0 0,0 54,40" />
              <path d="M 40,626 A 14,14 0 0,1 54,640" />
              <path d="M 1010,54 A 14,14 0 0,1 996,40" />
              <path d="M 1010,626 A 14,14 0 0,0 996,640" />

              {/* Left and Right Goals */}
              <rect x="24" y="300" width="16" height="80" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" />
              <rect x="1010" y="300" width="16" height="80" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" />
            </g>

            {/* ---------------- TRAJECTORY PATHS ---------------- */}
            {/* Background Halo for Luminous Visibility */}
            <g opacity="0.45">
              {renderedSegments.map((seg) => {
                const pathStr = seg.points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.svgX} ${p.svgY}`).join(' ');
                return (
                  <path
                    key={`halo_${seg.id}`}
                    d={pathStr}
                    stroke={seg.color}
                    strokeWidth="6.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                );
              })}
            </g>

            {/* Foreground Main Trajectory Polylines */}
            <g>
              {renderedSegments.map((seg) => {
                const pathStr = seg.points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.svgX} ${p.svgY}`).join(' ');
                return (
                  <path
                    key={`main_${seg.id}`}
                    d={pathStr}
                    stroke={seg.color}
                    strokeWidth={seg.isInterpolated ? '2.4' : '3.2'}
                    strokeDasharray={seg.isInterpolated ? '5 4' : undefined}
                    strokeOpacity={seg.isInterpolated ? '0.65' : '0.95'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                );
              })}
            </g>

            {/* Directional Movement Arrows along the Trajectory */}
            <g>
              {directionArrows.map((arr) => (
                <polygon
                  key={arr.id}
                  points="-6,-5 4,0 -6,5 -3,0"
                  fill={arr.color}
                  stroke="#080B10"
                  strokeWidth="0.8"
                  transform={`translate(${arr.svgX}, ${arr.svgY}) rotate(${arr.angleDeg})`}
                  className="opacity-95"
                />
              ))}
            </g>

            {/* Interactive Trajectory Nodes (Click to Seek) */}
            <g>
              {renderedSegments.map((seg) =>
                seg.points.map((p) => (
                  <circle
                    key={`hit_${p.frame}_${p.t}`}
                    cx={p.svgX}
                    cy={p.svgY}
                    r={p.isInterpolated ? 2.5 : 3.5}
                    fill={p.color}
                    stroke="#080B10"
                    strokeWidth="1.0"
                    className="cursor-pointer transition-transform hover:scale-200"
                    onMouseEnter={() => setHoveredPoint(p)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSeekToTime) onSeekToTime(p.t);
                    }}
                  />
                ))
              )}
            </g>

            {/* Active Live Ball Marker (Synchronized with Playhead) */}
            {currentBall && (
              (() => {
                const bPos = mapToPitch(currentBall.x, currentBall.y);
                if (!bPos) return null;
                const bColor = currentBall.color || TEAM_COLORS.UNKNOWN;
                const isInterp = Boolean(currentBall.isInterpolated);

                return (
                  <g transform={`translate(${bPos.x}, ${bPos.y})`} className="pointer-events-none">
                    {/* Pulsing Outer Radar Ring */}
                    <circle
                      cx="0"
                      cy="0"
                      r={isInterp ? 11 : 14}
                      fill={bColor}
                      fillOpacity="0.22"
                      stroke={bColor}
                      strokeWidth="1.5"
                      strokeDasharray={isInterp ? '3 2' : undefined}
                      className="animate-pulse"
                    />

                    {/* Secondary Steady Glow Ring */}
                    <circle
                      cx="0"
                      cy="0"
                      r="9"
                      fill={bColor}
                      fillOpacity="0.32"
                      stroke={bColor}
                      strokeWidth="1.5"
                    />

                    {/* High-Contrast Core Soccer Ball */}
                    <circle
                      cx="0"
                      cy="0"
                      r="5.5"
                      fill="#FFFFFF"
                      stroke="#080B10"
                      strokeWidth="1.8"
                    />

                    {/* Team Color Center Pip */}
                    <circle
                      cx="0"
                      cy="0"
                      r="2.5"
                      fill={bColor}
                    />

                    {/* Timecode & Speed Micro Badge */}
                    <g transform="translate(0, -17)">
                      <rect
                        x="-28"
                        y="-10"
                        width="56"
                        height="14"
                        rx="3"
                        fill="#080B10"
                        fillOpacity="0.92"
                        stroke={bColor}
                        strokeWidth="1.0"
                      />
                      <text
                        x="0"
                        y="0"
                        fill="#FFFFFF"
                        fontSize="8.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                        alignmentBaseline="central"
                      >
                        {formatTimecode(currentBall.t)}
                      </text>
                    </g>
                  </g>
                );
              })()
            )}
          </svg>

          {/* Interactive Hover Tooltip Overlay */}
          {hoveredPoint && (
            <div className="absolute top-3 left-3 bg-[#080B10]/95 border border-emerald-500/40 rounded-xl p-2.5 text-[10px] font-mono text-slate-300 pointer-events-none z-30 shadow-lg space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: hoveredPoint.color }}
                ></span>
                <span className="font-bold text-white">
                  {hoveredPoint.team === 'Team A'
                    ? teamAName
                    : hoveredPoint.team === 'Team B'
                    ? teamBName
                    : 'Unknown / Contested'}
                </span>
                <span className="text-emerald-400 font-semibold">
                  {formatTimecode(hoveredPoint.t)}
                </span>
              </div>
              <div className="text-slate-400">
                <span>Speed: {hoveredPoint.speed} %/s</span>
                <span className="mx-1">·</span>
                <span>Frame: {hoveredPoint.frame}</span>
                {hoveredPoint.isInterpolated && (
                  <span className="ml-1 text-amber-400 font-medium">(Estimated Bridge)</span>
                )}
              </div>
              <div className="text-[9px] text-emerald-400/80">Click point to jump video playhead</div>
            </div>
          )}

          {/* Footer Navigation Hints */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-400 pointer-events-none z-20">
            <div className="flex items-center gap-1.5 bg-[#080B10]/90 px-2 py-0.5 rounded border border-[#253244]">
              <Compass className="w-3 h-3 text-emerald-400" />
              <span>Click any path point to seek video</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#080B10]/90 px-2 py-0.5 rounded border border-[#253244]">
              <Clock className="w-3 h-3 text-sky-400" />
              <span>Current Time: {formatTimecode(currentTime)} / {formatTimecode(duration)}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Missing Ball Tracking State */
        <div className="p-8 rounded-2xl bg-[#080B10] border border-[#253244] text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-slate-800/60 text-slate-400">
            <Info className="w-6 h-6 text-amber-400" />
          </div>
          <h4 className="text-sm font-semibold text-white">No Ball Trajectory Available</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Ball tracking trajectory requires detected ball frames in <code className="font-mono text-slate-300">frame_tracking</code>. Upload a match video or run analysis to view the top-down 2D trajectory trace.
          </p>
        </div>
      )}

      {/* 3. Summary Statistics Row */}
      {summary && hasTracking && (
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {/* Detected Ball Frames */}
            <div className="p-3 bg-[#080B10] border border-[#253244] rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Detected Ball Frames</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-base sm:text-lg font-bold font-mono text-white">
                  {summary.detectedBallFrames ?? 0}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  / {summary.totalFrames ?? 0} frames
                </span>
              </div>
              <span className="text-[9px] font-mono text-emerald-400/80 mt-0.5">YOLO Detections</span>
            </div>

            {/* Interpolated Trajectory Points */}
            <div className="p-3 bg-[#080B10] border border-[#253244] rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Estimated Bridges</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-base sm:text-lg font-bold font-mono text-amber-300">
                  {summary.interpolatedBallFrames ?? 0}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  points
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 mt-0.5">Short gaps &le; 0.35s</span>
            </div>

            {/* Team A Trajectory Share (Estimated) */}
            <div className="p-3 bg-[#080B10] border border-[#253244] rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase">{teamAName} (Est.)</span>
                <span className="w-2 h-2 rounded-full bg-[#38BDF8]"></span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-base sm:text-lg font-bold font-mono text-[#38BDF8]">
                  {summary.possessionPct?.['Team A'] ?? 0}%
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                {summary.possessionPoints?.['Team A'] ?? summary.possessionFrames?.['Team A'] ?? 0} samples
              </span>
            </div>

            {/* Team B Trajectory Share (Estimated) */}
            <div className="p-3 bg-[#080B10] border border-[#253244] rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase">{teamBName} (Est.)</span>
                <span className="w-2 h-2 rounded-full bg-[#F43F5E]"></span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-base sm:text-lg font-bold font-mono text-[#F43F5E]">
                  {summary.possessionPct?.['Team B'] ?? 0}%
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                {summary.possessionPoints?.['Team B'] ?? summary.possessionFrames?.['Team B'] ?? 0} samples
              </span>
            </div>

            {/* Contested / Open Play (Estimated) */}
            <div className="p-3 bg-[#080B10] border border-[#253244] rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Contested / Open</span>
                <span className="w-2 h-2 rounded-full bg-[#94A3B8]"></span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-base sm:text-lg font-bold font-mono text-slate-300">
                  {summary.possessionPct?.['Unknown'] ?? 0}%
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                {summary.possessionPoints?.['Unknown'] ?? summary.possessionFrames?.['Unknown'] ?? 0} samples
              </span>
            </div>
          </div>

          {/* Conservative Attribution Disclaimer */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1 pt-1">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-400 shrink-0" />
              <span>
                * Team attribution is <strong>estimated</strong> based on spatial proximity and directional momentum in normalized broadcast coordinates; not official FIFA match possession statistics.
              </span>
            </span>
            <span className="hidden md:inline text-slate-600">
              {summary.segmentsCount ?? 0} continuous segments
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BallTrajectoryAnalysisPanel;
