import React from 'react';
import {
  LayoutDashboard,
  PlayCircle,
  UserCheck,
  BarChart3,
  Flame,
  Activity,
  ExternalLink,
  X,
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, tag: 'Command' },
  { id: 'match_analysis', label: 'Match Analysis', icon: PlayCircle, tag: 'Studio' },
  { id: 'player_tracking', label: 'Player Tracking', icon: UserCheck, tag: 'MOT' },
  { id: 'team_analytics', label: 'Team Analytics', icon: BarChart3, tag: 'Tactics' },
  { id: 'heatmaps', label: 'Heatmaps', icon: Flame, tag: 'Spatial' },
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
          className="fixed inset-0 bg-black/75 z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#101722] border-r border-[#253244] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:shrink-0 ${
          mobileOpen ? 'translate-x-0 shadow-modal' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#253244]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-base tracking-tight font-sans">
                  PitchVision
                </span>
                <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                  AI
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block -mt-0.5 font-mono">
                Football Analytics
              </span>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#17212E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          <div className="px-3 pt-2 pb-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
            Analytics Workspaces
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
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors text-left group ${
                  isActive
                    ? 'bg-[#17212E] text-white border border-[#253244]'
                    : 'text-slate-300 hover:text-white hover:bg-[#17212E]/60 border border-transparent'
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
                        ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30'
                        : 'bg-[#17212E] text-slate-400'
                    }`}
                  >
                    {item.tag}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Architecture Status Widget */}
          <div className="pt-6">
            <div className="p-3.5 rounded-xl bg-[#080B10] border border-[#253244] text-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">
                  Pipeline Status
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                  Phase 1 Verified
                </span>
              </div>
              <p className="font-semibold text-slate-200 text-xs">Ingestion & Workspaces</p>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Full-stack video pipeline active. Computer vision tracking models (YOLO & ByteTrack) queued for Phase 2.
              </p>
            </div>
          </div>
        </nav>

        {/* Backend Connectivity Footer */}
        <div className="p-3 border-t border-[#253244] bg-[#080B10]">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#101722] border border-[#253244]">
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full ${isBackendOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              <div className="text-[11px]">
                <span className="font-mono font-medium text-slate-300 block">
                  {isBackendOnline ? 'FastAPI Online' : 'FastAPI Offline'}
                </span>
                <span className="text-[9px] font-mono text-slate-500 block -mt-0.5">
                  localhost:8000
                </span>
              </div>
            </div>

            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] font-mono text-slate-400 hover:text-emerald-400 flex items-center gap-1 bg-[#17212E] hover:bg-slate-800 px-2 py-1 rounded border border-[#253244] transition-colors"
              title="FastAPI Swagger Documentation"
            >
              <span>Docs</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
