import React from 'react';
import { SAMPLE_SUBJECT_IMAGES, PRESET_BACKGROUND_IMAGES } from '../utils/sampleImages';
import { Sparkles, ArrowRight, Image as ImageIcon, Layers } from 'lucide-react';

export default function PresetGallery({ onSelectSample }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Demo Showcase</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
          Sample Image Gallery
        </h2>
        <p className="text-sm text-slate-400">
          Click any demo photo below to test background removal instantly in studio workbench.
        </p>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {SAMPLE_SUBJECT_IMAGES.map((sample) => (
          <div
            key={sample.id}
            onClick={() => onSelectSample(sample.url)}
            className="group glass-card rounded-2xl p-4 border border-slate-800 hover:border-indigo-500/80 cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-xl flex flex-col justify-between"
          >
            <div className="relative h-56 w-full rounded-xl overflow-hidden mb-4 bg-slate-900">
              <img
                src={sample.url}
                alt={sample.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-indigo-300 border border-indigo-500/20 uppercase tracking-wider">
                {sample.category}
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors flex items-center justify-between">
                <span>{sample.title}</span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-slate-400">{sample.description}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
