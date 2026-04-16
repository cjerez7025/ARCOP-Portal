// ============================================================
// src/adapters/httpAdapter.js — v2.1
// v2.1: agrega probarGChat para test de webhook Google Chat
// ============================================================

import { getAuth } from 'firebase/auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const _ok  = (data) => ({ status: 'success', data });
const _err = (msg)  => ({ status: 'error',   data: null, message: msg });

async function _getToken() {
  const user = getAuth().currentUser;
  if (!user) return null;
  return user.getIdToken();
}

async function _fetch(path, options = {}, requiresAuth = false) {
  try {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

    if (requiresAuth) {
      const token = await _getToken();
      if (!token) return _err('No autenticado. Inicia sesión como DPO.');
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res  = await fetch(`${API_URL}${path}`, { ...options, headers });
    const data = await res.json();

    if (!res.ok) return _err(data.error || `Error ${res.status}`);
    return _ok(data.data ?? data);
  } catch (e) {
    console.error('[httpAdapter]', e.message);
    if (e.message.includes('Failed to fetch')) {
      return _err('No se puede conectar con el servidor. Verifica REACT_APP_API_URL.');
    }
    return _err(e.message);
  }
}

const httpAdapter = {

  nombre: 'http',

  // ── Config ─────────────────────────────────────────────
  getConfig:            async ()       => _fetch('/api/config'),
  saveConfig:           async (data)   => _fetch('/api/config', { method: 'POST', body: JSON.stringify(data) }, true),
  restoreConfig:        async ()       => _fetch('/api/config/restore', { method: 'POST' }, true),
  getFormularioConfig:  async ()       => _fetch('/api/config/formularios'),
  saveFormularioConfig: async (config) => _fetch('/api/config/formularios', { method: 'POST', body: JSON.stringify(config) }, true),
  getFlujoConfig:       async ()       => _fetch('/api/config/flujos'),
  saveFlujoConfig:      async (config) => _fetch('/api/config/flujos', { method: 'POST', body: JSON.stringify(config) }, true),
  probarGChat:          async (webhook_url, derecho) =>
    _fetch('/api/config/probar-gchat', { method: 'POST', body: JSON.stringify({ webhook_url, derecho }) }, true),

  // ── Derechos ────────────────────────────────────────────
  getDerechos: async () =>
    _fetch('/api/derechos'),

  getTodosDerechos: async () =>
    _fetch('/api/derechos/todos', {}, true),

  crearDerecho: async (id, datos) =>
    _fetch('/api/derechos', { method: 'POST', body: JSON.stringify({ id, ...datos }) }, true),

  editarDerecho: async (id, cambios) =>
    _fetch(`/api/derechos/${id}`, { method: 'PUT', body: JSON.stringify(cambios) }, true),

  toggleDerecho: async (id) =>
    _fetch(`/api/derechos/${id}/toggle`, { method: 'PUT' }, true),

  // ── Solicitudes ─────────────────────────────────────────
  createSolicitud: async (solicitud) =>
    _fetch('/api/solicitudes', { method: 'POST', body: JSON.stringify(solicitud) }),

  getSolicitudes: async (filtros = {}) => {
    const params = new URLSearchParams(
      Object.entries(filtros).filter(([, v]) => v != null && v !== '')
    ).toString();
    return _fetch(`/api/solicitudes${params ? '?' + params : ''}`, {}, true);
  },

  getSolicitudPorNumero: async (numero) =>
    _fetch(`/api/solicitudes/numero/${numero}`),

  getSolicitudPorToken: async (token) =>
    _fetch(`/api/solicitudes/token/${token}`),

  updateSolicitud: async (id, changes) =>
    _fetch(`/api/solicitudes/${id}/estado`, { method: 'PUT', body: JSON.stringify(changes) }, true),

  resolverSolicitud: async (id, urlDatos, formatoEntrega) =>
    _fetch(`/api/solicitudes/${id}/resolver`, {
      method: 'PUT',
      body: JSON.stringify({ url_datos: urlDatos, formato_entrega: formatoEntrega }),
    }, true),

  validarIdentidad: async (token) =>
    _fetch(`/api/solicitudes/validar/${token}`, { method: 'POST' }),

  confirmarDescarga: async (id) =>
    _fetch(`/api/solicitudes/${id}/descarga`, { method: 'POST' }),

  // ── Estadísticas ────────────────────────────────────────
  getEstadisticas: async () =>
    _fetch('/api/estadisticas', {}, true),
};

export default httpAdapter;