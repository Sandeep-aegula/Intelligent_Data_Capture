import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor — attach auth token when available & handle FormData
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If sending FormData, delete Content-Type so browser/axios sets boundary automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Dev mode: do not force redirect to /login
      console.warn('API 401 Unauthorized (dev mode: auth bypassed)');
    }
    // Extract helpful detail message if present from FastAPI
    const message = error.response?.data?.detail || error.message || 'Network request failed';
    error.userMessage = typeof message === 'string' ? message : JSON.stringify(message);
    return Promise.reject(error);
  }
);

export default api;
