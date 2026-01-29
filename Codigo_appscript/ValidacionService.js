// ============================================
// SERVICIO DE VALIDACIONES
// ============================================

const ValidacionService = {
  
  /**
   * Valida una solicitud completa
   */
  validarSolicitud: function(solicitud) {
    // Validar campos requeridos
    if (!solicitud.nombre_completo || solicitud.nombre_completo.trim() === '') {
      return { valida: false, mensaje: 'Nombre completo es requerido' };
    }
    
    if (!solicitud.rut || !this.validarRUT(solicitud.rut)) {
      return { valida: false, mensaje: 'RUT inválido' };
    }
    
    if (!solicitud.email || !this.validarEmail(solicitud.email)) {
      return { valida: false, mensaje: 'Email inválido' };
    }
    
    if (!solicitud.formato_preferido) {
      return { valida: false, mensaje: 'Formato preferido es requerido' };
    }
    
    return { valida: true };
  },
  
  /**
   * Valida RUT chileno
   */
  validarRUT: function(rut) {
    if (!rut) return false;
    
    // Limpiar RUT
    const rutLimpio = rut.replace(/[^0-9kK]/g, '');
    
    if (rutLimpio.length < 8) return false;
    
    const cuerpo = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1).toUpperCase();
    
    // Calcular dígito verificador
    let suma = 0;
    let multiplicador = 2;
    
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo[i]) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    const dvCalculado = 11 - (suma % 11);
    const dvFinal = dvCalculado === 11 ? '0' : dvCalculado === 10 ? 'K' : dvCalculado.toString();
    
    return dv === dvFinal;
  },
  
  /**
   * Valida formato de email
   */
  validarEmail: function(email) {
    if (!email) return false;
    
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },
  
  /**
   * Valida teléfono chileno
   */
  validarTelefono: function(telefono) {
    if (!telefono) return true; // Opcional
    
    const regex = /^\+?56\s?9\s?\d{4}\s?\d{4}$/;
    return regex.test(telefono);
  }
};