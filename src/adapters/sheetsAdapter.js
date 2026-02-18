// ============================================================
// SHEETS ADAPTER
// Implementa el contrato del adaptador usando Google Apps Script
// Cuando se migre a Firebase, este archivo NO se toca.
// ============================================================

const API_URL = process.env.REACT_APP_APPS_SCRIPT_URL;

// ── Helper interno ────────────────────────────────────────
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
  const response = await fetch(`${API_URL}?${qs}`, {
    method: 'GET',
    redirect: 'follow',
  });

  return response.json();
};

// ============================================================
// CONTRATO DEL ADAPTADOR
// Todas las funciones que firebaseAdapter.js debe implementar
// ============================================================

const sheetsAdapter = {

  // ── Configuración del sistema ──────────────────────────

  getConfig: async () => {
    return get('getConfiguracion');
  },

  saveConfig: async (data) => {
    return post('guardarConfiguracion', data);
  },

  restoreConfig: async () => {
    return post('restaurarConfiguracion', {});
  },

  // ── Configuración de formularios dinámicos ─────────────

  getFormularioConfig: async () => {
    const result = await get('getConfiguracion');
    if (result.status !== 'success') return { status: 'error', data: null };

    const raw = result.data?.campos_formulario;
    if (!raw) return { status: 'success', data: null }; // null = usar defaults

    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return { status: 'success', data: parsed };
    } catch {
      console.warn('campos_formulario inválido en Sheets, usando defaults');
      return { status: 'success', data: null };
    }
  },

  saveFormularioConfig: async (formularioConfig) => {
    // Obtiene config actual para no pisar otros campos
    const current = await get('getConfiguracion');
    const currentData = current.status === 'success' ? current.data : {};

    const updated = {
      ...currentData,
      campos_formulario: JSON.stringify(formularioConfig),
    };

    return post('guardarConfiguracion', updated);
  },

  // ── Solicitudes ────────────────────────────────────────

  createSolicitud: async (solicitud) => {
    return post('createSolicitud', { solicitud });
  },

  getSolicitudes: async (filtros = {}) => {
    return get('getTodasSolicitudes', filtros);
  },

  getSolicitudPorNumero: async (numero) => {
    return get('getSolicitudPorNumero', { numero });
  },

  getSolicitudPorToken: async (token) => {
    return get('getSolicitud', { token });
  },

  updateSolicitud: async (id, changes) => {
    return post('actualizarSolicitud', { id, ...changes });
  },

  resolverSolicitud: async (id, urlDatos, formatoEntrega) => {
    return post('marcarResuelta', { id, url_datos: urlDatos, formato_entrega: formatoEntrega });
  },

  validarIdentidad: async (token) => {
    return post('validarIdentidad', { token });
  },

  // ── Estadísticas ───────────────────────────────────────

  getEstadisticas: async () => {
    return get('getEstadisticas');
  },
};

export default sheetsAdapter;