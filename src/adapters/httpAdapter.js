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

  saveBranding:           async (data) =>
    _fetch('/api/config/branding', { method: 'PUT', body: JSON.stringify(data) }, true),
  extractBrandingFromUrl: async (url)  =>
    _fetch('/api/config/branding/extract-from-url', { method: 'POST', body: JSON.stringify({ url }) }, true),
  getBrandingTemplates:   async ()     =>
    _fetch('/api/config/branding/templates', {}, true),

  uploadLogo: async (file) => {
    try {
      const token = await _getToken();
      if (!token) return _err('No autenticado');
      const formData = new FormData();
      formData.append('logo', file);
      const res  = await fetch(`${API_URL}/api/config/logo`, {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body:    formData,
      });
      const data = await res.json();
      if (!res.ok) return _err(data.error || `Error ${res.status}`);
      return _ok(data.data ?? data);
    } catch (e) {
      return _err(e.message);
    }
  },

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
uploadDocumentacion: async (solicitudId, archivos) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const formData = new FormData();
      formData.append('solicitudId', solicitudId);
 
      for (const archivo of archivos) {
        formData.append('archivos', archivo);
      }
 
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body:   formData,
        // NO poner Content-Type — fetch lo setea automáticamente con boundary
      });
 
      const data = await res.json();
 
      if (!res.ok) {
        return { status: 'error', data: null, message: data.error || `Error ${res.status}` };
      }
 
      return { status: 'success', data: data.data };
    } catch (e) {
      console.error('[httpAdapter] uploadDocumentacion error:', e.message);
      return { status: 'error', data: null, message: e.message };
    }
  },
  desistirSolicitud: async (id, motivo) =>
   _fetch(`/api/solicitudes/${id}/desistir`, { method: 'POST', body: JSON.stringify({ motivo }) }),
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

  rechazarSolicitud: async (id, causal, nota) =>
    _fetch(`/api/solicitudes/${id}/rechazar`, {
      method: 'POST',
      body: JSON.stringify({ causal, nota }),
    }, true),

  asignarResponsable: async (id, datos) =>
    _fetch(`/api/solicitudes/${id}/asignar`,
      { method: 'PUT', body: JSON.stringify(datos) }, true),

  reenviarValidacion: async (numero) =>
    _fetch(`/api/solicitudes/${numero}/reenviar-validacion`, { method: 'POST' }),

  // ── Brechas de datos (Art. 14 bis Ley 21.719) ───────────
  getBrechas: async () =>
    _fetch('/api/brechas', {}, true),

  registrarBrecha: async (datos) =>
    _fetch('/api/brechas', { method: 'POST', body: JSON.stringify(datos) }, true),

  actualizarBrecha: async (id, datos) =>
    _fetch(`/api/brechas/${id}/estado`,
      { method: 'PUT', body: JSON.stringify(datos) }, true),

  // ── Usuarios internos ────────────────────────────────────────
  getUsuarios: async () =>
    _fetch('/api/usuarios', {}, true),

  crearUsuario: async (datos) =>
    _fetch('/api/usuarios', { method: 'POST', body: JSON.stringify(datos) }, true),

  cambiarRolUsuario: async (uid, rol) =>
    _fetch(`/api/usuarios/${uid}/rol`, { method: 'PUT', body: JSON.stringify({ rol }) }, true),

  cambiarEstadoUsuario: async (uid, activo) =>
    _fetch(`/api/usuarios/${uid}/estado`, { method: 'PUT', body: JSON.stringify({ activo }) }, true),

  // ── Estadísticas ────────────────────────────────────────
  getEstadisticas: async () =>
    _fetch('/api/estadisticas', {}, true),
};

export default httpAdapter;