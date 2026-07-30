import React, { useState } from 'react';
import { Layers, Image as ImageIcon, Sliders, Settings, Key, Check, Scissors, Cpu, Cloud, Plus } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  onReset,
  hasActiveImage,
  engine,
  setEngine,
  removeBgApiKey,
  setRemoveBgApiKey
}) {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempKey, setTempKey] = useState(removeBgApiKey || '');

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setRemoveBgApiKey(tempKey.trim());
    localStorage.setItem('REMOVE_BG_API_KEY', tempKey.trim());
    setShowSettingsModal(false);
  };

  return (
    <header className="sticky top-0 z-50 studio-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between py-2.5">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('editor')}>
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-white shadow-sm">
            <Scissors className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-base font-bold tracking-tight text-white">ClearCut</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/60 font-mono">
              Studio
            </span>
          </div>
        </div>

        {/* Center Mode Segmented Control */}
        <nav className="segmented-control hidden md:flex items-center">
          <button
            onClick={() => setActiveTab('editor')}
            className={`segmented-control-btn flex items-center space-x-1.5 ${activeTab === 'editor' ? 'active' : ''}`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Editor Workbench</span>
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`segmented-control-btn flex items-center space-x-1.5 ${activeTab === 'batch' ? 'active' : ''}`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Batch Queue</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`segmented-control-btn flex items-center space-x-1.5 ${activeTab === 'presets' ? 'active' : ''}`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Preset Gallery</span>
          </button>
        </nav>

        {/* Right Engine Selector & Controls */}
        <div className="flex items-center space-x-2.5">
          {/* AI Engine Switcher */}
          <div className="segmented-control hidden sm:flex items-center">
            <button
              onClick={() => setEngine('local')}
              className={`segmented-control-btn flex items-center space-x-1 ${engine === 'local' ? 'active' : ''}`}
            >
              <Cpu className="w-3 h-3 text-emerald-400" />
              <span>Local WASM</span>
            </button>
            <button
              onClick={() => setEngine('removebg')}
              className={`segmented-control-btn flex items-center space-x-1 ${engine === 'removebg' ? 'active' : ''}`}
            >
              <Cloud className="w-3 h-3 text-blue-400" />
              <span>rembg.com API</span>
            </button>
          </div>

          {/* Key Settings Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/80 transition-colors"
            title="Configure rembg.com API Key"
          >
            <Settings className="w-4 h-4" />
          </button>

          {hasActiveImage && (
            <button
              onClick={onReset}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Image</span>
            </button>
          )}
        </div>
      </div>

      {/* rembg.com API Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="studio-card p-6 rounded-2xl max-w-md w-full border border-zinc-700 shadow-2xl relative">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-zinc-800 text-blue-400 border border-zinc-700 flex items-center justify-center">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Engine & API Settings</h3>
                <p className="text-xs text-zinc-400">Configure background removal engine parameters</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Primary Processing Engine
                </label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setEngine('local')}
                    className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                      engine === 'local' ? 'bg-blue-600/15 border-blue-500 text-white font-bold' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="font-semibold mb-0.5">Local In-Browser WASM</div>
                    <div className="text-[10px] text-zinc-400">Free, unlimited, private</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEngine('removebg')}
                    className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                      engine === 'removebg' ? 'bg-blue-600/15 border-blue-500 text-white font-bold' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="font-semibold mb-0.5">rembg.com Cloud API</div>
                    <div className="text-[10px] text-zinc-400">Cloud precision rendering</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  rembg.com API Key
                </label>
                <input
                  type="password"
                  placeholder="Paste your rembg.com API key..."
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-zinc-400 mt-1.5">
                  Saved key is encrypted locally in your browser or used via server environment.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-3.5 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
