import axios from 'axios';

const VITE_URL = import.meta.env.VITE_API_URL || '';
const BASE = VITE_URL.endsWith('/api') ? VITE_URL : `${VITE_URL}/api`;

const adminApi = axios.create({ baseURL: VITE_URL ? `${BASE}/admin` : undefined });

// Attach stored token automatically
adminApi.interceptors.request.use(config => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect on 401
adminApi.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

export default adminApi;
