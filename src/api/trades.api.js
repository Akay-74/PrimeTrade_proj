import api from './axios';

export const getTradesApi = (params = {}) =>
  api.get('/trades', { params });

export const createTradeApi = (data) =>
  api.post('/trades', data);

export const getTradeApi = (id) =>
  api.get(`/trades/${id}`);

export const updateTradeApi = (id, data) =>
  api.patch(`/trades/${id}`, data);

export const deleteTradeApi = (id) =>
  api.delete(`/trades/${id}`);

export const getTradeSummaryApi = () =>
  api.get('/trades/summary');
