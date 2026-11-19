import React, { useMemo } from 'react';
import { Eye, Crosshair, Zap, Maximize2, Minimize2 } from 'lucide-react';
import {
  calculatePlayerSpeeds,
  resolvePlayerSpeed,
  DEFAULT_SPEED_RECORD,
} from '../../utils/speedEstimator';

function formatTimecode(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00.0';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
}

/**
 * CameraRelativeMiniMap
 * Displays real-time synchronized player and ball positions in normalized
 * camera-view coordinates (0-100% of video frame width and height) along with
 * movement speed indicators (Idle, Moving, Fast movement).
 *
 * NOTE: Positions represent the original broadcast camera view,
 * not 2D calibrated FIFA pitch coordinates.
 */
export const CameraRelativeMiniMap = ({
  frameRecord,
  currentTime = 0,
  duration = 90,
  selectedPlayerId = null,
  onSelectPlayer = null,
  heightClass = 'h-72 sm:h-80 md:h-[340px]',
  teamAName = 'Team A',
  teamBName = 'Team B',
  teamAColor = '#38BDF8',
  teamBColor = '#F43F5E',
  speedData = null,
  playerSpeedData = null,
  playerSpeeds = null,
  frameTracking = null,
  isFullscreen = false,
  onToggleFullscreen = null,
  isPlaying = false,
  onPlayPause = null,
  onStepFrame = null,
  onSeek = null,
}) => {
  const players = frameRecord?.players || [];
  const ball = frameRecord?.ball || null;

  const rawSpeedEngine = speedData || playerSpeedData;

  // Lazily compute speedData if full frameTracking is provided without precomputed speedData
  const computedSpeedData = useMemo(() => {
    if (rawSpeedEngine || playerSpeeds || !Array.isArray(frameTracking) || frameTracking.length === 0) {
      return null;
    }
    return calculatePlayerSpeeds(frameTracking);
  }, [rawSpeedEngine, playerSpeeds, frameTracking]);

  const activeSpeedEngine = rawSpeedEngine || computedSpeedData;

  return (
    <div className="space-y-3">
      {/* Mini-Map Canvas */}
      <div
        className={`relative w-full ${
          isFullscreen
            ? 'max-w-6xl mx-auto h-[58vh] sm:h-[62vh] md:h-[65vh]'
            : heightClass
        } rounded-2xl overflow-hidden select-none border border-[#253244] shadow-panel bg-[#060D12] flex items-center justify-center`}
      >
        {/* Subtle camera field-of-view gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#06140E]/60 via-[#071710]/80 to-[#06140E]/60 pointer-events-none"></div>

        {/* Framing Corner Brackets */}
        <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-emerald-500/40 pointer-events-none rounded-tl-sm z-10"></div>
        {!onToggleFullscreen && (
          <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-emerald-500/40 pointer-events-none rounded-tr-sm z-10"></div>
        )}
        <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-500/40 pointer-events-none rounded-bl-sm z-10"></div>
        <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-500/40 pointer-events-none rounded-br-sm z-10"></div>

        {/* Optional Fullscreen Toggle Button on Canvas Top-Right */}
        {onToggleFullscreen && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFullscreen();
            }}
            className="absolute top-2.5 right-2.5 z-30 p-1.5 rounded-lg bg-[#080B10]/90 hover:bg-[#17212E] text-slate-300 hover:text-white border border-[#253244] text-xs font-mono transition-all flex items-center gap-1 shadow-md active:scale-95"
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Expand Fullscreen'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] hidden sm:inline">Exit</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-slate-300 hover:text-emerald-400" />
                <span className="text-[10px] hidden sm:inline">Fullscreen</span>
              </>
            )}
          </button>
        )}

        {/* Rule-of-Thirds Framing Guides (Subtle camera perspective grid) */}
        <div className="absolute inset-2 grid grid-cols-3 grid-rows-3 pointer-events-none border border-white/[0.04] z-0">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-white/[0.04]"></div>
          ))}
        </div>

        {/* Center Optical Axis Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-20">
          <Crosshair className="w-8 h-8 text-emerald-400 stroke-1" />
        </div>

        {/* Dynamic Tracked Players (Normalized Camera Viewport) */}
        {players.map((p) => {
          if (p.x == null || p.y == null) return null;

          const isSelected = p.id === selectedPlayerId;
          const isTeamA = p.team === 'Team A';
          const isTeamB = p.team === 'Team B';
          const isReferee = p.team === 'Referee';

          const speedInfo = resolvePlayerSpeed(activeSpeedEngine, frameRecord, p.id);
          const displaySpeed = speedInfo.speedVal;
          const isMoving = speedInfo.tier === 'moving';
          const isFast = speedInfo.tier === 'fast';

          // Team-specific badge colors
          let badgeClass = 'bg-slate-500 text-white border-slate-300';
          let ringColorClass = 'border-slate-400/60 ring-slate-400/40';

          if (isTeamA) {
            badgeClass = 'bg-sky-400 text-black border-white/80 shadow-sky-500/50';
            ringColorClass = 'border-sky-400/80 ring-sky-400/60';
          } else if (isTeamB) {
            badgeClass = 'bg-rose-500 text-white border-white/80 shadow-rose-500/50';
            ringColorClass = 'border-rose-500/80 ring-rose-500/60';
          } else if (isReferee) {
            badgeClass = 'bg-amber-400 text-black border-white/80 shadow-amber-500/50';
            ringColorClass = 'border-amber-400/80 ring-amber-400/60';
          }

          // Clamp markers safely within canvas boundaries (avoid edge clipping)
          const leftPct = Math.max(3, Math.min(97, p.x));
          const topPct = Math.max(4, Math.min(96, p.y));

          return (
            <div
              key={p.id}
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectPlayer) onSelectPlayer(p.id);
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto transition-all duration-100 ease-linear hover:scale-125 group z-20"
              style={{ left: `${leftPct}%`, top: `${topPct}%` }}
              title={`${p.team} #${p.id} — Speed: ${displaySpeed} (${speedInfo.label}) (Frame: ${p.x}%, ${p.y}%)`}
            >
              {/* Outer Motion Ring for "Moving" tier */}
              {isMoving && (
                <span
                  className={`absolute -inset-1 rounded-full border border-dashed ${ringColorClass} opacity-80 pointer-events-none animate-spin-slow`}
                  style={{ animationDuration: '4s' }}
                />
              )}

              {/* High-Intensity Motion Rings for "Fast movement" tier */}
              {isFast && (
                <>
                  <span className="absolute -inset-1.5 rounded-full border border-amber-400 animate-ping opacity-35 pointer-events-none" />
                  <span className="absolute -inset-1 rounded-full ring-2 ring-amber-400 ring-offset-1 ring-offset-[#060D12] pointer-events-none" />
                </>
              )}

              {/* Main Player Badge showing live numerical speed instead of player ID */}
              <div
                className={`relative px-1 min-w-[22px] sm:min-w-[26px] h-5 sm:h-6 rounded-full flex items-center justify-center font-mono font-bold text-[8.5px] sm:text-[9.5px] tracking-tight shadow border transition-all ${badgeClass} ${
                  isSelected ? 'ring-2 ring-emerald-400 scale-125 z-30' : ''
                }`}
              >
                {displaySpeed}

                {/* Small Lightning Indicator on Fast Movement */}
                {isFast && (
                  <span
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-md border border-[#060D12] z-30 pointer-events-none"
                    title="Fast movement"
                  >
                    <Zap className="w-2 h-2 fill-black stroke-black" />
                  </span>
                )}
              </div>

              {/* Enhanced Hover Tooltip with Player ID, Movement Speed & Category */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center bg-[#080B10]/95 backdrop-blur-sm text-white text-[9px] font-mono px-2.5 py-1 rounded-md border border-[#253244] whitespace-nowrap z-30 shadow-xl pointer-events-none">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">{p.team}</span>
                  <span className="text-emerald-400 font-semibold">#{p.id}</span>
                  <span className="text-slate-400 font-normal">({p.x}%, {p.y}%)</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[8.5px] border-t border-[#253244] pt-0.5 w-full justify-between">
                  <span className="text-slate-400">Speed:</span>
                  <span className="font-semibold text-white">{displaySpeed}</span>
                  <span
                    className={`px-1 py-0.2 rounded text-[7.5px] font-bold uppercase tracking-wider ${
                      isFast
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                        : isMoving
                        ? 'bg-sky-400/20 text-sky-300 border border-sky-400/40'
                        : 'bg-slate-700/50 text-slate-300 border border-slate-600'
                    }`}
                  >
                    {speedInfo.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Validated Ball Marker */}
        {ball && ball.x != null && ball.y != null && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 transition-all duration-100 ease-linear group"
            style={{
              left: `${Math.max(2, Math.min(98, ball.x))}%`,
              top: `${Math.max(2, Math.min(98, ball.y))}%`,
            }}
            title={`Football (${ball.x}%, ${ball.y}%)`}
          >
            <div className="relative flex items-center justify-center">
              <span className="absolute w-5 h-5 rounded-full bg-yellow-400/40 animate-ping pointer-events-none"></span>
              <div className="w-3 h-3 rounded-full bg-yellow-300 border-2 border-white shadow-md shadow-yellow-400/90 relative z-10"></div>
            </div>
          </div>
        )}

        {/* Empty state when no players are detected in active frame */}
        {players.length === 0 && (
          <div className="text-center p-4 text-slate-500 font-mono text-xs z-10">
            No on-pitch players detected in current frame
          </div>
        )}

        {/* Top-Left Viewport Badge */}
        <div className="absolute top-2.5 left-8 flex items-center gap-1.5 bg-[#080B10]/85 px-2 py-0.5 rounded text-[9px] font-mono text-slate-300 border border-[#253244] z-10 pointer-events-none">
          <Eye className="w-3 h-3 text-emerald-400" />
          <span>Camera Viewport</span>
        </div>

        {/* Bottom Status & Calibration Disclaimer */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-400 pointer-events-none z-10">
          <div className="flex items-center gap-1.5 bg-[#080B10]/90 px-2 py-0.5 rounded border border-[#253244]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Positions represent the camera view, not calibrated pitch coordinates.</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-[#080B10]/90 px-2 py-0.5 rounded border border-[#253244] text-[9px] text-slate-400">
            <span>Normalized: 0–100%</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Synchronized Scrub Bar (when in fullscreen mode and onSeek provided) */}
      {isFullscreen && onSeek && (
        <div className="bg-[#080B10] border border-[#253244] rounded-xl px-4 py-2 space-y-1.5 max-w-6xl mx-auto w-full">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="text-emerald-400 font-medium">{formatTimecode(currentTime)}</span>
            <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
              Frame {frameRecord?.frame ?? 0} · Synchronized Tactical Scrub Bar
            </span>
            <span>{formatTimecode(duration)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration || 1}
            step="0.05"
            value={currentTime}
            onChange={onSeek}
            className="w-full h-1.5 bg-[#17212E] rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
      )}

      {/* Comprehensive Mini-Map Legend: Teams & Movement Indicators */}
      <div
        className={`flex items-center justify-between flex-wrap gap-2.5 px-3 py-2 bg-[#080B10] border border-[#253244] rounded-xl text-xs font-mono ${
          isFullscreen ? 'max-w-6xl mx-auto w-full' : ''
        }`}
      >
        {/* Team & Ball Markers */}
        <div className="flex items-center gap-3 flex-wrap text-[11px]">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Teams:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 border border-white/60"></span>
            <span className="text-slate-300">{teamAName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white/60"></span>
            <span className="text-slate-300">{teamBName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white/60"></span>
            <span className="text-slate-300">Referee</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 border border-white/60"></span>
            <span className="text-slate-400">Unknown</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 border border-white/60 animate-pulse"></span>
            <span className="text-amber-300">Ball</span>
          </div>
        </div>

        {/* Movement Speed Indicators */}
        <div className="flex items-center gap-3 flex-wrap text-[11px] border-t sm:border-t-0 sm:border-l border-[#253244] pt-1.5 sm:pt-0 sm:pl-3">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Speed:</span>
          <div className="flex items-center gap-1 text-[10px]" title="Idle (< 2.0)">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-400"></span>
            <span className="text-slate-300">Idle</span>
          </div>
          <div className="flex items-center gap-1 text-[10px]" title="Moving (2.0 – 8.0)">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400/20 border border-dashed border-sky-400 ring-1 ring-sky-400/40"></span>
            <span className="text-slate-300">Moving</span>
          </div>
          <div className="flex items-center gap-1 text-[10px]" title="Fast movement (> 8.0)">
            <span className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/30 border border-amber-400 ring-2 ring-amber-400/60"></span>
              <Zap className="w-2 h-2 text-amber-300 absolute -top-1 -right-1 fill-amber-300" />
            </span>
            <span className="text-amber-300 font-semibold">Fast</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraRelativeMiniMap;
