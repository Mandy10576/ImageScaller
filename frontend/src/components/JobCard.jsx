import React, { useState } from 'react';
import { Download, RefreshCw, Trash2, CheckCircle2, Clock, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { getDownloadUrl, deleteJobApi, retryJobApi } from '../services/api';

const JobCard = ({ job, onActionCompleted }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = () => {
    window.open(getDownloadUrl(job.id), '_blank');
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this job and its image files?')) return;
    setLoading(true);
    try {
      await deleteJobApi(job.id);
      if (onActionCompleted) onActionCompleted();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    try {
      await retryJobApi(job.id);
      if (onActionCompleted) onActionCompleted();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Status Badge Rendering Helper
  const renderStatusBadge = () => {
    switch (job.status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Processing ({job.progress}%)
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            Queued in BullMQ
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="glass-card rounded-xl p-5 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="truncate">
            <h3 className="text-sm font-semibold text-white truncate" title={job.originalName}>
              {job.originalName}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Scale: <strong className="text-brand-400">{job.scale}x</strong> • {(job.fileSize / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          {renderStatusBadge()}
        </div>

        {/* Progress Bar */}
        {(job.status === 'PROCESSING' || job.status === 'PENDING') && (
          <div className="my-3">
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-brand-500 to-purple-500 h-2 transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(job.progress, 5)}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 text-right font-mono">{job.progress}%</p>
          </div>
        )}

        {/* Error Message display */}
        {job.status === 'FAILED' && job.errorMessage && (
          <div className="my-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {job.errorMessage}
          </div>
        )}

        <p className="text-[11px] text-slate-500 mt-2 font-mono">
          ID: {job.id.substring(0, 8)}... • Created: {new Date(job.createdAt).toLocaleTimeString()}
        </p>
      </div>

      {/* Action Footer Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <button
          type="button"
          disabled={loading}
          onClick={handleDelete}
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
          title="Delete Job"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>

        <div className="flex items-center gap-2">
          {job.status === 'FAILED' && (
            <button
              type="button"
              disabled={loading}
              onClick={handleRetry}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Retry Job
            </button>
          )}

          {job.status === 'COMPLETED' && (
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download Image
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobCard;
