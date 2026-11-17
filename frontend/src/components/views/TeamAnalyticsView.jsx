import React, { useState } from 'react';
import {
  BarChart3,
  Users,
  Shield,
  ArrowRight,
  Activity,
  Layers,
  Compass,
  Radar,
  Sparkles,
} from 'lucide-react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar as RadarChart } from 'react-chartjs-2';
import DemoBanner from '../common/DemoBanner';
import DemoBadge from '../common/DemoBadge';
import PitchCanvas from '../common/PitchCanvas';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export const TeamAnalyticsView = ({ data }) => {
  const [activeFormationTeam, setActiveFormationTeam] = useState('man_blue');

  const teamA = data?.team_a;
  const teamB = data?.team_b;
  const players = data?.players || [];

  // Filter players for formation preview on 2D pitch
  const displayedPlayers = players.filter((p) => p.team_id === activeFormationTeam);

  // Radar Chart comparing Tactical Profiles
  const radarData = {
    labels: [
      'Possession Control',
      'Field Tilt %',
      'Pass Accuracy',
      'Pressing Intensity (PPDA)',
      'Box Penetrations',
      'Defensive Line Height',
    ],
    datasets: [
      {
        label: teamA?.team_name || 'Manchester Blue (4-3-3)',
        data: [88, 82, 89, 78, 85, 84],
        backgroundColor: 'rgba(56, 189, 248, 0.25)',
        borderColor: '#38BDF8',
        borderWidth: 2,
        pointBackgroundColor: '#38BDF8',
      },
      {
        label: teamB?.team_name || 'London Red (4-2-3-1)',
        data: [72, 68, 84, 86, 70, 71],
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: '#EF4444',
        borderWidth: 2,
        pointBackgroundColor: '#EF4444',
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(30, 38, 56, 0.6)' },
        grid: { color: 'rgba(30, 38, 56, 0.6)' },
        pointLabels: {
          color: '#94A3B8',
          font: { family: 'Inter', size: 11, weight: '500' },
        },
        ticks: { display: false, max: 100, min: 0 },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: '#94A3B8',
          font: { family: 'Inter', size: 12 },
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: '#0F172A',
        borderColor: '#1E2638',
        borderWidth: 1,
        titleColor: '#F8FAFC',
        bodyColor: '#94A3B8',
      },
    },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <DemoBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-[#1E2638]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Team Collective Analytics & Shape</h2>
            <DemoBadge />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Macro tactical formations, team centroid coordinates, width/length compactness, and PPDA pressing.
          </p>
        </div>

        {/* Formation Team Switcher */}
        <div className="flex gap-1.5 p-1 bg-[#0A0E17] border border-[#1E2638] rounded-xl self-end sm:self-center">
          <button
            onClick={() => setActiveFormationTeam('man_blue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              activeFormationTeam === 'man_blue'
                ? 'bg-sky-500 text-black font-bold shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Man Blue (4-3-3)
          </button>
          <button
            onClick={() => setActiveFormationTeam('lon_red')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              activeFormationTeam === 'lon_red'
                ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            London Red (4-2-3-1)
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Tactical Formation Pitch (7 cols) */}
        <div className="lg:col-span-7 bg-[#0A0E17] border border-[#1E2638] rounded-2xl p-5 shadow-2xl shadow-black/60">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E2638] mb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {activeFormationTeam === 'man_blue' ? teamA?.team_name : teamB?.team_name} Tactical Shape
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Formation: {activeFormationTeam === 'man_blue' ? teamA?.formation : teamB?.formation}
              </p>
            </div>

            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              Average Centroid Position
            </span>
          </div>

          {/* Formation Pitch */}
          <PitchCanvas heightClass="h-80 sm:h-96 md:h-[400px]">
            {/* Team Centroid / Hull lines */}
            <div className="absolute inset-0 pointer-events-none z-10 opacity-30">
              <svg className="w-full h-full">
                <circle cx="50%" cy="50%" r="60" fill="none" stroke="#10B981" strokeWidth="1" strokeDasharray="3,3" />
              </svg>
            </div>

            {/* Display Lineup Nodes */}
            {displayedPlayers.map((p) => {
              const isTeamA = p.team_id === 'man_blue';

              return (
                <div
                  key={p.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto transition-transform hover:scale-125 group z-20"
                  style={{ left: `${p.pitch_x}%`, top: `${p.pitch_y}%` }}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs shadow-lg ${
                      isTeamA
                        ? 'bg-sky-400 text-black border-2 border-white'
                        : 'bg-rose-500 text-white border-2 border-white'
                    }`}
                  >
                    {p.jersey_number}
                  </div>

                  {/* Player Name Tag */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-slate-950/90 text-white text-[9px] font-mono px-1.5 py-0.2 rounded border border-slate-700 whitespace-nowrap">
                    {p.short_name}
                  </div>
                </div>
              );
            })}
          </PitchCanvas>

          {/* Tactical Width & Depth Metrics */}
          <div className="grid grid-cols-3 gap-3 mt-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#080C14] border border-[#1E2638] text-center">
              <span className="text-slate-400 block text-[9px] uppercase">Effective Width</span>
              <span className="text-white font-bold text-sm mt-0.5 block">
                {activeFormationTeam === 'man_blue' ? teamA?.team_width_m : teamB?.team_width_m} m
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#080C14] border border-[#1E2638] text-center">
              <span className="text-slate-400 block text-[9px] uppercase">Defensive Line</span>
              <span className="text-emerald-400 font-bold text-sm mt-0.5 block">
                {activeFormationTeam === 'man_blue' ? teamA?.defensive_line_m : teamB?.defensive_line_m} m
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#080C14] border border-[#1E2638] text-center">
              <span className="text-slate-400 block text-[9px] uppercase">PPDA Intensity</span>
              <span className="text-sky-400 font-bold text-sm mt-0.5 block">
                {activeFormationTeam === 'man_blue' ? teamA?.ppda : teamB?.ppda}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Tactical Radar & Head-to-Head Benchmark (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Radar Chart */}
          <div className="bg-[#0A0E17] border border-[#1E2638] rounded-2xl p-5 shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2638] mb-3">
              <h3 className="text-sm font-bold text-white tracking-tight">Tactical Profile Radar</h3>
              <DemoBadge size="xs" />
            </div>
            <div className="h-64 sm:h-72">
              <RadarChart data={radarData} options={radarOptions} />
            </div>
          </div>

          {/* Pressing & Build-up Telemetry Card */}
          <div className="bg-[#0A0E17] border border-[#1E2638] rounded-2xl p-5 shadow-2xl shadow-black/60">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-3">
              Pressing & Build-up Parameters (Phase 2 Model)
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#080C14] border border-[#1E2638]">
                <span className="text-slate-400">Pressing Intensity (PPDA)</span>
                <span className="font-mono font-bold text-white">
                  {teamA?.ppda} vs {teamB?.ppda} (Passes/Def. Action)
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#080C14] border border-[#1E2638]">
                <span className="text-slate-400">Pass Completion under Pressure</span>
                <span className="font-mono font-bold text-emerald-400">83.2% vs 76.5%</span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#080C14] border border-[#1E2638]">
                <span className="text-slate-400">High-Turnover Recoveries (&lt;40m)</span>
                <span className="font-mono font-bold text-sky-400">14 vs 9</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamAnalyticsView;
