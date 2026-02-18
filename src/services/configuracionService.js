/**
 * configuracionService.js
 * VERSIÓN CORREGIDA
 * - Content-Type: text/plain;charset=utf-8 (requerido por Apps Script)
 * - action como query param en POST
 * - portal_url incluido en CONFIG_DEFAULT
 */

import { API_URL } from '../utils/constants';

const CONFIG_DEFAULT = {
  empresa_nombre:            'Mi Empresa',
  empresa_rut:               '12.345.678-9',
  empresa_razon_social:      'Mi Empresa SpA',
  empresa_direccion:         'Dirección de la empresa',
  empresa_telefono:          '+56 2 2345 6789',
  empresa_email:             'contacto@empresa.cl',
  empresa_web:               'https://empresa.cl',
  dpo_nombre:                'Delegado de Protección de Datos',
  dpo_email:                 'dpo@empresa.cl',
  dpo_telefono:              '+56 9 8765 4321',
  dpo_horario:               'Lunes a Viernes, 9:00 - 18:00',
  portal_nombre:             'Portal ARCOP',
  portal_url:                'https://arcop-portal.vercel.app',  // ✅ nuevo
  portal_color:              '#2563eb',
  portal_color_secundario:   '#1e40af',
  logo_url:                  '',
  dias_respuesta:            '15',
  dias_alerta:               '3',
  dias_validacion:           '5',
  notif_activas:             'SI',
  email_cc:                  '',
  timezone:                  'America/Santiago',
  version:                   '1.0.0'
};

// ── OBTENER ────────────────────────────────────────────────
export const obtenerConfiguracion = async () => {
  try {
    console.log('📥 Obteniendo configuración...');

    if (!API_URL || API_URL.includes('TU_DEPLOYMENT_ID_AQUI')) {
      console.warn('⚠️ API_URL no configurada, usando config por defecto');
      return { status: 'success', data: CONFIG_DEFAULT, source: 'default' };
    }

    const response = await fetch(`${API_URL}?action=getConfiguracion`, {
      method: 'GET',
      redirect: 'follow'
    });

    const data = await response.json();

    if (data.status === 'success') {
      // Mezclar con CONFIG_DEFAULT para asegurar que portal_url siempre exista
      const merged = { ...CONFIG_DEFAULT, ...data.data };
      console.log('✅ Configuración obtenida del servidor');
      return { status: 'success', data: merged, source: 'server' };
    } else {
      console.warn('⚠️ Error del servidor, usando config por defecto');
      return { status: 'success', data: CONFIG_DEFAULT, source: 'default' };
    }
  } catch (error) {
    console.error('❌ Error en obtenerConfiguracion:', error);
    return { status: 'success', data: CONFIG_DEFAULT, source: 'default', error: error.message };
  }
};

// ── GUARDAR ────────────────────────────────────────────────
export const guardarConfiguracion = async (configuracion) => {
  try {
    console.log('💾 Guardando configuración...');

    if (!API_URL || API_URL.includes('TU_DEPLOYMENT_ID_AQUI')) {
      return { status: 'warning', message: 'API_URL no configurada. Configura el archivo .env' };
    }

    // ✅ CORRECCIÓN CRÍTICA: Apps Script requiere text/plain y action como query param
    const response = await fetch(`${API_URL}?action=guardarConfiguracion`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(configuracion),
      redirect: 'follow'
    });

    const responseText = await response.text();
    console.log('Respuesta raw:', responseText.substring(0, 200));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      // Si no parsea pero no tiene "error" en el texto, asumir éxito
      if (!responseText.toLowerCase().includes('error')) {
        return { status: 'success', message: 'Configuración guardada' };
      }
      return { status: 'error', message: 'Respuesta inesperada del servidor' };
    }

    console.log('✅ Configuración guardada:', data);
    return data;

  } catch (error) {
    console.error('❌ Error en guardarConfiguracion:', error);
    return { status: 'error', message: 'Error al guardar: ' + error.message };
  }
};

// ── RESTAURAR ──────────────────────────────────────────────
export const restaurarConfiguracion = async () => {
  try {
    console.log('🔄 Restaurando configuración predeterminada...');

    if (!API_URL || API_URL.includes('TU_DEPLOYMENT_ID_AQUI')) {
      return { status: 'warning', message: 'API_URL no configurada' };
    }

    const response = await fetch(`${API_URL}?action=restaurarConfiguracion`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({}),
      redirect: 'follow'
    });

    const data = await response.json();
    console.log('✅ Configuración restaurada:', data);
    return data;

  } catch (error) {
    console.error('❌ Error en restaurarConfiguracion:', error);
    return { status: 'error', message: error.message };
  }
};

// ── EXPORTAR ───────────────────────────────────────────────
export const exportarConfiguracion = async () => {
  try {
    console.log('📤 Exportando configuración...');

    const result = await obtenerConfiguracion();

    if (result.status === 'success') {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `configuracion-arcop-${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return { status: 'success', message: 'Configuración exportada' };
    }

    return result;

  } catch (error) {
    console.error('❌ Error en exportarConfiguracion:', error);
    return { status: 'error', message: error.message };
  }
};

// ── HELPERS ────────────────────────────────────────────────
export const obtenerValorConfiguracion = async (campo) => {
  try {
    const result = await obtenerConfiguracion();
    if (result.status === 'success' && result.data) return result.data[campo] || null;
    return null;
  } catch (error) {
    return null;
  }
};

export const validarConfiguracionCliente = (config) => {
  const errores = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const hexRegex   = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const urlRegex   = /^https?:\/\/.+/;

  if (!config.empresa_nombre?.trim())  errores.push('El nombre de la empresa es obligatorio');
  if (!config.empresa_rut?.trim())     errores.push('El RUT de la empresa es obligatorio');
  if (!config.dpo_email?.trim())       errores.push('El email del DPO es obligatorio');

  if (config.dpo_email     && !emailRegex.test(config.dpo_email))     errores.push('El email del DPO no es válido');
  if (config.empresa_email && !emailRegex.test(config.empresa_email)) errores.push('El email de la empresa no es válido');
  if (config.email_cc      && config.email_cc.trim() && !emailRegex.test(config.email_cc)) errores.push('El email CC no es válido');

  if (config.portal_url && !urlRegex.test(config.portal_url)) errores.push('La URL del portal debe comenzar con http:// o https://');

  if (config.dias_respuesta  && (isNaN(config.dias_respuesta)  || config.dias_respuesta  < 1)) errores.push('Los días de respuesta deben ser mayor a 0');
  if (config.dias_alerta     && (isNaN(config.dias_alerta)     || config.dias_alerta     < 1)) errores.push('Los días de alerta deben ser mayor a 0');
  if (config.dias_validacion && (isNaN(config.dias_validacion) || config.dias_validacion < 1)) errores.push('Los días de validación deben ser mayor a 0');

  if (config.portal_color            && !hexRegex.test(config.portal_color))            errores.push('El color principal debe ser código hex válido (ej: #2563eb)');
  if (config.portal_color_secundario && !hexRegex.test(config.portal_color_secundario)) errores.push('El color secundario debe ser código hex válido');

  return { valido: errores.length === 0, errores };
};