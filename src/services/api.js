const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getToken = () => localStorage.getItem('inventario_token');

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `API error: ${response.status}`);
  }

  return data;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email, password) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => apiFetch('/auth/me'),
  logout: () =>
    apiFetch('/auth/logout', { method: 'POST' }).catch(() => {}),
};

// ─── Users ───────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: () => apiFetch('/users'),
  getById: (id) => apiFetch(`/users/${id}`),
  create: (body) => apiFetch('/users', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => apiFetch(`/users/${id}`, { method: 'DELETE' }),
};

// ─── Vans ────────────────────────────────────────────────────────────────────
export const vansApi = {
  getAll: () => apiFetch('/vans'),
  getById: (id) => apiFetch(`/vans/${id}`),
  create: (body) => apiFetch('/vans', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => apiFetch(`/vans/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => apiFetch(`/vans/${id}`, { method: 'DELETE' }),
};

// ─── Warehouse Inventory ──────────────────────────────────────────────────────
export const warehouseApi = {
  getAll: () => apiFetch('/warehouse-inventory'),
  getById: (id) => apiFetch(`/warehouse-inventory/${id}`),
  create: (body) => apiFetch('/warehouse-inventory', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) =>
    apiFetch(`/warehouse-inventory/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => apiFetch(`/warehouse-inventory/${id}`, { method: 'DELETE' }),
};

// ─── Customers ───────────────────────────────────────────────────────────────
export const customersApi = {
  getAll: () => apiFetch('/customers'),
  getById: (id) => apiFetch(`/customers/${id}`),
  create: (body) => apiFetch('/customers', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => apiFetch(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => apiFetch(`/customers/${id}`, { method: 'DELETE' }),
};

// ─── Delivery Trips ───────────────────────────────────────────────────────────
export const deliveryTripsApi = {
  getAll: () => apiFetch('/delivery-trips'),
  getById: (id) => apiFetch(`/delivery-trips/${id}`),
  create: (body) => apiFetch('/delivery-trips', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) =>
    apiFetch(`/delivery-trips/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  complete: (id) =>
    apiFetch(`/delivery-trips/${id}/complete`, { method: 'PUT' }),
  delete: (id) => apiFetch(`/delivery-trips/${id}`, { method: 'DELETE' }),
};

// ─── Deliveries ───────────────────────────────────────────────────────────────
export const deliveriesApi = {
  getAll: () => apiFetch('/deliveries'),
  getById: (id) => apiFetch(`/deliveries/${id}`),
  getByTripId: (tripId) => apiFetch(`/deliveries?trip_id=${tripId}`),
  create: (body) => apiFetch('/deliveries', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => apiFetch(`/deliveries/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => apiFetch(`/deliveries/${id}`, { method: 'DELETE' }),
};

// ─── Inventory Logs ──────────────────────────────────────────────────────────
export const inventoryLogsApi = {
  getAll: () => apiFetch('/inventory-logs'),
  getById: (id) => apiFetch(`/inventory-logs/${id}`),
  create: (body) => apiFetch('/inventory-logs', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) =>
    apiFetch(`/inventory-logs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => apiFetch(`/inventory-logs/${id}`, { method: 'DELETE' }),
};
