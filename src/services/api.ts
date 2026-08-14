import axios from 'axios';

// Get backend API base URL from environment or fallback to relative '/api'
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && (window as any).__VITE_API_URL__) {
    return (window as any).__VITE_API_URL__;
  }
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    // Ensure no trailing slash
    return envUrl.trim().replace(/\/+$/, '');
  }
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 25000,
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
    // Only remove token if it's explicitly an expired token or invalid user error
    if (
      error.response &&
      error.response.status === 401 &&
      (error.response.data?.errorCode === 'TOKEN_EXPIRED' || error.response.data?.errorCode === 'TOKEN_INVALID')
    ) {
      // Gentle check: don't clear if user object is actively present in storage
    }
    // Handle network errors gracefully
    if (!error.response && error.message === 'Network Error') {
      console.warn('SubLoop API Network Warning: Server connectivity check.');
    }
    return Promise.reject(error);
  }
);

