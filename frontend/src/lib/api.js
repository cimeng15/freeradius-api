import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/login', data),             // Staff: { identity, password }
  clientLogin: (data) => api.post('/client-login', data), // Client: { identifier } (no password)
  logout: () => api.post('/logout'),
  me: () => api.get('/me'),
  changePassword: (data) => api.post('/change-password', data),
};

// Dashboard
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

// Packages
export const packageAPI = {
  list: (params) => api.get('/packages', { params }),
  get: (id) => api.get(`/packages/${id}`),
  create: (data) => api.post('/packages', data),
  update: (id, data) => api.put(`/packages/${id}`, data),
  delete: (id) => api.delete(`/packages/${id}`),
};

// Clients
export const clientAPI = {
  list: (params) => api.get('/clients', { params }),
  get: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  suspend: (id) => api.post(`/clients/${id}/suspend`),
  activate: (id) => api.post(`/clients/${id}/activate`),
};

// Routers
export const routerAPI = {
  list: (params) => api.get('/routers', { params }),
  get: (id) => api.get(`/routers/${id}`),
  create: (data) => api.post('/routers', data),
  update: (id, data) => api.put(`/routers/${id}`, data),
  delete: (id) => api.delete(`/routers/${id}`),
  test: (id) => api.post(`/routers/${id}/test`),
  statistics: (id) => api.get(`/routers/${id}/statistics`),
};

// Vouchers
export const voucherAPI = {
  list: (params) => api.get('/vouchers', { params }),
  get: (id) => api.get(`/vouchers/${id}`),
  create: (data) => api.post('/vouchers', data),
  update: (id, data) => api.put(`/vouchers/${id}`, data),
  delete: (id) => api.delete(`/vouchers/${id}`),
  bulk: (data) => api.post('/vouchers/bulk', data),
  check: (data) => api.post('/vouchers/check', data),
  use: (id) => api.post(`/vouchers/${id}/use`),
  bulkAction: (data) => api.post('/vouchers/bulk-action', data),
  groupedByTime: (params) => api.get('/vouchers-grouped', { params }),
};

// Resellers
export const resellerAPI = {
  list: (params) => api.get('/resellers', { params }),
  get: (id) => api.get(`/resellers/${id}`),
  create: (data) => api.post('/resellers', data),
  update: (id, data) => api.put(`/resellers/${id}`, data),
  delete: (id) => api.delete(`/resellers/${id}`),
  salesReport: (id, params) => api.get(`/resellers/${id}/sales-report`, { params }),
  addBalance: (id, data) => api.post(`/resellers/${id}/add-balance`, data),
  deductBalance: (id, data) => api.post(`/resellers/${id}/deduct-balance`, data),
};

// Staff Management
export const staffAPI = {
  list: (params) => api.get('/staff', { params }),
  get: (id) => api.get(`/staff/${id}`),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  delete: (id) => api.delete(`/staff/${id}`),
  roles: () => api.get('/staff-roles'),
};

// Settings
export const settingsAPI = {
  getPublic: () => api.get('/public/settings'),
  getAll: () => api.get('/settings'),
  getGroup: (group) => api.get(`/settings/group/${group}`),
  update: (data) => api.post('/settings', data),
  updateGeneral: (data) => api.post('/settings/general', data),
  uploadLogo: (formData) => api.post('/settings/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  systemInfo: () => api.get('/settings/system-info'),
  ping: (data) => api.post('/tools/ping', data),
  traceroute: (data) => api.post('/tools/traceroute', data),
};

// Monitoring
export const monitoringAPI = {
  onlineUsers: (params) => api.get('/monitoring/online-users', { params }),
  sessionHistory: (params) => api.get('/monitoring/session-history', { params }),
  bandwidthStats: (params) => api.get('/monitoring/bandwidth-stats', { params }),
  userSessions: (username) => api.get(`/monitoring/user-sessions/${username}`),
  disconnectUser: (data) => api.post('/monitoring/disconnect-user', data),
  realtimeStats: () => api.get('/monitoring/realtime-stats'),
};

export default api;
