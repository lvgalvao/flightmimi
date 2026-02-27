import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export default {
  // Airports
  searchAirports(query) {
    return api.get('/airports/search', { params: { query } });
  },

  // Alerts
  getAlerts() {
    return api.get('/alerts');
  },

  getAlert(id) {
    return api.get(`/alerts/${id}`);
  },

  createAlert(data) {
    return api.post('/alerts', data);
  },

  updateAlert(id, data) {
    return api.put(`/alerts/${id}`, data);
  },

  deleteAlert(id) {
    return api.delete(`/alerts/${id}`);
  },

  checkAlertNow(id) {
    return api.post(`/alerts/${id}/check`);
  },

  exportAlertCSV(id) {
    return api.get(`/alerts/${id}/export`, { responseType: 'blob' });
  },

  // Notifications
  getNotifications() {
    return api.get('/notifications');
  },

  markNotificationRead(id) {
    return api.put(`/notifications/${id}/read`);
  },
};
