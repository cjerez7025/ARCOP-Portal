// ==================================================
// UTILIDADES - FUNCIONES HELPER
// ==================================================

/**
 * Valida formato y dígito verificador de RUT chileno
 * @param {string} rut - RUT con o sin formato (ej: "12.345.678-9" o "123456789")
 * @returns {boolean} - true si el RUT es válido
 */
export const validarRUT = (rut) => {
  if (!rut) return false;

  // Limpiar RUT: quitar puntos, guiones y espacios
  const rutLimpio = rut.replace(/[.\-\s]/g, '').toUpperCase();

  // Validar que tenga al menos 2 caracteres (número + verificador)
  if (rutLimpio.length < 2) return false;

  // Separar número y dígito verificador
  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);

  // Validar que el cuerpo sean solo números
  if (!/^\d+$/.test(cuerpo)) return false;

  // Validar que el dígito verificador sea número o K
  if (!/^[0-9K]$/.test(dv)) return false;

  // Calcular dígito verificador esperado
  const dvEsperado = calcularDV(cuerpo);

  // Comparar
  return dv === dvEsperado;
};

/**
 * Calcula el dígito verificador de un RUT
 * Algoritmo módulo 11
 */
const calcularDV = (rut) => {
  let suma = 0;
  let multiplo = 2;

  // Recorrer de derecha a izquierda
  for (let i = rut.length - 1; i >= 0; i--) {
    suma += parseInt(rut.charAt(i)) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }

  const resto = suma % 11;
  const dv = 11 - resto;

  if (dv === 11) return '0';
  if (dv === 10) return 'K';
  return dv.toString();
};

/**
 * Formatea un RUT limpio al formato 12.345.678-9
 * @param {string} rut - RUT sin formato
 * @returns {string} - RUT formateado
 */
export const formatearRUT = (rut) => {
  if (!rut) return '';

  // Limpiar
  const rutLimpio = rut.replace(/[.\-\s]/g, '').toUpperCase();
  
  if (rutLimpio.length < 2) return rutLimpio;

  // Separar cuerpo y dv
  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);

  // Formatear cuerpo con puntos
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${cuerpoFormateado}-${dv}`;
};

/**
 * Formatea RUT mientras el usuario escribe
 * Útil para inputs
 */
export const formatearRUTInput = (valor) => {
  // Permitir solo números, K y caracteres de formato
  let limpio = valor.replace(/[^0-9Kk]/g, '').toUpperCase();
  
  // Limitar a 9 caracteres (12345678K)
  if (limpio.length > 9) {
    limpio = limpio.substring(0, 9);
  }

  if (limpio.length <= 1) return limpio;

  // Separar cuerpo y dv
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);

  // Formatear cuerpo con puntos
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${cuerpoFormateado}-${dv}`;
};

/**
 * Genera número de solicitud único
 * Formato: SOL-YYYY-NNNNN
 */
export const generarNumeroSolicitud = () => {
  const año = new Date().getFullYear();
  const numero = Math.floor(Math.random() * 90000) + 10000; // 5 dígitos
  return `SOL-${año}-${numero}`;
};

/**
 * Genera token de validación único
 */
export const generarToken = () => {
  return 'TKN-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
};

/**
 * Calcula fecha límite (15 días hábiles)
 * @param {Date} fechaInicio - Fecha de inicio
 * @returns {Date} - Fecha límite
 */
export const calcularFechaLimite = (fechaInicio = new Date()) => {
  let diasAgregados = 0;
  let fechaActual = new Date(fechaInicio);

  while (diasAgregados < 15) {
    fechaActual.setDate(fechaActual.getDate() + 1);
    
    // Si no es fin de semana, contar como día hábil
    const diaSemana = fechaActual.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasAgregados++;
    }
  }

  return fechaActual;
};

/**
 * Valida email
 */
export const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Valida teléfono chileno
 * Acepta: +56912345678, 912345678, 56912345678
 */
export const validarTelefonoChileno = (telefono) => {
  if (!telefono) return true; // Opcional
  
  const limpio = telefono.replace(/[\s\-\(\)]/g, '');
  
  // Móvil: 9 dígitos empezando con 9
  const movil = /^(\+?56)?9\d{8}$/;
  
  // Fijo: 9 dígitos empezando con 2 o 3
  const fijo = /^(\+?56)?[23]\d{8}$/;
  
  return movil.test(limpio) || fijo.test(limpio);
};

/**
 * Formatea fecha para mostrar
 */
export const formatearFecha = (fecha) => {
  if (!fecha) return '';
  
  const f = new Date(fecha);
  return f.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Calcula días entre dos fechas
 */
export const calcularDiasEntre = (fecha1, fecha2) => {
  const diff = Math.abs(new Date(fecha2) - new Date(fecha1));
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};