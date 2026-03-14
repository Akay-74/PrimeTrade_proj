import api from './axios.js';

export const getEventsApi = () => {
  return api.get('/events/');
};

export const createEventApi = (eventData) => {
  return api.post('/events/', eventData);
};

export const deleteEventApi = (eventId) => {
  return api.delete(`/events/${eventId}`);
};
