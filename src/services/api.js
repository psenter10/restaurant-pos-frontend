import axios from 'axios';

// Set VITE_API_BASE_URL in your .env file, e.g. https://yourdomain.com/api
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token if present (simple token-based auth against CI4)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token') || sessionStorage.getItem('pos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Auth ---
export const login = (username, password) => api.post('/auth/login', { username, password });

// --- Menu ---
export const getCategories = () => api.get('/categories');
export const getMenuItems = () => api.get('/menu-items');
export const createMenuItem = (data) => api.post('/menu-items', data);
export const updateMenuItem = (id, data) => api.put(`/menu-items/${id}`, data);
export const deleteMenuItem = (id) => api.delete(`/menu-items/${id}`);

// --- Tables ---
export const getTables = () => api.get('/tables');
export const updateTableStatus = (id, status) => api.patch(`/tables/${id}`, { status });

// --- Orders ---
export const getOrder = (tableId) => api.get(`/orders/table/${tableId}`);
export const createOrder = (data) => api.post('/orders', data);
export const addOrderItem = (orderId, data) => api.post(`/orders/${orderId}/items`, data);
export const removeOrderItem = (orderId, itemId) => api.delete(`/orders/${orderId}/items/${itemId}`);
export const closeOrder = (orderId, data) => api.post(`/orders/${orderId}/close`, data);

// --- KOT ---
export const getPendingKots = () => api.get('/kots?status=pending,preparing');
export const updateKotStatus = (kotId, status) => api.patch(`/kots/${kotId}`, { status });

// --- Reports ---
export const getDailySales = (date) => api.get('/reports/daily-sales', { params: { date } });

export default api;
