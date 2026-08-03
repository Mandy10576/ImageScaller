import React, { useState, useRef } from 'react';
import { Upload, Sparkles, Image as ImageIcon, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

const SAMPLE_PHOTOS = [
  {
    id: 's1',
    title: 'Portrait Photography',
    thumb: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 's2',
    title: 'Macro Architecture',
    thumb: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 's3',
    title: 'Anime & Artwork',
    thumb: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 's4',
    title: 'E-Commerce Gadget',
    thumb: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  },
];

export default function UploadSection({ onUploadSubmit, isSubmitting }) {
  const [scale, setScale] = useState(4);
  const [model, setModel] = useState('realesrgan-x4plus');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelected = (file) => {
    if (file) {
      onUploadSubmit(file, scale, model);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleSampleClick = async (sampleUrl) => {
    try {
      const res = await fetch(sampleUrl);
      const blob = await res.blob();
      const file = new File([blob], 'sample_image.jpg', { type: 'image/jpeg' });
      onUploadSubmit(file, scale, model);
    } catch (err) {
      console.error('Failed to load sample image:', err);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6">
      
      {/* Title */}
      <div className="text-center max-w-xl mx-auto mb-6">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-ESRGAN Neural Super-Resolution</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
          AI Image Upscaler Service
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Upscale low-resolution images asynchronously using Node.js, Express, PostgreSQL, BullMQ, Redis, and Python FastAPI.
        </p>
      </div>

      {/* Control Panel: Scale & Model */}
      <div className="studio-card rounded-2xl p-4 mb-6 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Scale Factor Selector */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Upscale Factor:</span>
          <div className="segmented-control flex items-center">
            {[2, 4, 8].map((s) => (
              <button
                key={s}
                onClick={() => setScale(s)}
                className={`segmented-control-btn font-mono ${scale === s ? 'active' : ''}`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Neural Model Selector */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Model:</span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="realesrgan-x4plus">Real-ESRGAN-x4plus (v0.1.0)</option>
          </select>
        </div>

      </div>

      {/* Main Upload Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full relative group cursor-pointer rounded-2xl p-10 text-center transition-all studio-card ${
          isDragging ? 'border-blue-500 bg-blue-950/20 scale-[1.005]' : 'border-zinc-800 hover:border-zinc-700'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-all">
            <Upload className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white mb-1">
              {isSubmitting ? 'Enqueuing Job...' : 'Drop low-res image here, or browse files'}
            </h3>
            <p className="text-xs text-zinc-400">
              Supports PNG, JPG, WEBP • Processed via BullMQ Queue & Python Real-ESRGAN Microservice
            </p>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Upload Image'}
          </button>
        </div>
      </div>

      {/* Sample Quick Selector */}
      <div className="mt-8">
        <span className="text-xs font-semibold text-zinc-400 flex items-center space-x-1.5 mb-3 px-1">
          <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
          <span>Or test with a sample photo:</span>
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SAMPLE_PHOTOS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => handleSampleClick(sample.url)}
              className="studio-card studio-card-hover rounded-xl overflow-hidden cursor-pointer flex flex-col group p-2 border border-zinc-800"
            >
              <div className="h-24 w-full rounded-lg overflow-hidden bg-zinc-900 mb-2">
                <img
                  src={sample.thumb}
                  alt={sample.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-200 truncate">{sample.title}</span>
                <ArrowRight className="w-3 h-3 text-zinc-500 group-hover:text-blue-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
