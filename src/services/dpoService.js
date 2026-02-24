// ============================================================
// src/services/dpoService.js — v4
// CORRECCIÓN: actualizarSolicitud ahora pasa TODOS los campos
// al adapter: asignado_a, asignado_email, fecha_termino_sla,
// fecha_entrada_estado, campos_transicion, notas_dpo.
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
// CORRECCIÓN v4: ya no descarta campos. Pasa todo lo que
// recibe desde PanelDPO al adapter (y este al backend).
export const actualizarSolicitud = async (id, updates) => {
  try {
    console.log('🔄 Actualizando solicitud — ID:', id, 'Updates:', updates);

    if (!id) return { status: 'error', message: 'ID de solicitud requerido' };

    // Construir payload completo — no filtrar campos
    const payload = {
      estado:               updates.estado               || '',
      notas_dpo:            updates.notas_dpo            || '',
      asignado_a:           updates.asignado_a           || '',
      asignado_email:       updates.asignado_email       || '',
      asignado_en:          updates.asignado_en          || '',
      fecha_entrada_estado: updates.fecha_entrada_estado || '',
      fecha_termino_sla:    updates.fecha_termino_sla    || '',
      // campos adicionales de transición (ej: sistemas_afectados, url_datos, etc.)
      ...(updates.campos_transicion || {}),
    };

    console.log('📦 Payload completo hacia adapter:', payload);

    const result = await adapter.updateSolicitud(id, payload);

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