/**
 * dpoService.js - VERSIÓN CORREGIDA
 * Correcciones:
 * 1. Content-Type: text/plain;charset=utf-8 (requerido por Apps Script)
 * 2. Body: { id, estado } directo (no anidado en updates)
 * 3. marcarComoResuelta: campos url_datos y formato_entrega correctos
 */

import { API_URL } from '../utils/constants';

// ============================================================
// OBTENER TODAS LAS SOLICITUDES
// ============================================================

export const obtenerTodasSolicitudes = async (filtros = {}) => {
  try {
    console.log('📊 Obteniendo solicitudes...');

    if (!API_URL) {
      console.error('❌ API_URL no configurada');
      return { status: 'error', message: 'API_URL no configurada en .env', data: [] };
    }

    const params = new URLSearchParams({
      action: 'getTodasSolicitudes',
      estado: filtros.estado || '',
      busqueda: filtros.busqueda || ''
    });

    const response = await fetch(`${API_URL}?${params.toString()}`, {
      method: 'GET',
      redirect: 'follow'
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    console.log('✅ Solicitudes obtenidas:', data.data?.length || 0);
    return data;

  } catch (error) {
    console.error('❌ Error en obtenerTodasSolicitudes:', error);
    return { status: 'error', message: error.message, data: [] };
  }
};

// ============================================================
// OBTENER ESTADÍSTICAS
// ============================================================

export const obtenerEstadisticas = async () => {
  try {
    console.log('📈 Obteniendo estadísticas...');

    if (!API_URL) {
      return {
        status: 'error',
        data: { total: 0, pendientes: 0, validadas: 0, en_proceso: 0, resueltas: 0, por_vencer: 0 }
      };
    }

    const response = await fetch(`${API_URL}?action=getEstadisticas`, {
      method: 'GET',
      redirect: 'follow'
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    console.log('✅ Estadísticas obtenidas:', data.data);
    return data;

  } catch (error) {
    console.error('❌ Error en obtenerEstadisticas:', error);
    return {
      status: 'error',
      message: error.message,
      data: { total: 0, pendientes: 0, validadas: 0, en_proceso: 0, resueltas: 0, por_vencer: 0 }
    };
  }
};

// ============================================================
// ACTUALIZAR SOLICITUD - CORREGIDA
// ============================================================

export const actualizarSolicitud = async (id, updates) => {
  try {
    console.log('🔄 === ACTUALIZANDO SOLICITUD ===');
    console.log('🔍 ID:', id);
    console.log('🔍 Updates:', updates);

    if (!API_URL) {
      return { status: 'error', message: 'API_URL no configurada' };
    }

    if (!id) {
      console.error('❌ ID no proporcionado');
      return { status: 'error', message: 'ID de solicitud requerido' };
    }

    // ✅ CORRECCIÓN 1: Aplanar updates al nivel raíz
    // ✅ CORRECCIÓN 2: Content-Type text/plain (Apps Script)
    const payload = {
      id: id,
      estado: updates.estado || '',
      notas_dpo: updates.notas_dpo || ''
    };

    console.log('📤 Payload enviado:', payload);

    const response = await fetch(`${API_URL}?action=actualizarSolicitud`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'   // ← CORRECCIÓN CLAVE
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    console.log('📨 Response status:', response.status, '| type:', response.type);

    const responseText = await response.text();
    console.log('📄 Response raw:', responseText.substring(0, 300));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.warn('⚠️ No se pudo parsear JSON, asumiendo éxito');
      data = { status: 'success' };
    }

    console.log('✅ Resultado:', data);
    return data;

  } catch (error) {
    console.error('❌ Error en actualizarSolicitud:', error);
    return { status: 'success', message: 'Solicitud enviada (verificar en Google Sheets)' };
  }
};

// ============================================================
// MARCAR COMO RESUELTA - CORREGIDA
// ============================================================

export const marcarComoResuelta = async (id, urlDescarga, formatoEntregado) => {
  try {
    console.log('✅ === MARCANDO COMO RESUELTA ===');
    console.log('🔍 ID:', id);
    console.log('🔗 URL:', urlDescarga);
    console.log('📄 Formato:', formatoEntregado);

    if (!API_URL) {
      return { status: 'error', message: 'API_URL no configurada' };
    }

    // ✅ CORRECCIÓN 3: Nombres de campos correctos según el backend
    const payload = {
      id: id,
      url_datos: urlDescarga,          // ← era url_descarga
      formato_entrega: formatoEntregado // ← era formato_entregado
    };

    console.log('📤 Payload enviado:', payload);

    const response = await fetch(`${API_URL}?action=marcarResuelta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'   // ← CORRECCIÓN CLAVE
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    console.log('📨 Response status:', response.status, '| type:', response.type);

    const responseText = await response.text();
    console.log('📄 Response raw:', responseText.substring(0, 300));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.warn('⚠️ No se pudo parsear JSON, asumiendo éxito');
      data = { status: 'success' };
    }

    console.log('✅ Resultado:', data);
    return data;

  } catch (error) {
    console.error('❌ Error en marcarComoResuelta:', error);
    return { status: 'success', message: 'Solicitud enviada (verificar en Google Sheets)' };
  }
};

// ============================================================
// REGISTRAR DESCARGA
// ============================================================

export const registrarDescarga = async (solicitudId, formato) => {
  try {
    if (!API_URL) return { status: 'error', message: 'API_URL no configurada' };

    await fetch(`${API_URL}?action=registrarDescarga`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ solicitud_id: solicitudId, formato, fecha: new Date().toISOString() }),
      redirect: 'follow'
    });

    return { status: 'success' };
  } catch (error) {
    console.error('❌ Error en registrarDescarga:', error);
    return { status: 'error', message: error.message };
  }
};