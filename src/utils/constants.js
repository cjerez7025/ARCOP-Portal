// ============================================
// CONSTANTS.JS - CONFIGURACIÓN DEL SISTEMA
// ============================================

// 🔗 URL DE TU APPS SCRIPT (desde variable de entorno)

export const API_URL = process.env.REACT_APP_APPS_SCRIPT_URL;
// 🏢 DATOS DE LA EMPRESA (Legacy - ahora se usa Configuración)
export const EMPRESA = {
  NOMBRE: 'ARCOP Consultores SpA',
  RUT: '12.345.678-9',
  DPO_EMAIL: 'dpo@arcop.cl',
  DPO_TELEFONO: '+56 2 2345 6789'
};

// ⏰ PLAZOS (Legacy - ahora se usa Configuración)
export const PLAZOS = {
  DIAS_RESPUESTA: 15,
  DIAS_ALERTA: 3,
  DIAS_VALIDACION: 5
};

// 📊 ESTADOS DE SOLICITUD
export const ESTADOS = {
  PENDIENTE: 'PENDIENTE',
  VALIDADA: 'VALIDADA',
  EN_PROCESO: 'EN_PROCESO',
  RESUELTA: 'RESUELTA',
  CERRADA: 'CERRADA'
};

// 🎨 COLORES POR ESTADO
export const ESTADO_COLORS = {
  PENDIENTE: 'yellow',
  VALIDADA: 'blue',
  EN_PROCESO: 'purple',
  RESUELTA: 'green',
  CERRADA: 'gray'
};

// 🏷️ ETIQUETAS DE ESTADO
export const ESTADO_LABELS = {
  PENDIENTE: 'Pendiente',
  VALIDADA: 'Validada',
  EN_PROCESO: 'En Proceso',
  RESUELTA: 'Resuelta',
  CERRADA: 'Cerrada'
};

// 📝 TIPOS DE SOLICITUD
export const TIPOS_SOLICITUD = [
  { value: 'ACCESO', label: 'Acceso a datos personales' },
  { value: 'RECTIFICACION', label: 'Rectificación de datos' },
  { value: 'CANCELACION', label: 'Cancelación de datos' },
  { value: 'OPOSICION', label: 'Oposición al tratamiento' }
];

// 📂 FORMATOS DE ENTREGA
export const FORMATOS = [
  { value: 'PDF', label: 'PDF' },
  { value: 'EXCEL', label: 'Excel' },
  { value: 'CSV', label: 'CSV' },
  { value: 'JSON', label: 'JSON' }
];

// 🎯 ALCANCE DE ACCESO
export const ALCANCE_ACCESO = [
  { value: 'TODOS', label: 'Todos mis datos personales' },
  { value: 'CATEGORIAS', label: 'Categorías específicas de datos' }
];

// 📊 CATEGORÍAS DE DATOS
export const CATEGORIAS_DATOS = [
  { value: 'personales', label: 'Datos personales básicos' },
  { value: 'contacto', label: 'Datos de contacto' },
  { value: 'laborales', label: 'Datos laborales' },
  { value: 'financieros', label: 'Datos financieros' },
  { value: 'salud', label: 'Datos de salud' },
  { value: 'navegacion', label: 'Datos de navegación' },
  { value: 'comerciales', label: 'Datos comerciales' },
  { value: 'otros', label: 'Otros datos' }
];