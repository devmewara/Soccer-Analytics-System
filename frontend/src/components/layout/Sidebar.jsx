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
  X,
  Radio,
  Cpu,
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, tag: 'Live' },
  { id: 'match_analysis', label: 'Match Analysis', icon: PlayCircle, tag: 'Studio' },
  { id: 'player_tracking', label: 'Player Tracking', icon: UserCheck, tag: 'MOT' },
  { id: 'team_analytics', label: 'Team Analytics', icon: BarChart3, tag: 'Shape' },
  { id: 'heatmaps', label: 'Heatmaps', icon: Flame, tag: 'KDE' },
];

export const Sidebar = ({
  activeTab,
  onSelectTab,
  isBackendOnline,
  apiVersion,
  mobileOpen,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#080C14] border-r border-[#1E2638] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:shrink-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#1E2638]/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/20">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-base tracking-tight font-sans">
                  PITCHVISION
                </span>
                <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                  AI
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block -mt-0.5 font-mono">
                Soccer Match Analytics
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          <div className="px-3 pt-2 pb-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-300">
            Tactical Workspaces
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 text-left group ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-300'
                  }`}
                />
                <span className="font-medium">{item.label}</span>

                <div className="ml-auto flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {item.tag}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></span>
                  )}
                </div>
              </button>
            );
          })}

          {/* Pipeline Phase Architectural Card */}
          <div className="pt-6">
            <div className="p-3.5 rounded-xl bg-[#0D131F] border border-[#1E2638] text-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">
                  Engine Status
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-mono">
                  Phase 1 Ready
                </span>
              </div>
              <p className="font-semibold text-slate-200 text-xs">Tactical Foundation</p>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Video Gateway & UI calibrated. YOLOv8 detection & ByteTrack MOT modules scheduled for Phase 2.
              </p>
            </div>
          </div>
        </nav>

        {/* Backend & Swagger Documentation Footer */}
        <div className="p-3 border-t border-[#1E2638] bg-[#06090E]">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0D131F] border border-[#1E2638]">
            <div className="flex items-center gap-2.5">
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
                <span className="font-mono font-medium text-slate-300 block">
                  {isBackendOnline ? 'FastAPI Online' : 'FastAPI Offline'}
                </span>
                <span className="text-[9px] font-mono text-slate-400 block -mt-0.5">
                  Port 8000
                </span>
              </div>
            </div>

            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 transition-colors"
              title="Open FastAPI Swagger Interactive Docs"
            >
              <span>Swagger</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
