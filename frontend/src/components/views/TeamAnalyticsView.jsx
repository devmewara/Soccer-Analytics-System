import React, { useState } from 'react';
import {
  BarChart3,
  Users,
  Shield,
  ArrowRight,
  Activity,
  Layers,
  Compass,
  CheckCircle2,
  Info,
  Palette,
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

export const TeamAnalyticsView = ({ data, realAnalytics, isUserUploaded = false }) => {
  const [activeFormationTeam, setActiveFormationTeam] = useState('man_blue');

  // Case 1: Real computer vision analytics with jersey classification
  if (isUserUploaded && realAnalytics && realAnalytics.players) {
    const players = realAnalytics.players || [];
    const teamAPlayers = players.filter((p) => p.team === 'Team A');
    const teamBPlayers = players.filter((p) => p.team === 'Team B');
    const referees = players.filter((p) => p.team === 'Referee');
    const unknownPlayers = players.filter((p) => p.team === 'Unknown');

    const teamAColor = realAnalytics.summary_metrics.team_a_color || '#38BDF8';
    const teamBColor = realAnalytics.summary_metrics.team_b_color || '#F43F5E';

    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-[#253244]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Team Classification & Squad Analytics</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>K-MEANS TORSO COLOR CLUSTERING</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated jersey color clustering segregating players into Team A and Team B with referee and unknown outlier filtering.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono px-2.5 py-1 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/25">
              Confirmed Team A Track IDs: <strong>{teamAPlayers.length}</strong>
            </span>
            <span className="text-xs font-mono px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/25">
              Confirmed Team B Track IDs: <strong>{teamBPlayers.length}</strong>
            </span>
            {referees.length > 0 && (
              <span className="text-xs font-mono px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/25">
                Referee Track IDs: <strong>{referees.length}</strong>
              </span>
            )}
            {unknownPlayers.length > 0 && (
              <span className="text-xs font-mono px-2.5 py-1 rounded-xl bg-slate-500/10 text-slate-300 border border-slate-500/25">
                Unknown IDs: <strong>{unknownPlayers.length}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Head-to-Head Squad Breakdown Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team A Card */}
          <div className="bg-[#101722] border border-[#253244] rounded-2xl p-5 shadow-panel space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#253244]">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-sm"
                  style={{ backgroundColor: `${teamAColor}25`, color: teamAColor, border: `1px solid ${teamAColor}50` }}
                >
                  A
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Team A</h3>
                  <span className="text-[10px] font-mono text-slate-400">Tactical Tag: Blue Overlay (#38BDF8)</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2.5 py-1 rounded-lg">
                {teamAPlayers.length} Confirmed Team A Track IDs
              </span>
            </div>

            {/* Team A Players Roster */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {teamAPlayers.map((p) => (
                <div
                  key={p.track_id}
                  className="p-2.5 bg-[#080B10] border border-[#253244] rounded-xl flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold">
                      #{p.track_id}
                    </span>
                    <div>
                      <span className="text-white font-semibold">{p.label}</span>
                      <span className="text-[10px] text-slate-500 block">F#{p.first_frame} → F#{p.last_frame}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.jersey_color_rgb && (
                      <div
                        className="w-4 h-4 rounded-full border border-white/30"
                        style={{ backgroundColor: `rgb(${p.jersey_color_rgb.join(',')})` }}
                        title={`RGB(${p.jersey_color_rgb.join(', ')})`}
                      />
                    )}
                    <span className="text-emerald-400 font-bold">{p.visibility_duration_seconds}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team B Card */}
          <div className="bg-[#101722] border border-[#253244] rounded-2xl p-5 shadow-panel space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#253244]">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-sm"
                  style={{ backgroundColor: `${teamBColor}25`, color: teamBColor, border: `1px solid ${teamBColor}50` }}
                >
                  B
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Team B</h3>
                  <span className="text-[10px] font-mono text-slate-400">Tactical Tag: Rose Overlay (#F43F5E)</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-lg">
                {teamBPlayers.length} Confirmed Team B Track IDs
              </span>
            </div>

            {/* Team B Players Roster */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {teamBPlayers.map((p) => (
                <div
                  key={p.track_id}
                  className="p-2.5 bg-[#080B10] border border-[#253244] rounded-xl flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
                      #{p.track_id}
                    </span>
                    <div>
                      <span className="text-white font-semibold">{p.label}</span>
                      <span className="text-[10px] text-slate-500 block">F#{p.first_frame} → F#{p.last_frame}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.jersey_color_rgb && (
                      <div
                        className="w-4 h-4 rounded-full border border-white/30"
                        style={{ backgroundColor: `rgb(${p.jersey_color_rgb.join(',')})` }}
                        title={`RGB(${p.jersey_color_rgb.join(', ')})`}
                      />
                    )}
                    <span className="text-emerald-400 font-bold">{p.visibility_duration_seconds}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Referees & Technical Details Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Referees / Officials */}
          <div className="bg-[#101722] border border-[#253244] rounded-2xl p-5 shadow-panel space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#253244]">
              <span className="text-xs font-bold text-white uppercase font-mono">Referees & Officials</span>
              <span className="text-xs font-mono font-bold text-amber-400">{referees.length} Detected</span>
            </div>
            {referees.length === 0 ? (
              <p className="text-xs text-slate-400">No distinct referee outlier detected in this sequence.</p>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {referees.map((r) => (
                  <div key={r.track_id} className="p-2.5 bg-[#080B10] border border-[#253244] rounded-xl flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-[11px]">
                        #{r.track_id}
                      </span>
                      <span className="text-white">{r.label}</span>
                    </div>
                    <span className="text-amber-400 font-bold">{r.visibility_duration_seconds}s</span>
                  </div>
                ))}
              </div>
            )}

            {unknownPlayers.length > 0 && (
              <div className="pt-2 border-t border-[#17212E] mt-2">
                <div className="flex items-center justify-between pb-1 text-[11px] font-mono">
                  <span className="text-slate-400">Ambiguous / Unknown:</span>
                  <span className="text-slate-300 font-bold">{unknownPlayers.length} tracklets</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  {unknownPlayers.map((u) => (
                    <span key={u.track_id} className="text-[10px] font-mono bg-slate-500/15 text-slate-300 px-1.5 py-0.5 rounded border border-slate-500/30">
                      #{u.track_id}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Color Extraction Pipeline Details */}
          <div className="lg:col-span-2 bg-[#101722] border border-[#253244] rounded-2xl p-5 shadow-panel space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#253244]">
              <Palette className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase font-mono">Computer Vision Color Extraction Pipeline</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs font-mono">
              <div className="p-2.5 bg-[#080B10] rounded-xl border border-[#253244]">
                <span className="text-slate-500 block text-[9px]">1. PITCH HULL FILTER</span>
                <span className="text-white font-semibold mt-1 block text-[11px]">OpenCV Grass Mask</span>
                <span className="text-[10px] text-slate-400">Excludes stands/spectators</span>
              </div>
              <div className="p-2.5 bg-[#080B10] rounded-xl border border-[#253244]">
                <span className="text-slate-500 block text-[9px]">2. UPPER TORSO CROP</span>
                <span className="text-white font-semibold mt-1 block text-[11px]">18%-50% H, 18%-82% W</span>
                <span className="text-[10px] text-slate-400">Excludes heads, arms, legs</span>
              </div>
              <div className="p-2.5 bg-[#080B10] rounded-xl border border-[#253244]">
                <span className="text-slate-500 block text-[9px]">3. K-MEANS KIT CLUSTERS</span>
                <span className="text-white font-semibold mt-1 block text-[11px]">K=2 Non-Referee Kits</span>
                <span className="text-[10px] text-slate-400">Calibrates Team A & B</span>
              </div>
              <div className="p-2.5 bg-[#080B10] rounded-xl border border-[#253244]">
                <span className="text-slate-500 block text-[9px]">4. DISTANCE CLASSIFIER</span>
                <span className="text-white font-semibold mt-1 block text-[11px]">T-A, T-B, Ref, Unknown</span>
                <span className="text-[10px] text-slate-400">Protects ambiguous kits</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Pitch Formation Note */}
        <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs space-y-1.5 text-slate-300">
          <div className="flex items-center gap-2 font-bold text-emerald-400">
            <Info className="w-4 h-4 shrink-0" />
            <span>Tactical 2D Pitch Lineup Projection</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Now that Team A and Team B have been clustered, full 2D pitch formation shapes (such as 4-3-3 vs 4-2-3-1) and compact defensive block lines will be plotted on standard 105m × 68m coordinates once 4-point homography calibration is computed.
          </p>
        </div>
      </div>
    );
  }

  // Case 2: Demo mode with simulated teams
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
        label: `${teamA?.team_name || 'Manchester Blue'} (4-3-3)`,
        data: [88, 82, 89, 78, 85, 84],
        backgroundColor: 'rgba(56, 189, 248, 0.2)',
        borderColor: '#38BDF8',
        borderWidth: 2,
        pointBackgroundColor: '#38BDF8',
      },
      {
        label: `${teamB?.team_name || 'London Red'} (4-2-3-1)`,
        data: [72, 68, 84, 86, 70, 71],
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
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
        angleLines: { color: 'rgba(37, 50, 68, 0.5)' },
        grid: { color: 'rgba(37, 50, 68, 0.5)' },
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
        backgroundColor: '#101722',
        borderColor: '#253244',
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-[#253244]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Team Collective Analytics & Tactical Shape</h2>
            <DemoBadge label="MODELED PRESETS" />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Macro-level tactical shapes, team centroid coordinates, width/depth dispersion, and PPDA pressing indicators.
          </p>
        </div>

        {/* Formation Team Switcher */}
        <div className="flex gap-1.5 p-1 bg-[#101722] border border-[#253244] rounded-xl self-end sm:self-center">
          <button
            onClick={() => setActiveFormationTeam('man_blue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              activeFormationTeam === 'man_blue'
                ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Man Blue (4-3-3)
          </button>
          <button
            onClick={() => setActiveFormationTeam('lon_red')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              activeFormationTeam === 'lon_red'
                ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
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
        <div className="lg:col-span-7 bg-[#101722] border border-[#253244] rounded-2xl p-5 shadow-panel">
          <div className="flex items-center justify-between pb-3 border-b border-[#253244] mb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {activeFormationTeam === 'man_blue' ? teamA?.team_name : teamB?.team_name} Shape
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
                <circle cx="50%" cy="50%" r="55" fill="none" stroke="#10B981" strokeWidth="1" strokeDasharray="3,3" />
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
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs shadow ${
                      isTeamA
                        ? 'bg-sky-400 text-black border-2 border-white'
                        : 'bg-rose-500 text-white border-2 border-white'
                    }`}
                  >
                    {p.jersey_number}
                  </div>

                  {/* Player Name Tag */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-[#080B10] text-white text-[9px] font-mono px-1.5 py-0.2 rounded border border-[#253244] whitespace-nowrap">
                    {p.short_name}
                  </div>
                </div>
              );
            })}
          </PitchCanvas>

          {/* Tactical Width & Depth Metrics */}
          <div className="grid grid-cols-3 gap-3 mt-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#080B10] border border-[#253244] text-center">
              <span className="text-slate-400 block text-[9px] uppercase">Effective Width</span>
              <span className="text-white font-bold text-sm mt-0.5 block">
                {activeFormationTeam === 'man_blue' ? teamA?.team_width_m : teamB?.team_width_m} m
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#080B10] border border-[#253244] text-center">
              <span className="text-slate-400 block text-[9px] uppercase">Defensive Line</span>
              <span className="text-emerald-400 font-bold text-sm mt-0.5 block">
                {activeFormationTeam === 'man_blue' ? teamA?.defensive_line_m : teamB?.defensive_line_m} m
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#080B10] border border-[#253244] text-center">
              <span className="text-slate-400 block text-[9px] uppercase">PPDA Pressing</span>
              <span className="text-sky-400 font-bold text-sm mt-0.5 block">
                {activeFormationTeam === 'man_blue' ? teamA?.ppda : teamB?.ppda}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Tactical Radar & Head-to-Head Benchmark (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Radar Chart */}
          <div className="bg-[#101722] border border-[#253244] rounded-2xl p-5 shadow-panel">
            <div className="flex items-center justify-between pb-3 border-b border-[#253244] mb-3">
              <h3 className="text-sm font-bold text-white tracking-tight">Tactical Profile Radar</h3>
              <DemoBadge size="xs" label="SAMPLE BENCHMARK" />
            </div>
            <div className="h-64 sm:h-72">
              <RadarChart data={radarData} options={radarOptions} />
            </div>
          </div>

          {/* Pressing & Build-up Telemetry Card */}
          <div className="bg-[#101722] border border-[#253244] rounded-2xl p-5 shadow-panel">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-3">
              Pressing & Build-up Parameters (Phase 2 Model)
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#080B10] border border-[#253244]">
                <span className="text-slate-400">Pressing Intensity (PPDA)</span>
                <span className="font-mono font-bold text-white">
                  {teamA?.ppda} vs {teamB?.ppda} (Passes/Def. Action)
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#080B10] border border-[#253244]">
                <span className="text-slate-400">Pass Completion under Pressure</span>
                <span className="font-mono font-bold text-emerald-400">83.2% vs 76.5%</span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#080B10] border border-[#253244]">
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
