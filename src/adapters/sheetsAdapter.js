// ============================================================
// src/adapters/sheetsAdapter.js
// Agrega confirmarDescarga() al contrato
// ============================================================

const API_URL = process.env.REACT_APP_APPS_SCRIPT_URL;

const post = async (action, body = {}) => {
  if (!API_URL) throw new Error('REACT_APP_APPS_SCRIPT_URL no configurada en .env');
  const response = await fetch(`${API_URL}?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
    redirect: 'follow',
  });
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    if (text.toLowerCase().includes('error') || text.toLowerCase().includes('exception')) {
      throw new Error('Error en Apps Script: ' + text.substring(0, 200));
    }
    return { status: 'success' };
  }
};

const get = async (action, params = {}) => {
  if (!API_URL) throw new Error('REACT_APP_APPS_SCRIPT_URL no configurada en .env');
  const qs = new URLSearchParams({ action, ...params }).toString();
  const response = await fetch(`${API_URL}?${qs}`, { method: 'GET', redirect: 'follow' });
  return response.json();
};

const sheetsAdapter = {

  // ── Configuración ─────────────────────────────────────
  getConfig:    async ()     => get('getConfiguracion'),
  saveConfig:   async (data) => post('guardarConfiguracion', data),
  restoreConfig: async ()    => post('restaurarConfiguracion', {}),

  // ── Formularios dinámicos ─────────────────────────────
  getFormularioConfig: async () => {
    const result = await get('getConfiguracion');
    if (result.status !== 'success') return { status: 'error', data: null };
    const raw = result.data?.campos_formulario;
    if (!raw) return { status: 'success', data: null };
    try {
      return { status: 'success', data: typeof raw === 'string' ? JSON.parse(raw) : raw };
    } catch {
      return { status: 'success', data: null };
    }
  },

  saveFormularioConfig: async (formularioConfig) => {
    const current = await get('getConfiguracion');
    const currentData = current.status === 'success' ? current.data : {};
    return post('guardarConfiguracion', { ...currentData, campos_formulario: JSON.stringify(formularioConfig) });
  },

  // ── Flujos ────────────────────────────────────────────
  getFlujoConfig: async () => {
    const result = await get('getConfiguracion');
    if (result.status !== 'success') return { status: 'error', data: null };
    const raw = result.data?.flujo_config;
    if (!raw) return { status: 'success', data: null };
    try {
      return { status: 'success', data: typeof raw === 'string' ? JSON.parse(raw) : raw };
    } catch {
      return { status: 'success', data: null };
    }
  },

  saveFlujoConfig: async (flujoConfig) => {
    const current = await get('getConfiguracion');
    const currentData = current.status === 'success' ? current.data : {};
    return post('guardarConfiguracion', { ...currentData, flujo_config: JSON.stringify(flujoConfig) });
  },

  // ── Solicitudes ───────────────────────────────────────
  createSolicitud:       async (solicitud)          => post('createSolicitud', { solicitud }),
  getSolicitudes:        async (filtros = {})        => get('getTodasSolicitudes', filtros),
  getSolicitudPorNumero: async (numero)              => get('getSolicitudPorNumero', { numero }),
  getSolicitudPorToken:  async (token)               => get('getSolicitud', { token }),
  updateSolicitud:       async (id, changes)         => post('actualizarSolicitud', { id, ...changes }),
  resolverSolicitud:     async (id, urlDatos, fmt)   => post('marcarResuelta', { id, url_datos: urlDatos, formato_entrega: fmt }),
  validarIdentidad:      async (token)               => post('validarIdentidad', { token }),

  // ── NUEVO: Confirmar descarga ─────────────────────────
  // Llamado desde Seguimiento.jsx cuando el titular hace clic en "Descargar"
  // Registra timestamp, contador y cambia estado a DESCARGA_CONFIRMADA
  confirmarDescarga: async (id) => {
    return post('confirmarDescarga', { id, descarga_confirmada_en: new Date().toISOString() });
  },

  // ── Estadísticas ──────────────────────────────────────
  getEstadisticas: async () => get('getEstadisticas'),
};

export default sheetsAdapter;