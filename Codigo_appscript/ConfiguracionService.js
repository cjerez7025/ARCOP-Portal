// ============================================
// SERVICIO DE CONFIGURACIÓN
// ============================================

const ConfiguracionService = {
  
  // Nombres de hojas
  SHEET_NAME: 'SOLICITUDES',
  LOGS_SHEET_NAME: 'LOGS',
  
  // Información de la empresa
  EMPRESA: {
    NOMBRE: 'Empresa XYZ SpA',
    RUT: '12.345.678-9',
    DPO_EMAIL: 'dpo@empresa.cl',
    DPO_TELEFONO: '+56 2 2345 6789'
  },
  
  // Plazos y configuración
  PLAZOS: {
    DIAS_HABILES_RESPUESTA: 15,
    MINUTOS_EXPIRACION_TOKEN: 30,
    HORAS_EXPIRACION_LINK_DESCARGA: 48
  },
  
  // Estados posibles de solicitud
  ESTADOS: {
    PENDIENTE: 'PENDIENTE',
    VALIDANDO: 'VALIDANDO_IDENTIDAD',
    VALIDADA: 'VALIDADA',
    ASIGNADA: 'ASIGNADA',
    EN_PROCESO: 'EN_PROCESO',
    RESUELTA: 'RESUELTA',
    CERRADA: 'CERRADA',
    RECHAZADA: 'RECHAZADA',
    EXPIRADA: 'EXPIRADA'
  },
  
  // Tipos de solicitud
  TIPOS: {
    ACCESO: 'ACCESO',
    RECTIFICACION: 'RECTIFICACION',
    CANCELACION: 'CANCELACION',
    OPOSICION: 'OPOSICION',
    PORTABILIDAD: 'PORTABILIDAD',
    BLOQUEO: 'BLOQUEO'
  },
  
  /**
   * Obtiene la spreadsheet activa
   */
  getSpreadsheet: function() {
    return SpreadsheetApp.getActiveSpreadsheet();
  },
  
  /**
   * Obtiene o crea una hoja
   */
  getOrCreateSheet: function(nombreHoja) {
    const ss = this.getSpreadsheet();
    let sheet = ss.getSheetByName(nombreHoja);
    
    if (!sheet) {
      sheet = ss.insertSheet(nombreHoja);
    }
    
    return sheet;
  }
};