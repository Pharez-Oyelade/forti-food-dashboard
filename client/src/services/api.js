import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — redirect on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if already on login-related endpoints
      const isAuthRequest = error.config?.url?.includes('/auth/');
      if (!isAuthRequest) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper methods
export const get = (url, config) => api.get(url, config).then((res) => res.data);
export const post = (url, data, config) => api.post(url, data, config).then((res) => res.data);
export const put = (url, data, config) => api.put(url, data, config).then((res) => res.data);
export const del = (url, config) => api.delete(url, config).then((res) => res.data);

export default api;
