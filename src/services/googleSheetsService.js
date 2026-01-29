// ==================================================
// PORTAL ARCOP - SERVICIO GOOGLE APPS SCRIPT
// ==================================================

const APPS_SCRIPT_URL = process.env.REACT_APP_APPS_SCRIPT_URL;

// ==================================================
// FUNCIONES AUXILIARES - GENERACIÓN DE DATOS
// ==================================================

/**
 * Genera un ID único para la solicitud
 * Formato: timestamp-randomString
 */
const generarId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${timestamp}-${random}`;
};

/**
 * Genera número de solicitud legible
 * Formato: SOL-2026-12345
 */
const generarNumeroSolicitud = () => {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const numero = String(Date.now()).slice(-5);
  return `SOL-${año}-${numero}`;
};

/**
 * Genera token de validación aleatorio (32 caracteres)
 */
const generarToken = () => {
  const part1 = Math.random().toString(36).substr(2);
  const part2 = Math.random().toString(36).substr(2);
  return part1 + part2;
};

/**
 * Calcula fecha límite: 15 días hábiles desde hoy
 * Excluye sábados y domingos
 */
const calcularFechaLimite = () => {
  const fecha = new Date();
  let diasAgregados = 0;
  
  while (diasAgregados < 15) {
    fecha.setDate(fecha.getDate() + 1);
    const diaSemana = fecha.getDay();
    
    // No contar sábados (6) ni domingos (0)
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasAgregados++;
    }
  }
  
  return fecha.toISOString();
};

/**
 * Calcula expiración del token: 30 minutos desde ahora
 */
const calcularExpiracionToken = () => {
  const ahora = Date.now();
  const treintaMinutos = 30 * 60 * 1000; // 30 minutos en milisegundos
  return new Date(ahora + treintaMinutos).toISOString();
};

// ==================================================
// FUNCIÓN PRINCIPAL: CREAR SOLICITUD
// ==================================================

/**
 * Crea una nueva solicitud enviando a Google Apps Script
 * @param {Object} datos - Datos del formulario
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const crearSolicitud = async (datos) => {
  try {
    console.log('📝 Creando solicitud...', datos);
    
    // Validar configuración
    if (!APPS_SCRIPT_URL) {
      throw new Error('APPS_SCRIPT_URL no configurada. Verifica tu archivo .env');
    }
    
    if (APPS_SCRIPT_URL.includes('TU-URL')) {
      throw new Error('Debes actualizar la URL de Apps Script en tu archivo .env');
    }
    
    // Generar datos automáticos
    const id = generarId();
    const numero = generarNumeroSolicitud();
    const token = generarToken();
    const fechaSolicitud = new Date().toISOString();
    const fechaLimite = calcularFechaLimite();
    const tokenExpiracion = calcularExpiracionToken();
    
    console.log('🔑 ID generado:', id);
    console.log('📋 Número:', numero);
    console.log('🎫 Token:', token.substr(0, 10) + '...');
    console.log('📅 Fecha límite:', fechaLimite);
    
    // Preparar solicitud completa
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
      creado_en: fechaSolicitud
    };
    
    console.log('📤 Enviando a Google Apps Script...');
    console.log('🌐 URL:', APPS_SCRIPT_URL);
    
    // Enviar a Google Apps Script
    // IMPORTANTE: usar mode: 'no-cors' porque Apps Script no permite CORS
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // ⚠️ CRÍTICO: Apps Script requiere no-cors
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'createSolicitud',
        solicitud: solicitudCompleta
      })
    });
    
    // Con no-cors no podemos leer la respuesta, pero si llegó aquí es porque se envió
    console.log('✅ Solicitud enviada exitosamente');
    
    // Retornar datos de la solicitud creada
    return {
      success: true,
      data: {
        id,
        numero_solicitud: numero,
        fecha_solicitud: fechaSolicitud,
        fecha_limite: fechaLimite,
        email: datos.email,
        estado: 'PENDIENTE'
      }
    };
    
  } catch (error) {
    console.error('❌ Error en crearSolicitud:', error);
    
    // Mensajes de error más amigables
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión. Verifica tu internet y que la URL de Apps Script sea correcta.');
    }
    
    throw error;
  }
};

// ==================================================
// FUNCIÓN: OBTENER SOLICITUD POR TOKEN
// (Para validación de email - próxima fase)
// ==================================================

/**
 * Busca una solicitud por su token de validación
 * @param {string} token - Token de validación
 * @returns {Promise<Object|null>} - Solicitud encontrada o null
 */
export const obtenerSolicitudPorToken = async (token) => {
  try {
    console.log('🔍 Buscando solicitud por token...');
    
    if (!APPS_SCRIPT_URL) {
      throw new Error('APPS_SCRIPT_URL no configurada');
    }
    
    const url = `${APPS_SCRIPT_URL}?action=getSolicitud&token=${encodeURIComponent(token)}`;
    
    const response = await fetch(url, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error('Error al buscar solicitud');
    }
    
    const result = await response.json();
    
    if (result.status === 'success') {
      console.log('✅ Solicitud encontrada');
      return result.solicitud;
    } else {
      console.log('❌ Solicitud no encontrada');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error en obtenerSolicitudPorToken:', error);
    throw error;
  }
};

// ==================================================
// FUNCIÓN: OBTENER SOLICITUDES POR EMAIL
// (Para "Mis Solicitudes" - próxima fase)
// ==================================================

/**
 * Obtiene todas las solicitudes de un email
 * @param {string} email - Email del titular
 * @returns {Promise<Array>} - Lista de solicitudes
 */
export const obtenerSolicitudesPorEmail = async (email) => {
  try {
    console.log('🔍 Buscando solicitudes de:', email);
    
    if (!APPS_SCRIPT_URL) {
      throw new Error('APPS_SCRIPT_URL no configurada');
    }
    
    const url = `${APPS_SCRIPT_URL}?action=getSolicitudesPorEmail&email=${encodeURIComponent(email)}`;
    
    const response = await fetch(url, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener solicitudes');
    }
    
    const result = await response.json();
    
    if (result.status === 'success') {
      console.log(`✅ Encontradas ${result.solicitudes.length} solicitudes`);
      return result.solicitudes;
    } else {
      return [];
    }
    
  } catch (error) {
    console.error('❌ Error en obtenerSolicitudesPorEmail:', error);
    throw error;
  }
};

// ==================================================
// FUNCIÓN: VALIDAR IDENTIDAD (Email confirmado)
// (Para validación de email - próxima fase)
// ==================================================

/**
 * Valida la identidad del usuario confirmando el email
 * @param {string} token - Token de validación
 * @returns {Promise<Object>} - Resultado de la validación
 */
export const validarIdentidad = async (token) => {
  try {
    console.log('✅ Validando identidad...');
    
    if (!APPS_SCRIPT_URL) {
      throw new Error('APPS_SCRIPT_URL no configurada');
    }
    
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'validarIdentidad',
        token: token
      })
    });
    
    console.log('✅ Identidad validada');
    
    return {
      success: true,
      message: 'Identidad validada correctamente'
    };
    
  } catch (error) {
    console.error('❌ Error en validarIdentidad:', error);
    throw error;
  }
};

// ==================================================
// EXPORTAR FUNCIONES
// ==================================================

export default {
  crearSolicitud,
  obtenerSolicitudPorToken,
  obtenerSolicitudesPorEmail,
  validarIdentidad
};
/**
 * Valida la identidad del usuario confirmando el email
 */
export const validarIdentidad = async (token) => {
  try {
    console.log('✅ Validando identidad con token:', token.substr(0, 10) + '...');
    
    if (!APPS_SCRIPT_URL) {
      throw new Error('APPS_SCRIPT_URL no configurada');
    }
    
    // Llamar a Apps Script para validar
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'validarIdentidad',
        token: token
      })
    });
    
    // Como es no-cors, asumimos éxito si no hay error
    console.log('✅ Identidad validada');
    
    // Obtener datos de la solicitud
    const solicitudResponse = await fetch(
      `${APPS_SCRIPT_URL}?action=getSolicitud&token=${encodeURIComponent(token)}`
    );
    
    if (solicitudResponse.ok) {
      const result = await solicitudResponse.json();
      
      return {
        success: true,
        solicitud: result.data
      };
    }
    
    return {
      success: true,
      message: 'Identidad validada correctamente'
    };
    
  } catch (error) {
    console.error('❌ Error al validar identidad:', error);
    return {
      success: false,
      message: error.message || 'Error al validar identidad'
    };
  }
};