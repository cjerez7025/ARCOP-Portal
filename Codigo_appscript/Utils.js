// ============================================
// UTILIDADES GENERALES
// ============================================

const Utils = {
  
  /**
   * Crea respuesta HTTP JSON
   */
  crearRespuesta: function(exito, mensaje, datos) {
    const respuesta = {
      status: exito ? 'success' : 'error',
      message: mensaje
    };
    
    if (datos) {
      respuesta.data = datos;
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(respuesta))
      .setMimeType(ContentService.MimeType.JSON);
  },
  
  /**
   * Registra evento en logs
   */
  registrarLog: function(accion, referencia, detalles) {
    try {
      const sheet = ConfiguracionService.getOrCreateSheet(ConfiguracionService.LOGS_SHEET_NAME);
      
      // Crear headers si es nueva hoja
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['TIMESTAMP', 'ACCION', 'REFERENCIA', 'DETALLES', 'USUARIO']);
        sheet.getRange('A1:E1')
          .setFontWeight('bold')
          .setBackground('#34A853')
          .setFontColor('#ffffff');
      }
      
      const timestamp = new Date();
      const usuario = Session.getEffectiveUser().getEmail();
      
      sheet.appendRow([timestamp, accion, referencia, detalles, usuario]);
      
    } catch (error) {
      Logger.log('Error al registrar log: ' + error);
    }
  },
  
  /**
   * Genera ID único
   */
  generarId: function() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${timestamp}-${random}`;
  },
  
  /**
   * Genera número de solicitud
   */
  generarNumeroSolicitud: function() {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const numero = String(Date.now()).slice(-5);
    return `SOL-${año}-${numero}`;
  },
  
  /**
   * Genera token aleatorio
   */
  generarToken: function() {
    const part1 = Math.random().toString(36).substr(2);
    const part2 = Math.random().toString(36).substr(2);
    return part1 + part2;
  },
  
  /**
   * Calcula fecha límite (15 días hábiles)
   */
  calcularFechaLimite: function() {
    const fecha = new Date();
    let diasAgregados = 0;
    
    while (diasAgregados < ConfiguracionService.PLAZOS.DIAS_HABILES_RESPUESTA) {
      fecha.setDate(fecha.getDate() + 1);
      const diaSemana = fecha.getDay();
      
      // No contar sábados (6) ni domingos (0)
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasAgregados++;
      }
    }
    
    return fecha.toISOString();
  },
  
  /**
   * Calcula expiración del token (30 minutos)
   */
  calcularExpiracionToken: function() {
    const ahora = Date.now();
    const minutos = ConfiguracionService.PLAZOS.MINUTOS_EXPIRACION_TOKEN;
    const milisegundos = minutos * 60 * 1000;
    return new Date(ahora + milisegundos).toISOString();
  },
  
  /**
   * Formatea fecha a string legible
   */
  formatearFecha: function(fecha) {
    if (!fecha) return '';
    
    const d = new Date(fecha);
    return d.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};