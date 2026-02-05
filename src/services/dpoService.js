// ==================================================
// SERVICIO DPO - COMUNICACIÓN CON BACKEND
// ==================================================

const APPS_SCRIPT_URL = process.env.REACT_APP_APPS_SCRIPT_URL;

/**
 * Obtiene todas las solicitudes con filtros opcionales
 */
export const obtenerTodasSolicitudes = async (filtros = {}) => {
  try {
    console.log('📊 Obteniendo solicitudes...', filtros);
    
    const params = new URLSearchParams({
      action: 'obtenerTodasSolicitudes',
      filtros: JSON.stringify(filtros)
    });
    
    const response = await fetch(`${APPS_SCRIPT_URL}?${params}`, {
      method: 'GET'
    });
    
    const result = await response.json();
    console.log('✅ Solicitudes obtenidas:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error al obtener solicitudes:', error);
    throw error;
  }
};

/**
 * Actualiza una solicitud (estado, asignación, etc.)
 * NOTA: Actualizar sigue usando POST con no-cors
 */
export const actualizarSolicitud = async (id, cambios) => {
  try {
    console.log('🔄 Actualizando solicitud:', id, cambios);
    
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'actualizarSolicitud',
        id,
        cambios
      })
    });
    
    console.log('✅ Solicitud actualizada');
    return {
      status: 'success',
      message: 'Solicitud actualizada'
    };
    
  } catch (error) {
    console.error('❌ Error al actualizar solicitud:', error);
    throw error;
  }
};

/**
 * Obtiene estadísticas del dashboard
 */
export const obtenerEstadisticas = async () => {
  try {
    console.log('📈 Obteniendo estadísticas...');
    
    const params = new URLSearchParams({
      action: 'obtenerEstadisticas'
    });
    
    const response = await fetch(`${APPS_SCRIPT_URL}?${params}`, {
      method: 'GET'
    });
    
    const result = await response.json();
    console.log('✅ Estadísticas obtenidas:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    throw error;
  }
};