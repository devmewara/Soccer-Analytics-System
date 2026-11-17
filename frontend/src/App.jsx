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

export function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(true);
  const [apiVersion, setApiVersion] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(DEMO_MATCH_DATA);

  // Check backend health and fetch dynamic demo overview
  const checkBackendHealth = useCallback(async () => {
    setIsCheckingBackend(true);
    try {
      const health = await api.checkHealth();
      if (health?.status === 'healthy') {
        setIsBackendOnline(true);
        setApiVersion(health.version);

        // Fetch live demo stats from FastAPI backend
        try {
          const liveData = await api.getOverviewAnalytics();
          setAnalyticsData((prev) => ({
            ...prev,
            ...liveData,
            pipeline_roadmap: prev.pipeline_roadmap, // retain roadmap info
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
    // Poll backend health status periodically every 15 seconds
    const interval = setInterval(checkBackendHealth, 15000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  const activeTabObj = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];

  const handleVideoUploaded = (response) => {
    // Scroll or switch if desired
    console.log('Video successfully uploaded:', response);
  };

  return (
    <div className="flex min-h-screen bg-[#070A0F] text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isBackendOnline={isBackendOnline}
        apiVersion={apiVersion}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          activeTabLabel={activeTabObj.label}
          isBackendOnline={isBackendOnline}
          isCheckingBackend={isCheckingBackend}
          onRefreshHealth={checkBackendHealth}
          onOpenUpload={() => {
            setActiveTab('overview');
            window.scrollTo({ top: 380, behavior: 'smooth' });
          }}
        />

        <main className="p-6 md:p-8 flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewTab
              data={analyticsData}
              onVideoUploaded={handleVideoUploaded}
            />
          )}

          {activeTab === 'match_analysis' && <MatchAnalysisView />}
          {activeTab === 'player_tracking' && <PlayerTrackingView />}
          {activeTab === 'team_analytics' && <TeamAnalyticsView />}
          {activeTab === 'heatmaps' && <HeatmapsView />}
        </main>
      </div>
    </div>
  );
}

export default App;
