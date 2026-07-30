import React from 'react';
import { Sparkles, Layers, Activity, Cpu, Database, Server, GitFork, ArrowUpRight } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenArchitecture, healthData }) {
  return (
    <header className="sticky top-0 z-50 studio-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between py-2.5">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('studio')}>
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold tracking-tight text-white">SuperRes</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                Real-ESRGAN
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 hidden sm:block">
              Neural AI Image Super-Resolution Service
            </p>
          </div>
        </div>

        {/* Center Mode Navigation */}
        <nav className="segmented-control hidden md:flex items-center">
          <button
            onClick={() => setActiveTab('studio')}
            className={`segmented-control-btn flex items-center space-x-1.5 ${activeTab === 'studio' ? 'active' : ''}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Upscaler</span>
          </button>

          <button
            onClick={() => setActiveTab('jobs')}
            className={`segmented-control-btn flex items-center space-x-1.5 ${activeTab === 'jobs' ? 'active' : ''}`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Job Monitor</span>
          </button>

          <button
            onClick={onOpenArchitecture}
            className="segmented-control-btn flex items-center space-x-1.5 text-blue-400 hover:text-blue-300"
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Architecture Flow</span>
          </button>
        </nav>

        {/* Right System Status Indicators */}
        <div className="flex items-center space-x-2">
          {/* Health Badges */}
          <div className="hidden lg:flex items-center space-x-2 bg-zinc-900/90 px-3 py-1 rounded-xl border border-zinc-800 text-[11px]">
            <div className="flex items-center space-x-1" title="PostgreSQL Database">
              <Database className="w-3 h-3 text-emerald-400" />
              <span className="text-zinc-300 font-medium">Postgres</span>
            </div>
            <span className="text-zinc-600">•</span>
            <div className="flex items-center space-x-1" title="BullMQ & Redis Queue">
              <Server className="w-3 h-3 text-purple-400" />
              <span className="text-zinc-300 font-medium">Redis</span>
            </div>
            <span className="text-zinc-600">•</span>
            <div className="flex items-center space-x-1" title="Python FastAPI AI Service (Port 8000)">
              <Cpu className="w-3 h-3 text-blue-400 animate-pulse" />
              <span className="text-zinc-300 font-medium">Python AI</span>
            </div>
          </div>

          <button
            onClick={onOpenArchitecture}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 text-xs font-semibold flex items-center space-x-1 transition-colors"
          >
            <span>Flow</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
