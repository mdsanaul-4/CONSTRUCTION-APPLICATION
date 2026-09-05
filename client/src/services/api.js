import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://construction-application-umyp.onrender.com',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('clm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('clm_token');
      localStorage.removeItem('clm_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function apiErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  return err?.response?.data?.message || fallback;
}

export default api;
