// ============================================
// VALIDACIONSERVICE.GS - VALIDACIONES
// ============================================

const ValidacionService = {
  
  /**
   * Valida una solicitud completa
   */
  validarSolicitud: function(solicitud) {
    // Validar RUT
    if (!this.validarRUT(solicitud.rut)) {
      return {
        valida: false,
        mensaje: 'RUT inválido'
      };
    }
    
    // Validar email
    if (!this.validarEmail(solicitud.email)) {
      return {
        valida: false,
        mensaje: 'Email inválido'
      };
    }
    
    // Validar campos requeridos
    if (!solicitud.nombre_completo || solicitud.nombre_completo.trim() === '') {
      return {
        valida: false,
        mensaje: 'Nombre completo es requerido'
      };
    }
    
    if (!solicitud.tipo || solicitud.tipo.trim() === '') {
      return {
        valida: false,
        mensaje: 'Tipo de solicitud es requerido'
      };
    }
    
    return {
      valida: true
    };
  },
  
  /**
   * Valida RUT chileno con módulo 11
   */
  validarRUT: function(rut) {
    if (!rut) return false;
    
    // Eliminar puntos y guión
    rut = rut.replace(/\./g, '').replace(/-/g, '');
    
    // Verificar que tenga largo mínimo
    if (rut.length < 2) return false;
    
    // Separar número y dígito verificador
    const rutNumero = rut.slice(0, -1);
    const dv = rut.slice(-1).toUpperCase();
    
    // Verificar que el número sea numérico
    if (!/^\d+$/.test(rutNumero)) return false;
    
    // Calcular dígito verificador
    let suma = 0;
    let multiplo = 2;
    
    for (let i = rutNumero.length - 1; i >= 0; i--) {
      suma += parseInt(rutNumero.charAt(i)) * multiplo;
      multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }
    
    const dvEsperado = 11 - (suma % 11);
    const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
    
    return dv === dvCalculado;
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
   * Valida configuración antes de guardar
   */
  validarConfiguracion: function(config) {
    const errores = [];
    
    // Validar campos requeridos
    if (!config.empresa_nombre || config.empresa_nombre.trim() === '') {
      errores.push('El nombre de la empresa es requerido');
    }
    
    if (!config.empresa_rut || config.empresa_rut.trim() === '') {
      errores.push('El RUT de la empresa es requerido');
    }
    
    if (!config.dpo_email || config.dpo_email.trim() === '') {
      errores.push('El email del DPO es requerido');
    }
    
    // Validar formato de emails
    if (config.dpo_email && !this.validarEmail(config.dpo_email)) {
      errores.push('El email del DPO no tiene un formato válido');
    }
    
    if (config.empresa_email && !this.validarEmail(config.empresa_email)) {
      errores.push('El email de la empresa no tiene un formato válido');
    }
    
    if (config.email_cc && config.email_cc.trim() !== '' && !this.validarEmail(config.email_cc)) {
      errores.push('El email CC no tiene un formato válido');
    }
    
    // Validar números
    if (config.dias_respuesta && (isNaN(config.dias_respuesta) || config.dias_respuesta < 1)) {
      errores.push('Los días de respuesta deben ser un número mayor a 0');
    }
    
    if (config.dias_alerta && (isNaN(config.dias_alerta) || config.dias_alerta < 1)) {
      errores.push('Los días de alerta deben ser un número mayor a 0');
    }
    
    if (config.dias_validacion && (isNaN(config.dias_validacion) || config.dias_validacion < 1)) {
      errores.push('Los días de validación deben ser un número mayor a 0');
    }
    
    return {
      valido: errores.length === 0,
      errores: errores
    };
  }
};
