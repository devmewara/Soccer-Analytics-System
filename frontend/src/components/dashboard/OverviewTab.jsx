import React from 'react';
import {
  Gauge,
  Activity,
  Compass,
  Zap,
  Crosshair,
  TrendingUp,
  Cpu,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import DemoBanner from '../common/DemoBanner';
import DemoBadge from '../common/DemoBadge';
import StatCard from '../common/StatCard';
import VideoUploadSection from './VideoUploadSection';
import PossessionChart from './PossessionChart';

export const OverviewTab = ({ data, onVideoUploaded }) => {
  const teamA = data?.team_a;
  const teamB = data?.team_b;
  const topPlayers = data?.top_performers || [];
  const possessionTrend = data?.possession_trend || [];
  const roadmap = data?.pipeline_roadmap || [];

  return (
    <div className="space-y-6">
      {/* Prominent Demo & Foundation Phase Alert */}
      <DemoBanner />

      {/* Primary KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Team Possession"
          value={teamA?.possession_pct ? `${teamA.possession_pct}%` : '58.4%'}
          subtitle={`${teamA?.team_name || 'Man Blue'}: ${teamA?.possession_pct || 58.4}% vs ${teamB?.possession_pct || 41.6}%`}
          icon={Gauge}
          trend="+4.2% vs avg"
          isDemo={true}
        />
        <StatCard
          title="Passing Accuracy"
          value={teamA?.pass_accuracy_pct ? `${teamA.pass_accuracy_pct}%` : '89.1%'}
          unit=""
          subtitle={`${teamA?.completed_passes || 545} / ${teamA?.total_passes || 612} passes completed`}
          icon={Crosshair}
          trend="+1.8% vs avg"
          isDemo={true}
        />
        <StatCard
          title="Total Distance"
          value={teamA?.total_distance_km ? `${teamA.total_distance_km}` : '112.4'}
          unit="km"
          subtitle="Team collective running volume"
          icon={Activity}
          trend="High work rate"
          isDemo={true}
        />
        <StatCard
          title="High-Intensity Sprints"
          value={teamA?.high_intensity_runs ? `${teamA.high_intensity_runs}` : '142'}
          unit="runs"
          subtitle="Speed > 25.2 km/h events"
          icon={Zap}
          trend="+14% intensity"
          isDemo={true}
        />
      </div>

      {/* Video Upload Section */}
      <VideoUploadSection onUploadSuccess={onVideoUploaded} />

      {/* Charts Section */}
      <PossessionChart
        possessionTrend={possessionTrend}
        teamA={teamA}
        teamB={teamB}
      />

      {/* Top Performers Table & Pipeline Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers Table */}
        <div className="lg:col-span-2 bg-[#0D131F] border border-slate-800 rounded-2xl p-5 shadow-lg shadow-black/30">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">Key Player Tracking Metrics</h3>
                <DemoBadge size="xs" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Physical and tactical indicators (Simulated demo player tracking records)
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">4 Tracked Players</span>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-mono border-b border-slate-800/80 pb-2">
                  <th className="pb-2 font-medium">Player</th>
                  <th className="pb-2 font-medium">Team</th>
                  <th className="pb-2 font-medium">Distance</th>
                  <th className="pb-2 font-medium">Top Speed</th>
                  <th className="pb-2 font-medium">Sprints</th>
                  <th className="pb-2 font-medium">Pass Acc.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono">
                {topPlayers.map((player) => (
                  <tr key={player.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-[10px]">
                          {player.jersey_number}
                        </span>
                        <div>
                          <p className="font-sans font-semibold text-white text-xs">{player.name}</p>
                          <p className="text-[10px] text-slate-400">{player.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-slate-400">{player.team}</td>
                    <td className="py-3 font-semibold text-emerald-400">{player.distance_covered_km} km</td>
                    <td className="py-3 text-slate-300">{player.top_speed_kmh} km/h</td>
                    <td className="py-3 text-slate-300">{player.sprints}</td>
                    <td className="py-3 text-emerald-400 font-semibold">{player.pass_completion_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Architecture & Phase Status Card */}
        <div className="bg-[#0D131F] border border-slate-800 rounded-2xl p-5 shadow-lg shadow-black/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">Project Milestones</h3>
            </div>

            <div className="mt-4 space-y-4">
              {roadmap.map((item, index) => (
                <div key={index} className="text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-slate-200">{item.phase}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        item.status.includes('Active') || item.status.includes('Completed')
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-slate-400 mt-1">{item.name}</p>
                  <ul className="mt-1.5 space-y-1 pl-4 list-disc text-slate-400 text-[11px]">
                    {item.items.map((sub, sIdx) => (
                      <li key={sIdx}>{sub}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-xs">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-slate-300">
              <p className="font-semibold text-slate-200">Phase 1 Scope Boundary:</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Foundation, API, upload, & dashboard. YOLOv8 object detection & ByteTrack tracking will begin in Phase 2.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
