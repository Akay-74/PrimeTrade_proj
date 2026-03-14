import api from './axios';

export const getUsersApi = (params = {}) =>
  api.get('/users', { params });

export const getUserApi = (id) =>
  api.get(`/users/${id}`);

export const updateUserRoleApi = (id, role) =>
  api.patch(`/users/${id}/role`, { role });

export const deleteUserApi = (id) =>
  api.delete(`/users/${id}`);
