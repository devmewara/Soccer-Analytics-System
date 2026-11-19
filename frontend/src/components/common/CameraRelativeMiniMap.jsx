import React from 'react';
import { Eye, Crosshair, AlertCircle } from 'lucide-react';

/**
 * CameraRelativeMiniMap
 * Displays real-time synchronized player and ball positions in normalized
 * camera-view coordinates (0-100% of video frame width and height).
 *
 * NOTE: Positions represent the original broadcast camera view,
 * not 2D calibrated FIFA pitch coordinates.
 */
export const CameraRelativeMiniMap = ({
  frameRecord,
  currentTime = 0,
  selectedPlayerId = null,
  onSelectPlayer = null,
  heightClass = 'h-72 sm:h-80 md:h-[340px]',
  teamAName = 'Team A',
  teamBName = 'Team B',
  teamAColor = '#38BDF8',
  teamBColor = '#F43F5E',
}) => {
  const players = frameRecord?.players || [];
  const ball = frameRecord?.ball || null;

  return (
    <div className="space-y-3">
      {/* Mini-Map Canvas */}
      <div
        className={`relative w-full ${heightClass} rounded-2xl overflow-hidden select-none border border-[#253244] shadow-panel bg-[#060D12] flex items-center justify-center`}
      >
        {/* Subtle camera field-of-view gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#06140E]/60 via-[#071710]/80 to-[#06140E]/60 pointer-events-none"></div>

        {/* Framing Corner Brackets */}
        <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-emerald-500/40 pointer-events-none rounded-tl-sm z-10"></div>
        <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-emerald-500/40 pointer-events-none rounded-tr-sm z-10"></div>
        <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-500/40 pointer-events-none rounded-bl-sm z-10"></div>
        <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-500/40 pointer-events-none rounded-br-sm z-10"></div>

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

          // Team-specific badge colors
          let badgeClass = 'bg-slate-500 text-white border-slate-300';
          if (isTeamA) {
            badgeClass = 'bg-sky-400 text-black border-white/80 shadow-sky-500/50';
          } else if (isTeamB) {
            badgeClass = 'bg-rose-500 text-white border-white/80 shadow-rose-500/50';
          } else if (isReferee) {
            badgeClass = 'bg-amber-400 text-black border-white/80 shadow-amber-500/50';
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
              title={`${p.team} #${p.id} (Frame: ${p.x}%, ${p.y}%)`}
            >
              <div
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-mono font-bold text-[9px] sm:text-[10px] shadow border transition-all ${badgeClass} ${
                  isSelected ? 'ring-2 ring-emerald-400 scale-125 z-30' : ''
                }`}
              >
                {p.id}
              </div>

              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-[#080B10] text-white text-[9px] font-mono px-2 py-0.5 rounded border border-[#253244] whitespace-nowrap z-30 shadow-lg pointer-events-none">
                <span className="font-bold">{p.team}</span> #{p.id}
                <span className="text-slate-400 ml-1">({p.x}%, {p.y}%)</span>
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

      {/* Compact Legend */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-2 py-1.5 bg-[#080B10] border border-[#253244] rounded-xl text-xs font-mono">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Legend:</span>
        <div className="flex items-center gap-3 flex-wrap text-[11px]">
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
      </div>
    </div>
  );
};

export default CameraRelativeMiniMap;
