import React from 'react';
import {
  LayoutDashboard,
  PlayCircle,
  UserCheck,
  BarChart3,
  Flame,
  Activity,
  Server,
  Terminal,
  ExternalLink,
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'match_analysis', label: 'Match Analysis', icon: PlayCircle },
  { id: 'player_tracking', label: 'Player Tracking', icon: UserCheck },
  { id: 'team_analytics', label: 'Team Analytics', icon: BarChart3 },
  { id: 'heatmaps', label: 'Heatmaps', icon: Flame },
];

export const Sidebar = ({ activeTab, onSelectTab, isBackendOnline, apiVersion }) => {
  return (
    <aside className="w-64 bg-[#0B0F17] border-r border-slate-800 flex flex-col shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800/80 gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/20">
          <Activity className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-white text-base tracking-tight">PITCHVISION</span>
            <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
              AI
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block -mt-0.5">Soccer Match Analytics</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-300 font-mono">
          Analytics Navigation
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></span>
              )}
            </button>
          );
        })}

        {/* Phase Info Box */}
        <div className="pt-6">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider">Implementation Phase</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                1 of 3
              </span>
            </div>
            <p className="font-medium text-slate-200">Phase 1: Foundation</p>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              FastAPI + React architecture. Computer Vision (YOLOv8 + ByteTrack) scheduled for Phase 2.
            </p>
          </div>
        </div>
      </nav>

      {/* Backend Status Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-[#070A0F]">
        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {isBackendOnline ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              )}
            </span>
            <div className="text-[11px]">
              <span className="font-mono font-medium text-slate-300">
                {isBackendOnline ? 'FastAPI Online' : 'Backend Offline'}
              </span>
            </div>
          </div>

          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
            title="View FastAPI Swagger Docs"
          >
            <span>Docs</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
