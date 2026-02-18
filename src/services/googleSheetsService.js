// ==================================================
// PORTAL ARCOP - SERVICIO GOOGLE APPS SCRIPT
// ✅ tipo: dinámico (ya no hardcodeado como ACCESO)
// ✅ campos extra por tipo incluidos en solicitudCompleta
// ==================================================

const APPS_SCRIPT_URL = process.env.REACT_APP_APPS_SCRIPT_URL;

// ── Helpers ────────────────────────────────────────────────
const generarId = () => {
  const timestamp = Date.now();
  const random    = Math.random().toString(36).substr(2, 9);
  return `${timestamp}-${random}`;
};

const generarNumeroSolicitud = () => {
  const anio   = new Date().getFullYear();
  const numero = String(Date.now()).slice(-5);
  return `SOL-${anio}-${numero}`;
};

const generarToken = () => {
  return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
};

const calcularFechaLimite = () => {
  const fecha = new Date();
  let diasAgregados = 0;
  while (diasAgregados < 15) {
    fecha.setDate(fecha.getDate() + 1);
    const dia = fecha.getDay();
    if (dia !== 0 && dia !== 6) diasAgregados++;
  }
  return fecha.toISOString();
};

const calcularExpiracionToken = () => {
  return new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
};

// ==================================================
// CREAR SOLICITUD
// ==================================================
export const crearSolicitud = async (datos) => {
  try {
    console.log('Creando solicitud tipo:', datos.tipo, datos);

    if (!APPS_SCRIPT_URL) {
      throw new Error('APPS_SCRIPT_URL no configurada en .env');
    }

    const id            = generarId();
    const numero        = generarNumeroSolicitud();
    const token         = generarToken();
    const fechaSolicitud = new Date().toISOString();
    const fechaLimite   = calcularFechaLimite();
    const tokenExpiracion = calcularExpiracionToken();
    const frontendUrl   = process.env.REACT_APP_FRONTEND_URL || window.location.origin;

    // ✅ tipo viene del formulario, no hardcodeado
    const solicitudCompleta = {
      id,
      numero_solicitud:  numero,
      fecha_solicitud:   fechaSolicitud,
      tipo:              datos.tipo || 'ACCESO',           // ✅ dinámico
      estado:            'PENDIENTE',
      nombre_completo:   datos.nombre_completo,
      rut:               datos.rut,
      email:             datos.email.toLowerCase(),
      telefono:          datos.telefono || '',
      // Campos de acceso/portabilidad
      alcance_acceso:    datos.alcance_acceso    || '',
      categorias:        JSON.stringify(datos.categorias || []),
      formato_preferido: datos.formato_preferido || 'PDF',
      // Campos de rectificación
      dato_incorrecto:   datos.dato_incorrecto   || '',
      valor_correcto:    datos.valor_correcto     || '',
      documentacion:     datos.documentacion      || '',
      // Campos de cancelación
      alcance_cancelacion: datos.alcance_cancelacion || '',
      // Campos de oposición
      tipo_oposicion:    datos.tipo_oposicion    || '',
      // Campos de portabilidad
      destino_portabilidad: datos.destino_portabilidad || '',
      // Campo motivo (cancelación/oposición)
      motivo:            datos.motivo            || '',
      // Metadatos
      token_validacion:  token,
      token_expiracion:  tokenExpiracion,
      fecha_limite:      fechaLimite,
      dias_restantes:    15,
      ip_origen:         datos.metadata?.ip_origen  || window.location.hostname,
      user_agent:        datos.metadata?.user_agent || navigator.userAgent,
      creado_en:         fechaSolicitud,
      frontend_url:      frontendUrl,
    };

    console.log('Enviando a Apps Script...', solicitudCompleta);

    const response = await fetch(`${APPS_SCRIPT_URL}?action=createSolicitud`, {
      method:   'POST',
      headers:  { 'Content-Type': 'text/plain;charset=utf-8' },
      body:     JSON.stringify({ solicitud: solicitudCompleta }),
      redirect: 'follow',
    });

    const responseText = await response.text();
    console.log('Respuesta raw:', responseText.substring(0, 300));

    let responseData;
    try {
      responseData = JSON.parse(responseText);
      if (responseData.status === 'error') {
        throw new Error(responseData.message || 'Error del servidor');
      }
    } catch (parseError) {
      if (responseText.includes('Exception') || responseText.includes('Error')) {
        throw new Error('Error en el servidor de Apps Script');
      }
      responseData = { status: 'success' };
    }

    return {
      success: true,
      data: {
        id,
        numero_solicitud: numero,
        fecha_solicitud:  fechaSolicitud,
        fecha_limite:     fechaLimite,
        tipo:             datos.tipo,
        email:            datos.email,
        estado:           'PENDIENTE',
        token_validacion: token,
      },
    };

  } catch (error) {
    console.error('Error en crearSolicitud:', error);
    if (error.message.includes('Failed to fetch')) {
      throw new Error('No se puede conectar con el servidor. Verifica la URL en .env');
    }
    throw new Error('Error al enviar solicitud: ' + error.message);
  }
};

// ==================================================
// VALIDAR IDENTIDAD
// ==================================================
export const validarIdentidad = async (token) => {
  try {
    console.log('=== VALIDANDO IDENTIDAD ===');
    console.log('Token:', token ? token.substring(0, 20) + '...' : 'null');

    if (!APPS_SCRIPT_URL) {
      throw new Error('APPS_SCRIPT_URL no configurada');
    }

    const response = await fetch(`${APPS_SCRIPT_URL}?action=validarIdentidad`, {
      method:   'POST',
      headers:  { 'Content-Type': 'text/plain;charset=utf-8' },
      body:     JSON.stringify({ token }),
      redirect: 'follow',
    });

    const responseText = await response.text();
    console.log('Respuesta validación:', responseText.substring(0, 200));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      if (responseText.includes('Exception') || responseText.includes('Error')) {
        return { status: 'error', message: 'Error al validar identidad' };
      }
      return { status: 'success' };
    }

    return data;

  } catch (error) {
    console.error('Error en validarIdentidad:', error);
    return { status: 'error', message: error.message };
  }
};

// ==================================================
// OBTENER SOLICITUD POR NÚMERO
// ==================================================
export const obtenerSolicitudPorNumero = async (numero) => {
  try {
    if (!APPS_SCRIPT_URL) throw new Error('APPS_SCRIPT_URL no configurada');

    const response = await fetch(
      `${APPS_SCRIPT_URL}?action=getSolicitudPorNumero&numero=${encodeURIComponent(numero)}`,
      { method: 'GET', redirect: 'follow' }
    );

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error en obtenerSolicitudPorNumero:', error);
    return { status: 'error', message: error.message };
  }
};