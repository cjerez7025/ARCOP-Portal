// ==================================================
// PORTAL ARCOP - VALIDADORES
// ==================================================

import { z } from 'zod';

/**
 * Valida un RUT chileno usando módulo 11
 * @param {string} rut - RUT a validar (con o sin puntos y guión)
 * @returns {boolean} - true si es válido
 */
export const validarRUT = (rut) => {
  // Limpiar RUT (quitar puntos, guiones y espacios)
  const rutLimpio = rut.replace(/[^0-9kK]/g, '');
  
  // Verificar largo mínimo
  if (rutLimpio.length < 8) return false;
  
  // Separar cuerpo y dígito verificador
  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1).toUpperCase();
  
  // Calcular dígito verificador esperado
  let suma = 0;
  let multiplicador = 2;
  
  // Iterar desde el final hacia el inicio
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  
  const dvCalculado = 11 - (suma % 11);
  let dvFinal;
  
  if (dvCalculado === 11) {
    dvFinal = '0';
  } else if (dvCalculado === 10) {
    dvFinal = 'K';
  } else {
    dvFinal = dvCalculado.toString();
  }
  
  // Comparar
  return dv === dvFinal;
};

/**
 * Formatea un RUT agregando puntos y guión
 * @param {string} rut - RUT sin formato
 * @returns {string} - RUT formateado (ej: 12.345.678-9)
 */
export const formatearRUT = (rut) => {
  // Limpiar
  const rutLimpio = rut.replace(/[^0-9kK]/g, '');
  
  // Si es muy corto, retornar tal cual
  if (rutLimpio.length < 2) return rutLimpio;
  
  // Separar cuerpo y DV
  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1).toUpperCase();
  
  // Agregar puntos al cuerpo (de derecha a izquierda, cada 3 dígitos)
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Unir con guión
  return `${cuerpoFormateado}-${dv}`;
};

/**
 * Valida un teléfono chileno
 * @param {string} telefono - Teléfono a validar
 * @returns {boolean} - true si es válido
 */
export const validarTelefono = (telefono) => {
  // Formatos aceptados:
  // +56 9 XXXX XXXX
  // +569XXXXXXXX
  // 9XXXXXXXX
  const regex = /^\+?56\s?9\s?\d{4}\s?\d{4}$/;
  return regex.test(telefono);
};

// ==================================================
// SCHEMAS DE VALIDACIÓN CON ZOD
// ==================================================

/**
 * Schema para validar formulario de solicitud de acceso
 */
export const solicitudAccesoSchema = z.object({
  nombre_completo: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre es demasiado largo')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  
  rut: z.string()
    .refine(validarRUT, {
      message: 'RUT inválido. Verifica que esté correcto.'
    }),
  
  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  
  telefono: z.string()
    .regex(/^\+?56\s?9\s?\d{4}\s?\d{4}$/, {
      message: 'Formato: +56 9 XXXX XXXX'
    })
    .optional()
    .or(z.literal('')),
  
  alcance_acceso: z.enum(['TODOS', 'ESPECIFICO'], {
    errorMap: () => ({ message: 'Debe seleccionar una opción' })
  }),
  
  categorias: z.array(z.string())
    .optional()
    .refine((val) => {
      // Si alcance es ESPECIFICO, debe tener al menos una categoría
      // Esta validación se hace en el componente
      return true;
    }),
  
  formato_preferido: z.enum(['PDF', 'CSV', 'JSON'], {
    errorMap: () => ({ message: 'Debe seleccionar un formato' })
  }),
  
  acepta_terminos: z.literal(true, {
    errorMap: () => ({ 
      message: 'Debe aceptar los términos y condiciones para continuar' 
    })
  })
});

/**
 * Type inference para TypeScript (opcional)
 */
export type SolicitudAccesoFormData = z.infer<typeof solicitudAccesoSchema>;