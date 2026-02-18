// ============================================================
// DPO SERVICE — v3 (via Traductor)
// Ya no llama directo a Apps Script.
// Toda la comunicación pasa por adapters/index.js
// ============================================================

import adapter from '../adapters';

// ── Obtener todas las solicitudes ─────────────────────────
export const obtenerTodasSolicitudes = async (filtros = {}) => {
  try {
    console.log('📊 Obteniendo solicitudes...');
    const result = await adapter.getSolicitudes({
      estado:   filtros.estado   || '',
      busqueda: filtros.busqueda || '',
    });
    console.log('✅ Solicitudes obtenidas:', result.data?.length || 0);
    return result;
  } catch (error) {
    console.error('❌ Error en obtenerTodasSolicitudes:', error);
    return { status: 'error', message: error.message, data: [] };
  }
};

// ── Obtener estadísticas ──────────────────────────────────
export const obtenerEstadisticas = async () => {
  try {
    console.log('📈 Obteniendo estadísticas...');
    const result = await adapter.getEstadisticas();
    console.log('✅ Estadísticas obtenidas:', result.data);
    return result;
  } catch (error) {
    console.error('❌ Error en obtenerEstadisticas:', error);
    return {
      status: 'error',
      message: error.message,
      data: { total: 0, pendientes: 0, validadas: 0, en_proceso: 0, resueltas: 0, por_vencer: 0 },
    };
  }
};

// ── Actualizar estado de solicitud ────────────────────────
export const actualizarSolicitud = async (id, updates) => {
  try {
    console.log('🔄 Actualizando solicitud — ID:', id, 'Updates:', updates);

    if (!id) return { status: 'error', message: 'ID de solicitud requerido' };

    const result = await adapter.updateSolicitud(id, {
      estado:    updates.estado    || '',
      notas_dpo: updates.notas_dpo || '',
    });

    console.log('✅ Resultado:', result);
    return result;
  } catch (error) {
    console.error('❌ Error en actualizarSolicitud:', error);
    return { status: 'error', message: error.message };
  }
};

// ── Marcar como resuelta ──────────────────────────────────
export const marcarComoResuelta = async (id, urlDescarga, formatoEntregado) => {
  try {
    console.log('✅ Marcando como resuelta — ID:', id, 'URL:', urlDescarga);

    if (!id) return { status: 'error', message: 'ID de solicitud requerido' };

    const result = await adapter.resolverSolicitud(id, urlDescarga, formatoEntregado);
    console.log('✅ Resultado:', result);
    return result;
  } catch (error) {
    console.error('❌ Error en marcarComoResuelta:', error);
    return { status: 'error', message: error.message };
  }
};