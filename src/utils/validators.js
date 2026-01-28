// ==================================================
// PORTAL ARCOP - VALIDADORES
// ==================================================

import { z } from 'zod';

/**
 * Valida un RUT chileno usando módulo 11
 */
export const validarRUT = (rut) => {
  const rutLimpio = rut.replace(/[^0-9kK]/g, '');
  
  if (rutLimpio.length < 8) return false;
  
  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1).toUpperCase();
  
  let suma = 0;
  let multiplicador = 2;
  
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  
  const dvCalculado = 11 - (suma % 11);
  const dvFinal = dvCalculado === 11 ? '0' : dvCalculado === 10 ? 'K' : dvCalculado.toString();
  
  return dv === dvFinal;
};

/**
 * Formatea un RUT agregando puntos y guión
 */
export const formatearRUT = (rut) => {
  const rutLimpio = rut.replace(/[^0-9kK]/g, '');
  if (rutLimpio.length < 2) return rutLimpio;
  
  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1).toUpperCase();
  
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${cuerpoFormateado}-${dv}`;
};

/**
 * Schema de validación con Zod
 */
export const solicitudAccesoSchema = z.object({
  nombre_completo: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre es demasiado largo'),
  
  rut: z.string()
    .refine(validarRUT, 'RUT inválido'),
  
  email: z.string()
    .email('Email inválido')
    .toLowerCase(),
  
  telefono: z.string()
    .regex(/^\+?56\s?9\s?\d{4}\s?\d{4}$/, 'Formato: +56 9 XXXX XXXX')
    .optional()
    .or(z.literal('')),
  
  alcance_acceso: z.enum(['TODOS', 'ESPECIFICO']),
  
  categorias: z.array(z.string()).optional(),
  
  formato_preferido: z.enum(['PDF', 'CSV', 'JSON']),
  
  acepta_terminos: z.literal(true, {
    errorMap: () => ({ message: 'Debe aceptar los términos y condiciones' })
  })
});