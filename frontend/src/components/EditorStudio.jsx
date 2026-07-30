import React, { useState, useEffect, useRef } from 'react';
import {
  Wand2, Image as ImageIcon, Palette, Sparkles, Sliders, Layers, Download,
  Eye, Crop, Sun, Moon, FlipHorizontal, FlipVertical, Move,
  Paintbrush, Check, RefreshCw, ZoomIn, Plus, Shield
} from 'lucide-react';

import CompareSlider from './CompareSlider';
import ManualTouchup from './ManualTouchup';
import ExportModal from './ExportModal';
import { renderCompositeImage, processBackgroundRemoval, loadImage } from '../utils/bgRemover';
import { PRESET_BACKGROUND_IMAGES, PRESET_SOLID_COLORS, PRESET_GRADIENTS } from '../utils/sampleImages';

export default function EditorStudio({ initialImage, onNewImage, engine = 'local', apiKey = '' }) {
  // Processing States
  const [isProcessing, setIsProcessing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);

  // Original & Cutout Data
  const [originalUrl, setOriginalUrl] = useState(null);
  const [originalImgObj, setOriginalImgObj] = useState(null);
  const [cutoutImgObj, setCutoutImgObj] = useState(null);
  const [cutoutDataUrl, setCutoutDataUrl] = useState(null);
  const [maskUrl, setMaskUrl] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // View & Mode States
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'side' | 'cutout' | 'mask'
  const [activeSidebarTab, setActiveSidebarTab] = useState('background'); // 'background' | 'touchup' | 'fx' | 'color' | 'crop'
  const [isTouchupActive, setIsTouchupActive] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Composite Settings
  const [backgroundConfig, setBackgroundConfig] = useState({
    type: 'transparent',
    color: '#FFFFFF',
    gradientCss: PRESET_GRADIENTS[0].css,
    gradientStops: ['#6366f1', '#ec4899'],
    gradientAngle: 135,
    imageUrl: null,
    blurAmount: 15,
  });

  const [fxConfig, setFxConfig] = useState({
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    strokeWidth: 0,
    strokeColor: '#FFFFFF',
    brightness: 100,
    contrast: 100,
    saturation: 100,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    rotate: 0,
    flipH: false,
    flipV: false,
  });

  const [aspectRatio, setAspectRatio] = useState('original');
  const [masterCanvas, setMasterCanvas] = useState(null);

  // Load and Process Image on initial setup
  useEffect(() => {
    if (!initialImage) return;

    let isMounted = true;
    setIsProcessing(true);
    setProgress(10);
    setErrorMsg(null);

    async function runRemoval() {
      try {
        let srcUrl;
        if (typeof initialImage === 'string') {
          srcUrl = initialImage;
        } else {
          srcUrl = URL.createObjectURL(initialImage);
        }
        setOriginalUrl(srcUrl);

        const loadedOrig = await loadImage(srcUrl);
        if (!isMounted) return;
        setOriginalImgObj(loadedOrig);
        setDimensions({ width: loadedOrig.naturalWidth, height: loadedOrig.naturalHeight });

        // Run AI removal with selected engine
        const res = await processBackgroundRemoval(
          initialImage,
          (p) => {
            if (isMounted) setProgress(p);
          },
          { engine, apiKey }
        );

        if (!isMounted) return;

        const loadedCutout = await loadImage(res.cutOutUrl);
        setCutoutImgObj(loadedCutout);
        setCutoutDataUrl(res.cutOutUrl);
        setMaskUrl(res.maskDataUrl);
        setIsProcessing(false);
      } catch (err) {
        console.error('Error processing background:', err);
        if (isMounted) {
          setErrorMsg('Could not process background. Please try another image.');
          setIsProcessing(false);
        }
      }
    }

    runRemoval();

    return () => {
      isMounted = false;
    };
  }, [initialImage, engine, apiKey]);

  // Re-render composite canvas whenever cutouts or studio controls change
  useEffect(() => {
    if (!cutoutImgObj) return;

    let isMounted = true;

    async function updateMasterCanvas() {
      const canvas = await renderCompositeImage({
        originalImg: originalImgObj,
        cutoutImg: cutoutImgObj,
        backgroundConfig,
        fxConfig,
        aspectRatio,
      });

      if (isMounted) {
        setMasterCanvas(canvas);
      }
    }

    updateMasterCanvas();

    return () => {
      isMounted = false;
    };
  }, [cutoutImgObj, originalImgObj, backgroundConfig, fxConfig, aspectRatio]);

  // Apply touchup refinement
  const handleApplyTouchup = async (refinedDataUrl) => {
    setIsTouchupActive(false);
    setCutoutDataUrl(refinedDataUrl);
    const newCutoutImg = await loadImage(refinedDataUrl);
    setCutoutImgObj(newCutoutImg);
  };

  const handleCustomBgUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const fileUrl = URL.createObjectURL(e.target.files[0]);
      setBackgroundConfig({
        ...backgroundConfig,
        type: 'image',
        imageUrl: fileUrl,
      });
    }
  };

  if (isProcessing) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-blue-400 mb-5 shadow-sm">
          <Wand2 className="w-6 h-6 animate-pulse" />
        </div>

        <h2 className="text-xl font-bold text-white mb-1">Isolating Image Subject...</h2>
        <p className="text-xs text-zinc-400 mb-6">
          Executing AI matting segmentation ({progress}%).
        </p>

        <div className="w-full bg-zinc-900 rounded-full h-2 p-0.5 border border-zinc-800 overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="p-6 studio-card rounded-2xl border border-rose-500/30">
          <h3 className="text-sm font-bold text-rose-400 mb-2">Processing Error</h3>
          <p className="text-xs text-zinc-300 mb-4">{errorMsg}</p>
          <button
            onClick={onNewImage}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
          >
            Try Another Image
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 flex flex-col h-full">
      
      {/* Studio Workbench Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 p-2.5 studio-card rounded-xl border border-zinc-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onNewImage}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center space-x-1.5 border border-zinc-700/80"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload New</span>
          </button>

          <span className="text-xs text-zinc-400 font-mono hidden sm:inline-block">
            Canvas: {dimensions.width} × {dimensions.height} px
          </span>
        </div>

        {/* Tab Selection buttons for sidebar */}
        <div className="segmented-control flex items-center">
          <button
            onClick={() => { setActiveSidebarTab('background'); setIsTouchupActive(false); }}
            className={`segmented-control-btn ${activeSidebarTab === 'background' && !isTouchupActive ? 'active' : ''}`}
          >
            <span>Background</span>
          </button>

          <button
            onClick={() => setIsTouchupActive(true)}
            className={`segmented-control-btn ${isTouchupActive ? 'active' : ''}`}
          >
            <span>Touch-up Edge</span>
          </button>

          <button
            onClick={() => { setActiveSidebarTab('fx'); setIsTouchupActive(false); }}
            className={`segmented-control-btn ${activeSidebarTab === 'fx' && !isTouchupActive ? 'active' : ''}`}
          >
            <span>Shadow & Sticker</span>
          </button>

          <button
            onClick={() => { setActiveSidebarTab('color'); setIsTouchupActive(false); }}
            className={`segmented-control-btn ${activeSidebarTab === 'color' && !isTouchupActive ? 'active' : ''}`}
          >
            <span>Filters</span>
          </button>
        </div>

        {/* Export HD Button */}
        <button
          onClick={() => setIsExportOpen(true)}
          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm flex items-center space-x-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export HD</span>
        </button>
      </div>

      {/* Main Studio Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        
        {/* Left/Center Viewport Area */}
        <div className="lg:col-span-8 flex flex-col studio-card rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
          {isTouchupActive ? (
            <ManualTouchup
              originalUrl={originalUrl}
              cutoutDataUrl={cutoutDataUrl}
              onApplyRefinedMask={handleApplyTouchup}
              onCancel={() => setIsTouchupActive(false)}
            />
          ) : (
            <CompareSlider
              originalUrl={originalUrl}
              processedCanvas={masterCanvas || cutoutDataUrl}
              maskUrl={maskUrl}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          )}
        </div>

        {/* Right Studio Inspector Panel */}
        <div className="lg:col-span-4 studio-card rounded-2xl border border-zinc-800 p-4 flex flex-col justify-between overflow-y-auto max-h-[660px]">
          
          {/* TAB 1: BACKGROUND SELECTION */}
          {activeSidebarTab === 'background' && !isTouchupActive && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Palette className="w-3.5 h-3.5 text-blue-400" />
                <span>Replace Background</span>
              </h3>

              {/* Background Types Grid */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setBackgroundConfig({ ...backgroundConfig, type: 'transparent' })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-all ${
                    backgroundConfig.type === 'transparent'
                      ? 'bg-blue-600/15 border-blue-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="w-4 h-4 rounded bg-checkerboard-dark border border-zinc-600" />
                  <span>Transparent</span>
                </button>

                <button
                  onClick={() => setBackgroundConfig({ ...backgroundConfig, type: 'color' })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-all ${
                    backgroundConfig.type === 'color'
                      ? 'bg-blue-600/15 border-blue-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="w-4 h-4 rounded border border-zinc-600" style={{ backgroundColor: backgroundConfig.color }} />
                  <span>Solid Color</span>
                </button>

                <button
                  onClick={() => setBackgroundConfig({ ...backgroundConfig, type: 'gradient' })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-all ${
                    backgroundConfig.type === 'gradient'
                      ? 'bg-blue-600/15 border-blue-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="w-4 h-4 rounded border border-zinc-600" style={{ background: backgroundConfig.gradientCss }} />
                  <span>Gradient</span>
                </button>

                <button
                  onClick={() => setBackgroundConfig({ ...backgroundConfig, type: 'blur' })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-all ${
                    backgroundConfig.type === 'blur'
                      ? 'bg-blue-600/15 border-blue-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>Blur Original</span>
                </button>
              </div>

              {/* Sub-options for Solid Color */}
              {backgroundConfig.type === 'color' && (
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-300">
                    <span className="font-semibold text-zinc-400">Presets:</span>
                    <input
                      type="color"
                      value={backgroundConfig.color}
                      onChange={(e) => setBackgroundConfig({ ...backgroundConfig, color: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_SOLID_COLORS.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => setBackgroundConfig({ ...backgroundConfig, color: c.hex })}
                        className="w-full h-7 rounded-lg border border-zinc-700 hover:scale-105 transition-transform"
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-options for Gradients */}
              {backgroundConfig.type === 'gradient' && (
                <div className="pt-2 space-y-3">
                  <span className="text-xs font-semibold text-zinc-400 block">Gradient Presets:</span>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_GRADIENTS.map((g, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          setBackgroundConfig({
                            ...backgroundConfig,
                            gradientCss: g.css,
                            stops: i === 0 ? ['#ff9a9e', '#fecfef'] : i === 1 ? ['#4facfe', '#00f2fe'] : ['#7F00FF', '#E100FF'],
                          })
                        }
                        className="w-full h-9 rounded-lg border border-zinc-700 hover:scale-105 transition-transform"
                        style={{ background: g.css }}
                        title={g.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Backdrop Photos */}
              <div className="pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-2 text-xs text-zinc-300">
                  <span className="font-semibold text-zinc-400">Stock Backdrops:</span>
                  <label className="text-[11px] text-blue-400 cursor-pointer hover:underline">
                    + Upload Custom
                    <input type="file" accept="image/*" onChange={handleCustomBgUpload} className="hidden" />
                  </label>
                </div>
                <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                  {PRESET_BACKGROUND_IMAGES.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() =>
                        setBackgroundConfig({
                          ...backgroundConfig,
                          type: 'image',
                          imageUrl: bg.url,
                        })
                      }
                      className="relative h-13 rounded-lg overflow-hidden border border-zinc-800 hover:border-blue-500 transition-all group"
                    >
                      <img src={bg.url} alt={bg.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Blur Strength Slider */}
              {backgroundConfig.type === 'blur' && (
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-zinc-300 mb-1">
                    <span className="font-semibold">Blur Radius:</span>
                    <span className="font-mono text-blue-400">{backgroundConfig.blurAmount}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={backgroundConfig.blurAmount}
                    onChange={(e) => setBackgroundConfig({ ...backgroundConfig, blurAmount: Number(e.target.value) })}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SHADOW & STICKER EFFECTS */}
          {activeSidebarTab === 'fx' && !isTouchupActive && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Drop Shadow & Sticker Border</span>
              </h3>

              {/* Drop Shadow Controls */}
              <div className="space-y-3 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                <div className="flex items-center justify-between text-xs text-white font-semibold">
                  <span>3D Drop Shadow</span>
                  <input
                    type="color"
                    value={fxConfig.shadowColor}
                    onChange={(e) => setFxConfig({ ...fxConfig, shadowColor: e.target.value })}
                    className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>Shadow Blur:</span>
                    <span className="font-mono text-blue-400">{fxConfig.shadowBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={fxConfig.shadowBlur}
                    onChange={(e) => setFxConfig({ ...fxConfig, shadowBlur: Number(e.target.value) })}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>Offset Y (Distance):</span>
                    <span className="font-mono text-blue-400">{fxConfig.shadowOffsetY}px</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="60"
                    value={fxConfig.shadowOffsetY}
                    onChange={(e) => setFxConfig({ ...fxConfig, shadowOffsetY: Number(e.target.value) })}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>

              {/* Sticker Border Controls */}
              <div className="space-y-3 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                <div className="flex items-center justify-between text-xs text-white font-semibold">
                  <span>Sticker Outline Border</span>
                  <input
                    type="color"
                    value={fxConfig.strokeColor}
                    onChange={(e) => setFxConfig({ ...fxConfig, strokeColor: e.target.value })}
                    className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>Border Thickness:</span>
                    <span className="font-mono text-blue-400">{fxConfig.strokeWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    value={fxConfig.strokeWidth}
                    onChange={(e) => setFxConfig({ ...fxConfig, strokeWidth: Number(e.target.value) })}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>

              {/* Transform & Scale */}
              <div className="space-y-3 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                <span className="text-xs text-white font-semibold block">Scale & Flip Subject</span>

                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>Scale:</span>
                    <span className="font-mono text-blue-400">{Math.round(fxConfig.scale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="1.8"
                    step="0.05"
                    value={fxConfig.scale}
                    onChange={(e) => setFxConfig({ ...fxConfig, scale: Number(e.target.value) })}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={() => setFxConfig({ ...fxConfig, flipH: !fxConfig.flipH })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border flex items-center justify-center space-x-1 ${
                      fxConfig.flipH ? 'bg-blue-600 text-white border-blue-500' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span>Flip H</span>
                  </button>
                  <button
                    onClick={() => setFxConfig({ ...fxConfig, flipV: !fxConfig.flipV })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border flex items-center justify-center space-x-1 ${
                      fxConfig.flipV ? 'bg-blue-600 text-white border-blue-500' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    <FlipVertical className="w-3.5 h-3.5" />
                    <span>Flip V</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COLOR ADJUSTMENTS */}
          {activeSidebarTab === 'color' && !isTouchupActive && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span>Color Grading & Adjustments</span>
              </h3>

              <div>
                <div className="flex justify-between text-xs text-zinc-300 mb-1">
                  <span>Brightness:</span>
                  <span className="font-mono text-blue-400">{fxConfig.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={fxConfig.brightness}
                  onChange={(e) => setFxConfig({ ...fxConfig, brightness: Number(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-zinc-300 mb-1">
                  <span>Contrast:</span>
                  <span className="font-mono text-blue-400">{fxConfig.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={fxConfig.contrast}
                  onChange={(e) => setFxConfig({ ...fxConfig, contrast: Number(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-zinc-300 mb-1">
                  <span>Saturation:</span>
                  <span className="font-mono text-blue-400">{fxConfig.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={fxConfig.saturation}
                  onChange={(e) => setFxConfig({ ...fxConfig, saturation: Number(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <button
                onClick={() => setFxConfig({ ...fxConfig, brightness: 100, contrast: 100, saturation: 100 })}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors mt-2"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Bottom Export Trigger */}
          <div className="pt-3 border-t border-zinc-800 mt-4">
            <button
              onClick={() => setIsExportOpen(true)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Cutout Result</span>
            </button>
          </div>

        </div>

      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        masterCanvas={masterCanvas}
        originalWidth={dimensions.width}
        originalHeight={dimensions.height}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
      />

    </div>
  );
}
