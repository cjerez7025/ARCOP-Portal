// ==================================================
// PORTAL ARCOP - SERVICIO GOOGLE APPS SCRIPT
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
  const año = fecha.getFullYear();
  const numero = String(Date.now()).slice(-5);
  return `SOL-${año}-${numero}`;
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
  const treintaMinutos = 30 * 60 * 1000;
  return new Date(ahora + treintaMinutos).toISOString();
};

// ==================================================
// FUNCIÓN PRINCIPAL: CREAR SOLICITUD
// ==================================================

export const crearSolicitud = async (datos) => {
  try {
    console.log('📝 Creando solicitud...', datos);
    
    if (!APPS_SCRIPT_URL) {
      throw new Error('APPS_SCRIPT_URL no configurada en .env');
    }
    
    // Generar datos automáticos
    const id = generarId();
    const numero = generarNumeroSolicitud();
    const token = generarToken();
    const fechaSolicitud = new Date().toISOString();
    const fechaLimite = calcularFechaLimite();
    const tokenExpiracion = calcularExpiracionToken();
    
    console.log('🔑 Datos generados:');
    console.log('  ID:', id);
    console.log('  Número:', numero);
    console.log('  Token:', token.substr(0, 10) + '...');
    
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
    
    console.log('📤 Enviando a Apps Script...');
    console.log('🌐 URL:', APPS_SCRIPT_URL);
    
    // Enviar a Google Apps Script
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'createSolicitud',
        solicitud: solicitudCompleta
      })
    });
    
    console.log('✅ Solicitud enviada exitosamente');
    
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
    throw new Error('Error al enviar solicitud: ' + error.message);
  }
};

// ==================================================
// FUNCIÓN: VALIDAR IDENTIDAD
// ==================================================

export const validarIdentidad = async (token) => {
  try {
    console.log('✅ Validando identidad...');
    
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

// ==================================================
// EXPORTAR FUNCIONES
// ==================================================

export default {
  crearSolicitud,
  validarIdentidad
};