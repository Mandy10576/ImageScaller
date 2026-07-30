import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import UploadSection from './components/UploadSection';
import CompareSlider from './components/CompareSlider';
import JobMonitor from './components/JobMonitor';
import ArchitectureModal from './components/ArchitectureModal';
import { jobApi } from './utils/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('studio'); // 'studio' | 'jobs'
  const [activeJob, setActiveJob] = useState(null);
  const [jobsList, setJobsList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchOpen, setIsArchOpen] = useState(false);

  // Poll active job status if it's processing
  useEffect(() => {
    if (!activeJob || activeJob.status === 'COMPLETED' || activeJob.status === 'FAILED') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await jobApi.getJobById(activeJob.id);
        if (res && res.data) {
          setActiveJob(res.data);
          if (res.data.status === 'COMPLETED' || res.data.status === 'FAILED') {
            refreshJobsList();
          }
        }
      } catch (err) {
        console.error('Error polling job status:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeJob]);

  // Initial load of jobs list
  useEffect(() => {
    refreshJobsList();
  }, []);

  const refreshJobsList = async () => {
    try {
      const res = await jobApi.getAllJobs({ limit: 10 });
      if (res && res.data) {
        setJobsList(res.data);
      }
    } catch (err) {
      console.error('Error fetching jobs list:', err);
    }
  };

  const handleUploadSubmit = async (file, scale) => {
    setIsSubmitting(true);
    try {
      const res = await jobApi.createUpscaleJob(file, scale);
      if (res && res.data) {
        const newJob = {
          ...res.data,
          originalUrl: URL.createObjectURL(file),
        };
        setActiveJob(newJob);
        refreshJobsList();
      }
    } catch (err) {
      console.error('Error submitting job:', err);
      alert('Failed to submit job to queue. Ensure Express server and Redis are running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      await jobApi.deleteJob(jobId);
      if (activeJob && activeJob.id === jobId) {
        setActiveJob(null);
      }
      refreshJobsList();
    } catch (err) {
      console.error('Error deleting job:', err);
    }
  };

  const handleRetryJob = async (jobId) => {
    try {
      const res = await jobApi.retryJob(jobId);
      if (res && res.data) {
        setActiveJob(res.data);
        refreshJobsList();
      }
    } catch (err) {
      console.error('Error retrying job:', err);
    }
  };

  return (
    <div className="min-h-screen studio-bg flex flex-col font-sans text-zinc-100 selection:bg-blue-600 selection:text-white">
      
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenArchitecture={() => setIsArchOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4">
        {activeTab === 'studio' && (
          <>
            {!activeJob ? (
              <UploadSection
                onUploadSubmit={handleUploadSubmit}
                isSubmitting={isSubmitting}
              />
            ) : (
              <div className="max-w-5xl mx-auto space-y-4">
                {/* Top Control Bar */}
                <div className="studio-card p-3 rounded-2xl border border-zinc-800 flex items-center justify-between">
                  <button
                    onClick={() => setActiveJob(null)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                  >
                    ← Upscale Another Image
                  </button>

                  <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400">
                    <span>Job ID: {activeJob.id.slice(0, 8)}...</span>
                    <span>•</span>
                    <span className="text-white font-bold">{activeJob.scale || 4}x Real-ESRGAN</span>
                  </div>
                </div>

                {/* Processing State vs Comparison View */}
                {activeJob.status === 'PROCESSING' || activeJob.status === 'PENDING' ? (
                  <div className="studio-card p-12 rounded-2xl text-center border border-zinc-800">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto mb-4 animate-spin">
                      ⏳
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      {activeJob.status === 'PENDING' ? 'Queued in BullMQ Redis Queue...' : 'Upscaling via Python FastAPI AI Service...'}
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto mb-4">
                      Executing Real-ESRGAN super-resolution tensor processing ({activeJob.progress || 10}%).
                    </p>
                    <div className="w-full max-w-md bg-zinc-900 rounded-full h-2 mx-auto overflow-hidden border border-zinc-800">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${activeJob.progress || 10}%` }}
                      />
                    </div>
                  </div>
                ) : activeJob.status === 'COMPLETED' ? (
                  <div className="studio-card rounded-2xl overflow-hidden border border-zinc-800">
                    <CompareSlider
                      originalUrl={activeJob.originalUrl || `/uploads/${activeJob.inputPath ? activeJob.inputPath.split(/[\/\\]/).pop() : ''}`}
                      upscaledUrl={`/outputs/${activeJob.outputPath ? activeJob.outputPath.split(/[\/\\]/).pop() : ''}`}
                      scale={activeJob.scale || 4}
                    />
                    
                    {/* Bottom Download Bar */}
                    <div className="p-4 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between">
                      <div className="text-xs text-zinc-400">
                        Upscaling complete! High-definition output ready.
                      </div>
                      <a
                        href={`/api/v1/jobs/${activeJob.id}/download`}
                        download
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-sm flex items-center space-x-2"
                      >
                        <span>Download {activeJob.scale || 4}x High-Res Output</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="studio-card p-8 rounded-2xl text-center border border-rose-500/30">
                    <h3 className="text-sm font-bold text-rose-400 mb-2">Upscaling Job Failed</h3>
                    <p className="text-xs text-zinc-300 mb-4">{activeJob.errorMessage || 'Unknown processing error'}</p>
                    <button
                      onClick={() => handleRetryJob(activeJob.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
                    >
                      Retry Job
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'jobs' && (
          <JobMonitor
            jobs={jobsList}
            onRefresh={refreshJobsList}
            onDelete={handleDeleteJob}
            onRetry={handleRetryJob}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-6 bg-zinc-950/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white">SuperRes AI</span>
            <span>•</span>
            <span>Real-ESRGAN Neural Super-Resolution Platform</span>
          </div>

          <div className="flex items-center space-x-6 text-zinc-400">
            <span className="hover:text-zinc-200 cursor-pointer" onClick={() => setIsArchOpen(true)}>
              Architecture Flow
            </span>
            <span className="hover:text-zinc-200 cursor-pointer">BullMQ + Redis</span>
            <span className="hover:text-zinc-200 cursor-pointer">Python FastAPI</span>
          </div>

          <p className="text-[11px] text-zinc-500">
            © 2026 SuperRes AI. Built with React, Express, BullMQ, Redis, PostgreSQL & Python.
          </p>
        </div>
      </footer>

      {/* Architecture Flow Modal */}
      <ArchitectureModal
        isOpen={isArchOpen}
        onClose={() => setIsArchOpen(false)}
      />
    </div>
  );
}
