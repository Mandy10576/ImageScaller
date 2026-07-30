import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import UploadDropzone from './components/UploadDropzone';
import EditorStudio from './components/EditorStudio';
import BatchProcessor from './components/BatchProcessor';
import PresetGallery from './components/PresetGallery';
import FeaturesSection from './components/FeaturesSection';

export default function App() {
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'batch' | 'presets'
  const [selectedImage, setSelectedImage] = useState(null);
  const [engine, setEngine] = useState('local'); // 'local' | 'removebg'
  const [removeBgApiKey, setRemoveBgApiKey] = useState('');

  useEffect(() => {
    const savedKey = localStorage.getItem('REMOVE_BG_API_KEY');
    if (savedKey) setRemoveBgApiKey(savedKey);
  }, []);

  const handleImageSelected = (imageSource) => {
    setSelectedImage(imageSource);
    setActiveTab('editor');
  };

  const handleResetImage = () => {
    setSelectedImage(null);
    setActiveTab('editor');
  };

  return (
    <div className="min-h-screen studio-bg flex flex-col font-sans text-zinc-100 selection:bg-blue-600 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReset={handleResetImage}
        hasActiveImage={!!selectedImage}
        engine={engine}
        setEngine={setEngine}
        removeBgApiKey={removeBgApiKey}
        setRemoveBgApiKey={setRemoveBgApiKey}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4">
        {activeTab === 'editor' && (
          <>
            {!selectedImage ? (
              <>
                <UploadDropzone onImageSelected={handleImageSelected} />
                <FeaturesSection />
              </>
            ) : (
              <EditorStudio
                initialImage={selectedImage}
                onNewImage={handleResetImage}
                engine={engine}
                apiKey={removeBgApiKey}
              />
            )}
          </>
        )}

        {activeTab === 'batch' && <BatchProcessor />}

        {activeTab === 'presets' && (
          <PresetGallery onSelectSample={handleImageSelected} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-6 bg-zinc-950/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white">ClearCut Studio</span>
            <span>•</span>
            <span>Image Background Remover</span>
          </div>

          <div className="flex items-center space-x-6 text-zinc-400">
            <span className="hover:text-zinc-200 cursor-pointer">rembg.com API</span>
            <span className="hover:text-zinc-200 cursor-pointer">Local WASM</span>
            <span className="hover:text-zinc-200 cursor-pointer">Batch Engine</span>
          </div>

          <p className="text-[11px] text-zinc-500">
            © 2026 ClearCut AI. Handcrafted Pro Studio.
          </p>
        </div>
      </footer>
    </div>
  );
}
