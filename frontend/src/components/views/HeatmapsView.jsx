import React, { useState } from 'react';
import { Flame, Layers, User, Eye, Info } from 'lucide-react';
import DemoBanner from '../common/DemoBanner';
import DemoBadge from '../common/DemoBadge';

export const HeatmapsView = () => {
  const [selectedPlayer, setSelectedPlayer] = useState('kdb');

  const playerProfiles = {
    kdb: {
      name: 'Kevin De Bruyne',
      number: 17,
      role: 'Right Half-Space Playmaker',
      team: 'Manchester Blue',
      hotspotDesc: 'Dense operating zone focused in the right half-space channel and intermediate attacking third.',
      // CSS gradient positions for simulated Gaussian heat kernels
      heatpoints: [
        { x: '68%', y: '35%', size: '180px', intensity: 'rgba(239, 68, 68, 0.65)' },
        { x: '72%', y: '40%', size: '130px', intensity: 'rgba(245, 158, 11, 0.75)' },
        { x: '55%', y: '45%', size: '200px', intensity: 'rgba(16, 185, 129, 0.45)' },
      ],
    },
    saka: {
      name: 'Bukayo Saka',
      number: 7,
      role: 'Right Wing Touchline Hugger',
      team: 'London Red',
      hotspotDesc: 'High concentration along the right touchline with diagonal attacking surges into the penalty box.',
      heatpoints: [
        { x: '78%', y: '18%', size: '190px', intensity: 'rgba(239, 68, 68, 0.70)' },
        { x: '85%', y: '25%', size: '140px', intensity: 'rgba(245, 158, 11, 0.8)' },
        { x: '60%', y: '18%', size: '170px', intensity: 'rgba(16, 185, 129, 0.45)' },
      ],
    },
    haaland: {
      name: 'Erling Haaland',
      number: 9,
      role: 'Central Penalty Box Poacher',
      team: 'Manchester Blue',
      hotspotDesc: 'Highly concentrated central presence inside the 18-yard box and along the penalty spot.',
      heatpoints: [
        { x: '84%', y: '50%', size: '150px', intensity: 'rgba(239, 68, 68, 0.80)' },
        { x: '88%', y: '50%', size: '110px', intensity: 'rgba(245, 158, 11, 0.85)' },
        { x: '75%', y: '50%', size: '180px', intensity: 'rgba(16, 185, 129, 0.45)' },
      ],
    },
    odegaard: {
      name: 'Martin Odegaard',
      number: 8,
      role: 'Creative Midfield Anchor',
      team: 'London Red',
      hotspotDesc: 'Broad distribution across the central and right midfield thirds to orchestrate build-up play.',
      heatpoints: [
        { x: '52%', y: '42%', size: '190px', intensity: 'rgba(239, 68, 68, 0.65)' },
        { x: '58%', y: '35%', size: '140px', intensity: 'rgba(245, 158, 11, 0.75)' },
        { x: '42%', y: '50%', size: '180px', intensity: 'rgba(16, 185, 129, 0.45)' },
      ],
    },
  };

  const activeProfile = playerProfiles[selectedPlayer];

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Player Position Heatmaps</h2>
            <DemoBadge />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            2D Spatial density visualization simulating player activity clusters across 90 minutes.
          </p>
        </div>

        {/* Player Switcher */}
        <div className="flex gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {Object.entries(playerProfiles).map(([key, p]) => (
            <button
              key={key}
              onClick={() => setSelectedPlayer(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                selectedPlayer === key
                  ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              #{p.number} {p.name.split(' ').pop()}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Pitch Canvas */}
      <div className="bg-[#0D131F] border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/40">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              {activeProfile.name} (#{activeProfile.number}) • {activeProfile.team}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{activeProfile.hotspotDesc}</p>
          </div>

          {/* Heat Intensity Legend */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
            <span className="text-[10px] text-slate-400">Low Density</span>
            <div className="w-24 h-2.5 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-600"></div>
            <span className="text-[10px] text-rose-400 font-bold">Peak Hotspot</span>
          </div>
        </div>

        {/* Realistic Football Pitch with Simulated Heat Kernels */}
        <div className="mt-5 relative w-full h-96 rounded-xl overflow-hidden border-2 border-emerald-500/40 bg-[#071d11] shadow-inner">
          {/* Pitch markings */}
          <div className="absolute inset-0 border border-white/25 m-4 rounded pointer-events-none z-10">
            {/* Halfway line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/25"></div>
            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-white/25 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
            </div>
            {/* Penalty boxes */}
            <div className="absolute top-1/4 bottom-1/4 left-0 w-28 border-r border-y border-white/25"></div>
            <div className="absolute top-1/4 bottom-1/4 right-0 w-28 border-l border-y border-white/25"></div>
            {/* Goal boxes */}
            <div className="absolute top-1/3 bottom-1/3 left-0 w-12 border-r border-y border-white/25"></div>
            <div className="absolute top-1/3 bottom-1/3 right-0 w-12 border-l border-y border-white/25"></div>
          </div>

          {/* Simulated Heatmap Glow Kernels */}
          {activeProfile.heatpoints.map((pt, idx) => (
            <div
              key={idx}
              className="absolute rounded-full pointer-events-none filter blur-xl transition-all duration-700 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: pt.x,
                top: pt.y,
                width: pt.size,
                height: pt.size,
                backgroundColor: pt.intensity,
              }}
            ></div>
          ))}

          {/* Direction of attack watermark */}
          <div className="absolute bottom-6 right-8 text-xs font-mono text-white/30 z-20 flex items-center gap-1.5">
            <span>Attacking Direction</span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* Algorithm details */}
        <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-200">Phase 2 Heatmap Generation Specification:</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Once ByteTrack coordinates are projected to pitch coordinates via homography matrix `H`, a 2D Gaussian Kernel Density Estimation (KDE) using `scipy.stats.gaussian_kde` will generate continuous pitch occupancy grids in real time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapsView;
