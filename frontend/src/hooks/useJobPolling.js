import { useState, useEffect, useCallback } from 'react';
import { fetchJobsApi } from '../services/api';

export const useJobPolling = (pollIntervalMs = 2000) => {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('');

  const loadJobs = useCallback(
    async (page = 1, status = activeFilter) => {
      try {
        const response = await fetchJobsApi(page, 10, status);
        setJobs(response.data);
        setPagination(response.pagination);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [activeFilter]
  );

  useEffect(() => {
    loadJobs(1, activeFilter);
  }, [loadJobs, activeFilter]);

  // Polling mechanism if any job is currently PENDING or PROCESSING
  useEffect(() => {
    const hasActiveJobs = jobs.some(
      (job) => job.status === 'PENDING' || job.status === 'PROCESSING'
    );

    if (!hasActiveJobs) return;

    const interval = setInterval(() => {
      loadJobs(pagination.page, activeFilter);
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [jobs, pagination.page, activeFilter, loadJobs, pollIntervalMs]);

  return {
    jobs,
    pagination,
    loading,
    error,
    activeFilter,
    setActiveFilter,
    refreshJobs: () => loadJobs(pagination.page, activeFilter),
  };
};
