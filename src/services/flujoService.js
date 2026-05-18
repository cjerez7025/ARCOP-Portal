// ============================================================
// src/services/flujoService.js
// FIX: mergeConDefaults ahora repara transiciones_posibles []
// en estados de ley guardados antes de que existiera ese campo.
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

// ── Tipos de campos de transición ─────────────────────────
export const TIPOS_CAMPO_TRANSICION = [
  { value: 'url',       label: 'URL de descarga',             placeholder: 'https://drive.google.com/...' },
  { value: 'text',      label: 'Texto corto',                 placeholder: 'Ingrese valor...' },
  { value: 'textarea',  label: 'Texto largo / justificación', placeholder: 'Describa...' },
  { value: 'select',      label: 'Selección de opciones',          placeholder: '' },
  { value: 'multiselect', label: 'Selección múltiple (checkboxes)', placeholder: '' },
  { value: 'date',      label: 'Fecha',                       placeholder: '' },
  { value: 'checkbox',  label: 'Confirmación (checkbox)',     placeholder: '' },
  { value: 'file',      label: 'Adjuntar archivo(s)',         placeholder: '' },
];

// ── Estados base comunes a todos los derechos ─────────────
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
    sla_dias:              2,
    sla_alerta_dias:       1,
    actores:               [],
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
    sla_dias:              2,
    sla_alerta_dias:       1,
    actores:               [],
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
    sla_dias:              10,
    sla_alerta_dias:       2,
    actores:               [],
    campos_transicion:     [],
    transiciones_posibles: ['RESUELTA'],
  },
  {
    id:          'RESUELTA',
    nombre:      'Resuelta',
    descripcion: 'El derecho fue ejercido. Los datos fueron enviados al titular. Esperando confirmación de descarga.',
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
    sla_dias:              1,
    sla_alerta_dias:       0,
    actores:               [],
    campos_transicion: [
      { id: 'url_datos',       tipo: 'url',    label: 'URL de descarga / entrega', obligatorio: true },
      { id: 'formato_entrega', tipo: 'multiselect', label: 'Formato entregado',   obligatorio: true,
        opciones: ['PDF', 'CSV', 'JSON', 'XML', 'Excel', 'Físico'] },
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
    sla_dias:              0,
    sla_alerta_dias:       0,
    actores:               [],
    campos_transicion:     [],
    transiciones_posibles: [],
  },
];

// ── Estados específicos por derecho ───────────────────────
const ESTADOS_ESPECIFICOS = {

  ACCESO: [],

  RECTIFICACION: [
    {
      id:          'COMUNICADO_A_TERCEROS',
      nombre:      'Comunicado a Terceros',
      descripcion: 'Se notificó a quienes recibieron los datos en cesión previa. Obligatorio antes de cerrar.',
      color:       'teal',
      orden:       45,
      protegido:   true,
      origen:      'ley',
      articulo:    'Art. 6° Ley 21.719',
      activo:      true,
      es_inicial:  false,
      es_final:    false,
      requiere_confirmacion: true,
      envia_email:           true,
      campos_transicion: [
        { id: 'terceros_notificados', tipo: 'textarea', label: 'Terceros notificados (nombre y fecha)', obligatorio: true },
        { id: 'hubo_cesion',          tipo: 'checkbox', label: 'Confirmo que se notificó a todos los terceros que recibieron cesión', obligatorio: true },
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
        { id: 'motivo_bloqueo', tipo: 'textarea', label: 'Fundamento del bloqueo temporal', obligatorio: false },
      ],
      transiciones_posibles: ['EN_PROCESO'],
    },
    {
      id:          'DATOS_ELIMINADOS',
      nombre:      'Datos Eliminados',
      descripcion: 'Confirmación de que la supresión fue ejecutada efectivamente en todos los sistemas.',
      color:       'red',
      orden:       35,
      protegido:   true,
      origen:      'ley',
      articulo:    'Art. 7° Ley 21.719',
      activo:      true,
      es_inicial:  false,
      es_final:    false,
      requiere_confirmacion: true,
      envia_email:           true,
      campos_transicion: [
        { id: 'sistemas_afectados',    tipo: 'textarea', label: 'Sistemas donde se eliminaron los datos', obligatorio: true },
        { id: 'confirmacion_eliminacion', tipo: 'checkbox', label: 'Confirmo que los datos fueron eliminados de todos los sistemas indicados', obligatorio: true },
      ],
      transiciones_posibles: ['RESUELTA'],
    },
  ],

  OPOSICION: [
    {
      id:          'EN_EVALUACION',
      nombre:      'En Evaluación',
      descripcion: 'Se está evaluando la legitimidad del tratamiento frente al derecho de oposición.',
      color:       'orange',
      orden:       25,
      protegido:   true,
      origen:      'ley',
      articulo:    'Art. 8° Ley 21.719',
      activo:      true,
      es_inicial:  false,
      es_final:    false,
      requiere_confirmacion: false,
      envia_email:           false,
      campos_transicion: [
        { id: 'fundamento_evaluacion', tipo: 'textarea', label: 'Fundamento legal evaluado', obligatorio: false },
      ],
      transiciones_posibles: ['TRATAMIENTO_SUSPENDIDO', 'OPOSICION_RECHAZADA'],
    },
    {
      id:          'TRATAMIENTO_SUSPENDIDO',
      nombre:      'Tratamiento Suspendido',
      descripcion: 'El tratamiento fue suspendido en respuesta a la oposición.',
      color:       'red',
      orden:       35,
      protegido:   true,
      origen:      'ley',
      articulo:    'Art. 8° Ley 21.719',
      activo:      true,
      es_inicial:  false,
      es_final:    false,
      requiere_confirmacion: true,
      envia_email:           true,
      campos_transicion: [
        { id: 'sistemas_suspension', tipo: 'textarea', label: 'Sistemas donde se suspendió el tratamiento', obligatorio: true },
      ],
      transiciones_posibles: ['RESUELTA'],
    },
    {
      id:          'OPOSICION_RECHAZADA',
      nombre:      'Oposición Rechazada',
      descripcion: 'Se determinó que existe una base legal que prevalece sobre la oposición.',
      color:       'gray',
      orden:       36,
      protegido:   true,
      origen:      'ley',
      articulo:    'Art. 8° Ley 21.719',
      activo:      true,
      es_inicial:  false,
      es_final:    false,
      requiere_confirmacion: false,
      envia_email:           true,
      campos_transicion: [
        { id: 'fundamento_rechazo', tipo: 'textarea', label: 'Fundamento legal del rechazo', obligatorio: true },
      ],
      transiciones_posibles: ['RESUELTA'],
    },
  ],

  PORTABILIDAD: [
    {
      id:          'GENERANDO_ARCHIVO',
      nombre:      'Generando Archivo',
      descripcion: 'Se está preparando el archivo de portabilidad en formato estructurado.',
      color:       'indigo',
      orden:       35,
      protegido:   true,
      origen:      'ley',
      articulo:    'Art. 9° Ley 21.719',
      activo:      true,
      es_inicial:  false,
      es_final:    false,
      requiere_confirmacion: false,
      envia_email:           false,
      campos_transicion: [
        { id: 'formato_generado',    tipo: 'select', label: 'Formato del archivo generado',       obligatorio: true, opciones: ['JSON', 'CSV', 'XML'] },
        { id: 'url_archivo_interno', tipo: 'url',    label: 'URL interna del archivo (solo DPO)', obligatorio: true },
      ],
      transiciones_posibles: ['RESUELTA'],
    },
  ],
};

// ── Metadatos de derechos ─────────────────────────────────
export const DERECHOS_META_FLUJO = {
  ACCESO:        { nombre: 'Acceso',        icono: '🔍', color: 'blue',   articulo: 'Art. 5°' },
  RECTIFICACION: { nombre: 'Rectificación', icono: '✏️', color: 'yellow', articulo: 'Art. 6°' },
  CANCELACION:   { nombre: 'Cancelación',   icono: '🗑️', color: 'red',    articulo: 'Art. 7°' },
  OPOSICION:     { nombre: 'Oposición',     icono: '🚫', color: 'orange', articulo: 'Art. 8°' },
  PORTABILIDAD:  { nombre: 'Portabilidad',  icono: '📦', color: 'green',  articulo: 'Art. 9°' },
};

// ── Funciones internas ────────────────────────────────────

function buildFlujoDefault(derecho) {
  const especificos = ESTADOS_ESPECIFICOS[derecho] || [];
  const todos = [...ESTADOS_BASE, ...especificos];
  todos.sort((a, b) => a.orden - b.orden);
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

function normalizarEstado(e) {
  if (!Array.isArray(e.transiciones_posibles)) e.transiciones_posibles = [];
  if (!Array.isArray(e.campos_transicion))     e.campos_transicion     = [];
  if (!Array.isArray(e.actores))               e.actores               = [];
  if (e.sla_dias        === undefined)         e.sla_dias              = 0;
  if (e.sla_alerta_dias === undefined)         e.sla_alerta_dias       = 0;
  // Limpiar campos con label vacío (creados accidentalmente con botón Agregar)
  e.campos_transicion = e.campos_transicion.filter(c => c.label && c.label.trim() !== '');
  return e;
}

function mergeConDefaults(saved) {
  const defaults = buildConfigDefault();

  Object.keys(defaults.derechos).forEach(key => {
    if (!saved.derechos?.[key]) {
      // El derecho completo no existe en Sheets → usar el default
      if (!saved.derechos) saved.derechos = {};
      saved.derechos[key] = defaults.derechos[key];
    } else {
      // El derecho existe → normalizar cada estado
      saved.derechos[key].estados = saved.derechos[key].estados.map(normalizarEstado);

      // ── FIX CRÍTICO ────────────────────────────────────────────────────
      // Si un estado de ley tiene transiciones_posibles vacío ([]) pero el
      // default tiene transiciones definidas, restaurar desde el default.
      // Esto ocurre con flujos guardados antes de que existiera este campo.
      const defaultEstados = defaults.derechos[key].estados;

      saved.derechos[key].estados = saved.derechos[key].estados.map(estadoGuardado => {
        // Solo reparar estados de ley — los custom se respetan tal cual
        if (estadoGuardado.origen !== 'ley') return estadoGuardado;

        const idNorm = (estadoGuardado.id || '').toUpperCase().trim();
        const defEquivalente = defaultEstados.find(
          d => (d.id || '').toUpperCase().trim() === idNorm
        );
        if (!defEquivalente) return estadoGuardado;

        let reparado = { ...estadoGuardado };

        // Reparar transiciones_posibles vacías
        if (
          reparado.transiciones_posibles.length === 0 &&
          defEquivalente.transiciones_posibles.length > 0
        ) {
          console.log(`[flujoService] Restaurando transiciones de ${idNorm} (${key}):`, defEquivalente.transiciones_posibles);
          reparado.transiciones_posibles = [...defEquivalente.transiciones_posibles];
        }

        // Reparar campos_transicion vacíos (ej: RESUELTA necesita url_datos y formato_entrega)
        if (
          reparado.campos_transicion.length === 0 &&
          defEquivalente.campos_transicion.length > 0
        ) {
          console.log(`[flujoService] Restaurando campos_transicion de ${idNorm} (${key}):`, defEquivalente.campos_transicion.map(c=>c.id));
          reparado.campos_transicion = [...defEquivalente.campos_transicion];
        }

        return reparado;
      });
      // ── FIN FIX ────────────────────────────────────────────────────────

      // Agregar estados de ley que no estén en la config guardada
      const savedIds = saved.derechos[key].estados.map(e => (e.id || '').toUpperCase().trim());
      const nuevosLey = defaults.derechos[key].estados.filter(
        e => e.origen === 'ley' && !savedIds.includes((e.id || '').toUpperCase().trim())
      );
      if (nuevosLey.length > 0) {
        saved.derechos[key].estados = [...saved.derechos[key].estados, ...nuevosLey];
        saved.derechos[key].estados.sort((a, b) => a.orden - b.orden);
      }
    }
  });

  return saved;
}

// ── API pública ───────────────────────────────────────────

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

export { buildConfigDefault };

export const crearEstadoCustom = (override = {}) => ({
  id:                    `CUSTOM_${Date.now()}`,
  nombre:                'Nuevo Estado',
  descripcion:           '',
  color:                 'gray',
  orden:                 99,
  protegido:             false,
  origen:                'custom',
  articulo:              '',
  activo:                true,
  es_inicial:            false,
  es_final:              false,
  requiere_confirmacion: false,
  envia_email:           false,
  sla_dias:              0,
  sla_alerta_dias:       0,
  actores:               [],
  campos_transicion:     [],
  transiciones_posibles: [],
  ...override,
});

export const crearActor = (override = {}) => ({
  id:     `actor_${Date.now()}`,
  nombre: '',
  email:  '',
  ...override,
});

export const crearTransicion = (override = {}) => ({
  id:        `tr_${Date.now()}`,
  hacia:     '',
  condicion: 'dpo_elige',
  color:     'blue',
  campos_requeridos: [],
  ...override,
});

export const crearCampoRequerido = (override = {}) => ({
  id:         `campo_${Date.now()}`,
  label:      '',
  tipo:       'text',
  obligatorio: true,
  opciones:   [],
  placeholder: '',
  ...override,
});

// ── Exports de compatibilidad ─────────────────────────────
// Usados por FlowDiagramEditor.jsx, TabFlujos.jsx, useFlujoConfig.js

// Mapa de clases Tailwind por color de estado
export const COLOR_CLASSES = {
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', badge: 'bg-yellow-100 text-yellow-800' },
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300',   badge: 'bg-blue-100 text-blue-800'   },
  purple: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', badge: 'bg-purple-100 text-purple-800'},
  green:  { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300',  badge: 'bg-green-100 text-green-800' },
  gray:   { bg: 'bg-gray-100',   text: 'text-gray-800',   border: 'border-gray-300',   badge: 'bg-gray-100 text-gray-800'   },
  red:    { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300',    badge: 'bg-red-100 text-red-800'     },
  orange: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', badge: 'bg-orange-100 text-orange-800'},
  teal:   { bg: 'bg-teal-100',   text: 'text-teal-800',   border: 'border-teal-300',   badge: 'bg-teal-100 text-teal-800'   },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300', badge: 'bg-indigo-100 text-indigo-800'},
  pink:   { bg: 'bg-pink-100',   text: 'text-pink-800',   border: 'border-pink-300',   badge: 'bg-pink-100 text-pink-800'   },
};

// Helper: retorna las clases de un color dado (con fallback a gray)
export const getColor = (color) => COLOR_CLASSES[color] || COLOR_CLASSES.gray;

// Alias de TIPOS_CAMPO_TRANSICION para compatibilidad con imports anteriores
export const TIPOS_CAMPO = TIPOS_CAMPO_TRANSICION;

// Factory de campo de transición (alias de crearCampoRequerido con nombre anterior)
export const crearCampoTransicion = (override = {}) => ({
  id:          `campo_${Date.now()}`,
  label:       '',
  tipo:        'text',
  obligatorio: false,
  opciones:    [],
  placeholder: '',
  ayuda:       '',
  ...override,
});