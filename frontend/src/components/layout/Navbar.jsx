import React from 'react';
import { Menu, Video, RefreshCw, Cpu, Database, Play, Sparkles } from 'lucide-react';
import DemoBadge from '../common/DemoBadge';

export const Navbar = ({
  activeTabLabel,
  isBackendOnline,
  isCheckingBackend,
  onRefreshHealth,
  onOpenUpload,
  onLoadSampleClip,
  onToggleMobileMenu,
  activeVideoName,
}) => {
  return (
    <header className="h-16 bg-[#080C14]/90 backdrop-blur-md border-b border-[#1E2638] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-400 hidden sm:inline">PitchVision AI</span>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">{activeTabLabel}</h1>
          </div>
          <p className="text-[10px] text-slate-400 hidden md:block">
            Footage: <strong className="text-slate-300 font-mono">{activeVideoName || 'Manchester Blue vs London Red (Tactical Cam)'}</strong>
          </p>
        </div>
      </div>

      {/* Right: Telemetry status & Primary Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dataset demo indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0D131F] border border-[#1E2638] text-[11px] font-mono text-slate-300">
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span>Data:</span>
          <DemoBadge size="xs" />
        </div>

        {/* Backend health check button */}
        <button
          onClick={onRefreshHealth}
          disabled={isCheckingBackend}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0D131F] border border-[#1E2638] hover:border-slate-700 text-xs font-mono text-slate-300 transition-colors"
          title="Poll backend health"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCheckingBackend ? 'animate-spin text-emerald-400' : isBackendOnline ? 'text-emerald-400' : 'text-rose-400'}`} />
          <span className="hidden sm:inline">
            {isBackendOnline ? 'API Connected' : 'API Offline'}
          </span>
        </button>

        {/* Quick Sample Clip Loader */}
        <button
          onClick={onLoadSampleClip}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-medium text-xs transition-colors"
          title="Load demonstration match footage"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Demo Clip</span>
        </button>

        {/* Video Upload CTA */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95"
        >
          <Video className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Upload Match</span>
          <span className="xs:hidden">Upload</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
