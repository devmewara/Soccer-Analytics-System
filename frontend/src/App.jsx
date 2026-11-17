import React, { useState, useEffect, useCallback } from 'react';
import Sidebar, { NAV_ITEMS } from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import OverviewTab from './components/dashboard/OverviewTab';
import MatchAnalysisView from './components/views/MatchAnalysisView';
import PlayerTrackingView from './components/views/PlayerTrackingView';
import TeamAnalyticsView from './components/views/TeamAnalyticsView';
import HeatmapsView from './components/views/HeatmapsView';
import { DEMO_MATCH_DATA } from './constants/mockData';
import { api } from './api/client';
import { CheckCircle2, Info, X } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(true);
  const [apiVersion, setApiVersion] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(DEMO_MATCH_DATA);
  const [selectedPlayerForTracking, setSelectedPlayerForTracking] = useState(17);
  const [activeVideo, setActiveVideo] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Check backend health and fetch dynamic demo overview
  const checkBackendHealth = useCallback(async () => {
    setIsCheckingBackend(true);
    try {
      const health = await api.checkHealth();
      if (health?.status === 'healthy') {
        setIsBackendOnline(true);
        setApiVersion(health.version);

        try {
          const liveData = await api.getOverviewAnalytics();
          setAnalyticsData((prev) => ({
            ...prev,
            ...liveData,
            pipeline_stages: prev.pipeline_stages,
            players: prev.players,
            pitch_zones: prev.pitch_zones,
            match_events: prev.match_events,
          }));
        } catch (dataErr) {
          console.warn('Backend healthy but analytics fetch error:', dataErr);
        }
      } else {
        setIsBackendOnline(false);
      }
    } catch (err) {
      setIsBackendOnline(false);
    } finally {
      setIsCheckingBackend(false);
    }
  }, []);

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 15000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  // Keyboard shortcut navigation (1-5 keys)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === '1') setActiveTab('overview');
      if (e.key === '2') setActiveTab('match_analysis');
      if (e.key === '3') setActiveTab('player_tracking');
      if (e.key === '4') setActiveTab('team_analytics');
      if (e.key === '5') setActiveTab('heatmaps');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeTabObj = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];

  const handleVideoUploaded = (uploadResponse) => {
    setActiveVideo(uploadResponse);
    showToast(`Footage "${uploadResponse.original_filename}" ingested successfully!`, 'success');
  };

  const handleLoadSampleClip = () => {
    setActiveVideo({
      filename: 'sample_tactical_broadcast_1080p.mp4',
      original_filename: 'Manchester_Blue_vs_London_Red_Tactical_Cam.mp4',
      stream_url: null, // triggers high-fidelity simulated broadcast canvas with YOLO bounding boxes
    });
    showToast('Loaded demo tactical match footage with synchronized player tracking.', 'info');
  };

  return (
    <div className="flex min-h-screen bg-[#05070B] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isBackendOnline={isBackendOnline}
        apiVersion={apiVersion}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          activeTabLabel={activeTabObj.label}
          isBackendOnline={isBackendOnline}
          isCheckingBackend={isCheckingBackend}
          onRefreshHealth={checkBackendHealth}
          onOpenUpload={() => {
            setActiveTab('overview');
            window.scrollTo({ top: 380, behavior: 'smooth' });
          }}
          onLoadSampleClip={handleLoadSampleClip}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          activeVideoName={activeVideo?.original_filename || activeVideo?.filename}
        />

        {/* Dynamic Toast Feedback Pill */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 animate-bounce">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-white shadow-2xl shadow-black text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage.message}</span>
              <button
                onClick={() => setToastMessage(null)}
                className="text-slate-400 hover:text-white ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Content View Area */}
        <main className="p-4 sm:p-6 md:p-8 flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewTab
              data={analyticsData}
              onVideoUploaded={handleVideoUploaded}
              onNavigateToTab={(tabId) => setActiveTab(tabId)}
              onSelectPlayerForTracking={(playerId) => setSelectedPlayerForTracking(playerId)}
              onLoadDemoClip={handleLoadSampleClip}
              activeVideoName={activeVideo?.original_filename}
            />
          )}

          {activeTab === 'match_analysis' && (
            <MatchAnalysisView
              data={analyticsData}
              activeVideo={activeVideo}
              onSelectPlayer={(playerId) => {
                setSelectedPlayerForTracking(playerId);
                setActiveTab('player_tracking');
              }}
              onLoadDemoClip={handleLoadSampleClip}
            />
          )}

          {activeTab === 'player_tracking' && (
            <PlayerTrackingView
              data={analyticsData}
              initialSelectedPlayerId={selectedPlayerForTracking}
            />
          )}

          {activeTab === 'team_analytics' && (
            <TeamAnalyticsView data={analyticsData} />
          )}

          {activeTab === 'heatmaps' && (
            <HeatmapsView data={analyticsData} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
