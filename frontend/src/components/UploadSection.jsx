import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Sliders, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { uploadImageApi } from '../services/api';

const UploadSection = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scale, setScale] = useState(4);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    if (!file) return;

    // Validate MIME type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file format. Please upload JPEG, PNG, or WebP.');
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Validate Size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds maximum limit of 10MB.');
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await uploadImageApi(selectedFile, scale);
      setSuccessMsg('Job successfully dispatched to BullMQ worker queue!');
      setSelectedFile(null);
      setPreviewUrl(null);
      if (onUploadSuccess) onUploadSuccess(response.data);
    } catch (err) {
      setError(err.message || 'Failed to submit image job');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 mb-8 border border-slate-800 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-brand-400" />
            Upload Source Image
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            PNG, JPEG, WebP supported up to 10MB. Images are upscaled asynchronously via BullMQ workers.
          </p>
        </div>

        {/* Scale Multiplier Selector */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
          <Sliders className="w-4 h-4 text-slate-400 ml-2" />
          <span className="text-xs font-semibold text-slate-300">Scale:</span>
          {[2, 4, 8].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScale(s)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                scale === s
                  ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          selectedFile
            ? 'border-brand-500/50 bg-brand-500/5'
            : 'border-slate-700/80 hover:border-brand-500/40 bg-slate-900/30 hover:bg-slate-900/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => handleFileChange(e.target.files[0])}
          className="hidden"
        />

        {previewUrl ? (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-lg border border-slate-700 shadow-md"
            />
            <div className="text-left space-y-1">
              <p className="text-sm font-semibold text-white truncate max-w-xs">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-400">
                Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <p className="text-xs font-medium text-brand-400">
                Target Upscale: Real-ESRGAN {scale}x Resolution
              </p>
              <p className="text-xs text-slate-500 mt-2">Click or drag a new image to replace</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-brand-400">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">
                <span className="text-brand-400 font-semibold">Click to upload</span> or drag and drop image here
              </p>
              <p className="text-xs text-slate-500 mt-1">High-Resolution AI Model Neural Reconstruction</p>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Submit Button */}
      {selectedFile && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={uploading}
            onClick={handleUploadSubmit}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Dispatching to BullMQ...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Start AI Upscaling ({scale}x)
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadSection;
