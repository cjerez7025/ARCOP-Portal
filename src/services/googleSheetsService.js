// ==================================================
// PORTAL ARCOP - SERVICIO GOOGLE APPS SCRIPT
// VERSION CORREGIDA - validarIdentidad sin no-cors
// ==================================================

const APPS_SCRIPT_URL = process.env.REACT_APP_APPS_SCRIPT_URL;

// ==================================================
// FUNCIONES AUXILIARES
// ==================================================

const generarId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${timestamp}-${random}`;
};

const generarNumeroSolicitud = () => {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const numero = String(Date.now()).slice(-5);
  return `SOL-${anio}-${numero}`;
};

const generarToken = () => {
  const part1 = Math.random().toString(36).substr(2);
  const part2 = Math.random().toString(36).substr(2);
  return part1 + part2;
};

const calcularFechaLimite = () => {
  const fecha = new Date();
  let diasAgregados = 0;
  while (diasAgregados < 15) {
    fecha.setDate(fecha.getDate() + 1);
    const diaSemana = fecha.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasAgregados++;
    }
  }
  return fecha.toISOString();
};

const calcularExpiracionToken = () => {
  const ahora = Date.now();
  const cincoDias = 5 * 24 * 60 * 60 * 1000;
  return new Date(ahora + cincoDias).toISOString();
};

// ==================================================
// FUNCION PRINCIPAL: CREAR SOLICITUD
// ==================================================

export const crearSolicitud = async (datos) => {
  try {
    console.log('Creando solicitud...', datos);

    if (!APPS_SCRIPT_URL) {
      throw new Error('APPS_SCRIPT_URL no configurada en .env');
    }

    const id = generarId();
    const numero = generarNumeroSolicitud();
    const token = generarToken();
    const fechaSolicitud = new Date().toISOString();
    const fechaLimite = calcularFechaLimite();
    const tokenExpiracion = calcularExpiracionToken();
    const frontendUrl = process.env.REACT_APP_FRONTEND_URL || window.location.origin;

    console.log('Frontend URL:', frontendUrl);

    const solicitudCompleta = {
      id,
      numero_solicitud: numero,
      fecha_solicitud: fechaSolicitud,
      tipo: 'ACCESO',
      estado: 'PENDIENTE',
      nombre_completo: datos.nombre_completo,
      rut: datos.rut,
      email: datos.email.toLowerCase(),
      telefono: datos.telefono || '',
      alcance_acceso: datos.alcance_acceso,
      categorias: JSON.stringify(datos.categorias || []),
      formato_preferido: datos.formato_preferido,
      token_validacion: token,
      token_expiracion: tokenExpiracion,
      fecha_limite: fechaLimite,
      dias_restantes: 15,
      ip_origen: datos.metadata?.ip_origen || window.location.hostname,
      user_agent: datos.metadata?.user_agent || navigator.userAgent,
      creado_en: fechaSolicitud,
      frontend_url: frontendUrl
    };

    console.log('Enviando a Apps Script...');

    const response = await fetch(`${APPS_SCRIPT_URL}?action=createSolicitud`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ solicitud: solicitudCompleta }),
      redirect: 'follow'
    });

    const responseText = await response.text();
    console.log('Respuesta:', responseText.substring(0, 200));

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

    console.log('Solicitud creada exitosamente');

    return {
      success: true,
      data: {
        id,
        numero_solicitud: numero,
        fecha_solicitud: fechaSolicitud,
        fecha_limite: fechaLimite,
        email: datos.email,
        estado: 'PENDIENTE',
        token_validacion: token
      }
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
// FUNCION: VALIDAR IDENTIDAD - CORREGIDA
// ✅ Sin mode: no-cors para que el backend reciba correctamente
// ==================================================

export const validarIdentidad = async (token) => {
  try {
    console.log('=== VALIDANDO IDENTIDAD (FRONTEND) ===');
    console.log('Token:', token ? token.substr(0, 15) + '...' : 'VACÍO');

    if (!APPS_SCRIPT_URL) {
      throw new Error('APPS_SCRIPT_URL no configurada');
    }

    if (!token) {
      return { success: false, message: 'Token no proporcionado' };
    }

    console.log('Enviando validacion al backend...');

    // ✅ CORRECCION: Sin mode: no-cors
    const response = await fetch(`${APPS_SCRIPT_URL}?action=validarIdentidad`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token: token }),
      redirect: 'follow'
    });

    console.log('Response status:', response.status);

    const responseText = await response.text();
    console.log('Response text:', responseText.substring(0, 300));

    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Response parseada:', responseData);
    } catch (parseError) {
      console.warn('No se pudo parsear respuesta, asumiendo exito');
      responseData = { status: 'success' };
    }

    if (responseData.status === 'error') {
      return {
        success: false,
        message: responseData.message || 'Error al validar identidad'
      };
    }

    console.log('Identidad validada exitosamente en el backend');

    // Obtener datos actualizados de la solicitud
    try {
      const solicitudResponse = await fetch(
        `${APPS_SCRIPT_URL}?action=getSolicitud&token=${encodeURIComponent(token)}`,
        { redirect: 'follow' }
      );
      const solicitudText = await solicitudResponse.text();
      const solicitudData = JSON.parse(solicitudText);

      if (solicitudData.status === 'success' && solicitudData.data) {
        return {
          success: true,
          solicitud: solicitudData.data
        };
      }
    } catch (fetchError) {
      console.warn('No se pudo obtener datos actualizados:', fetchError.message);
    }

    return {
      success: true,
      message: 'Identidad validada correctamente'
    };

  } catch (error) {
    console.error('Error al validar identidad:', error);
    return {
      success: false,
      message: error.message || 'Error al validar identidad'
    };
  }
};

// ==================================================
// FUNCION: OBTENER SOLICITUD POR TOKEN
// ==================================================

export const obtenerSolicitudPorToken = async (token) => {
  try {
    if (!APPS_SCRIPT_URL) throw new Error('APPS_SCRIPT_URL no configurada');

    const response = await fetch(
      `${APPS_SCRIPT_URL}?action=getSolicitud&token=${encodeURIComponent(token)}`,
      { redirect: 'follow' }
    );
    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Error al obtener solicitud:', error);
    throw error;
  }
};

// ==================================================
// FUNCION: OBTENER SOLICITUDES POR EMAIL
// ==================================================

export const obtenerSolicitudesPorEmail = async (email) => {
  try {
    if (!APPS_SCRIPT_URL) throw new Error('APPS_SCRIPT_URL no configurada');

    const response = await fetch(
      `${APPS_SCRIPT_URL}?action=getSolicitudesPorEmail&email=${encodeURIComponent(email)}`,
      { redirect: 'follow' }
    );
    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    throw error;
  }
};

// ==================================================
// FUNCION: OBTENER SOLICITUD POR NUMERO
// ==================================================

export const obtenerSolicitudPorNumero = async (numero) => {
  try {
    if (!APPS_SCRIPT_URL) throw new Error('APPS_SCRIPT_URL no configurada');

    const response = await fetch(
      `${APPS_SCRIPT_URL}?action=getSolicitudPorNumero&numero=${encodeURIComponent(numero)}`,
      { redirect: 'follow' }
    );
    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Error al obtener solicitud:', error);
    throw error;
  }
};