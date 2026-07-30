import React, { useState, useRef } from 'react';
import { Layers, UploadCloud, Trash2, Download, CheckCircle, RefreshCw, Sparkles, Image as ImageIcon } from 'lucide-react';
import { processBackgroundRemoval } from '../utils/bgRemover';

export default function BatchProcessor() {
  const [items, setItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFilesAdded = (files) => {
    const newItems = Array.from(files).map((file, idx) => ({
      id: `${Date.now()}_${idx}`,
      file,
      name: file.name,
      originalUrl: URL.createObjectURL(file),
      cutoutUrl: null,
      progress: 0,
      status: 'pending', // 'pending' | 'processing' | 'done' | 'error'
    }));

    setItems((prev) => [...prev, ...newItems]);
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const startBatchProcess = async () => {
    if (isProcessing || items.length === 0) return;
    setIsProcessing(true);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.status === 'done') continue;

      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: 'processing', progress: 10 } : it))
      );

      try {
        const result = await processBackgroundRemoval(item.file, (p) => {
          setItems((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, progress: p } : it))
          );
        });

        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, status: 'done', cutoutUrl: result.cutOutUrl, progress: 100 }
              : it
          )
        );
      } catch (err) {
        console.error('Failed processing item:', item.name, err);
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, status: 'error', progress: 0 } : it))
        );
      }
    }

    setIsProcessing(false);
  };

  const downloadSingle = (item) => {
    if (!item.cutoutUrl) return;
    const link = document.createElement('a');
    link.download = `clearcut_${item.name.replace(/\.[^/.]+$/, '')}.png`;
    link.href = item.cutoutUrl;
    link.click();
  };

  const downloadAll = () => {
    items.forEach((item) => {
      if (item.cutoutUrl) downloadSingle(item);
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Multi-Image Bulk Processing</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white">Batch Background Remover</h2>
          <p className="text-xs text-slate-400 mt-1">
            Upload multiple photos and strip backgrounds concurrently in your browser.
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center space-x-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFilesAdded(e.target.files)}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Add Images</span>
          </button>

          {items.length > 0 && (
            <button
              onClick={startBatchProcess}
              disabled={isProcessing}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isProcessing ? 'Processing Queue...' : 'Process All Images'}</span>
            </button>
          )}

          {items.some((it) => it.status === 'done') && (
            <button
              onClick={downloadAll}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download All</span>
            </button>
          )}
        </div>
      </div>

      {/* Batch Upload Drop Box */}
      {items.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-800 hover:border-purple-500/60 rounded-3xl p-12 text-center glass-panel cursor-pointer group transition-all"
        >
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 mx-auto flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Select multiple images to process in bulk</h3>
          <p className="text-xs text-slate-400">Click or drag & drop a batch of photos here</p>
        </div>
      ) : (
        /* Queue Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="glass-card rounded-2xl p-3 border border-slate-800/80 flex flex-col justify-between relative group"
            >
              {/* Delete Button */}
              <button
                onClick={() => removeItem(item.id)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-slate-400 hover:text-rose-400 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Preview Thumbnail */}
              <div className="relative w-full h-44 rounded-xl overflow-hidden bg-checkerboard-dark mb-3 flex items-center justify-center">
                {item.cutoutUrl ? (
                  <img src={item.cutoutUrl} alt="Cutout" className="max-h-full max-w-full object-contain" />
                ) : (
                  <img src={item.originalUrl} alt="Original" className="max-h-full max-w-full object-contain opacity-70" />
                )}

                {/* Status Badge */}
                {item.status === 'processing' && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-3">
                    <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mb-2" />
                    <span className="text-[11px] font-semibold text-white">{item.progress}%</span>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div className="bg-indigo-500 h-full transition-all" style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Info & Download */}
              <div className="flex items-center justify-between">
                <div className="truncate pr-2">
                  <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                  <span className="text-[10px] text-slate-400 capitalize">{item.status}</span>
                </div>

                {item.status === 'done' && (
                  <button
                    onClick={() => downloadSingle(item)}
                    className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
