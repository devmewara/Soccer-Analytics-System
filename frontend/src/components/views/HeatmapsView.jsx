import React, { useState } from 'react';
import {
  Flame,
  Layers,
  User,
  Sliders,
  Eye,
  Info,
  Grid,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import DemoBanner from '../common/DemoBanner';
import DemoBadge from '../common/DemoBadge';
import PitchCanvas from '../common/PitchCanvas';

export const HeatmapsView = ({ data }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState(17);
  const [metricMode, setMetricMode] = useState('occupancy'); // 'occupancy' | 'sprints' | 'defensive'
  const [matchPeriod, setMatchPeriod] = useState('full'); // 'full' | '1h' | '2h'
  const [showTacticalGrid, setShowTacticalGrid] = useState(false);
  const [opacity, setOpacity] = useState(0.85);

  const players = data?.players || [];
  const selectedPlayer = players.find((p) => p.id === selectedPlayerId) || players[0];

  // Tactical heat clusters defined per player in mockData.js
  const heatClusters = selectedPlayer?.heatmap_clusters || [
    { x: '65%', y: '35%', size: '200px', intensity: 'rgba(239, 68, 68, 0.70)' },
    { x: '72%', y: '38%', size: '150px', intensity: 'rgba(245, 158, 11, 0.75)' },
    { x: '55%', y: '42%', size: '190px', intensity: 'rgba(16, 185, 129, 0.45)' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <DemoBanner />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-[#1E2638]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Spatial Position Heatmaps</h2>
            <DemoBadge />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            2D Gaussian Kernel Density Estimation (KDE) projected across pitch metric coordinates.
          </p>
        </div>

        {/* Player Quick Switcher Buttons */}
        <div className="flex flex-wrap gap-1 p-1 bg-[#0A0E17] border border-[#1E2638] rounded-xl self-end sm:self-center">
          {players.slice(0, 5).map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlayerId(p.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                selectedPlayerId === p.id
                  ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              #{p.jersey_number} {p.short_name}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#0A0E17] border border-[#1E2638] rounded-2xl text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Metric Mode Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[10px] uppercase">Metric:</span>
            <div className="flex gap-1 bg-[#080C14] p-1 rounded-lg border border-[#1E2638] text-[11px] font-mono">
              <button
                onClick={() => setMetricMode('occupancy')}
                className={`px-2.5 py-0.5 rounded transition-colors ${
                  metricMode === 'occupancy' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Touches
              </button>
              <button
                onClick={() => setMetricMode('sprints')}
                className={`px-2.5 py-0.5 rounded transition-colors ${
                  metricMode === 'sprints' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sprints (&gt;25km/h)
              </button>
              <button
                onClick={() => setMetricMode('defensive')}
                className={`px-2.5 py-0.5 rounded transition-colors ${
                  metricMode === 'defensive' ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Defensive Press
              </button>
            </div>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[10px] uppercase">Half:</span>
            <div className="flex gap-1 bg-[#080C14] p-1 rounded-lg border border-[#1E2638] text-[11px] font-mono">
              <button
                onClick={() => setMatchPeriod('full')}
                className={`px-2 py-0.5 rounded ${matchPeriod === 'full' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
              >
                Full 90'
              </button>
              <button
                onClick={() => setMatchPeriod('1h')}
                className={`px-2 py-0.5 rounded ${matchPeriod === '1h' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
              >
                1st Half
              </button>
              <button
                onClick={() => setMatchPeriod('2h')}
                className={`px-2 py-0.5 rounded ${matchPeriod === '2h' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
              >
                2nd Half
              </button>
            </div>
          </div>
        </div>

        {/* Grid Toggle & Density Legend */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowTacticalGrid(!showTacticalGrid)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] border transition-colors ${
              showTacticalGrid
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>18 Zones Grid</span>
          </button>

          {/* Legend */}
          <div className="hidden sm:flex items-center gap-2 font-mono text-[10px]">
            <span className="text-slate-400">Turf</span>
            <div className="w-20 h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-600"></div>
            <span className="text-rose-400 font-bold">Peak Hotspot</span>
          </div>
        </div>
      </div>

      {/* Main Heatmap Pitch Canvas */}
      <div className="bg-[#0A0E17] border border-[#1E2638] rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2638] mb-3">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              <span>
                {selectedPlayer?.name} (#{selectedPlayer?.jersey_number}) • Spatial Density Canvas
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
              className="absolute rounded-full pointer-events-none filter blur-2xl transition-all duration-700 -translate-x-1/2 -translate-y-1/2"
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
            <div className="w-3 h-3 rounded-full bg-white border-2 border-emerald-400 shadow-md shadow-emerald-400 animate-ping"></div>
          </div>
        </PitchCanvas>

        {/* Mathematical Formulation Explanatory Box */}
        <div className="mt-4 p-4 rounded-xl bg-[#080C14] border border-[#1E2638] flex items-start gap-3 text-xs text-slate-300">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white">Mathematical Implementation Specification (Phase 2):</p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Upon Phase 2 integration, player bounding box base-midpoints are converted to real pitch meters ($X, Y$) via the OpenCV homography calibration matrix $H$. A continuous 2D Gaussian Kernel Density Estimation (KDE) using `scipy.stats.gaussian_kde` evaluates the point density over a $105 \times 68$ spatial grid.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapsView;
