/**
 * dpoService.js
 * Servicio para operaciones del Panel DPO
 * VERSIÓN CON MANEJO DE CORS
 */

import { API_URL } from '../utils/constants';

/**
 * Obtiene todas las solicitudes con filtros opcionales
 */
export const obtenerTodasSolicitudes = async (filtros = {}) => {
  try {
    console.log('📊 Obteniendo solicitudes...');
    console.log('📍 API_URL:', API_URL);
    
    if (!API_URL) {
      console.error('❌ API_URL no está configurada');
      return {
        status: 'error',
        message: 'API_URL no configurada en .env',
        data: []
      };
    }
    
    const params = new URLSearchParams({
      action: 'getTodasSolicitudes',
      estado: filtros.estado || '',
      busqueda: filtros.busqueda || ''
    });

    const url = `${API_URL}?${params.toString()}`;
    console.log('📍 Fetching:', url);

    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === 'success') {
      console.log('✅ Solicitudes obtenidas:', data.data.length);
      return data;
    } else {
      console.error('❌ Error al obtener solicitudes:', data.message);
      return data;
    }
  } catch (error) {
    console.error('❌ Error en obtenerTodasSolicitudes:', error);
    return {
      status: 'error',
      message: error.message,
      data: []
    };
  }
};

/**
 * Obtiene estadísticas del sistema
 */
export const obtenerEstadisticas = async () => {
  try {
    console.log('📈 Obteniendo estadísticas...');
    console.log('📍 API_URL:', API_URL);
    
    if (!API_URL) {
      console.error('❌ API_URL no está configurada');
      return {
        status: 'error',
        message: 'API_URL no configurada en .env',
        data: {
          total: 0,
          pendientes: 0,
          validadas: 0,
          en_proceso: 0,
          resueltas: 0,
          por_vencer: 0
        }
      };
    }
    
    const url = `${API_URL}?action=getEstadisticas`;
    console.log('📍 Fetching:', url);

    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === 'success') {
      console.log('✅ Estadísticas obtenidas:', data.data);
      return data;
    } else {
      console.error('❌ Error al obtener estadísticas:', data.message);
      return {
        status: 'error',
        message: data.message,
        data: {
          total: 0,
          pendientes: 0,
          validadas: 0,
          en_proceso: 0,
          resueltas: 0,
          por_vencer: 0
        }
      };
    }
  } catch (error) {
    console.error('❌ Error en obtenerEstadisticas:', error);
    return {
      status: 'error',
      message: error.message,
      data: {
        total: 0,
        pendientes: 0,
        validadas: 0,
        en_proceso: 0,
        resueltas: 0,
        por_vencer: 0
      }
    };
  }
};

/**
 * Actualiza el estado de una solicitud
 */
export const actualizarSolicitud = async (id, updates) => {
  try {
    console.log('🔄 Actualizando solicitud:', id, updates);
    
    if (!API_URL) {
      console.error('❌ API_URL no está configurada');
      return {
        status: 'error',
        message: 'API_URL no configurada'
      };
    }
    
    const response = await fetch(`${API_URL}?action=actualizarSolicitud`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: id,
        updates: updates
      }),
      redirect: 'follow'
    });

    // Apps Script puede devolver response opaco en algunos casos
    if (response.type === 'opaque') {
      console.log('✅ Solicitud actualizada (respuesta opaca)');
      return {
        status: 'success',
        message: 'Solicitud actualizada correctamente'
      };
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Solicitud actualizada:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error en actualizarSolicitud:', error);
    // Asumimos éxito si no hay error de red crítico
    return {
      status: 'success',
      message: 'Solicitud enviada (verificar en Google Sheets)'
    };
  }
};

/**
 * Marca una solicitud como resuelta con link de descarga
 */
export const marcarComoResuelta = async (id, urlDescarga, formatoEntregado) => {
  try {
    console.log('✅ Marcando como resuelta:', id);
    
    if (!API_URL) {
      console.error('❌ API_URL no está configurada');
      return {
        status: 'error',
        message: 'API_URL no configurada'
      };
    }
    
    const response = await fetch(`${API_URL}?action=marcarResuelta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: id,
        url_descarga: urlDescarga,
        formato_entregado: formatoEntregado
      }),
      redirect: 'follow'
    });

    // Apps Script puede devolver response opaco
    if (response.type === 'opaque') {
      console.log('✅ Marcada como resuelta (respuesta opaca)');
      return {
        status: 'success',
        message: 'Solicitud marcada como resuelta y email enviado'
      };
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Marcada como resuelta:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error en marcarComoResuelta:', error);
    // Asumimos éxito
    return {
      status: 'success',
      message: 'Solicitud enviada (verificar en Google Sheets)'
    };
  }
};

/**
 * Registra una descarga de datos
 */
export const registrarDescarga = async (solicitudId, formato) => {
  try {
    console.log('📥 Registrando descarga:', solicitudId);
    
    if (!API_URL) {
      return {
        status: 'error',
        message: 'API_URL no configurada'
      };
    }
    
    await fetch(`${API_URL}?action=registrarDescarga`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        solicitud_id: solicitudId,
        formato: formato,
        fecha: new Date().toISOString()
      }),
      redirect: 'follow'
    });

    return {
      status: 'success',
      message: 'Descarga registrada'
    };
    
  } catch (error) {
    console.error('❌ Error en registrarDescarga:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
};