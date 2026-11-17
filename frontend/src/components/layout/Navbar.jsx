import React, { useState } from 'react';
import { Activity, Video, Menu, X, Play, Info, Sparkles, RefreshCw } from 'lucide-react';

export const Navbar = ({
  activePage,
  onNavigate,
  isBackendOnline,
  isCheckingBackend,
  onRefreshHealth,
  onOpenUpload,
  hasActiveVideo,
  isDemoMode,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    {
      id: 'analysis',
      label: 'Match Analysis',
      badge: hasActiveVideo ? (isDemoMode ? 'Demo' : 'Video Loaded') : null,
    },
    { id: 'about', label: 'About' },
  ];

  const handleLinkClick = (pageId) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="h-16 bg-[#101722] border-b border-[#253244] sticky top-0 z-40 px-4 sm:px-6 lg:px-8 shadow-panel">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => handleLinkClick('home')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400 transition-colors">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white text-base tracking-tight font-sans">
              PitchVision
            </span>
            <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded">
              AI
            </span>
          </div>
        </div>

        {/* Desktop Minimal Horizontal Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = activePage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#17212E] text-white font-semibold border border-[#253244]'
                    : 'text-slate-400 hover:text-white hover:bg-[#17212E]/50 border border-transparent'
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                      link.badge === 'Demo'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Status & Actions */}
        <div className="flex items-center gap-3">
          {/* Backend Status indicator */}
          <button
            onClick={onRefreshHealth}
            disabled={isCheckingBackend}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#080B10] border border-[#253244] hover:border-slate-600 text-xs font-mono text-slate-300 transition-colors"
            title="FastAPI server connection status (click to re-check)"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            ></span>
            <span className="text-[11px] text-slate-400">
              {isCheckingBackend
                ? 'Checking...'
                : isBackendOnline
                ? 'Backend Online'
                : 'Backend Offline'}
            </span>
            <RefreshCw
              className={`w-3 h-3 text-slate-500 ${isCheckingBackend ? 'animate-spin' : ''}`}
            />
          </button>

          {/* Primary Action Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs shadow-sm transition-all active:scale-95"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Upload Video</span>
          </button>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[#17212E] border border-[#253244] text-slate-400 hover:text-white"
            title="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-[#101722] border-b border-[#253244] p-4 space-y-2 shadow-modal z-50">
          {navLinks.map((link) => {
            const isActive = activePage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-sm text-left transition-colors ${
                  isActive
                    ? 'bg-[#17212E] text-white font-semibold border border-[#253244]'
                    : 'text-slate-400 hover:text-white hover:bg-[#17212E]/50'
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-3 border-t border-[#253244] flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>FastAPI: {isBackendOnline ? 'Connected' : 'Offline'}</span>
            <button
              onClick={onRefreshHealth}
              className="text-emerald-400 hover:text-emerald-300"
            >
              Refresh Status
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
