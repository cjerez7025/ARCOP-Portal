// ============================================================
// GOOGLE SHEETS SERVICE — v3 (via Traductor)
// Ya no llama directo a Apps Script.
// Toda la comunicación pasa por adapters/index.js
//
// NOTA: Este archivo mantiene su nombre para no romper los
// imports existentes que todavía lo referencian. Internamente
// ya usa el adapter — cuando se migre a Firebase, nada cambia.
// ============================================================

import adapter from '../adapters';

// ── Crear solicitud ───────────────────────────────────────
export const crearSolicitud = async (datos) => {
  try {
    console.log('📝 Creando solicitud...', datos);

    const result = await adapter.createSolicitud(datos);

    if (result.status === 'error') {
      throw new Error(result.message || 'Error al crear solicitud');
    }

    console.log('✅ Solicitud creada:', result.data);
    return result;

  } catch (error) {
    console.error('❌ Error en crearSolicitud:', error);
    if (error.message?.includes('Failed to fetch')) {
      throw new Error('No se puede conectar con el servidor. Verifica la URL en .env');
    }
    throw new Error('Error al enviar solicitud: ' + error.message);
  }
};

// ── Validar identidad por token ───────────────────────────
export const validarIdentidad = async (token) => {
  try {
    console.log('🔐 Validando identidad — token:', token ? token.substr(0, 15) + '...' : 'VACÍO');

    if (!token) return { success: false, message: 'Token no proporcionado' };

    const result = await adapter.validarIdentidad(token);

    if (result.status === 'error') {
      return { success: false, message: result.message || 'Error al validar identidad' };
    }

    // Intentar obtener datos actualizados de la solicitud
    try {
      const solicitudResult = await adapter.getSolicitudPorToken(token);
      if (solicitudResult.status === 'success' && solicitudResult.data) {
        return { success: true, solicitud: solicitudResult.data };
      }
    } catch {
      console.warn('No se pudieron obtener datos actualizados de la solicitud');
    }

    return { success: true, message: 'Identidad validada correctamente' };

  } catch (error) {
    console.error('❌ Error en validarIdentidad:', error);
    return { success: false, message: error.message || 'Error al validar identidad' };
  }
};

// ── Obtener solicitud por token ───────────────────────────
export const obtenerSolicitudPorToken = async (token) => {
  try {
    if (!token) throw new Error('Token requerido');
    return await adapter.getSolicitudPorToken(token);
  } catch (error) {
    console.error('❌ Error en obtenerSolicitudPorToken:', error);
    throw error;
  }
};

// ── Obtener solicitud por número ──────────────────────────
export const obtenerSolicitudPorNumero = async (numero) => {
  try {
    if (!numero) throw new Error('Número de solicitud requerido');
    return await adapter.getSolicitudPorNumero(numero);
  } catch (error) {
    console.error('❌ Error en obtenerSolicitudPorNumero:', error);
    throw error;
  }
};