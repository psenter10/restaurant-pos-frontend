import axios from 'axios';


const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';


const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token if present (simple bearer-token auth against the CI4 API)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token') || sessionStorage.getItem('pos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Every successful response is wrapped as { success, data } by the backend
// (see BaseApiController::success()). Unwrap it here so callers can keep
// using res.data as the payload directly, same as before a real API existed.
// Error responses ({ success:false, message, errors }) are left as-is —
// they surface via the rejected promise's error.response.data.
api.interceptors.response.use((response) => {
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    response.data = response.data.data;
  }
  return response;
});

// --- Auth ---
export const login = (username, password) => api.post('/auth/login', { username, password });
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');

// --- Menu: categories ---
export const getMenuCategories = () => api.get('/menu/categories');
export const createMenuCategory = (data) => api.post('/menu/categories', data);
export const updateMenuCategory = (id, data) => api.put(`/menu/categories/${id}`, data);
export const deleteMenuCategory = (id) => api.delete(`/menu/categories/${id}`);
export const toggleMenuCategoryAvailability = (id) => api.patch(`/menu/categories/${id}/toggle-availability`);

// --- Menu: groups ---
export const getMenuGroups = () => api.get('/menu/groups');
export const createMenuGroup = (data) => api.post('/menu/groups', data);
export const updateMenuGroup = (id, data) => api.put(`/menu/groups/${id}`, data);
export const deleteMenuGroup = (id) => api.delete(`/menu/groups/${id}`);
export const toggleMenuGroupAvailability = (id) => api.patch(`/menu/groups/${id}/toggle-availability`);
export const addCategoryToGroup = (groupId, categoryId) =>
  api.post(`/menu/groups/${groupId}/categories`, { category_id: categoryId });
export const removeCategoryFromGroup = (groupId, categoryId) =>
  api.delete(`/menu/groups/${groupId}/categories/${categoryId}`);

// --- Menu: items ---
export const getMenuItems = () => api.get('/menu/items');
export const createMenuItem = (data) => api.post('/menu/items', data);
export const updateMenuItem = (id, data) => api.put(`/menu/items/${id}`, data);
export const deleteMenuItem = (id) => api.delete(`/menu/items/${id}`);
export const toggleMenuItemAvailability = (id) => api.patch(`/menu/items/${id}/toggle-availability`);
export const toggleMenuItemFavourite = (id) => api.patch(`/menu/items/${id}/toggle-favourite`);

// --- Table & Floor: sections ---
export const getTableSections = () => api.get('/tables/sections');
export const createTableSection = (data) => api.post('/tables/sections', data);
export const updateTableSection = (id, data) => api.put(`/tables/sections/${id}`, data);
export const deleteTableSection = (id) => api.delete(`/tables/sections/${id}`);
export const toggleTableSectionAvailability = (id) => api.patch(`/tables/sections/${id}/toggle-availability`);

// --- Table & Floor: tables ---
export const getTables = () => api.get('/tables');
export const createTable = (sectionId, data) => api.post(`/tables/sections/${sectionId}/tables`, data);
export const updateTable = (id, data) => api.put(`/tables/${id}`, data);
export const deleteTable = (id) => api.delete(`/tables/${id}`);
export const toggleTableAvailability = (id) => api.patch(`/tables/${id}/toggle-availability`);
export const updateTableStatus = (id, data) => api.patch(`/tables/${id}/status`, data);
export const updateTableMerge = (id, mergedTableIds) =>
  api.put(`/tables/${id}/merge`, { merged_table_ids: mergedTableIds });

// --- Users ---
export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const resetUserPassword = (id, password) => api.put(`/users/${id}/password`, { password });
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const toggleUserActive = (id) => api.patch(`/users/${id}/toggle-active`);

// --- Waiters ---
export const getWaiters = () => api.get('/waiters');
export const createWaiter = (data) => api.post('/waiters', data);
export const updateWaiter = (id, data) => api.put(`/waiters/${id}`, data);
export const deleteWaiter = (id) => api.delete(`/waiters/${id}`);
export const toggleWaiterActive = (id) => api.patch(`/waiters/${id}/toggle-active`);
export const getWaiterStats = () => api.get('/waiters/stats');

// --- Settings ---
export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => api.put('/settings', data);

// --- Orders & KOTs ---
export const getTableOrder = (tableId) => api.get(`/tables/${tableId}/order`);
export const saveKot = (tableId, data) => api.post(`/tables/${tableId}/kots`, data);
export const generateBill = (orderId, data) => api.put(`/orders/${orderId}/bill`, data);
export const settleOrder = (orderId, data) => api.post(`/orders/${orderId}/settle`, data);
export const deleteOrder = (orderId) => api.delete(`/orders/${orderId}`);

// --- Kitchen Display ---
export const getKots = (date) => api.get('/kots', { params: { date } });
export const updateKotStatus = (id, status) => api.patch(`/kots/${id}/status`, { status });
export const cancelKot = (id) => api.delete(`/kots/${id}`);

// --- Admin dashboard ---
export const getDashboardSummary = () => api.get('/admin/dashboard/summary');
export const getSalesTrend = (days = 7) => api.get('/admin/dashboard/sales-trend', { params: { days } });
export const getTopSellingItems = (limit = 5) => api.get('/admin/dashboard/top-items', { params: { limit } });
export const getPaymentSplit = () => api.get('/admin/dashboard/payment-split');

// --- Reports ---
export const getDailySales = (from, to) => api.get('/reports/daily-sales', { params: { from, to } });
export const getSalesRegister = (from, to) => api.get('/reports/sales-register', { params: { from, to } });

// --- QZ Tray signing (see services/print.js connectQz) ---
export const signQzRequest = (request) => api.post('/qz/sign', { request });

export default api;
