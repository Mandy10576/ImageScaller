import React from 'react';
import { Layers, Filter, RefreshCw, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import JobCard from './JobCard';

const JobList = ({
  jobs,
  pagination,
  loading,
  error,
  activeFilter,
  setActiveFilter,
  refreshJobs,
}) => {
  const filters = [
    { label: 'All Jobs', value: '' },
    { label: 'Queued (Pending)', value: 'PENDING' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Failed', value: 'FAILED' },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-400" />
            BullMQ Processing Queue Monitor
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status updates powered by worker polling & PostgreSQL persistence.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshJobs}
          className="self-start sm:self-auto p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-slate-800/80">
        <Filter className="w-4 h-4 text-slate-500 mr-1" />
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setActiveFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === f.value
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                : 'bg-slate-900/50 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Job Grid */}
      {jobs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
          <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300">No jobs found in queue</p>
          <p className="text-xs text-slate-500 mt-1">
            Upload an image above to dispatch your first Real-ESRGAN upscaling task.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onActionCompleted={refreshJobs} />
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total jobs)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => refreshJobs(pagination.page - 1)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => refreshJobs(pagination.page + 1)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobList;
