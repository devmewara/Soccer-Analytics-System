import React from 'react';
import { BarChart3, Users, Shield, ArrowRight, Activity, Percent } from 'lucide-react';
import DemoBanner from '../common/DemoBanner';
import DemoBadge from '../common/DemoBadge';

export const TeamAnalyticsView = () => {
  return (
    <div className="space-y-6">
      <DemoBanner />

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Team Collective Analytics</h2>
            <DemoBadge />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Macro-level tactical metrics, team width, pressing intensity, and formation structure.
          </p>
        </div>

        <span className="text-xs font-mono bg-sky-500/10 border border-sky-500/20 text-sky-400 px-3 py-1.5 rounded-lg">
          Formation: 4-3-3 vs 4-2-3-1 (Demo)
        </span>
      </div>

      {/* Team Formations & Structure Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team A Card */}
        <div className="bg-[#0D131F] border border-slate-800 rounded-2xl p-6 shadow-lg shadow-black/30">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-400"></span>
                <h3 className="text-base font-bold text-white">Manchester Blue</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">Shape: 4-3-3 Positional</p>
            </div>
            <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-1 rounded">
              58.4% Possession
            </span>
          </div>

          <div className="mt-5 space-y-4 text-xs">
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Average Team Width</span>
              <span className="font-mono font-bold text-white">48.2 meters (Demo)</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Defensive Line Height</span>
              <span className="font-mono font-bold text-emerald-400">54.6m (High Line)</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Pressing Intensity (PPDA)</span>
              <span className="font-mono font-bold text-white">8.4 passes per defensive action</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Passing Sequences (10+ passes)</span>
              <span className="font-mono font-bold text-white">19 sequences</span>
            </div>
          </div>
        </div>

        {/* Team B Card */}
        <div className="bg-[#0D131F] border border-slate-800 rounded-2xl p-6 shadow-lg shadow-black/30">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <h3 className="text-base font-bold text-white">London Red</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">Shape: 4-2-3-1 Counter-Press</p>
            </div>
            <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded">
              41.6% Possession
            </span>
          </div>

          <div className="mt-5 space-y-4 text-xs">
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Average Team Width</span>
              <span className="font-mono font-bold text-white">42.8 meters (Demo)</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Defensive Line Height</span>
              <span className="font-mono font-bold text-rose-400">46.1m (Mid Block)</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Pressing Intensity (PPDA)</span>
              <span className="font-mono font-bold text-white">11.2 passes per defensive action</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Counter-Attack Transitions</span>
              <span className="font-mono font-bold text-white">12 fast breaks</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamAnalyticsView;
