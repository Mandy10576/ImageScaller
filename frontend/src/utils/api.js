import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
});

export const jobApi = {
  // Create upscale job (POST /api/v1/jobs/upload)
  createUpscaleJob: async (file, scale = 4) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('scale', scale);

    const res = await api.post('/jobs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Get job by ID (GET /api/v1/jobs/:id)
  getJobById: async (id) => {
    const res = await api.get(`/jobs/${id}`);
    return res.data;
  },

  // Get all jobs (GET /api/v1/jobs)
  getAllJobs: async (params = {}) => {
    const res = await api.get('/jobs', { params });
    return res.data;
  },

  // Retry job (POST /api/v1/jobs/:id/retry)
  retryJob: async (id) => {
    const res = await api.post(`/jobs/${id}/retry`);
    return res.data;
  },

  // Delete job (DELETE /api/v1/jobs/:id)
  deleteJob: async (id) => {
    const res = await api.delete(`/jobs/${id}`);
    return res.data;
  },

  // Check backend health (GET /api/v1/health)
  getHealth: async () => {
    const res = await api.get('/health');
    return res.data;
  },
};

export default api;
