import React, { useState, useRef, useEffect } from 'react';
import { Sliders, ZoomIn, ZoomOut, RotateCcw, Image as ImageIcon } from 'lucide-react';

export default function CompareSlider({ originalUrl, upscaledUrl, scale = 4 }) {
  const containerRef = useRef(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

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
      {/* Controls Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/90 border-b border-zinc-800 text-xs text-zinc-300 select-none">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-white">Before / After Comparison</span>
          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] border border-blue-500/30">
            {scale}x Real-ESRGAN
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] w-12 text-center text-zinc-400">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          {zoom !== 1 && (
            <button
              onClick={() => setZoom(1)}
              className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="relative flex-1 w-full min-h-[420px] max-h-[600px] overflow-hidden flex items-center justify-center p-4">
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          className="relative max-w-full max-h-full rounded-xl overflow-hidden cursor-ew-resize select-none border border-zinc-800 shadow-2xl bg-zinc-950"
          style={{
            transform: `scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          {/* Upscaled Result Image */}
          <img
            src={upscaledUrl}
            alt="Upscaled High-Res"
            className="max-h-[520px] w-auto object-contain pointer-events-none block"
          />

          {/* Original Image Clipped Overlay */}
          <div
            className="absolute top-0 left-0 bottom-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={originalUrl}
              alt="Original Low-Res"
              className="max-h-[520px] w-auto object-contain max-w-none block"
              style={{
                width: containerWidth ? `${containerWidth}px` : '100%',
              }}
            />
            <span className="absolute top-3 left-3 px-2 py-1 bg-black/75 backdrop-blur-md rounded text-[10px] font-bold text-zinc-300 uppercase tracking-wider border border-zinc-700">
              Original (Low-Res)
            </span>
          </div>

          <span className="absolute top-3 right-3 px-2 py-1 bg-blue-600/90 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
            {scale}x Upscaled (Real-ESRGAN)
          </span>

          {/* Draggable Divider Handle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-zinc-900 shadow-xl flex items-center justify-center border-2 border-blue-600">
              <Sliders className="w-4 h-4 rotate-90" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
