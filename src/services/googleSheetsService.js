// ==================================================
// PORTAL ARCOP - SERVICIO GOOGLE SHEETS API
// ==================================================

const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const SPREADSHEET_ID = process.env.REACT_APP_SPREADSHEET_ID;
const SHEET_NAME = process.env.REACT_APP_SHEET_NAME || 'SOLICITUDES';

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
 * Formato: SOL-2025-12345
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
 * Crea una nueva solicitud en Google Sheets
 * @param {Object} datos - Datos del formulario
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const crearSolicitud = async (datos) => {
  try {
    console.log('📝 Creando solicitud...', datos);
    
    // Validar variables de entorno
    if (!API_KEY) {
      throw new Error('API_KEY no configurada. Verifica tu archivo .env');
    }
    
    if (!SPREADSHEET_ID) {
      throw new Error('SPREADSHEET_ID no configurado. Verifica tu archivo .env');
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
    
    // Preparar fila para Google Sheets (25 columnas)
    // Orden debe coincidir EXACTAMENTE con los headers de la hoja
    const row = [
      id,                                       // A: ID_SOLICITUD
      numero,                                   // B: NUMERO_SOLICITUD
      fechaSolicitud,                           // C: FECHA_SOLICITUD
      'ACCESO',                                 // D: TIPO
      'PENDIENTE',                              // E: ESTADO
      datos.nombre_completo,                    // F: NOMBRE_COMPLETO
      datos.rut,                                // G: RUT
      datos.email.toLowerCase(),                // H: EMAIL
      datos.telefono || '',                     // I: TELEFONO
      datos.alcance_acceso,                     // J: ALCANCE_ACCESO
      JSON.stringify(datos.categorias || []),   // K: CATEGORIAS
      datos.formato_preferido,                  // L: FORMATO_PREFERIDO
      'FALSE',                                  // M: IDENTIDAD_VALIDADA
      token,                                    // N: TOKEN_VALIDACION
      tokenExpiracion,                          // O: TOKEN_EXPIRACION
      fechaLimite,                              // P: FECHA_LIMITE
      '15',                                     // Q: DIAS_RESTANTES
      '',                                       // R: ASIGNADO_A
      '',                                       // S: FECHA_RESOLUCION
      '',                                       // T: URL_DESCARGA
      '',                                       // U: URL_EXPIRACION
      datos.metadata?.ip_origen || '',          // V: IP_ORIGEN
      datos.metadata?.user_agent || '',         // W: USER_AGENT
      fechaSolicitud,                           // X: CREADO_EN
      fechaSolicitud                            // Y: ACTUALIZADO_EN
    ];
    
    // Construir URL de la API de Google Sheets
    const baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    const endpoint = `${baseUrl}/${SPREADSHEET_ID}/values/${SHEET_NAME}:append`;
    const url = `${endpoint}?valueInputOption=RAW&key=${API_KEY}`;
    
    console.log('🌐 Enviando a Google Sheets...');
    
    // Realizar request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [row]
      })
    });
    
    // Manejar respuesta
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Error de Google Sheets:', error);
      
      // Mensajes de error más amigables
      if (error.error?.status === 'PERMISSION_DENIED') {
        throw new Error('Permisos insuficientes. Verifica que el Sheet sea público para lectura.');
      }
      
      if (error.error?.status === 'NOT_FOUND') {
        throw new Error('Sheet no encontrado. Verifica el SPREADSHEET_ID en .env');
      }
      
      if (error.error?.status === 'INVALID_ARGUMENT') {
        throw new Error('Error en los datos. Verifica que el nombre de la hoja sea correcto.');
      }
      
      throw new Error(error.error?.message || 'Error al crear solicitud en Google Sheets');
    }
    
    const result = await response.json();
    console.log('✅ Solicitud creada exitosamente:', result);
    
    // Retornar datos de la solicitud creada
    return {
      success: true,
      data: {
        id,
        numero_solicitud: numero,
        fecha_solicitud: fechaSolicitud,
        fecha_limite: fechaLimite,
        email: datos.email,
        estado: 'PENDIENTE',
        // No incluir token en la respuesta por seguridad
      }
    };
    
  } catch (error) {
    console.error('❌ Error en crearSolicitud:', error);
    
    // Re-lanzar el error con mensaje más claro
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión. Verifica tu internet y que la API Key sea válida.');
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
    
    const baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    const endpoint = `${baseUrl}/${SPREADSHEET_ID}/values/${SHEET_NAME}`;
    const url = `${endpoint}?key=${API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Error al buscar solicitud');
    }
    
    const result = await response.json();
    const rows = result.values;
    
    if (!rows || rows.length <= 1) {
      return null; // No hay datos (solo headers)
    }
    
    // Buscar por token (columna N, índice 13)
    const solicitudRow = rows.find((row, index) => {
      // Saltar header
      if (index === 0) return false;
      return row[13] === token;
    });
    
    if (!solicitudRow) {
      console.log('❌ Solicitud no encontrada');
      return null;
    }
    
    console.log('✅ Solicitud encontrada');
    
    // Mapear datos
    return {
      id: solicitudRow[0],
      numero_solicitud: solicitudRow[1],
      fecha_solicitud: solicitudRow[2],
      tipo: solicitudRow[3],
      estado: solicitudRow[4],
      nombre_completo: solicitudRow[5],
      rut: solicitudRow[6],
      email: solicitudRow[7],
      telefono: solicitudRow[8],
      alcance_acceso: solicitudRow[9],
      categorias: JSON.parse(solicitudRow[10] || '[]'),
      formato_preferido: solicitudRow[11],
      identidad_validada: solicitudRow[12] === 'TRUE',
      token_validacion: solicitudRow[13],
      token_expiracion: solicitudRow[14],
      fecha_limite: solicitudRow[15],
      dias_restantes: solicitudRow[16]
    };
    
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
    
    const baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    const endpoint = `${baseUrl}/${SPREADSHEET_ID}/values/${SHEET_NAME}`;
    const url = `${endpoint}?key=${API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Error al obtener solicitudes');
    }
    
    const result = await response.json();
    const rows = result.values;
    
    if (!rows || rows.length <= 1) {
      return []; // No hay datos
    }
    
    // Filtrar por email (columna H, índice 7)
    const solicitudes = rows
      .filter((row, index) => {
        // Saltar header
        if (index === 0) return false;
        return row[7]?.toLowerCase() === email.toLowerCase();
      })
      .map(row => ({
        id: row[0],
        numero_solicitud: row[1],
        fecha_solicitud: row[2],
        tipo: row[3],
        estado: row[4],
        nombre_completo: row[5],
        fecha_limite: row[15],
        dias_restantes: row[16]
      }));
    
    console.log(`✅ Encontradas ${solicitudes.length} solicitudes`);
    
    return solicitudes;
    
  } catch (error) {
    console.error('❌ Error en obtenerSolicitudesPorEmail:', error);
    throw error;
  }
};

// ==================================================
// EXPORTAR FUNCIONES
// ==================================================

export default {
  crearSolicitud,
  obtenerSolicitudPorToken,
  obtenerSolicitudesPorEmail
};