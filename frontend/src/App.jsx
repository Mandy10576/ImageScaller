import React from 'react';
import Navbar from './components/Navbar';
import UploadSection from './components/UploadSection';
import JobList from './components/JobList';
import { useJobPolling } from './hooks/useJobPolling';

function App() {
  const {
    jobs,
    pagination,
    loading,
    error,
    activeFilter,
    setActiveFilter,
    refreshJobs,
  } = useJobPolling(2000);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Header Hero Title */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
            Enterprise AI Image Upscaling
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            Upscale low-resolution images using Real-ESRGAN neural super-resolution models.
            Processed asynchronously using BullMQ, Redis, PostgreSQL, and Express.
          </p>
        </div>

        {/* Upload Form */}
        <UploadSection onUploadSuccess={refreshJobs} />

        {/* Queue & Job Monitor */}
        <JobList
          jobs={jobs}
          pagination={pagination}
          loading={loading}
          error={error}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          refreshJobs={refreshJobs}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        AI Image Upscaler Platform • Built with React, Vite, Express, BullMQ, Redis & PostgreSQL
      </footer>
    </div>
  );
}

export default App;
