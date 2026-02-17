// ============================================
// UTILS.GS - UTILIDADES GENERALES
// ============================================

const Utils = {
  
  /**
   * Genera un ID único para solicitud
   */
  generarId: function() {
    return 'SOL_' + new Date().getTime() + '_' + Math.random().toString(36).substr(2, 9);
  },
  
  /**
   * Genera número de solicitud con formato SOL-YYYYMM-XXXX
   */
  generarNumeroSolicitud: function() {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SOL-${año}${mes}-${random}`;
  },
  
  /**
   * Genera token de validación aleatorio
   */
  generarToken: function() {
    return Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9);
  },
  
  /**
   * Calcula fecha de expiración del token (5 días)
   */
  calcularExpiracionToken: function() {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + Config.PLAZOS.DIAS_VALIDACION);
    return fecha.toISOString();
  },
  
  /**
   * Calcula fecha límite de respuesta (15 días hábiles)
   */
  calcularFechaLimite: function() {
    const fecha = new Date();
    let diasAgregados = 0;
    
    while (diasAgregados < Config.PLAZOS.DIAS_RESPUESTA) {
      fecha.setDate(fecha.getDate() + 1);
      const diaSemana = fecha.getDay();
      
      // Omitir sábados (6) y domingos (0)
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasAgregados++;
      }
    }
    
    return fecha.toISOString();
  },
  
  /**
   * Normaliza headers de columnas a minúsculas
   */
  normalizarHeader: function(header) {
    return header.toString().toLowerCase().trim();
  },
  
  /**
   * Busca índice de columna (case-insensitive)
   */
  buscarIndiceColumna: function(headers, nombreColumna) {
    const nombreNormalizado = nombreColumna.toLowerCase();
    return headers.findIndex(h => this.normalizarHeader(h) === nombreNormalizado);
  },
  
  /**
   * Convierte fila de Sheet a objeto
   */
  filaAObjeto: function(headers, fila) {
    const objeto = {};
    headers.forEach((header, index) => {
      objeto[this.normalizarHeader(header)] = fila[index];
    });
    return objeto;
  }
};