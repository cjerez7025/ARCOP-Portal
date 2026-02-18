// ============================================================
// CONFIGURACION SERVICE — v3 (via Traductor)
// Ya no llama directo a Apps Script.
// Toda la comunicación pasa por adapters/index.js
// ============================================================

import adapter from '../adapters';

// ── Configuración por defecto (fallback local) ────────────
const CONFIG_DEFAULT = {
  empresa_nombre:           'Mi Empresa',
  empresa_rut:              '12.345.678-9',
  empresa_razon_social:     'Mi Empresa SpA',
  empresa_direccion:        'Dirección de la empresa',
  empresa_telefono:         '+56 2 2345 6789',
  empresa_email:            'contacto@empresa.cl',
  empresa_web:              'https://empresa.cl',
  dpo_nombre:               'Delegado de Protección de Datos',
  dpo_email:                'dpo@empresa.cl',
  dpo_telefono:             '+56 9 8765 4321',
  dpo_horario:              'Lunes a Viernes, 9:00 - 18:00',
  portal_nombre:            'Portal ARCOP',
  portal_url:               '',
  portal_color:             '#2563eb',
  portal_color_secundario:  '#1e40af',
  logo_url:                 '',
  dias_respuesta:           '15',
  dias_alerta:              '3',
  dias_validacion:          '5',
  notif_activas:            'SI',
  email_cc:                 '',
  timezone:                 'America/Santiago',
  version:                  '1.0.0',
};

// ── Obtener configuración ─────────────────────────────────
export const obtenerConfiguracion = async () => {
  try {
    console.log('📥 Obteniendo configuración del sistema...');

    const result = await adapter.getConfig();

    if (result.status === 'success') {
      console.log('✅ Configuración obtenida desde servidor');
      return { ...result, source: 'server' };
    }

    console.warn('⚠️ Error del servidor, usando configuración por defecto');
    return { status: 'success', data: CONFIG_DEFAULT, source: 'default' };

  } catch (error) {
    console.error('❌ Error en obtenerConfiguracion:', error);
    return { status: 'success', data: CONFIG_DEFAULT, source: 'default', error: error.message };
  }
};

// ── Guardar configuración ─────────────────────────────────
export const guardarConfiguracion = async (configuracion) => {
  try {
    console.log('💾 Guardando configuración...');
    const result = await adapter.saveConfig(configuracion);
    console.log('✅ Configuración guardada:', result);
    return result;
  } catch (error) {
    console.error('❌ Error en guardarConfiguracion:', error);
    return { status: 'error', message: 'Error al guardar: ' + error.message };
  }
};

// ── Restaurar configuración ───────────────────────────────
export const restaurarConfiguracion = async () => {
  try {
    console.log('🔄 Restaurando configuración predeterminada...');
    const result = await adapter.restoreConfig();
    console.log('✅ Configuración restaurada:', result);
    return result;
  } catch (error) {
    console.error('❌ Error en restaurarConfiguracion:', error);
    return { status: 'error', message: error.message };
  }
};

// ── Exportar configuración como JSON ─────────────────────
export const exportarConfiguracion = async () => {
  try {
    console.log('📤 Exportando configuración...');
    const result = await obtenerConfiguracion();

    const data = result.status === 'success' ? result.data : CONFIG_DEFAULT;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `configuracion-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return { status: 'success', message: 'Configuración exportada' };

  } catch (error) {
    console.error('❌ Error en exportarConfiguracion:', error);
    return { status: 'error', message: error.message };
  }
};

// ── Obtener un valor específico ───────────────────────────
export const obtenerValorConfiguracion = async (campo) => {
  try {
    const result = await obtenerConfiguracion();
    return result.status === 'success' ? (result.data[campo] ?? null) : null;
  } catch {
    return null;
  }
};

// ── Validar configuración en el cliente ───────────────────
export const validarConfiguracionCliente = (config) => {
  const errores = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const hexRegex   = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

  if (!config.empresa_nombre?.trim())  errores.push('El nombre de la empresa es obligatorio');
  if (!config.empresa_rut?.trim())     errores.push('El RUT de la empresa es obligatorio');
  if (!config.dpo_email?.trim())       errores.push('El email del DPO es obligatorio');

  if (config.dpo_email     && !emailRegex.test(config.dpo_email))     errores.push('El email del DPO no es válido');
  if (config.empresa_email && !emailRegex.test(config.empresa_email)) errores.push('El email de la empresa no es válido');
  if (config.email_cc?.trim() && !emailRegex.test(config.email_cc))   errores.push('El email CC no es válido');

  if (config.dias_respuesta && (isNaN(config.dias_respuesta) || config.dias_respuesta < 1))
    errores.push('Los días de respuesta deben ser un número mayor a 0');
  if (config.dias_alerta && (isNaN(config.dias_alerta) || config.dias_alerta < 1))
    errores.push('Los días de alerta deben ser un número mayor a 0');

  if (config.portal_color            && !hexRegex.test(config.portal_color))
    errores.push('El color principal debe ser un código hexadecimal válido (ej: #2563eb)');
  if (config.portal_color_secundario && !hexRegex.test(config.portal_color_secundario))
    errores.push('El color secundario debe ser un código hexadecimal válido');

  return { valido: errores.length === 0, errores };
};