// ============================================
// CONFIG.GS - CONFIGURACIÓN Y CONSTANTES
// v2 — Agrega DESCARGA_CONFIRMADA en ESTADOS
// ============================================

const Config = {
  // Estados de solicitud
  ESTADOS: {
    PENDIENTE:           'PENDIENTE',
    VALIDADA:            'VALIDADA',
    EN_PROCESO:          'EN_PROCESO',
    RESUELTA:            'RESUELTA',
    DESCARGA_CONFIRMADA: 'DESCARGA_CONFIRMADA',  // ← NUEVO
    CERRADA:             'CERRADA'
  },
  
  // Nombres de hojas
  SHEETS: {
    SOLICITUDES:   'SOLICITUDES',
    CONFIGURACION: 'CONFIGURACION'
  },
  
  // Plazos por defecto
  PLAZOS: {
    DIAS_RESPUESTA: 15,
    DIAS_VALIDACION: 5,
    DIAS_ALERTA: 3
  },
  
  // Configuración por defecto
  CONFIG_DEFAULT: {
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
    portal_color:              '#2563eb',
    portal_color_secundario:   '#1e40af',
    logo_url:                  '',
    dias_respuesta:            '15',
    dias_alerta:               '3',
    dias_validacion:           '5',
    notif_activas:             'SI',
    email_cc:                  '',
    timezone:                  'America/Santiago',
    version:                   '2.3'
  }
};