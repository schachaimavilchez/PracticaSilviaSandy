// src/services/api.js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem('access_token');
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

const handleResponse = async (res) => {
  if (res.status === 401) {
    localStorage.clear();
    window.location.href = '/';
    return;
  }
  if (res.status === 204) return { success: true };
  const data = await res.json();
  if (!res.ok) throw { status: res.status, data };
  return data;
};

export const api = {
  // ── AUTH ──────────────────────────────────────────────────────────────────
  login: (credentials) =>
    fetch(`${BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }).then(handleResponse),

  register: (data) =>
    fetch(`${BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  me: () =>
    fetch(`${BASE_URL}/usuarios/me/`, { headers: getHeaders() }).then(handleResponse),

  // ── TARJETA GUARDADA ──────────────────────────────────────────────────────
  guardarTarjeta: (data) =>
    fetch(`${BASE_URL}/usuarios/guardar-tarjeta/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  // ── PRODUCTOS ─────────────────────────────────────────────────────────────
  getProductos: () =>
    fetch(`${BASE_URL}/productos/`, { headers: getHeaders() }).then(handleResponse),

  crearProducto: (data) => {
    const isFormData = data instanceof FormData;
    return fetch(`${BASE_URL}/productos/`, {
      method: 'POST',
      headers: getHeaders(isFormData),
      body: isFormData ? data : JSON.stringify(data),
    }).then(handleResponse);
  },

  actualizarProducto: (id, data) => {
    const isFormData = data instanceof FormData;
    return fetch(`${BASE_URL}/productos/${id}/`, {
      method: 'PATCH',
      headers: getHeaders(isFormData),
      body: isFormData ? data : JSON.stringify(data),
    }).then(handleResponse);
  },

  eliminarProducto: (id) =>
    fetch(`${BASE_URL}/productos/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then(handleResponse),

  // ── PEDIDOS ───────────────────────────────────────────────────────────────
  getPedidos: () =>
    fetch(`${BASE_URL}/pedidos/`, { headers: getHeaders() }).then(handleResponse),

  crearPedido: (items) =>
    fetch(`${BASE_URL}/pedidos/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ items }),
    }).then(handleResponse),

  cambiarEstado: (id, estado) =>
    fetch(`${BASE_URL}/pedidos/${id}/cambiar_estado/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ estado }),
    }).then(handleResponse),

  // ── PAGO ──────────────────────────────────────────────────────────────────
  /**
   * Paga un pedido concreto.
   * metodo: 'guardada' | 'nueva' | 'saldo'
   */
  pagar: (pedidoId, metodo = 'guardada') =>
    fetch(`${BASE_URL}/pedidos/${pedidoId}/pagar/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ metodo }),
    }).then(handleResponse),

  // ── QR ────────────────────────────────────────────────────────────────────
  validarQR: (codigo) =>
    fetch(`${BASE_URL}/qr/validar/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ codigo }),
    }).then(handleResponse),

  // ── ESTADÍSTICAS ──────────────────────────────────────────────────────────
  /**
   * Obtiene estadísticas con filtro opcional de fechas.
   * @param {string} fechaInicio  'YYYY-MM-DD' o null
   * @param {string} fechaFin     'YYYY-MM-DD' o null
   */
  getEstadisticas: (fechaInicio = null, fechaFin = null) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fecha_inicio', fechaInicio);
    if (fechaFin)    params.append('fecha_fin',    fechaFin);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetch(`${BASE_URL}/estadisticas/${query}`, { headers: getHeaders() }).then(handleResponse);
  },
};
