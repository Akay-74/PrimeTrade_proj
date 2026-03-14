import api from './axios';

export const loginApi = (email, password) =>
  api.post('/auth/login', { email, password });

export const registerApi = (name, email, password) =>
  api.post('/auth/register', { name, email, password });

export const getMeApi = () => api.get('/auth/me');
