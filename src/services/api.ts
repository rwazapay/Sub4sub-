import axios from 'axios';

const API_BASE_URL = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('subloop_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for consistent error normalization
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if unauthorized
      localStorage.removeItem('subloop_token');
    }
    return Promise.reject(error);
  }
);
