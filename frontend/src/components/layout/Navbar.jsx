import React from 'react';
import { ShieldCheck, Video, RefreshCw, Cpu, Database } from 'lucide-react';
import DemoBadge from '../common/DemoBadge';

export const Navbar = ({
  activeTabLabel,
  isBackendOnline,
  isCheckingBackend,
  onRefreshHealth,
  onOpenUpload,
}) => {
  return (
    <header className="h-16 bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-tight">{activeTabLabel}</h1>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-mono text-emerald-400">Match Analytics</span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Match: <strong className="text-slate-200">Manchester Blue vs London Red</strong> (Simulated Exhibition)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Match Demo Tag */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-300 font-mono">Dataset:</span>
          <DemoBadge size="xs" />
        </div>

        {/* Backend health quick refresh button */}
        <button
          onClick={onRefreshHealth}
          disabled={isCheckingBackend}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 transition-colors"
          title="Check backend health status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCheckingBackend ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">
            {isBackendOnline ? 'API Connected' : 'Check API'}
          </span>
        </button>

        {/* Video Upload CTA */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95"
        >
          <Video className="w-3.5 h-3.5" />
          <span>Upload Match Video</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
