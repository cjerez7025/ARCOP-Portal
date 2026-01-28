// ==================================================
// PORTAL ARCOP - CONSTANTES
// ==================================================

export const ESTADOS = {
  PENDIENTE: 'PENDIENTE',
  VALIDANDO: 'VALIDANDO_IDENTIDAD',
  VALIDADA: 'VALIDADA',
  ASIGNADA: 'ASIGNADA',
  EN_PROCESO: 'EN_PROCESO',
  RESUELTA: 'RESUELTA',
  CERRADA: 'CERRADA',
  RECHAZADA: 'RECHAZADA',
  EXPIRADA: 'EXPIRADA'
};

export const TIPOS_SOLICITUD = {
  ACCESO: 'ACCESO',
  RECTIFICACION: 'RECTIFICACION',
  CANCELACION: 'CANCELACION',
  OPOSICION: 'OPOSICION',
  PORTABILIDAD: 'PORTABILIDAD',
  BLOQUEO: 'BLOQUEO'
};

export const ALCANCE_ACCESO = {
  TODOS: 'TODOS',
  ESPECIFICO: 'ESPECIFICO'
};

export const FORMATOS = {
  PDF: 'PDF',
  CSV: 'CSV',
  JSON: 'JSON'
};

export const CATEGORIAS_DATOS = [
  { value: 'identificacion', label: 'Datos de Identificación', description: 'Nombre, RUT, fecha de nacimiento' },
  { value: 'contacto', label: 'Datos de Contacto', description: 'Email, teléfono, dirección' },
  { value: 'financiero', label: 'Datos Financieros', description: 'Información de pagos y transacciones' },
  { value: 'compras', label: 'Historial de Compras', description: 'Productos y servicios adquiridos' },
  { value: 'preferencias', label: 'Preferencias', description: 'Configuraciones y preferencias personales' },
  { value: 'comportamiento', label: 'Comportamiento Web', description: 'Navegación y uso del sitio' }
];

export const ESTADO_COLORS = {
  PENDIENTE: 'bg-gray-100 text-gray-800 border-gray-300',
  VALIDANDO_IDENTIDAD: 'bg-blue-100 text-blue-800 border-blue-300',
  VALIDADA: 'bg-green-100 text-green-800 border-green-300',
  ASIGNADA: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  EN_PROCESO: 'bg-orange-100 text-orange-800 border-orange-300',
  RESUELTA: 'bg-green-100 text-green-800 border-green-300',
  CERRADA: 'bg-gray-100 text-gray-800 border-gray-300',
  RECHAZADA: 'bg-red-100 text-red-800 border-red-300',
  EXPIRADA: 'bg-red-100 text-red-800 border-red-300'
};

export const ESTADO_LABELS = {
  PENDIENTE: 'Pendiente',
  VALIDANDO_IDENTIDAD: 'Validando Identidad',
  VALIDADA: 'Validada',
  ASIGNADA: 'Asignada',
  EN_PROCESO: 'En Proceso',
  RESUELTA: 'Resuelta',
  CERRADA: 'Cerrada',
  RECHAZADA: 'Rechazada',
  EXPIRADA: 'Expirada'
};

// Configuración de plazos
export const PLAZOS = {
  DIAS_HABILES_RESPUESTA: 15,
  MINUTOS_EXPIRACION_TOKEN: 30,
  HORAS_EXPIRACION_LINK_DESCARGA: 48,
  DIAS_ALERTA_VENCIMIENTO: 3
};

// Información de la empresa (usar variables de entorno en producción)
export const EMPRESA = {
  NOMBRE: process.env.REACT_APP_EMPRESA_NOMBRE || 'Empresa XYZ SpA',
  RUT: process.env.REACT_APP_EMPRESA_RUT || '12.345.678-9',
  DPO_EMAIL: process.env.REACT_APP_DPO_EMAIL || 'dpo@empresa.cl',
  DPO_TELEFONO: process.env.REACT_APP_DPO_TELEFONO || '+56 2 2345 6789'
};