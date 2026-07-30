import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Link as LinkIcon, Sparkles, Check, ArrowRight, Shield } from 'lucide-react';
import { SAMPLE_SUBJECT_IMAGES } from '../utils/sampleImages';

export default function UploadDropzone({ onImageSelected }) {
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlModal, setShowUrlModal] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelected(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageSelected(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = (e) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files[0]) {
      onImageSelected(e.clipboardData.files[0]);
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onImageSelected(urlInput.trim());
      setShowUrlModal(false);
      setUrlInput('');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-8 px-4" onPaste={handlePaste}>
      
      {/* Title */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/80 text-zinc-300 text-xs font-medium mb-3">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Studio Grade • Private In-Browser AI</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
          Image Background Remover
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Upload any portrait, product, pet, or vehicle photo to isolate subjects with precise AI matting.
        </p>
      </div>

      {/* Main Studio Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full relative group cursor-pointer rounded-2xl p-10 text-center transition-all duration-200 studio-card ${
          isDragging
            ? 'border-blue-500 bg-blue-950/20 scale-[1.005]'
            : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp, image/jpg"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/90 border border-zinc-700/80 flex items-center justify-center text-zinc-300 group-hover:scale-105 group-hover:text-white transition-all shadow-sm">
            <Upload className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white mb-1">
              Select an image or drag & drop here
            </h3>
            <p className="text-xs text-zinc-400">
              Supports PNG, JPG, WEBP • Up to 25MB • Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] border border-zinc-700">Ctrl+V</kbd> to paste
            </p>
          </div>

          <div className="flex items-center space-x-2.5 pt-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-sm"
            >
              Upload Photo
            </button>

            <button
              onClick={() => setShowUrlModal(true)}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-medium flex items-center space-x-1.5 transition-all"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Import URL</span>
            </button>
          </div>
        </div>
      </div>

      {/* URL Input Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="studio-card p-6 rounded-2xl max-w-md w-full border border-zinc-700 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-3">Import Image from URL</h3>
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <input
                type="url"
                required
                placeholder="https://example.com/photo.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowUrlModal(false)}
                  className="px-3.5 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                >
                  Load Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sample Quick Selector */}
      <div className="w-full mt-10">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-semibold text-zinc-400 flex items-center space-x-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span>Or test with a sample photo:</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {SAMPLE_SUBJECT_IMAGES.slice(0, 5).map((sample) => (
            <div
              key={sample.id}
              onClick={() => onImageSelected(sample.url)}
              className="studio-card studio-card-hover rounded-xl overflow-hidden cursor-pointer flex flex-col group"
            >
              <div className="h-24 w-full relative overflow-hidden bg-zinc-900">
                <img
                  src={sample.thumb}
                  alt={sample.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-2.5 flex items-center justify-between bg-zinc-900/60">
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
