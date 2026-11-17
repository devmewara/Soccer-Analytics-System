import React from 'react';
import {
  Activity,
  Cpu,
  Layers,
  Code2,
  Server,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const AboutPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 space-y-10">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-[#101722] border border-[#253244] flex items-center justify-center text-emerald-400 mx-auto shadow-panel">
          <Activity className="w-6 h-6 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">About PitchVision AI</h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          An AI-powered football match analytics platform using computer vision and deep learning 
          for player tracking, tactical formation analysis, and pitch spatial intelligence.
        </p>
      </div>

      {/* College Project Context */}
      <div className="bg-[#101722] border border-[#253244] rounded-2xl p-6 shadow-panel">
        <h2 className="text-base font-bold text-white tracking-tight mb-2">Project Scope & Purpose</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Developed as a university Continuous Assessment (CA) project in Computer Vision and Deep Learning. 
          The system bridges high-definition video processing and tactical football intelligence, offering 
          coaches and performance teams deep insights from raw match footage.
        </p>

        <div className="mt-4 pt-4 border-t border-[#253244] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 bg-[#080B10] rounded-xl border border-[#253244]">
            <span className="text-slate-500 block text-[10px] uppercase">Architecture Mode</span>
            <span className="text-emerald-400 font-bold block mt-0.5">Decoupled Full-Stack</span>
          </div>
          <div className="p-3 bg-[#080B10] rounded-xl border border-[#253244]">
            <span className="text-slate-500 block text-[10px] uppercase">Evaluation Target</span>
            <span className="text-white font-bold block mt-0.5">CV Ingestion & Analytics Pipeline</span>
          </div>
        </div>
      </div>

      {/* Technology Stack Grid */}
      <div className="bg-[#101722] border border-[#253244] rounded-2xl p-6 shadow-panel space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight">Verified Technology Stack</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-[#080B10] border border-[#253244] rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold">
              <Code2 className="w-4 h-4" />
              <span>Frontend Client</span>
            </div>
            <ul className="text-slate-300 text-[11px] space-y-1 font-mono">
              <li>• React 18</li>
              <li>• Vite 6</li>
              <li>• Tailwind CSS 3.4</li>
              <li>• Chart.js 4.4</li>
              <li>• Lucide Icons</li>
            </ul>
          </div>

          <div className="p-4 bg-[#080B10] border border-[#253244] rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-mono font-bold">
              <Server className="w-4 h-4" />
              <span>Backend API</span>
            </div>
            <ul className="text-slate-300 text-[11px] space-y-1 font-mono">
              <li>• Python 3.13</li>
              <li>• FastAPI Framework</li>
              <li>• Uvicorn ASGI Server</li>
              <li>• Pydantic v2</li>
              <li>• Python-multipart</li>
            </ul>
          </div>

          <div className="p-4 bg-[#080B10] border border-[#253244] rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-mono font-bold">
              <Cpu className="w-4 h-4" />
              <span>Future CV Engine</span>
            </div>
            <ul className="text-slate-300 text-[11px] space-y-1 font-mono">
              <li>• Ultralytics YOLOv8</li>
              <li>• ByteTrack MOT</li>
              <li>• OpenCV Homography</li>
              <li>• NumPy & Pandas</li>
              <li>• SciPy 2D KDE</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Phased Roadmap & Honesty Statement */}
      <div className="bg-[#101722] border border-[#253244] rounded-2xl p-6 shadow-panel space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#253244]">
          <h2 className="text-base font-bold text-white tracking-tight">Implementation Roadmap</h2>
          <span className="text-[10px] font-mono text-emerald-400">3-Phase Architecture</span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 bg-[#080B10] border border-emerald-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-300 font-mono">Phase 1: Foundation & Ingestion Gateway</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                COMPLETED
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-1">
              Decoupled architecture, horizontal modern navigation, video upload streaming up to 500MB, 
              HTML5 video playback, calibrated 2D pitch engine, and dynamic analysis workspaces.
            </p>
          </div>

          <div className="p-3 bg-[#080B10] border border-amber-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-300 font-mono">Phase 2: Computer Vision Core</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-mono">
                SCHEDULED NEXT
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-1">
              Integration of Ultralytics YOLOv8 for player/ball detection, ByteTrack for tracking ID persistence, 
              and OpenCV homography perspective matrix for pitch calibration.
            </p>
          </div>

          <div className="p-3 bg-[#080B10] border border-[#253244] rounded-xl">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 font-mono">Phase 3: Tactical Kinematics</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                UPCOMING
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-1">
              Calculating real-world instantaneous velocities (km/h), team centroid width/depth, Voronoi pitch dominance, 
              and continuous 2D Gaussian Kernel Density Estimation (KDE) heatmaps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
