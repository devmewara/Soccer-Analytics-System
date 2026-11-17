
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/layout/Navbar';
import HomePage from './components/home/HomePage';
import AnalysisWorkspace from './components/analysis/AnalysisWorkspace';
import AboutPage from './components/about/AboutPage';
import { DEMO_MATCH_DATA } from './constants/mockData';
import { api } from './api/client';
import { CheckCircle2, X } from 'lucide-react';

export function App() {
  // Navigation: 'home' | 'analysis' | 'about'
  const [activePage, setActivePage] = useState('home');
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(true);
  const [activeVideo, setActiveVideo] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Poll backend health status
  const checkBackendHealth = useCallback(async () => {
    setIsCheckingBackend(true);
    try {
      const health = await api.checkHealth();
      if (health?.status === 'healthy') {
        setIsBackendOnline(true);
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

  // Handler for uploading or selecting a video for analysis
  const handleStartAnalysis = (videoObj) => {
    setActiveVideo(videoObj);
    setIsDemoMode(false);
    setActivePage('analysis');
    showToast(`Video "${videoObj.original_filename || videoObj.filename}" ready for analysis.`, 'success');
  };

  // Handler for explicitly launching the Sample Demonstration sandbox
  const handleLaunchDemo = () => {
    setActiveVideo({
      filename: 'sample_tactical_broadcast_1080p.mp4',
      original_filename: 'Manchester_Blue_vs_London_Red_Demo.mp4',
      stream_url: null,
    });
    setIsDemoMode(true);
    setActivePage('analysis');
    showToast('Launched Sample Demonstration Sandbox with modeled tactical tracking.', 'info');
  };

  return (
    <div className="min-h-screen bg-[#080B10] text-[#F8FAFC] font-sans flex flex-col selection:bg-emerald-500/25 selection:text-emerald-300">
      {/* 1. Global Modern Horizontal Top Navigation (Sidebar completely removed) */}
      <Navbar
        activePage={activePage}
        onNavigate={(pageId) => setActivePage(pageId)}
        isBackendOnline={isBackendOnline}
        isCheckingBackend={isCheckingBackend}
        onRefreshHealth={checkBackendHealth}
        onOpenUpload={() => {
          setActivePage('home');
          window.scrollTo({ top: 120, behavior: 'smooth' });
        }}
        hasActiveVideo={Boolean(activeVideo)}
        isDemoMode={isDemoMode}
      />

      {/* 2. Global Feedback Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#101722] border border-emerald-500/40 text-white shadow-modal text-xs font-mono">
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

      {/* 3. Main Application Canvas */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {activePage === 'home' && (
          <HomePage
            onStartAnalysis={handleStartAnalysis}
            onLaunchDemo={handleLaunchDemo}
            isBackendOnline={isBackendOnline}
          />
        )}

        {activePage === 'analysis' && (
          <AnalysisWorkspace
            activeVideo={activeVideo}
            isDemoMode={isDemoMode}
            data={DEMO_MATCH_DATA}
            onBackToHome={() => setActivePage('home')}
            onLaunchDemo={handleLaunchDemo}
          />
        )}

        {activePage === 'about' && <AboutPage />}
      </main>
    </div>
  );
}

export default App;
