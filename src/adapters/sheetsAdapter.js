// ============================================================
// src/adapters/sheetsAdapter.js
// createSolicitud completa TODOS los campos que espera
// GoogleSheetsService.guardarSolicitud() en Apps Script:
//   id, numero_solicitud, fecha_solicitud, tipo, estado,
//   nombre_completo, rut, email, telefono, alcance_acceso,
//   categorias, formato_preferido, token_validacion,
//   token_expiracion, fecha_limite, dias_restantes,
//   ip_origen, user_agent, creado_en
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

// ── Helpers locales (espejo de Utils.gs) ──────────────────
const _generarNumero = () => {
  const d   = new Date();
  const año = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const rnd = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SOL-${año}${mes}-${rnd}`;
};

const _generarId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/** Fecha límite: 15 días hábiles desde hoy */
const _fechaLimite = () => {
  const f = new Date();
  let d = 0;
  while (d < 15) {
    f.setDate(f.getDate() + 1);
    if (f.getDay() !== 0 && f.getDay() !== 6) d++;
  }
  return f.toISOString();
};

/** Token expira en 5 días (DIAS_VALIDACION del Apps Script) */
const _tokenExpiracion = () => {
  const f = new Date();
  f.setDate(f.getDate() + 5);
  return f.toISOString();
};

// ── Adapter ───────────────────────────────────────────────
const sheetsAdapter = {

  // ── Configuración ─────────────────────────────────────
  getConfig:     async ()     => get('getConfiguracion'),
  saveConfig:    async (data) => post('guardarConfiguracion', data),
  restoreConfig: async ()     => post('restaurarConfiguracion', {}),

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
  createSolicitud: async (solicitud) => {
    const ahora  = new Date().toISOString();
    const numero = solicitud.numero_solicitud || _generarNumero();
    const id     = solicitud.id               || _generarId();

    // Objeto completo con TODOS los campos que espera guardarSolicitud()
    const normalizada = {
      // Identidad
      id,
      numero_solicitud:  numero,
      fecha_solicitud:   solicitud.fecha_solicitud  || ahora,
      creado_en:         solicitud.creado_en         || ahora,

      // Tipo y estado — Apps Script valida 'tipo' (campo legacy)
      tipo:              solicitud.tipo_derecho || solicitud.tipo || '',
      tipo_derecho:      solicitud.tipo_derecho || solicitud.tipo || '',
      estado:            'PENDIENTE',

      // Titular
      nombre_completo:   solicitud.nombre_completo  || '',
      rut:               solicitud.rut               || '',
      email:             solicitud.email             || '',
      telefono:          solicitud.telefono          || '',

      // Campos específicos del derecho
      alcance_acceso:    solicitud.alcance_acceso    || 'TODOS',
      categorias:        solicitud.categorias        || '[]',
      formato_preferido: solicitud.formato_preferido || 'PDF',
      datos_rectificar:  solicitud.datos_rectificar  || '',
      descripcion:       solicitud.descripcion       || '',

      // Token y fechas de control
      token_validacion:  solicitud.token_validacion  || '',
      token_expiracion:  solicitud.token_expiracion  || _tokenExpiracion(),
      fecha_limite:      solicitud.fecha_limite       || _fechaLimite(),
      dias_restantes:    15,

      // Metadata
      ip_origen:         solicitud.ip_origen         || '',
      user_agent:        solicitud.user_agent         || '',
      frontend_url:      solicitud.frontend_url       || '',
    };

    const result = await post('createSolicitud', { solicitud: normalizada });

    // Si Apps Script no devuelve numero_solicitud, lo inyectamos nosotros
    if (result.status === 'success' && !result.data?.numero_solicitud) {
      result.data = { ...(result.data || {}), numero_solicitud: numero };
    }

    return result;
  },

  getSolicitudes:        async (filtros = {})       => get('getTodasSolicitudes', filtros),
  getSolicitudPorNumero: async (numero)             => get('getSolicitudPorNumero', { numero }),
  getSolicitudPorToken:  async (token)              => get('getSolicitud', { token }),
  updateSolicitud:       async (id, changes)        => post('actualizarSolicitud', { id, ...changes }),
  resolverSolicitud:     async (id, urlDatos, fmt)  => post('marcarResuelta', { id, url_datos: urlDatos, formato_entrega: fmt }),
  validarIdentidad:      async (token)              => post('validarIdentidad', { token }),
  confirmarDescarga:     async (id)                 => post('confirmarDescarga', { id, descarga_confirmada_en: new Date().toISOString() }),
  getEstadisticas:       async ()                   => get('getEstadisticas'),
};

export default sheetsAdapter;