/**
 * configuracionService.js
 * Servicio para gestionar la configuración del sistema
 * VERSIÓN CON FALLBACK - No bloquea si falla
 */

import { API_URL } from '../utils/constants';

/**
 * Configuración por defecto (fallback)
 */
const CONFIG_DEFAULT = {
  empresa_nombre: 'Mi Empresa',
  empresa_rut: '12.345.678-9',
  empresa_razon_social: 'Mi Empresa SpA',
  empresa_direccion: 'Dirección de la empresa',
  empresa_telefono: '+56 2 2345 6789',
  empresa_email: 'contacto@empresa.cl',
  empresa_web: 'https://empresa.cl',
  dpo_nombre: 'Delegado de Protección de Datos',
  dpo_email: 'dpo@empresa.cl',
  dpo_telefono: '+56 9 8765 4321',
  dpo_horario: 'Lunes a Viernes, 9:00 - 18:00',
  portal_nombre: 'Portal ARCOP',
  portal_color: '#2563eb',
  portal_color_secundario: '#1e40af',
  logo_url: '',
  dias_respuesta: '15',
  dias_alerta: '3',
  dias_validacion: '5',
  notif_activas: 'SI',
  email_cc: '',
  timezone: 'America/Santiago',
  version: '1.0.0'
};

/**
 * Obtiene la configuración completa del sistema
 */
export const obtenerConfiguracion = async () => {
  try {
    console.log('📥 Obteniendo configuración del sistema...');
    console.log('📍 API_URL:', API_URL);
    
    // Verificar que API_URL esté configurada
    if (!API_URL || API_URL.includes('TU_DEPLOYMENT_ID_AQUI')) {
      console.warn('⚠️ API_URL no configurada, usando configuración por defecto');
      return {
        status: 'success',
        data: CONFIG_DEFAULT,
        source: 'default'
      };
    }
    
    const response = await fetch(`${API_URL}?action=getConfiguracion`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (data.status === 'success') {
      console.log('✅ Configuración obtenida desde servidor:', data.data);
      return {
        ...data,
        source: 'server'
      };
    } else {
      console.error('❌ Error del servidor:', data.message);
      console.log('🔄 Usando configuración por defecto');
      return {
        status: 'success',
        data: CONFIG_DEFAULT,
        source: 'default'
      };
    }
  } catch (error) {
    console.error('❌ Error en obtenerConfiguracion:', error);
    console.log('🔄 Usando configuración por defecto como fallback');
    
    return {
      status: 'success',
      data: CONFIG_DEFAULT,
      source: 'default',
      error: error.message
    };
  }
};

/**
 * Guarda la configuración del sistema
 */
export const guardarConfiguracion = async (configuracion) => {
  try {
    console.log('💾 Guardando configuración...', configuracion);
    
    // Verificar que API_URL esté configurada
    if (!API_URL || API_URL.includes('TU_DEPLOYMENT_ID_AQUI')) {
      console.warn('⚠️ API_URL no configurada, no se puede guardar en servidor');
      return {
        status: 'warning',
        message: 'Configuración guardada localmente. Configure API_URL para guardar en servidor.'
      };
    }
    
    const response = await fetch(`${API_URL}?action=guardarConfiguracion`, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(configuracion)
    });

    console.log('✅ Configuración guardada');
    
    return {
      status: 'success',
      message: 'Configuración guardada correctamente'
    };
    
  } catch (error) {
    console.error('❌ Error en guardarConfiguracion:', error);
    return {
      status: 'error',
      message: 'Error al guardar: ' + error.message
    };
  }
};

/**
 * Restaura la configuración a valores predeterminados
 */
export const restaurarConfiguracion = async () => {
  try {
    console.log('🔄 Restaurando configuración predeterminada...');
    
    if (!API_URL || API_URL.includes('TU_DEPLOYMENT_ID_AQUI')) {
      console.warn('⚠️ API_URL no configurada');
      return {
        status: 'warning',
        message: 'Configure API_URL para usar esta función'
      };
    }
    
    const response = await fetch(`${API_URL}?action=restaurarConfiguracion`, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('✅ Configuración restaurada');
    
    return {
      status: 'success',
      message: 'Configuración restaurada correctamente'
    };
    
  } catch (error) {
    console.error('❌ Error en restaurarConfiguracion:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
};

/**
 * Exporta la configuración como JSON
 */
export const exportarConfiguracion = async () => {
  try {
    console.log('📤 Exportando configuración...');
    
    if (!API_URL || API_URL.includes('TU_DEPLOYMENT_ID_AQUI')) {
      // Exportar configuración local
      const blob = new Blob([JSON.stringify(CONFIG_DEFAULT, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `configuracion-default-${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      return {
        status: 'success',
        message: 'Configuración por defecto exportada'
      };
    }
    
    const response = await fetch(`${API_URL}?action=exportarConfiguracion`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (data.status === 'success') {
      const blob = new Blob([data.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `configuracion-${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Configuración exportada');
      return data;
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Error en exportarConfiguracion:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
};

/**
 * Obtiene un valor específico de configuración
 */
export const obtenerValorConfiguracion = async (campo) => {
  try {
    const result = await obtenerConfiguracion();
    
    if (result.status === 'success' && result.data) {
      return result.data[campo] || null;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error en obtenerValorConfiguracion:', error);
    return null;
  }
};

/**
 * Valida la configuración antes de guardar (cliente)
 */
export const validarConfiguracionCliente = (config) => {
  const errores = [];
  
  // Validar campos obligatorios
  if (!config.empresa_nombre || config.empresa_nombre.trim() === '') {
    errores.push('El nombre de la empresa es obligatorio');
  }
  
  if (!config.empresa_rut || config.empresa_rut.trim() === '') {
    errores.push('El RUT de la empresa es obligatorio');
  }
  
  if (!config.dpo_email || config.dpo_email.trim() === '') {
    errores.push('El email del DPO es obligatorio');
  }
  
  // Validar formato email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (config.dpo_email && !emailRegex.test(config.dpo_email)) {
    errores.push('El email del DPO no es válido');
  }
  
  if (config.empresa_email && !emailRegex.test(config.empresa_email)) {
    errores.push('El email de la empresa no es válido');
  }
  
  if (config.email_cc && config.email_cc.trim() !== '' && !emailRegex.test(config.email_cc)) {
    errores.push('El email CC no es válido');
  }
  
  // Validar números
  if (config.dias_respuesta && (isNaN(config.dias_respuesta) || config.dias_respuesta < 1)) {
    errores.push('Los días de respuesta deben ser un número mayor a 0');
  }
  
  if (config.dias_alerta && (isNaN(config.dias_alerta) || config.dias_alerta < 1)) {
    errores.push('Los días de alerta deben ser un número mayor a 0');
  }
  
  // Validar color hex
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (config.portal_color && !hexRegex.test(config.portal_color)) {
    errores.push('El color principal debe ser un código hexadecimal válido (ej: #2563eb)');
  }
  
  if (config.portal_color_secundario && !hexRegex.test(config.portal_color_secundario)) {
    errores.push('El color secundario debe ser un código hexadecimal válido');
  }
  
  return {
    valido: errores.length === 0,
    errores: errores
  };
};