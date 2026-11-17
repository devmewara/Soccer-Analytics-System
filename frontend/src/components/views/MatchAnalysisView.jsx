import React, { useState } from 'react';
import { PlayCircle, Target, ArrowRight, Shield, Sparkles, Eye } from 'lucide-react';
import DemoBanner from '../common/DemoBanner';
import DemoBadge from '../common/DemoBadge';

export const MatchAnalysisView = () => {
  const [selectedZone, setSelectedZone] = useState('finalThird');

  const zoneData = {
    defensiveThird: {
      title: 'Defensive Third (Zone 1)',
      passes: '184 passes (92% completion)',
      possessionTime: '24% of ball time',
      actions: '14 clearances, 8 interceptions',
    },
    middleThird: {
      title: 'Middle Third / Midfield (Zone 2)',
      passes: '298 passes (89% completion)',
      possessionTime: '52% of ball time',
      actions: '22 progressive carries, 11 turnovers won',
    },
    finalThird: {
      title: 'Final Third / Attacking Box (Zone 3)',
      passes: '130 passes (78% completion)',
      possessionTime: '24% of ball time',
      actions: '7 shots on target, 14 box entries, 2 goals',
    },
  };

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Tactical Match Analysis</h2>
            <DemoBadge />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            2D Pitch projection & tactical event breakdown. Computer vision video frame analysis will feed this directly in Phase 2.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-emerald-400">
          <Eye className="w-3.5 h-3.5" />
          <span>Pitch Homography: Calibration Stub</span>
        </div>
      </div>

      {/* Interactive 2D Pitch Layout */}
      <div className="bg-[#0D131F] border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/40">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span>2D Tactical Pitch Canvas</span>
            <span className="text-[10px] text-slate-400 font-normal font-mono">(Click zone to inspect)</span>
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedZone('defensiveThird')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                selectedZone === 'defensiveThird'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400'
              }`}
            >
              Defensive Third
            </button>
            <button
              onClick={() => setSelectedZone('middleThird')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                selectedZone === 'middleThird'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400'
              }`}
            >
              Middle Third
            </button>
            <button
              onClick={() => setSelectedZone('finalThird')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                selectedZone === 'finalThird'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400'
              }`}
            >
              Final Third
            </button>
          </div>
        </div>

        {/* Pitch Graphic Representation */}
        <div className="mt-5 relative w-full h-80 rounded-xl overflow-hidden border-2 border-emerald-500/40 bg-[#0a2313] flex items-center justify-center">
          {/* Pitch markings */}
          <div className="absolute inset-0 border border-white/20 m-3 rounded">
            {/* Halfway line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/20"></div>
            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border border-white/20 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
            </div>
            {/* Left Penalty Box */}
            <div className="absolute top-1/4 bottom-1/4 left-0 w-24 border-r border-y border-white/20"></div>
            {/* Right Penalty Box */}
            <div className="absolute top-1/4 bottom-1/4 right-0 w-24 border-l border-y border-white/20"></div>
          </div>

          {/* Tactical Zone Highlight Overlays */}
          {selectedZone === 'defensiveThird' && (
            <div className="absolute top-3 bottom-3 left-3 w-1/3 bg-emerald-500/15 border-r-2 border-dashed border-emerald-400 flex items-center justify-center">
              <span className="font-mono text-xs font-bold text-emerald-300 bg-slate-950/80 px-2 py-1 rounded border border-emerald-500/30">
                Defensive Third Active
              </span>
            </div>
          )}
          {selectedZone === 'middleThird' && (
            <div className="absolute top-3 bottom-3 left-1/3 w-1/3 bg-sky-500/15 border-x-2 border-dashed border-sky-400 flex items-center justify-center">
              <span className="font-mono text-xs font-bold text-sky-300 bg-slate-950/80 px-2 py-1 rounded border border-sky-500/30">
                Midfield Hub Active
              </span>
            </div>
          )}
          {selectedZone === 'finalThird' && (
            <div className="absolute top-3 bottom-3 right-3 w-1/3 bg-amber-500/15 border-l-2 border-dashed border-amber-400 flex items-center justify-center">
              <span className="font-mono text-xs font-bold text-amber-300 bg-slate-950/80 px-2 py-1 rounded border border-amber-500/30">
                Attacking Zone Active
              </span>
            </div>
          )}

          {/* Sample Player Position Markers */}
          <div className="absolute left-[20%] top-[40%] flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-sky-500 text-black font-bold text-[10px] flex items-center justify-center border border-white">
              3
            </span>
            <span className="text-[9px] font-mono text-white/80 mt-0.5">Dias</span>
          </div>

          <div className="absolute left-[48%] top-[50%] flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-sky-500 text-black font-bold text-[10px] flex items-center justify-center border border-white shadow-lg shadow-sky-500/50">
              17
            </span>
            <span className="text-[9px] font-mono text-white/80 mt-0.5">KDB</span>
          </div>

          <div className="absolute right-[22%] top-[35%] flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-sky-500 text-black font-bold text-[10px] flex items-center justify-center border border-white">
              9
            </span>
            <span className="text-[9px] font-mono text-white/80 mt-0.5">Haaland</span>
          </div>

          {/* Ball Marker */}
          <div className="absolute left-[54%] top-[45%] flex flex-col items-center animate-bounce">
            <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-amber-400 shadow-md shadow-white"></div>
          </div>
        </div>

        {/* Selected Zone Analysis Breakdown */}
        <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              {zoneData[selectedZone].title}
            </h4>
            <p className="text-xs text-slate-400 mt-1">{zoneData[selectedZone].actions}</p>
          </div>
          <div className="flex gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">PASS DENSITY</span>
              <span className="text-emerald-400 font-semibold">{zoneData[selectedZone].passes}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">TIME IN ZONE</span>
              <span className="text-sky-400 font-semibold">{zoneData[selectedZone].possessionTime}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchAnalysisView;
