const RAW_BASE = import.meta.env.VITE_API_URL || '';
const API_BASE_URL = `${RAW_BASE.replace(/\/$/, '')}/api/v1`;

const handleResponse = async (response, fallbackErrorMsg) => {
  const contentType = response.headers.get('content-type') || '';
  
  if (contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || fallbackErrorMsg);
    }
    return data;
  } else {
    const text = await response.text();
    if (!response.ok) {
      const isHtmlError = text.includes('<!DOCTYPE html>') || text.includes('<html') || text.includes('Server Error');
      const msg = isHtmlError
        ? 'Server returned an error. Please verify backend environment variables & database connection.'
        : text || fallbackErrorMsg;
      throw new Error(msg);
    }
    return text;
  }
};

export const uploadImageApi = async (file, scale = 4) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('scale', scale);

  const response = await fetch(`${API_BASE_URL}/jobs/upload`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse(response, 'Failed to upload image');
};

export const fetchJobsApi = async (page = 1, limit = 10, status = '') => {
  let url = `${API_BASE_URL}/jobs?page=${page}&limit=${limit}`;
  if (status) url += `&status=${status}`;

  const response = await fetch(url);
  return handleResponse(response, 'Failed to fetch jobs');
};

export const fetchJobByIdApi = async (id) => {
  const response = await fetch(`${API_BASE_URL}/jobs/${id}`);
  return handleResponse(response, 'Failed to fetch job details');
};

export const deleteJobApi = async (id) => {
  const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response, 'Failed to delete job');
};

export const retryJobApi = async (id) => {
  const response = await fetch(`${API_BASE_URL}/jobs/${id}/retry`, {
    method: 'POST',
  });
  return handleResponse(response, 'Failed to retry job');
};

export const checkHealthApi = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return await handleResponse(response, 'Health check failed');
  } catch (err) {
    return { status: 'DOWN', message: err.message };
  }
};

export const getDownloadUrl = (id) => `${API_BASE_URL}/jobs/${id}/download`;
