import React, { useState, useRef, useEffect } from 'react';
import { Sliders, Eye, Maximize2, ZoomIn, ZoomOut, RotateCcw, Image as ImageIcon } from 'lucide-react';

export default function CompareSlider({
  originalUrl,
  processedCanvas,
  maskUrl,
  viewMode,
  setViewMode,
  checkerboardDark = true
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef(null);
  const [processedDataUrl, setProcessedDataUrl] = useState(null);

  useEffect(() => {
    if (processedCanvas) {
      if (typeof processedCanvas === 'string') {
        setProcessedDataUrl(processedCanvas);
      } else if (processedCanvas.toDataURL) {
        setProcessedDataUrl(processedCanvas.toDataURL('image/png'));
      }
    }
  }, [processedCanvas]);

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    percentage = Math.max(0, Math.min(100, percentage));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Viewport Control Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-300 select-none">
        
        {/* View Mode Buttons */}
        <div className="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1 rounded font-medium transition-all ${
              viewMode === 'split' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Split Slider
          </button>
          <button
            onClick={() => setViewMode('side')}
            className={`px-3 py-1 rounded font-medium transition-all ${
              viewMode === 'side' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Side-by-Side
          </button>
          <button
            onClick={() => setViewMode('cutout')}
            className={`px-3 py-1 rounded font-medium transition-all ${
              viewMode === 'cutout' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cutout Result
          </button>
          <button
            onClick={() => setViewMode('mask')}
            className={`px-3 py-1 rounded font-medium transition-all ${
              viewMode === 'mask' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            AI Mask
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] w-12 text-center text-slate-400">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          {zoom !== 1 && (
            <button
              onClick={() => setZoom(1)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Image Canvas Viewport */}
      <div className="relative flex-1 w-full min-h-[420px] max-h-[650px] overflow-hidden flex items-center justify-center p-4">
        
        {/* VIEWMODE 1: SPLIT SLIDER */}
        {viewMode === 'split' && (
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            className={`relative max-w-full max-h-full rounded-xl overflow-hidden cursor-ew-resize select-none border border-slate-800 shadow-2xl ${
              checkerboardDark ? 'bg-checkerboard-dark' : 'bg-checkerboard-light'
            }`}
            style={{
              transform: `scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out'
            }}
          >
            {/* Processed Composite Background / Cutout */}
            {processedDataUrl ? (
              <img
                src={processedDataUrl}
                alt="Cutout Result"
                className="max-h-[550px] w-auto object-contain pointer-events-none block"
              />
            ) : (
              <div className="w-[500px] h-[350px] flex items-center justify-center text-slate-500">
                Processing AI cutout...
              </div>
            )}

            {/* Original Image Clipped Overlay */}
            <div
              className="absolute top-0 left-0 bottom-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={originalUrl}
                alt="Original Image"
                className="max-h-[550px] w-auto object-contain max-w-none block"
                style={{
                  width: containerRef.current?.offsetWidth || 'auto',
                }}
              />
              <span className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase tracking-wider">
                Before
              </span>
            </div>

            <span className="absolute top-3 right-3 px-2 py-1 bg-indigo-600/80 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase tracking-wider">
              After
            </span>

            {/* Interactive Slider Divider Line & Handle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center border-2 border-indigo-600">
                <Sliders className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>
        )}

        {/* VIEWMODE 2: SIDE BY SIDE DUAL VIEW */}
        {viewMode === 'side' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full max-w-5xl items-center justify-center">
            {/* Original Box */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900/50 p-2 flex flex-col items-center">
              <span className="absolute top-4 left-4 z-10 px-2.5 py-1 bg-slate-950/80 backdrop-blur-md rounded text-[11px] font-semibold text-slate-300">
                Original Image
              </span>
              <img
                src={originalUrl}
                alt="Original"
                className="max-h-[480px] w-auto object-contain rounded-lg"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>

            {/* Processed Cutout Box */}
            <div className={`relative rounded-xl overflow-hidden border border-indigo-500/30 p-2 flex flex-col items-center ${
              checkerboardDark ? 'bg-checkerboard-dark' : 'bg-checkerboard-light'
            }`}>
              <span className="absolute top-4 left-4 z-10 px-2.5 py-1 bg-indigo-600/90 backdrop-blur-md rounded text-[11px] font-semibold text-white">
                Cutout Studio
              </span>
              {processedDataUrl && (
                <img
                  src={processedDataUrl}
                  alt="Processed Result"
                  className="max-h-[480px] w-auto object-contain rounded-lg"
                  style={{ transform: `scale(${zoom})` }}
                />
              )}
            </div>
          </div>
        )}

        {/* VIEWMODE 3: CUTOUT ONLY */}
        {viewMode === 'cutout' && (
          <div className={`relative rounded-xl overflow-hidden border border-slate-800 p-2 flex items-center justify-center ${
            checkerboardDark ? 'bg-checkerboard-dark' : 'bg-checkerboard-light'
          }`}>
            {processedDataUrl && (
              <img
                src={processedDataUrl}
                alt="Result"
                className="max-h-[550px] w-auto object-contain rounded-lg"
                style={{ transform: `scale(${zoom})` }}
              />
            )}
          </div>
        )}

        {/* VIEWMODE 4: AI MASK OVERLAY */}
        {viewMode === 'mask' && (
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black p-2 flex items-center justify-center">
            {maskUrl ? (
              <img
                src={maskUrl}
                alt="AI Mask"
                className="max-h-[550px] w-auto object-contain rounded-lg"
                style={{ transform: `scale(${zoom})` }}
              />
            ) : (
              <div className="text-slate-500 text-xs">Mask generating...</div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
