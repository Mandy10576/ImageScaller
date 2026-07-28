import React from 'react';
import { Sparkles, Layers, Cpu } from 'lucide-react';
import HealthBadge from './HealthBadge';

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-brand-600 to-purple-600 rounded-xl shadow-lg shadow-brand-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-white tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-400 bg-clip-text text-transparent">
              Real-ESRGAN SuperRes
            </span>
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">
              Enterprise v1.0
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <HealthBadge />
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Cpu className="w-3.5 h-3.5" />
            Swagger API Docs
          </a>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
