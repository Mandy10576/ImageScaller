import React, { useState } from 'react';
import { Layers, Clock, CheckCircle, AlertCircle, Download, RefreshCw, Trash2, ExternalLink } from 'lucide-react';

export default function JobMonitor({ jobs, onRefresh, onDelete, onRetry }) {
  const [filter, setFilter] = useState('ALL');

  const filteredJobs = jobs.filter((j) => {
    if (filter === 'ALL') return true;
    return j.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
            <CheckCircle className="w-3 h-3" />
            <span>COMPLETED</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20 flex items-center space-x-1">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>PROCESSING</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>QUEUED</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/20 flex items-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>FAILED</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <span>BullMQ Job Queue & Database Monitor</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time status of PostgreSQL job records and BullMQ Redis worker processing queue.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2">
          <div className="segmented-control flex items-center">
            {['ALL', 'PROCESSING', 'COMPLETED', 'FAILED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`segmented-control-btn ${filter === f ? 'active' : ''}`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
            title="Refresh Jobs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Jobs Table / List */}
      {filteredJobs.length === 0 ? (
        <div className="studio-card rounded-2xl p-12 text-center border border-zinc-800">
          <p className="text-sm font-semibold text-zinc-400">No jobs found for filter '{filter}'</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="studio-card studio-card-hover rounded-xl p-4 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Job Summary */}
              <div className="flex items-center space-x-3 truncate">
                <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0 font-mono text-xs font-bold">
                  {job.scale || 4}x
                </div>

                <div className="truncate">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white truncate">{job.originalName}</span>
                    {getStatusBadge(job.status)}
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-zinc-400 font-mono mt-1 flex-wrap gap-y-1">
                    <span>ID: {job.id.slice(0, 8)}...</span>
                    <span>•</span>
                    <span>Created: {new Date(job.createdAt).toLocaleTimeString()}</span>
                    {job.completedAt && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400">Completed: {new Date(job.completedAt).toLocaleTimeString()}</span>
                        <span>•</span>
                        <span className="text-blue-400">
                          ⏱ {(() => {
                            const ms = new Date(job.completedAt) - new Date(job.createdAt);
                            const totalSec = Math.floor(ms / 1000);
                            const min = Math.floor(totalSec / 60);
                            const sec = totalSec % 60;
                            return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
                          })()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress & Actions */}
              <div className="flex items-center space-x-4 justify-between md:justify-end">
                {/* Progress Bar */}
                {job.status === 'PROCESSING' && (
                  <div className="w-36">
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1 font-mono">
                      <span>Neural Matrix</span>
                      <span>{job.progress}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Download / Retry Buttons */}
                <div className="flex items-center space-x-2">
                  {job.status === 'COMPLETED' && (
                    <a
                      href={`/api/v1/jobs/${job.id}/download`}
                      download
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center space-x-1 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  )}

                  {job.status === 'FAILED' && (
                    <button
                      onClick={() => onRetry(job.id)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
                    >
                      Retry
                    </button>
                  )}

                  <button
                    onClick={() => onDelete(job.id)}
                    className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-rose-950 hover:text-rose-400 text-zinc-400 border border-zinc-700/80 transition-colors"
                    title="Delete Job"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
