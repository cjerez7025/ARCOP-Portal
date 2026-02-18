// ============================================================
// FLUJO SERVICE
// Lógica de negocio del configurador de flujos por derecho.
// Define los estados obligatorios por ley y permite agregar
// estados custom (que también pueden marcarse como ley si
// la normativa cambia en el futuro).
// ============================================================

import adapter from '../adapters';

// ── Colores disponibles para badges ───────────────────────
export const COLORES_ESTADO = [
  { value: 'yellow',  label: 'Amarillo',  bg: 'bg-yellow-100',  text: 'text-yellow-800',  border: 'border-yellow-300'  },
  { value: 'blue',    label: 'Azul',      bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-300'    },
  { value: 'purple',  label: 'Morado',    bg: 'bg-purple-100',  text: 'text-purple-800',  border: 'border-purple-300'  },
  { value: 'green',   label: 'Verde',     bg: 'bg-green-100',   text: 'text-green-800',   border: 'border-green-300'   },
  { value: 'gray',    label: 'Gris',      bg: 'bg-gray-100',    text: 'text-gray-800',    border: 'border-gray-300'    },
  { value: 'red',     label: 'Rojo',      bg: 'bg-red-100',     text: 'text-red-800',     border: 'border-red-300'     },
  { value: 'orange',  label: 'Naranjo',   bg: 'bg-orange-100',  text: 'text-orange-800',  border: 'border-orange-300'  },
  { value: 'teal',    label: 'Teal',      bg: 'bg-teal-100',    text: 'text-teal-800',    border: 'border-teal-300'    },
  { value: 'indigo',  label: 'Índigo',    bg: 'bg-indigo-100',  text: 'text-indigo-800',  border: 'border-indigo-300'  },
  { value: 'pink',    label: 'Rosa',      bg: 'bg-pink-100',    text: 'text-pink-800',    border: 'border-pink-300'    },
];

// ── Tipos de campos que el DPO debe completar al transicionar ─
export const TIPOS_CAMPO_TRANSICION = [
  { value: 'url',       label: 'URL de descarga',         placeholder: 'https://drive.google.com/...' },
  { value: 'text',      label: 'Texto corto',             placeholder: 'Ingrese valor...' },
  { value: 'textarea',  label: 'Texto largo / justificación', placeholder: 'Describa...' },
  { value: 'select',    label: 'Selección de opciones',   placeholder: '' },
  { value: 'date',      label: 'Fecha',                   placeholder: '' },
  { value: 'checkbox',  label: 'Confirmación (checkbox)', placeholder: '' },
];

// ── Estados base comunes a todos los derechos ─────────────
// protegido: true  → no se puede eliminar ni reordenar
// origen: 'ley'    → requerido normativamente (Art. 11 y plazos)
const ESTADOS_BASE = [
  {
    id:          'PENDIENTE',
    nombre:      'Pendiente',
    descripcion: 'Solicitud recibida. Identidad aún no validada.',
    color:       'yellow',
    orden:       1,
    protegido:   true,
    origen:      'ley',
    articulo:    'Art. 11 Ley 21.719',
    activo:      true,
    es_inicial:  true,
    es_final:    false,
    requiere_confirmacion: false,
    envia_email:           false,
    campos_transicion:     [],
    transiciones_posibles: ['VALIDADA'],
  },
  {
    id:          'VALIDADA',
    nombre:      'Validada',
    descripcion: 'Identidad confirmada. El plazo de 15 días hábiles comienza aquí.',
    color:       'blue',
    orden:       2,
    protegido:   true,
    origen:      'ley',
    articulo:    'Art. 11 Ley 21.719',
    activo:      true,
    es_inicial:  false,
    es_final:    false,
    requiere_confirmacion: false,
    envia_email:           true,
    campos_transicion:     [],
    transiciones_posibles: ['EN_PROCESO'],
  },
  {
    id:          'EN_PROCESO',
    nombre:      'En Proceso',
    descripcion: 'La organización está ejecutando el derecho.',
    color:       'purple',
    orden:       3,
    protegido:   true,
    origen:      'ley',
    articulo:    'Art. 11 Ley 21.719',
    activo:      true,
    es_inicial:  false,
    es_final:    false,
    requiere_confirmacion: false,
    envia_email:           true,
    campos_transicion:     [],
    transiciones_posibles: ['RESUELTA'],
  },
  {
    id:          'RESUELTA',
    nombre:      'Resuelta',
    descripcion: 'El derecho fue ejercido y la respuesta fue entregada.',
    color:       'green',
    orden:       4,
    protegido:   true,
    origen:      'ley',
    articulo:    'Art. 11 Ley 21.719',
    activo:      true,
    es_inicial:  false,
    es_final:    false,
    requiere_confirmacion: true,
    envia_email:           true,
    campos_transicion: [
      { id: 'url_datos', tipo: 'url', label: 'URL de descarga / entrega', obligatorio: true },
      { id: 'formato_entrega', tipo: 'select', label: 'Formato entregado', obligatorio: true,
        opciones: ['PDF', 'CSV', 'JSON', 'XML', 'Físico'] },
    ],
    transiciones_posibles: ['CERRADA'],
  },
  {
    id:          'CERRADA',
    nombre:      'Cerrada',
    descripcion: 'Ciclo completo. Solicitud archivada.',
    color:       'gray',
    orden:       5,
    protegido:   true,
    origen:      'ley',
    articulo:    'Art. 11 Ley 21.719',
    activo:      true,
    es_inicial:  false,
    es_final:    true,
    requiere_confirmacion: false,
    envia_email:           false,
    campos_transicion:     [],
    transiciones_posibles: [],
  },
];

// ── Estados específicos por derecho ───────────────────────
const ESTADOS_ESPECIFICOS = {

  ACCESO: [],  // El flujo base es suficiente para Acceso

  RECTIFICACION: [
    {
      id:          'COMUNICADO_A_TERCEROS',
      nombre:      'Comunicado a Terceros',
      descripcion: 'Se notificó a quienes recibieron los datos en cesión previa. Obligatorio antes de cerrar.',
      color:       'teal',
      orden:       45,  // entre EN_PROCESO(3) y RESUELTA(4), orden decimal para intercalar
      protegido:   true,
      origen:      'ley',
      articulo:    'Art. 6° Ley 21.719',
      activo:      true,
      es_inicial:  false,
      es_final:    false,
      requiere_confirmacion: true,
      envia_email:           true,
      campos_transicion: [
        { id: 'terceros_notificados', tipo: 'textarea',  label: 'Terceros notificados (nombre y fecha)', obligatorio: true },
        { id: 'hubo_cesion',          tipo: 'checkbox',  label: 'Confirmo que se notificó a todos los terceros que recibieron cesión', obligatorio: true },
      ],
      transiciones_posibles: ['RESUELTA'],
    },
  ],

  CANCELACION: [
    {
      id:          'BLOQUEADO',
      nombre:      'Bloqueado',
      descripcion: 'Bloqueo temporal del tratamiento mientras se evalúa la solicitud. Los datos no se eliminan aún.',
      color:       'orange',
      orden:       25,  // entre VALIDADA(2) y EN_PROCESO(3)
      protegido:   true,
      origen:      'ley',
      articulo:    'Art. 8° ter Ley 21.719',
      activo:      true,
      es_inicial:  false,
      es_final:    false,
      requiere_confirmacion: true,
      envia_email:           true,
      campos_transicion: [
        { id: 'motivo_bloqueo', tipo: 'textarea', label: 'Fundamento del bloqueo temporal', obligatorio: false },
      ],
      transiciones_posibles: ['EN_PROCESO'],
    },
    {
      id:          'DATOS_ELIMINADOS',
      nombre:      'Datos Eliminados',
      descripcion: 'Confirmación de que la supresión fue ejecutada efectivamente en todos los sistemas.',
      color:       'red',
      orden:       35,  // entre EN_PROCESO(3) y RESUELTA(4)
      protegido:   true,
      origen:      'ley',
      articulo:    'Art. 7° Ley 21.719',
      activo:      true,
      es_inicial:  false,
      es_final:    false,
      requiere_confirmacion: true,
      envia_email:           false,
      campos_transicion: [
        { id: 'sistemas_afectados', tipo: 'textarea', label: 'Sistemas donde se eliminaron los datos', obligatorio: true },
        { id: 'confirmacion_eliminacion', tipo: 'checkbox', label: 'Confirmo que los datos fueron eliminados de todos los sistemas', obligatorio: true },
      ],
      transiciones_posibles: ['RESUELTA'],
    },
  ],

  OPOSICION: [
    {
      id:          'BLOQUEADO',
      nombre:      'Bloqueado',
      descripcion: 'Bloqueo temporal del tratamiento específico mientras se evalúa la oposición.',
      color:       'orange',
      orden:       25,
      protegido:   true,
      origen:      'ley',
      articulo:    'Art. 8° ter Ley 21.719',
      activo:      true,
      es_inicial:  false,
      es_final:    false,
      requiere_confirmacion: true,
      envia_email:           true,
      campos_transicion: [
        { id: 'tratamiento_bloqueado', tipo: 'text', label: 'Tratamiento específico bloqueado', obligatorio: true },
      ],
      transiciones_posibles: ['EN_PROCESO'],
    },
    {
      id:          'TRATAMIENTO_CESADO',
      nombre:      'Tratamiento Cesado',
      descripcion: 'Confirmación de que el tratamiento específico fue detenido.',
      color:       'red',
      orden:       35,
      protegido:   true,
      origen:      'ley',
      articulo:    'Art. 8° Ley 21.719',
      activo:      true,
      es_inicial:  false,
      es_final:    false,
      requiere_confirmacion: true,
      envia_email:           false,
      campos_transicion: [
        { id: 'tratamiento_cesado_detalle', tipo: 'textarea', label: 'Detalle del tratamiento detenido y fecha efectiva', obligatorio: true },
        { id: 'confirmacion_cese', tipo: 'checkbox', label: 'Confirmo que el tratamiento fue detenido en todos los sistemas', obligatorio: true },
      ],
      transiciones_posibles: ['RESUELTA'],
    },
  ],

  PORTABILIDAD: [
    {
      id:          'DATOS_PREPARADOS',
      nombre:      'Datos Preparados',
      descripcion: 'Archivo generado en el formato solicitado. Pendiente de entrega al titular.',
      color:       'indigo',
      orden:       35,  // entre EN_PROCESO(3) y RESUELTA(4)
      protegido:   true,
      origen:      'ley',
      articulo:    'Art. 9° Ley 21.719',
      activo:      true,
      es_inicial:  false,
      es_final:    false,
      requiere_confirmacion: false,
      envia_email:           false,
      campos_transicion: [
        { id: 'formato_generado', tipo: 'select', label: 'Formato del archivo generado', obligatorio: true,
          opciones: ['JSON', 'CSV', 'XML'] },
        { id: 'url_archivo_interno', tipo: 'url', label: 'URL interna del archivo (solo DPO)', obligatorio: true },
      ],
      transiciones_posibles: ['RESUELTA'],
    },
  ],
};

// ── Metadatos de derechos (reutiliza de formularioService) ─
export const DERECHOS_META_FLUJO = {
  ACCESO:        { nombre: 'Acceso',        icono: '🔍', color: 'blue',   articulo: 'Art. 5°' },
  RECTIFICACION: { nombre: 'Rectificación', icono: '✏️', color: 'yellow', articulo: 'Art. 6°' },
  CANCELACION:   { nombre: 'Cancelación',   icono: '🗑️', color: 'red',    articulo: 'Art. 7°' },
  OPOSICION:     { nombre: 'Oposición',     icono: '🚫', color: 'orange', articulo: 'Art. 8°' },
  PORTABILIDAD:  { nombre: 'Portabilidad',  icono: '📦', color: 'green',  articulo: 'Art. 9°' },
};

// ── Funciones del servicio ─────────────────────────────────

/**
 * Construye el flujo default de un derecho:
 * estados base + estados específicos del derecho, ordenados.
 */
function buildFlujoDefault(derecho) {
  const especificos = ESTADOS_ESPECIFICOS[derecho] || [];
  const todos = [...ESTADOS_BASE, ...especificos];
  // Ordenar por campo 'orden'
  todos.sort((a, b) => a.orden - b.orden);
  // Reindexar orden secuencial
  todos.forEach((e, i) => { e.orden = i + 1; });
  return { activo: true, estados: todos };
}

function buildConfigDefault() {
  const config = { version: '1.0', derechos: {} };
  Object.keys(DERECHOS_META_FLUJO).forEach(key => {
    config.derechos[key] = buildFlujoDefault(key);
  });
  return config;
}

function mergeConDefaults(saved) {
  const defaults = buildConfigDefault();
  Object.keys(defaults.derechos).forEach(key => {
    if (!saved.derechos?.[key]) {
      if (!saved.derechos) saved.derechos = {};
      saved.derechos[key] = defaults.derechos[key];
    } else {
      // Agregar estados de ley que hayan sido incorporados en versiones futuras
      const savedIds = saved.derechos[key].estados.map(e => e.id);
      const nuevosLey = defaults.derechos[key].estados.filter(
        e => e.origen === 'ley' && !savedIds.includes(e.id)
      );
      if (nuevosLey.length > 0) {
        saved.derechos[key].estados = [...saved.derechos[key].estados, ...nuevosLey];
        saved.derechos[key].estados.sort((a, b) => a.orden - b.orden);
      }
    }
  });
  return saved;
}

// ── API pública ────────────────────────────────────────────

export const obtenerFlujoConfig = async () => {
  try {
    const result = await adapter.getFlujoConfig();
    if (result.status === 'success' && result.data) {
      return { status: 'success', data: mergeConDefaults(result.data) };
    }
    return { status: 'success', data: buildConfigDefault(), source: 'default' };
  } catch (error) {
    console.error('Error en obtenerFlujoConfig:', error);
    return { status: 'success', data: buildConfigDefault(), source: 'default' };
  }
};

export const guardarFlujoConfig = async (config) => {
  try {
    return await adapter.saveFlujoConfig(config);
  } catch (error) {
    console.error('Error en guardarFlujoConfig:', error);
    return { status: 'error', message: error.message };
  }
};

export const restaurarFlujoDefault = (derecho) => buildFlujoDefault(derecho);

export const crearEstadoCustom = (override = {}) => ({
  id:                    `CUSTOM_${Date.now()}`,
  nombre:                'Nuevo Estado',
  descripcion:           '',
  color:                 'gray',
  orden:                 99,
  protegido:             false,   // el DPO puede marcarlo como true si la ley cambia
  origen:                'custom',
  articulo:              '',      // el DPO puede completarlo si viene de ley futura
  activo:                true,
  es_inicial:            false,
  es_final:              false,
  requiere_confirmacion: false,
  envia_email:           false,
  campos_transicion:     [],
  transiciones_posibles: [],
  ...override,
});

export const crearCampoTransicion = (override = {}) => ({
  id:          `campo_${Date.now()}`,
  tipo:        'text',
  label:       'Nuevo campo',
  obligatorio: false,
  opciones:    [],
  ...override,
});