const API_BASE_URL = '/api/v1';

export const uploadImageApi = async (file, scale = 4, onProgress) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('scale', scale);

  const response = await fetch(`${API_BASE_URL}/jobs/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to upload image');
  }

  return data;
};

export const fetchJobsApi = async (page = 1, limit = 10, status = '') => {
  let url = `${API_BASE_URL}/jobs?page=${page}&limit=${limit}`;
  if (status) url += `&status=${status}`;

  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch jobs');
  }

  return data;
};

export const fetchJobByIdApi = async (id) => {
  const response = await fetch(`${API_BASE_URL}/jobs/${id}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch job details');
  }

  return data;
};

export const deleteJobApi = async (id) => {
  const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
    method: 'DELETE',
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete job');
  }

  return data;
};

export const retryJobApi = async (id) => {
  const response = await fetch(`${API_BASE_URL}/jobs/${id}/retry`, {
    method: 'POST',
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retry job');
  }

  return data;
};

export const checkHealthApi = async () => {
  const response = await fetch(`${API_BASE_URL}/health`);
  const data = await response.json();
  return data;
};

export const getDownloadUrl = (id) => `${API_BASE_URL}/jobs/${id}/download`;
