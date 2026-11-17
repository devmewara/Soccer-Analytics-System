import React, { useState } from 'react';

/**
 * Professional 2D Football Pitch Component
 * Accurately models FIFA regulation 105m x 68m pitch proportions,
 * penalty boxes, goal areas, penalty arcs, center circle, and corner arcs.
 */
export const PitchCanvas = ({
  children,
  className = '',
  showGrid = false,
  showZones = false,
  activeZone = null,
  onZoneClick = null,
  onPitchClick = null,
  interactiveCoords = true,
  heightClass = 'h-80 sm:h-96 md:h-[420px]',
}) => {
  const [hoverCoords, setHoverCoords] = useState(null);

  const handleMouseMove = (e) => {
    if (!interactiveCoords) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    const meterX = ((xPct / 100) * 105).toFixed(1);
    const meterY = ((yPct / 100) * 68).toFixed(1);
    setHoverCoords({ x: meterX, y: meterY, xPct, yPct });
  };

  const handleMouseLeave = () => {
    setHoverCoords(null);
  };

  return (
    <div
      onClick={(e) => {
        if (onPitchClick && hoverCoords) {
          onPitchClick(hoverCoords);
        }
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full ${heightClass} rounded-2xl overflow-hidden select-none border border-[#253244] shadow-panel bg-[#0B1B13] ${className}`}
    >
      {/* Pitch Grass Stripes (Alternating mowed turf) */}
      <div className="absolute inset-0 pitch-stripes-bg opacity-90 pointer-events-none"></div>

      {/* Optional Tactical 18-Zone Positional Grid */}
      {showGrid && (
        <div className="absolute inset-3 grid grid-cols-6 grid-rows-3 pointer-events-none border border-emerald-500/10 z-0">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="border border-emerald-500/10 flex items-center justify-center"
            >
              <span className="text-[9px] font-mono text-emerald-400/30">Z{i + 1}</span>
            </div>
          ))}
        </div>
      )}

      {/* Optional Tactical Thirds Highlights */}
      {showZones && (
        <div className="absolute inset-3 flex pointer-events-auto z-10">
          {/* Defensive Third (0-33%) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (onZoneClick) onZoneClick('z_def_third');
            }}
            className={`w-1/3 h-full border-r-2 border-dashed transition-all cursor-pointer flex flex-col justify-between p-3 ${
              activeZone === 'z_def_third'
                ? 'bg-emerald-500/15 border-emerald-400'
                : 'border-white/15 hover:bg-white/5'
            }`}
          >
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-300 bg-[#080B10]/80 px-2 py-0.5 rounded border border-emerald-500/30 self-start">
              Defensive Third
            </span>
            <span className="text-[9px] font-mono text-slate-400 self-end">0m - 35m</span>
          </div>

          {/* Middle Third (33-66%) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (onZoneClick) onZoneClick('z_mid_third');
            }}
            className={`w-1/3 h-full border-r-2 border-dashed transition-all cursor-pointer flex flex-col justify-between p-3 ${
              activeZone === 'z_mid_third'
                ? 'bg-sky-500/15 border-sky-400'
                : 'border-white/15 hover:bg-white/5'
            }`}
          >
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-sky-300 bg-[#080B10]/80 px-2 py-0.5 rounded border border-sky-500/30 self-center">
              Middle Third
            </span>
            <span className="text-[9px] font-mono text-slate-400 self-center">35m - 70m</span>
          </div>

          {/* Attacking Third (66-100%) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (onZoneClick) onZoneClick('z_att_third');
            }}
            className={`w-1/3 h-full transition-all cursor-pointer flex flex-col justify-between p-3 ${
              activeZone === 'z_att_third'
                ? 'bg-amber-500/15 border-l-2 border-amber-400'
                : 'hover:bg-white/5'
            }`}
          >
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-300 bg-[#080B10]/80 px-2 py-0.5 rounded border border-amber-500/30 self-end">
              Final Third
            </span>
            <span className="text-[9px] font-mono text-slate-400 self-start">70m - 105m</span>
          </div>
        </div>
      )}

      {/* Official Pitch Geometry Markings (Calm white lines) */}
      <div className="absolute inset-3 border border-white/30 rounded-sm pointer-events-none z-0">
        {/* Halfway Line */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1.5px] bg-white/30"></div>

        {/* Center Circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-white/30 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
        </div>

        {/* Left Penalty Area */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-24 sm:w-28 h-44 sm:h-52 border-r border-y border-white/30">
          <div className="absolute top-1/2 -translate-y-1/2 left-0 w-8 sm:w-10 h-20 sm:h-24 border-r border-y border-white/30"></div>
          <div className="absolute top-1/2 -translate-y-1/2 left-16 sm:left-18 w-1.5 h-1.5 rounded-full bg-white/60"></div>
          <div className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 w-14 h-24 rounded-r-full border-r border-white/30"></div>
        </div>

        {/* Right Penalty Area */}
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-24 sm:w-28 h-44 sm:h-52 border-l border-y border-white/30">
          <div className="absolute top-1/2 -translate-y-1/2 right-0 w-8 sm:w-10 h-20 sm:h-24 border-l border-y border-white/30"></div>
          <div className="absolute top-1/2 -translate-y-1/2 right-16 sm:right-18 w-1.5 h-1.5 rounded-full bg-white/60"></div>
          <div className="absolute top-1/2 -translate-y-1/2 left-0 -translate-x-1/2 w-14 h-24 rounded-l-full border-l border-white/30"></div>
        </div>

        {/* Corner Arcs */}
        <div className="absolute top-0 left-0 w-3 h-3 border-r border-b border-white/30 rounded-br-full"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-r border-t border-white/30 rounded-tr-full"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-l border-b border-white/30 rounded-bl-full"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-l border-t border-white/30 rounded-tl-full"></div>
      </div>

      {/* Dynamic Overlays / Children */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {children}
      </div>

      {/* Coordinate & Calibration Status Footer */}
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-400 pointer-events-none z-30">
        <div className="flex items-center gap-2 bg-[#080B10]/90 px-2.5 py-1 rounded border border-[#253244]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Calibrated Pitch (105m × 68m)</span>
        </div>

        {hoverCoords && (
          <div className="bg-[#080B10]/95 px-2.5 py-1 rounded border border-emerald-500/40 text-emerald-300">
            <span>X: {hoverCoords.x}m</span>
            <span className="mx-1 text-slate-600">•</span>
            <span>Y: {hoverCoords.y}m</span>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-1.5 bg-[#080B10]/90 px-2.5 py-1 rounded border border-[#253244]">
          <span>Direction: Left &rarr; Right</span>
        </div>
      </div>
    </div>
  );
};

export default PitchCanvas;
