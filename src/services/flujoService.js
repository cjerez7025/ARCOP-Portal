// ============================================================
// FLUJO SERVICE v2 — Grafo de transiciones enriquecido
//
// Modelo de transición:
// {
//   id:               'tr_unique_id',
//   hacia:            'ESTADO_ID',
//   etiqueta:         'Aprobada',        // nombre de la flecha
//   descripcion:      'El dato fue...',  // tooltip / ayuda
//   color:            'green',           // color visual de la flecha
//   condicion:        'dpo_elige' | 'automatica',
//   condicion_campo:  'campo_id',        // si automatica: campo que dispara
//   condicion_valor:  'valor',           // si automatica: valor exacto
//   campos_requeridos: [ CampoTransicion ]  // campos por ESTA flecha
// }
//
// Cada estado tiene `transiciones: [ Transicion ]` en lugar de
// `transiciones_posibles: [ string ]`
// ============================================================

import adapter from '../adapters';

// ── Colores disponibles ───────────────────────────────────
export const COLORES_ESTADO = [
  { value: 'yellow',  label: 'Amarillo' },
  { value: 'blue',    label: 'Azul'     },
  { value: 'purple',  label: 'Morado'   },
  { value: 'green',   label: 'Verde'    },
  { value: 'gray',    label: 'Gris'     },
  { value: 'red',     label: 'Rojo'     },
  { value: 'orange',  label: 'Naranjo'  },
  { value: 'teal',    label: 'Teal'     },
  { value: 'indigo',  label: 'Índigo'   },
  { value: 'pink',    label: 'Rosa'     },
];

export const COLORES_TRANSICION = [
  { value: 'green',  label: 'Verde — aprobación / avance' },
  { value: 'red',    label: 'Rojo — denegación / rechazo'  },
  { value: 'blue',   label: 'Azul — información / neutro'  },
  { value: 'orange', label: 'Naranjo — escalamiento'        },
  { value: 'gray',   label: 'Gris — cierre / fin'          },
  { value: 'purple', label: 'Morado — revisión especial'   },
];

export const TIPOS_CAMPO = [
  { value: 'url',      label: 'URL de descarga'            },
  { value: 'text',     label: 'Texto corto'                },
  { value: 'textarea', label: 'Texto largo / justificación'},
  { value: 'select',   label: 'Selección de opciones'      },
  { value: 'date',     label: 'Fecha'                      },
  { value: 'checkbox', label: 'Confirmación (checkbox)'    },
];

// ── Helpers de construcción ───────────────────────────────
export const crearTransicion = (override = {}) => ({
  id:               `tr_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
  hacia:            '',
  etiqueta:         'Nueva transición',
  descripcion:      '',
  color:            'blue',
  condicion:        'dpo_elige',
  condicion_campo:  null,
  condicion_valor:  null,
  campos_requeridos: [],
  ...override,
});

export const crearCampoRequerido = (override = {}) => ({
  id:          `campo_${Date.now()}`,
  tipo:        'text',
  label:       'Nuevo campo',
  placeholder: '',
  obligatorio: false,
  opciones:    [],
  ...override,
});

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
  transiciones:          [],     // ← array de objetos Transicion (no IDs)
  pos_x:                 null,   // posición en el diagrama (se guarda al arrastrar)
  pos_y:                 null,
  ...override,
});

// ── Color CSS classes ─────────────────────────────────────
export const COLOR_CLASSES = {
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', dot: 'bg-yellow-400', stroke: '#F59E0B', fill: '#FEF3C7' },
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300',   dot: 'bg-blue-400',   stroke: '#3B82F6', fill: '#DBEAFE' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', dot: 'bg-purple-400', stroke: '#8B5CF6', fill: '#EDE9FE' },
  green:  { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300',  dot: 'bg-green-400',  stroke: '#10B981', fill: '#D1FAE5' },
  gray:   { bg: 'bg-gray-100',   text: 'text-gray-700',   border: 'border-gray-300',   dot: 'bg-gray-400',   stroke: '#6B7280', fill: '#F3F4F6' },
  red:    { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300',    dot: 'bg-red-400',    stroke: '#EF4444', fill: '#FEE2E2' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-400', stroke: '#F97316', fill: '#FFEDD5' },
  teal:   { bg: 'bg-teal-100',   text: 'text-teal-800',   border: 'border-teal-300',   dot: 'bg-teal-400',   stroke: '#14B8A6', fill: '#CCFBF1' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300', dot: 'bg-indigo-400', stroke: '#6366F1', fill: '#E0E7FF' },
  pink:   { bg: 'bg-pink-100',   text: 'text-pink-800',   border: 'border-pink-300',   dot: 'bg-pink-400',   stroke: '#EC4899', fill: '#FCE7F3' },
};

export const getColor = (color) => COLOR_CLASSES[color] || COLOR_CLASSES.gray;

// ── Estados base (Ley 21.719) ─────────────────────────────
const ESTADOS_BASE = [
  {
    id: 'PENDIENTE', nombre: 'Pendiente',
    descripcion: 'Solicitud recibida. Identidad aún no validada.',
    color: 'yellow', orden: 1, protegido: true, origen: 'ley',
    articulo: 'Art. 11 Ley 21.719', activo: true,
    es_inicial: true, es_final: false,
    requiere_confirmacion: false, envia_email: false,
    transiciones: [
      { id: 'tr_pend_valid', hacia: 'VALIDADA', etiqueta: 'Identidad confirmada',
        descripcion: 'El titular validó su identidad por email', color: 'blue',
        condicion: 'automatica', condicion_campo: 'identidad_validada', condicion_valor: 'TRUE',
        campos_requeridos: [] },
    ],
    pos_x: 60, pos_y: 200,
  },
  {
    id: 'VALIDADA', nombre: 'Validada',
    descripcion: 'Identidad confirmada. Plazo de 15 días hábiles comienza aquí.',
    color: 'blue', orden: 2, protegido: true, origen: 'ley',
    articulo: 'Art. 11 Ley 21.719', activo: true,
    es_inicial: false, es_final: false,
    requiere_confirmacion: false, envia_email: true,
    transiciones: [
      { id: 'tr_valid_proc', hacia: 'EN_PROCESO', etiqueta: 'Iniciar proceso',
        descripcion: 'DPO toma la solicitud para procesarla', color: 'blue',
        condicion: 'dpo_elige', condicion_campo: null, condicion_valor: null,
        campos_requeridos: [] },
    ],
    pos_x: 260, pos_y: 200,
  },
  {
    id: 'EN_PROCESO', nombre: 'En Proceso',
    descripcion: 'La organización está ejecutando el derecho.',
    color: 'purple', orden: 3, protegido: true, origen: 'ley',
    articulo: 'Art. 11 Ley 21.719', activo: true,
    es_inicial: false, es_final: false,
    requiere_confirmacion: false, envia_email: true,
    transiciones: [
      { id: 'tr_proc_res', hacia: 'RESUELTA', etiqueta: 'Resolver',
        descripcion: 'Derecho ejercido y datos entregados', color: 'green',
        condicion: 'dpo_elige', condicion_campo: null, condicion_valor: null,
        campos_requeridos: [
          { id: 'url_datos', tipo: 'url', label: 'URL de descarga / entrega', obligatorio: true, opciones: [] },
          { id: 'formato_entrega', tipo: 'select', label: 'Formato entregado', obligatorio: true,
            opciones: ['PDF', 'CSV', 'JSON', 'XML', 'Físico'] },
        ] },
    ],
    pos_x: 460, pos_y: 200,
  },
  {
    id: 'RESUELTA', nombre: 'Resuelta',
    descripcion: 'El derecho fue ejercido y la respuesta fue entregada.',
    color: 'green', orden: 4, protegido: true, origen: 'ley',
    articulo: 'Art. 11 Ley 21.719', activo: true,
    es_inicial: false, es_final: false,
    requiere_confirmacion: true, envia_email: true,
    transiciones: [
      { id: 'tr_res_cerr', hacia: 'CERRADA', etiqueta: 'Cerrar',
        descripcion: 'Ciclo completado', color: 'gray',
        condicion: 'dpo_elige', condicion_campo: null, condicion_valor: null,
        campos_requeridos: [] },
    ],
    pos_x: 660, pos_y: 200,
  },
  {
    id: 'CERRADA', nombre: 'Cerrada',
    descripcion: 'Ciclo completo. Solicitud archivada.',
    color: 'gray', orden: 5, protegido: true, origen: 'ley',
    articulo: 'Art. 11 Ley 21.719', activo: true,
    es_inicial: false, es_final: true,
    requiere_confirmacion: false, envia_email: false,
    transiciones: [],
    pos_x: 860, pos_y: 200,
  },
];

// ── Estados específicos por derecho ──────────────────────
const ESTADOS_ESPECIFICOS = {
  ACCESO: [],

  RECTIFICACION: [
    {
      id: 'COMUNICADO_A_TERCEROS', nombre: 'Comunicado a Terceros',
      descripcion: 'Se notificó a receptores previos de cesión. Obligatorio Art. 6°.',
      color: 'teal', orden: 35, protegido: true, origen: 'ley',
      articulo: 'Art. 6° Ley 21.719', activo: true,
      es_inicial: false, es_final: false,
      requiere_confirmacion: true, envia_email: true,
      transiciones: [
        { id: 'tr_com_res', hacia: 'RESUELTA', etiqueta: 'Notificación completada',
          color: 'green', condicion: 'dpo_elige', condicion_campo: null, condicion_valor: null,
          campos_requeridos: [
            { id: 'terceros_notificados', tipo: 'textarea', label: 'Terceros notificados (nombre y fecha)', obligatorio: true, opciones: [] },
            { id: 'confirmacion_notif', tipo: 'checkbox', label: 'Confirmo que todos los terceros fueron notificados', obligatorio: true, opciones: [] },
          ] },
      ],
      pos_x: 460, pos_y: 380,
    },
  ],

  CANCELACION: [
    {
      id: 'BLOQUEADO', nombre: 'Bloqueado',
      descripcion: 'Bloqueo temporal del tratamiento mientras se evalúa.',
      color: 'orange', orden: 25, protegido: true, origen: 'ley',
      articulo: 'Art. 8° ter Ley 21.719', activo: true,
      es_inicial: false, es_final: false,
      requiere_confirmacion: true, envia_email: true,
      transiciones: [
        { id: 'tr_bloq_proc', hacia: 'EN_PROCESO', etiqueta: 'Iniciar eliminación',
          color: 'purple', condicion: 'dpo_elige', condicion_campo: null, condicion_valor: null,
          campos_requeridos: [] },
        { id: 'tr_bloq_cerr', hacia: 'CERRADA', etiqueta: 'Denegar y cerrar',
          descripcion: 'La solicitud no cumple los requisitos legales para proceder',
          color: 'red', condicion: 'dpo_elige', condicion_campo: null, condicion_valor: null,
          campos_requeridos: [
            { id: 'motivo_denegacion', tipo: 'textarea', label: 'Motivo de denegación', obligatorio: true, opciones: [] },
          ] },
      ],
      pos_x: 260, pos_y: 380,
    },
    {
      id: 'DATOS_ELIMINADOS', nombre: 'Datos Eliminados',
      descripcion: 'Confirmación de supresión efectiva en todos los sistemas.',
      color: 'red', orden: 35, protegido: true, origen: 'ley',
      articulo: 'Art. 7° Ley 21.719', activo: true,
      es_inicial: false, es_final: false,
      requiere_confirmacion: true, envia_email: false,
      transiciones: [
        { id: 'tr_elim_res', hacia: 'RESUELTA', etiqueta: 'Confirmar eliminación',
          color: 'green', condicion: 'dpo_elige', condicion_campo: null, condicion_valor: null,
          campos_requeridos: [
            { id: 'sistemas_afectados', tipo: 'textarea', label: 'Sistemas donde se eliminaron los datos', obligatorio: true, opciones: [] },
            { id: 'confirmacion_eliminacion', tipo: 'checkbox', label: 'Confirmo eliminación en todos los sistemas', obligatorio: true, opciones: [] },
          ] },
      ],
      pos_x: 460, pos_y: 380,
    },
  ],

  OPOSICION: [
    {
      id: 'BLOQUEADO', nombre: 'Bloqueado',
      descripcion: 'Bloqueo temporal del tratamiento específico.',
      color: 'orange', orden: 25, protegido: true, origen: 'ley',
      articulo: 'Art. 8° ter Ley 21.719', activo: true,
      es_inicial: false, es_final: false,
      requiere_confirmacion: true, envia_email: true,
      transiciones: [
        { id: 'tr_bloq_proc', hacia: 'EN_PROCESO', etiqueta: 'Evaluar oposición',
          color: 'purple', condicion: 'dpo_elige', condicion_campo: null, condicion_valor: null,
          campos_requeridos: [
            { id: 'tratamiento_bloqueado', tipo: 'text', label: 'Tratamiento específico bloqueado', obligatorio: true, opciones: [] },
          ] },
        { id: 'tr_bloq_cerr', hacia: 'CERRADA', etiqueta: 'Denegar oposición',
          color: 'red', condicion: 'dpo_elige', condicion_campo: null, condicion_valor: null,
          campos_requeridos: [
            { id: 'fundamento_denegacion', tipo: 'textarea', label: 'Fundamento legal de denegación', obligatorio: true, opciones: [] },
          ] },
      ],
      pos_x: 260, pos_y: 380,
    },
    {
      id: 'TRATAMIENTO_CESADO', nombre: 'Tratamiento Cesado',
      descripcion: 'Confirmación de que el tratamiento específico fue detenido.',
      color: 'red', orden: 35, protegido: true, origen: 'ley',
      articulo: 'Art. 8° Ley 21.719', activo: true,
      es_inicial: false, es_final: false,
      requiere_confirmacion: true, envia_email: false,
      transiciones: [
        { id: 'tr_ces_res', hacia: 'RESUELTA', etiqueta: 'Confirmar cese',
          color: 'green', condicion: 'dpo_elige', condicion_campo: null, condicion_valor: null,
          campos_requeridos: [
            { id: 'detalle_cese', tipo: 'textarea', label: 'Detalle del tratamiento detenido y fecha efectiva', obligatorio: true, opciones: [] },
            { id: 'confirmacion_cese', tipo: 'checkbox', label: 'Confirmo cese en todos los sistemas', obligatorio: true, opciones: [] },
          ] },
      ],
      pos_x: 460, pos_y: 380,
    },
  ],

  PORTABILIDAD: [
    {
      id: 'DATOS_PREPARADOS', nombre: 'Datos Preparados',
      descripcion: 'Archivo generado en el formato solicitado. Pendiente de entrega.',
      color: 'indigo', orden: 35, protegido: true, origen: 'ley',
      articulo: 'Art. 9° Ley 21.719', activo: true,
      es_inicial: false, es_final: false,
      requiere_confirmacion: false, envia_email: false,
      transiciones: [
        { id: 'tr_prep_res', hacia: 'RESUELTA', etiqueta: 'Entregar datos',
          color: 'green', condicion: 'dpo_elige', condicion_campo: null, condicion_valor: null,
          campos_requeridos: [
            { id: 'formato_generado', tipo: 'select', label: 'Formato del archivo', obligatorio: true, opciones: ['JSON', 'CSV', 'XML'] },
            { id: 'url_datos', tipo: 'url', label: 'URL de descarga del archivo portable', obligatorio: true, opciones: [] },
          ] },
      ],
      pos_x: 460, pos_y: 380,
    },
  ],
};

export const DERECHOS_META_FLUJO = {
  ACCESO:        { nombre: 'Acceso',        icono: '🔍', color: 'blue',   articulo: 'Art. 5°' },
  RECTIFICACION: { nombre: 'Rectificación', icono: '✏️', color: 'yellow', articulo: 'Art. 6°' },
  CANCELACION:   { nombre: 'Cancelación',   icono: '🗑️', color: 'red',    articulo: 'Art. 7°' },
  OPOSICION:     { nombre: 'Oposición',     icono: '🚫', color: 'orange', articulo: 'Art. 8°' },
  PORTABILIDAD:  { nombre: 'Portabilidad',  icono: '📦', color: 'green',  articulo: 'Art. 9°' },
};

// ── Construcción de flujo default ─────────────────────────
function buildFlujoDefault(derecho) {
  const especificos = (ESTADOS_ESPECIFICOS[derecho] || []).map(e => ({ ...e }));
  const base = ESTADOS_BASE.map(e => {
    const copia = JSON.parse(JSON.stringify(e));
    // Para EN_PROCESO en derechos con estado intermedio antes de RESUELTA,
    // agregar transición hacia ese estado específico
    if (copia.id === 'EN_PROCESO') {
      if (derecho === 'CANCELACION') {
        copia.transiciones = [
          { id: `tr_proc_elim_${derecho}`, hacia: 'DATOS_ELIMINADOS', etiqueta: 'Confirmar eliminación',
            color: 'red', condicion: 'dpo_elige', condicion_campo: null, condicion_valor: null,
            campos_requeridos: [] },
          { id: `tr_proc_res_den_${derecho}`, hacia: 'RESUELTA', etiqueta: 'Denegar cancelación',
            color: 'red', condicion: 'dpo_elige', condicion_campo: null, condicion_valor: null,
            campos_requeridos: [
              { id: 'motivo_denegacion', tipo: 'textarea', label: 'Motivo legal de denegación', obligatorio: true, opciones: [] },
            ] },
        ];
      } else if (derecho === 'OPOSICION') {
        copia.transiciones = [
          { id: `tr_proc_ces_${derecho}`, hacia: 'TRATAMIENTO_CESADO', etiqueta: 'Acoger oposición',
            color: 'green', condicion: 'dpo_elige', condicion_campo: null, condicion_valor: null,
            campos_requeridos: [] },
          { id: `tr_proc_res_den_${derecho}`, hacia: 'RESUELTA', etiqueta: 'Denegar oposición',
            color: 'red', condicion: 'dpo_elige', condicion_campo: null, condicion_valor: null,
            campos_requeridos: [
              { id: 'fundamento_denegacion', tipo: 'textarea', label: 'Fundamento de denegación', obligatorio: true, opciones: [] },
            ] },
        ];
      } else if (derecho === 'RECTIFICACION') {
        copia.transiciones = [
          { id: `tr_proc_com_${derecho}`, hacia: 'COMUNICADO_A_TERCEROS', etiqueta: 'Rectificación aplicada',
            color: 'teal', condicion: 'dpo_elige', condicion_campo: null, condicion_valor: null,
            campos_requeridos: [
              { id: 'dato_corregido', tipo: 'text', label: 'Dato corregido (nuevo valor)', obligatorio: true, opciones: [] },
            ] },
          { id: `tr_proc_res_direct_${derecho}`, hacia: 'RESUELTA', etiqueta: 'Sin cesión previa',
            descripcion: 'No hubo cesión a terceros, se puede resolver directamente',
            color: 'green', condicion: 'dpo_elige', condicion_campo: null, condicion_valor: null,
            campos_requeridos: [
              { id: 'dato_corregido', tipo: 'text', label: 'Dato corregido (nuevo valor)', obligatorio: true, opciones: [] },
            ] },
          { id: `tr_proc_den_${derecho}`, hacia: 'RESUELTA', etiqueta: 'Denegar rectificación',
            color: 'red', condicion: 'dpo_elige', condicion_campo: null, condicion_valor: null,
            campos_requeridos: [
              { id: 'motivo_denegacion', tipo: 'textarea', label: 'Motivo de denegación', obligatorio: true, opciones: [] },
            ] },
        ];
      } else if (derecho === 'PORTABILIDAD') {
        copia.transiciones = [
          { id: `tr_proc_prep_${derecho}`, hacia: 'DATOS_PREPARADOS', etiqueta: 'Generar archivo',
            color: 'indigo', condicion: 'dpo_elige', condicion_campo: null, condicion_valor: null,
            campos_requeridos: [] },
        ];
      }
    }
    // VALIDADA en derechos con BLOQUEADO puede ir directo a bloqueado
    if (copia.id === 'VALIDADA' && ['CANCELACION', 'OPOSICION'].includes(derecho)) {
      copia.transiciones = [
        { id: `tr_valid_bloq_${derecho}`, hacia: 'BLOQUEADO', etiqueta: 'Bloquear tratamiento',
          descripcion: 'Aplicar bloqueo temporal mientras se evalúa',
          color: 'orange', condicion: 'dpo_elige', condicion_campo: null, condicion_valor: null,
          campos_requeridos: [] },
        { id: `tr_valid_proc_${derecho}`, hacia: 'EN_PROCESO', etiqueta: 'Iniciar proceso',
          color: 'blue', condicion: 'dpo_elige', condicion_campo: null, condicion_valor: null,
          campos_requeridos: [] },
      ];
    }
    return copia;
  });

  const todos = [...base, ...especificos];
  todos.sort((a, b) => a.orden - b.orden);
  todos.forEach((e, i) => { e.orden = i + 1; });
  return { activo: true, estados: todos };
}

function buildConfigDefault() {
  const config = { version: '2.0', derechos: {} };
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
      // Migrar estados viejos que usen transiciones_posibles (array de strings)
      saved.derechos[key].estados.forEach(e => {
        if (!e.transiciones) {
          e.transiciones = (e.transiciones_posibles || []).map(id =>
            crearTransicion({ hacia: id, etiqueta: `→ ${id}` })
          );
          delete e.transiciones_posibles;
        }
      });
      // Agregar estados de ley nuevos
      const savedIds = saved.derechos[key].estados.map(e => e.id);
      const nuevos = defaults.derechos[key].estados.filter(
        e => e.origen === 'ley' && !savedIds.includes(e.id)
      );
      if (nuevos.length) {
        saved.derechos[key].estados = [...saved.derechos[key].estados, ...nuevos];
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
    return { status: 'success', data: buildConfigDefault(), source: 'default' };
  }
};

export const guardarFlujoConfig    = async (config) => adapter.saveFlujoConfig(config);
export const restaurarFlujoDefault = (derecho)       => buildFlujoDefault(derecho);