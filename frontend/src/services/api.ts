import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Importante para enviar e receber cookies HTTP-Only de autenticação
});

// Interceptor para tratar erros de autenticação (401/403)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
