import { create } from 'zustand';
import axios from 'axios';

// Smart API URL determination:
// 1. Use environment variable VITE_API_URL if configured
// 2. If running locally, point to local backend port 5000
// 3. If running in production (Vercel/live), point to the Render backend URL
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal ? `http://localhost:5000/api` : `https://mansaracrm.onrender.com/api`;
};

export const API_URL = getApiUrl();
export const BACKEND_URL = API_URL.replace(/\/api$/, '');

// Set default base URL for API requests
axios.defaults.baseURL = API_URL;

// Configure interceptor to inject Authorization header dynamically
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('mansara_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('mansara_token') || null,
  isAuthenticated: !!localStorage.getItem('mansara_token'),
  loading: false,
  error: null,

  // Actions
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { token, user } = response.data.data;
      
      localStorage.setItem('mansara_token', token);
      set({ token, user, isAuthenticated: true, loading: false });
      return { success: true, role: user.role };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check credentials.';
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  logout: () => {
    localStorage.removeItem('mansara_token');
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  fetchCurrentUser: async () => {
    const token = get().token;
    if (!token) return;
    
    set({ loading: true });
    try {
      const response = await axios.get('/auth/me');
      set({ user: response.data.data, isAuthenticated: true, loading: false });
    } catch (err) {
      // Token probably invalid/expired
      localStorage.removeItem('mansara_token');
      set({ user: null, token: null, isAuthenticated: false, loading: false });
    }
  },

  clearError: () => set({ error: null })
}));
