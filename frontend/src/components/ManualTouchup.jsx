import React, { useRef, useEffect, useState } from 'react';
import { Eraser, Paintbrush, Undo, Redo, Check, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

export default function ManualTouchup({
  originalUrl,
  cutoutDataUrl,
  onApplyRefinedMask,
  onCancel
}) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('erase'); // 'erase' | 'restore'
  const [brushSize, setBrushSize] = useState(25);
  const [hardness, setHardness] = useState(80);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100, visible: false });

  const originalImgRef = useRef(null);
  const cutoutImgRef = useRef(null);

  // Initialize canvas with cutout image & load original image
  useEffect(() => {
    if (!cutoutDataUrl || !originalUrl) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const cutoutImg = new Image();
    cutoutImg.crossOrigin = 'anonymous';
    cutoutImg.src = cutoutDataUrl;
    cutoutImgRef.current = cutoutImg;

    const origImg = new Image();
    origImg.crossOrigin = 'anonymous';
    origImg.src = originalUrl;
    originalImgRef.current = origImg;

    cutoutImg.onload = () => {
      canvas.width = cutoutImg.naturalWidth || cutoutImg.width;
      canvas.height = cutoutImg.naturalHeight || cutoutImg.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(cutoutImg, 0, 0);

      // Save initial canvas state
      const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialData]);
      setHistoryStep(0);
    };
  }, [cutoutDataUrl, originalUrl]);

  const saveHistoryState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(currentState);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(history[prevStep], 0, 0);
      setHistoryStep(prevStep);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(history[nextStep], 0, 0);
      setHistoryStep(nextStep);
    }
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      screenX: e.clientX - rect.left,
      screenY: e.clientY - rect.top
    };
  };

  const paintOnCanvas = (x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.closePath();

    if (tool === 'erase') {
      // Erase pixels to transparent
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fill();
    } else if (tool === 'restore' && originalImgRef.current) {
      // Paint back original image pixels
      ctx.globalCompositeOperation = 'source-over';
      ctx.clip();
      ctx.drawImage(originalImgRef.current, 0, 0, canvas.width, canvas.height);
    }

    ctx.restore();
  };

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    paintOnCanvas(coords.x, coords.y);
  };

  const handleMouseMove = (e) => {
    const coords = getCanvasCoords(e);
    setCursorPos({ x: coords.screenX, y: coords.screenY, visible: true });

    if (isDrawing) {
      paintOnCanvas(coords.x, coords.y);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveHistoryState();
    }
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const refinedDataUrl = canvas.toDataURL('image/png');
    onApplyRefinedMask(refinedDataUrl);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 gap-3">
        {/* Tool Switcher */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setTool('erase')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tool === 'erase'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eraser className="w-4 h-4" />
            <span>Erase Background</span>
          </button>
          <button
            onClick={() => setTool('restore')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tool === 'restore'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Paintbrush className="w-4 h-4" />
            <span>Restore Subject</span>
          </button>
        </div>

        {/* Sliders: Size & Hardness */}
        <div className="flex items-center space-x-4 text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">Brush Size:</span>
            <input
              type="range"
              min="5"
              max="120"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="font-mono text-indigo-400 w-8">{brushSize}px</span>
          </div>
        </div>

        {/* Undo / Redo / Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleUndo}
            disabled={historyStep <= 0}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyStep >= history.length - 1}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>

          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            Cancel
          </button>

          <button
            onClick={handleApply}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30"
          >
            <Check className="w-4 h-4" />
            <span>Apply Touch-up</span>
          </button>
        </div>
      </div>

      {/* Main Touchup Canvas Viewport */}
      <div className="relative flex-1 min-h-[450px] bg-checkerboard-dark flex items-center justify-center p-4 overflow-hidden select-none">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            handleMouseUp();
            setCursorPos((c) => ({ ...c, visible: false }));
          }}
          className="max-h-[550px] w-auto border border-slate-700/60 rounded-xl shadow-2xl cursor-none"
        />

        {/* Live Brush Size Ring Indicator */}
        {cursorPos.visible && (
          <div
            className="pointer-events-none absolute rounded-full border-2 border-white shadow-[0_0_8px_rgba(0,0,0,0.8)] -translate-x-1/2 -translate-y-1/2"
            style={{
              left: cursorPos.x + 'px',
              top: cursorPos.y + 'px',
              width: brushSize + 'px',
              height: brushSize + 'px',
              backgroundColor: tool === 'erase' ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.2)'
            }}
          />
        )}
      </div>
    </div>
  );
}
