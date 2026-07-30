import React, { useState } from 'react';
import { Download, X, FileImage, Sparkles, Check, Ratio } from 'lucide-react';

export default function ExportModal({
  isOpen,
  onClose,
  masterCanvas,
  originalWidth,
  originalHeight,
  aspectRatio,
  setAspectRatio
}) {
  if (!isOpen) return null;

  const [format, setFormat] = useState('png'); // 'png' | 'jpg' | 'webp'
  const [quality, setQuality] = useState(0.95);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    if (!masterCanvas) return;
    setDownloading(true);

    try {
      const mimeType = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
      const dataUrl = masterCanvas.toDataURL(mimeType, quality);

      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 10);
      link.download = `clearcut_ai_${timestamp}.${format}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setTimeout(() => {
        setDownloading(false);
        onClose();
      }, 500);
    }
  };

  const aspectRatios = [
    { id: 'original', label: 'Original', desc: `${originalWidth || 'Auto'} × ${originalHeight || 'Auto'}` },
    { id: '1:1', label: '1:1 Square', desc: 'Avatar / Instagram' },
    { id: '4:5', label: '4:5 Portrait', desc: 'Instagram Feed' },
    { id: '9:16', label: '9:16 Story', desc: 'Reels / TikTok' },
    { id: '16:9', label: '16:9 Landscape', desc: 'YouTube Thumbnail' },
    { id: '4:3', label: '4:3 Product', desc: 'E-Commerce' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel p-6 rounded-3xl max-w-lg w-full border border-slate-700 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Export Cutout Image</h3>
            <p className="text-xs text-slate-400">Choose export format & resolution settings</p>
          </div>
        </div>

        {/* Format Selector */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            File Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setFormat('png')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                format === 'png'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-sm">PNG</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Transparent HD</span>
            </button>

            <button
              onClick={() => setFormat('jpg')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                format === 'jpg'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-sm">JPG</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Smaller Size</span>
            </button>

            <button
              onClick={() => setFormat('webp')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                format === 'webp'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-sm">WEBP</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Web Optimized</span>
            </button>
          </div>
        </div>

        {/* Aspect Ratio Presets */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Aspect Ratio Crop</span>
            <Ratio className="w-3.5 h-3.5 text-indigo-400" />
          </label>
          <div className="grid grid-cols-3 gap-2">
            {aspectRatios.map((item) => (
              <button
                key={item.id}
                onClick={() => setAspectRatio(item.id)}
                className={`p-2 rounded-xl border text-left transition-all ${
                  aspectRatio === item.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold">{item.label}</div>
                <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Quality Slider for JPG/WEBP */}
        {format !== 'png' && (
          <div className="mb-6">
            <div className="flex justify-between items-center text-xs text-slate-300 mb-2">
              <span className="font-semibold uppercase tracking-wider text-slate-400">Quality:</span>
              <span className="font-mono text-indigo-400">{Math.round(quality * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.0"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
          >
            Cancel
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-[2] py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
          >
            {downloading ? (
              <span>Downloading...</span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download High-Res {format.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
