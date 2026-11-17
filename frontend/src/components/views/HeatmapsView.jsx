import React, { useState } from 'react';
import {
  Flame,
  Grid,
  Info,
  Sliders,
} from 'lucide-react';
import DemoBanner from '../common/DemoBanner';
import DemoBadge from '../common/DemoBadge';
import PitchCanvas from '../common/PitchCanvas';

export const HeatmapsView = ({ data }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState(17);
  const [metricMode, setMetricMode] = useState('occupancy'); // 'occupancy' | 'sprints' | 'defensive'
  const [matchPeriod, setMatchPeriod] = useState('full'); // 'full' | '1h' | '2h'
  const [showTacticalGrid, setShowTacticalGrid] = useState(false);
  const [opacity, setOpacity] = useState(0.8);

  const players = data?.players || [];
  const selectedPlayer = players.find((p) => p.id === selectedPlayerId) || players[0];

  // Modeled heat density clusters for preview
  const heatClusters = selectedPlayer?.heatmap_clusters || [
    { x: '65%', y: '35%', size: '200px', intensity: 'rgba(239, 68, 68, 0.65)' },
    { x: '72%', y: '38%', size: '150px', intensity: 'rgba(245, 158, 11, 0.70)' },
    { x: '55%', y: '42%', size: '190px', intensity: 'rgba(16, 185, 129, 0.40)' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <DemoBanner />

      {/* Header & Quick Player Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-[#253244]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Spatial Position Heatmaps</h2>
            <DemoBadge label="MODELED DENSITY" />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            2D Gaussian Kernel Density Estimation (KDE) pitch occupancy preview.
          </p>
        </div>

        {/* Player Switcher */}
        <div className="flex flex-wrap gap-1 p-1 bg-[#101722] border border-[#253244] rounded-xl self-end sm:self-center">
          {players.slice(0, 5).map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlayerId(p.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                selectedPlayerId === p.id
                  ? 'bg-emerald-500 text-black font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              #{p.jersey_number} {p.short_name}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#101722] border border-[#253244] rounded-2xl text-xs shadow-panel">
        <div className="flex flex-wrap items-center gap-3">
          {/* Metric Mode Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[10px] uppercase">Metric:</span>
            <div className="flex gap-1 bg-[#080B10] p-1 rounded-lg border border-[#253244] text-[11px] font-mono">
              <button
                onClick={() => setMetricMode('occupancy')}
                className={`px-2.5 py-0.5 rounded transition-colors ${
                  metricMode === 'occupancy' ? 'bg-[#17212E] text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Touches
              </button>
              <button
                onClick={() => setMetricMode('sprints')}
                className={`px-2.5 py-0.5 rounded transition-colors ${
                  metricMode === 'sprints' ? 'bg-[#17212E] text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sprints (&gt;25km/h)
              </button>
              <button
                onClick={() => setMetricMode('defensive')}
                className={`px-2.5 py-0.5 rounded transition-colors ${
                  metricMode === 'defensive' ? 'bg-[#17212E] text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Defensive Press
              </button>
            </div>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[10px] uppercase">Half:</span>
            <div className="flex gap-1 bg-[#080B10] p-1 rounded-lg border border-[#253244] text-[11px] font-mono">
              <button
                onClick={() => setMatchPeriod('full')}
                className={`px-2 py-0.5 rounded ${matchPeriod === 'full' ? 'bg-[#17212E] text-white font-bold' : 'text-slate-400'}`}
              >
                Full 90'
              </button>
              <button
                onClick={() => setMatchPeriod('1h')}
                className={`px-2 py-0.5 rounded ${matchPeriod === '1h' ? 'bg-[#17212E] text-white font-bold' : 'text-slate-400'}`}
              >
                1st Half
              </button>
              <button
                onClick={() => setMatchPeriod('2h')}
                className={`px-2 py-0.5 rounded ${matchPeriod === '2h' ? 'bg-[#17212E] text-white font-bold' : 'text-slate-400'}`}
              >
                2nd Half
              </button>
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#253244]">
            <span className="text-slate-400 font-mono text-[10px] uppercase">Opacity:</span>
            <input
              type="range"
              min="0.3"
              max="1.0"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-16 h-1 bg-[#080B10] rounded appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>

        {/* Grid Toggle & Density Legend */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowTacticalGrid(!showTacticalGrid)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] border transition-colors ${
              showTacticalGrid
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-[#17212E] text-slate-400 border-[#253244]'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>18 Zones Grid</span>
          </button>

          {/* Legend */}
          <div className="hidden sm:flex items-center gap-2 font-mono text-[10px]">
            <span className="text-slate-400">Turf</span>
            <div className="w-20 h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-600"></div>
            <span className="text-rose-400 font-medium">Peak Hotspot</span>
          </div>
        </div>
      </div>

      {/* Main Heatmap Pitch Canvas */}
      <div className="bg-[#101722] border border-[#253244] rounded-2xl p-5 sm:p-6 shadow-panel">
        <div className="flex items-center justify-between pb-3 border-b border-[#253244] mb-3">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              <span>
                {selectedPlayer?.name} (#{selectedPlayer?.jersey_number}) • Pitch Density Canvas
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Operating Zone: {selectedPlayer?.role} • Team: {selectedPlayer?.team_name}
            </p>
          </div>

          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
            {metricMode.toUpperCase()} FILTER
          </span>
        </div>

        {/* 2D Pitch Canvas with Gaussian Density Kernels */}
        <PitchCanvas
          showGrid={showTacticalGrid}
          heightClass="h-96 sm:h-[420px] md:h-[480px]"
        >
          {/* Simulated 2D Gaussian Heat Kernels */}
          {heatClusters.map((pt, idx) => (
            <div
              key={idx}
              className="absolute rounded-full pointer-events-none filter blur-2xl transition-all duration-500 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: pt.x,
                top: pt.y,
                width: pt.size,
                height: pt.size,
                backgroundColor: pt.intensity,
                opacity: opacity,
              }}
            ></div>
          ))}

          {/* Center Point Indicator */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
            style={{ left: `${selectedPlayer?.pitch_x}%`, top: `${selectedPlayer?.pitch_y}%` }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-white border-2 border-emerald-400 shadow-sm shadow-emerald-400"></div>
          </div>
        </PitchCanvas>

        {/* Mathematical Formulation Explanatory Box */}
        <div className="mt-4 p-3.5 rounded-xl bg-[#080B10] border border-[#253244] flex items-start gap-3 text-xs text-slate-300">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white">Mathematical Implementation Specification (Phase 2):</p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Upon Phase 2 integration, player bounding box base-midpoints will be projected to real pitch meters ($X, Y$) via the OpenCV homography matrix $H$. A continuous 2D Gaussian Kernel Density Estimation (KDE) using `scipy.stats.gaussian_kde` evaluates point density over a $105 \times 68$ spatial grid.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapsView;
