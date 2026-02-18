// ============================================================
// FORMULARIO SERVICE
// Lógica de negocio del configurador dinámico.
// No importa de dónde vienen los datos (Sheets/Firebase).
// ============================================================

import adapter from '../adapters';

// ── Defaults legales según Ley 21.719 ─────────────────────
// Estos campos representan los mínimos exigidos por la ley.
// protegido: true  → el DPO no puede desactivarlo
// editable: false  → el DPO no puede cambiar label/tipo
// origen: 'ley'   → requerido normativamente

export const CAMPOS_IDENTIDAD = [
  {
    id: 'nombre_completo',
    tipo: 'text',
    label: 'Nombre Completo',
    ayuda: '',
    placeholder: 'Juan Pérez González',
    obligatorio: true,
    activo: true,
    editable: false,
    protegido: true,
    origen: 'ley',
    orden: 1,
    seccion: 'identidad',
  },
  {
    id: 'rut',
    tipo: 'rut',
    label: 'RUT',
    ayuda: 'Requerido para acreditar identidad (Art. 11, Ley 21.719)',
    placeholder: '12.345.678-9',
    obligatorio: true,
    activo: true,
    editable: false,
    protegido: true,
    origen: 'ley',
    orden: 2,
    seccion: 'identidad',
  },
  {
    id: 'email',
    tipo: 'email',
    label: 'Correo Electrónico',
    ayuda: 'Se enviarán notificaciones a este correo',
    placeholder: 'juan@email.com',
    obligatorio: true,
    activo: true,
    editable: false,
    protegido: true,
    origen: 'ley',
    orden: 3,
    seccion: 'identidad',
  },
  {
    id: 'telefono',
    tipo: 'tel',
    label: 'Teléfono',
    ayuda: '',
    placeholder: '+56 9 8765 4321',
    obligatorio: false,
    activo: true,
    editable: true,
    protegido: false,
    origen: 'ley',
    orden: 4,
    seccion: 'identidad',
  },
];

// Campos específicos por derecho según la ley
export const CAMPOS_DEFAULT_POR_DERECHO = {

  ACCESO: [
    {
      id: 'alcance_acceso',
      tipo: 'radio',
      label: '¿Qué datos desea acceder?',
      ayuda: 'Art. 5° Ley 21.719',
      obligatorio: true,
      activo: true,
      editable: true,
      protegido: false,
      origen: 'ley',
      orden: 1,
      seccion: 'solicitud',
      opciones: [
        { value: 'TODOS',     label: 'Todos mis datos personales' },
        { value: 'ESPECIFICO', label: 'Categorías específicas' },
      ],
    },
    {
      id: 'periodo',
      tipo: 'text',
      label: 'Período de tiempo (opcional)',
      ayuda: 'Ej: últimos 12 meses, año 2024',
      placeholder: 'Ej: año 2024',
      obligatorio: false,
      activo: false,
      editable: true,
      protegido: false,
      origen: 'sistema',
      orden: 2,
      seccion: 'solicitud',
    },
    {
      id: 'formato_preferido',
      tipo: 'select',
      label: 'Formato de entrega',
      ayuda: 'Formato en que recibirá sus datos',
      obligatorio: false,
      activo: true,
      editable: true,
      protegido: false,
      origen: 'sistema',
      orden: 3,
      seccion: 'solicitud',
      opciones: [
        { value: 'PDF',  label: 'PDF (recomendado)' },
        { value: 'CSV',  label: 'CSV (Excel)' },
        { value: 'JSON', label: 'JSON (técnico)' },
      ],
    },
  ],

  RECTIFICACION: [
    {
      id: 'dato_incorrecto',
      tipo: 'text',
      label: '¿Qué dato está incorrecto?',
      ayuda: 'Art. 6° Ley 21.719 — indique el dato a rectificar',
      placeholder: 'Ej: Mi nombre aparece mal escrito',
      obligatorio: true,
      activo: true,
      editable: true,
      protegido: false,
      origen: 'ley',
      orden: 1,
      seccion: 'solicitud',
    },
    {
      id: 'valor_correcto',
      tipo: 'textarea',
      label: '¿Cuál es el valor correcto?',
      ayuda: 'Indique el dato correcto tal como debe quedar',
      placeholder: 'Escriba el valor correcto...',
      obligatorio: true,
      activo: true,
      editable: true,
      protegido: false,
      origen: 'ley',
      orden: 2,
      seccion: 'solicitud',
    },
    {
      id: 'documentacion',
      tipo: 'textarea',
      label: 'Documentación de respaldo',
      ayuda: 'Indique si tiene documentos que acrediten la corrección (cédula, contrato, etc.)',
      placeholder: 'Ej: adjunto copia de cédula de identidad actualizada',
      obligatorio: false,
      activo: true,
      editable: true,
      protegido: false,
      origen: 'ley',
      orden: 3,
      seccion: 'solicitud',
    },
  ],

  CANCELACION: [
    {
      id: 'alcance_cancelacion',
      tipo: 'radio',
      label: '¿Qué datos desea eliminar?',
      ayuda: 'Art. 7° Ley 21.719',
      obligatorio: true,
      activo: true,
      editable: true,
      protegido: false,
      origen: 'ley',
      orden: 1,
      seccion: 'solicitud',
      opciones: [
        { value: 'TODOS',      label: 'Todos mis datos personales' },
        { value: 'ESPECIFICO', label: 'Datos específicos' },
      ],
    },
    {
      id: 'causal_supresion',
      tipo: 'select',
      label: 'Causal de supresión',
      ayuda: 'La ley exige invocar una causal válida (Art. 7°)',
      obligatorio: true,
      activo: true,
      editable: true,
      protegido: true,
      origen: 'ley',
      orden: 2,
      seccion: 'solicitud',
      opciones: [
        { value: 'NO_NECESARIOS',  label: 'Los datos ya no son necesarios para el fin que fueron recolectados' },
        { value: 'RETIRO_CONSENTIMIENTO', label: 'Retiro mi consentimiento y no existe otra base legal' },
        { value: 'ILICITO',        label: 'Los datos fueron obtenidos de forma ilícita' },
        { value: 'OBLIGACION_LEGAL', label: 'Existe una obligación legal de suprimirlos' },
      ],
    },
    {
      id: 'motivo',
      tipo: 'textarea',
      label: 'Descripción adicional',
      ayuda: 'Puede agregar contexto adicional a su solicitud',
      placeholder: 'Explique brevemente su solicitud...',
      obligatorio: false,
      activo: true,
      editable: true,
      protegido: false,
      origen: 'sistema',
      orden: 3,
      seccion: 'solicitud',
    },
    {
      id: 'solicita_bloqueo',
      tipo: 'checkbox_single',
      label: 'Solicitar bloqueo temporal mientras se resuelve',
      ayuda: 'Art. 8° ter — suspensión temporal del tratamiento durante la evaluación',
      obligatorio: false,
      activo: true,
      editable: true,
      protegido: false,
      origen: 'ley',
      orden: 4,
      seccion: 'solicitud',
    },
  ],

  OPOSICION: [
    {
      id: 'tipo_oposicion',
      tipo: 'radio',
      label: '¿A qué tratamiento se opone?',
      ayuda: 'Art. 8° Ley 21.719 — identifique el tratamiento específico',
      obligatorio: true,
      activo: true,
      editable: true,
      protegido: false,
      origen: 'ley',
      orden: 1,
      seccion: 'solicitud',
      opciones: [
        { value: 'MARKETING',      label: 'Comunicaciones de marketing y publicidad' },
        { value: 'PERFILAMIENTO',  label: 'Perfilamiento o análisis de comportamiento' },
        { value: 'CESION',         label: 'Cesión de datos a terceros' },
        { value: 'AUTOMATIZADO',   label: 'Decisiones individuales automatizadas (Art. 8° bis)' },
        { value: 'OTRO',           label: 'Otro tratamiento (especificar)' },
      ],
    },
    {
      id: 'motivo',
      tipo: 'textarea',
      label: 'Motivo de la oposición',
      ayuda: 'Indique el motivo legítimo que fundamenta su oposición',
      placeholder: 'Explique por qué se opone al tratamiento...',
      obligatorio: true,
      activo: true,
      editable: true,
      protegido: false,
      origen: 'ley',
      orden: 2,
      seccion: 'solicitud',
    },
    {
      id: 'solicita_bloqueo',
      tipo: 'checkbox_single',
      label: 'Solicitar bloqueo temporal mientras se resuelve',
      ayuda: 'Art. 8° ter — suspensión temporal del tratamiento durante la evaluación',
      obligatorio: false,
      activo: true,
      editable: true,
      protegido: false,
      origen: 'ley',
      orden: 3,
      seccion: 'solicitud',
    },
  ],

  PORTABILIDAD: [
    {
      id: 'formato_preferido',
      tipo: 'select',
      label: 'Formato de entrega',
      ayuda: 'Art. 9° — formato estructurado, genérico y de uso común',
      obligatorio: true,
      activo: true,
      editable: true,
      protegido: false,
      origen: 'ley',
      orden: 1,
      seccion: 'solicitud',
      opciones: [
        { value: 'JSON', label: 'JSON (estándar interoperable, recomendado)' },
        { value: 'CSV',  label: 'CSV (Excel / hojas de cálculo)' },
        { value: 'XML',  label: 'XML (interoperabilidad con sistemas)' },
      ],
    },
    {
      id: 'alcance_acceso',
      tipo: 'radio',
      label: '¿Qué datos desea portar?',
      ayuda: 'Solo aplica a datos tratados con su consentimiento (Art. 9°)',
      obligatorio: true,
      activo: true,
      editable: true,
      protegido: false,
      origen: 'ley',
      orden: 2,
      seccion: 'solicitud',
      opciones: [
        { value: 'TODOS',      label: 'Todos mis datos' },
        { value: 'ESPECIFICO', label: 'Datos específicos' },
      ],
    },
    {
      id: 'destino_portabilidad',
      tipo: 'text',
      label: 'Responsable destinatario (opcional)',
      ayuda: 'Si desea transferir directamente a otro responsable, indíquelo',
      placeholder: 'Ej: Nombre de la empresa o institución destino',
      obligatorio: false,
      activo: false,
      editable: true,
      protegido: false,
      origen: 'sistema',
      orden: 3,
      seccion: 'solicitud',
    },
  ],
};

// Metadatos de cada derecho (icono, color, descripción)
export const DERECHOS_META = {
  ACCESO: {
    nombre:      'Acceso',
    icono:       '🔍',
    color:       'blue',
    articulo:    'Art. 5°',
    descripcion: 'Saber qué datos personales tenemos sobre usted',
  },
  RECTIFICACION: {
    nombre:      'Rectificación',
    icono:       '✏️',
    color:       'yellow',
    articulo:    'Art. 6°',
    descripcion: 'Corregir datos personales incorrectos o incompletos',
  },
  CANCELACION: {
    nombre:      'Cancelación',
    icono:       '🗑️',
    color:       'red',
    articulo:    'Art. 7°',
    descripcion: 'Eliminar sus datos personales de nuestros registros',
  },
  OPOSICION: {
    nombre:      'Oposición',
    icono:       '🚫',
    color:       'orange',
    articulo:    'Art. 8°',
    descripcion: 'Oponerse al tratamiento de sus datos personales',
  },
  PORTABILIDAD: {
    nombre:      'Portabilidad',
    icono:       '📦',
    color:       'green',
    articulo:    'Art. 9°',
    descripcion: 'Recibir sus datos en formato estructurado y transferible',
  },
};

// ── Funciones del servicio ─────────────────────────────────

/**
 * Obtiene la configuración de formularios.
 * Si no existe en el backend, devuelve los defaults legales.
 */
export const obtenerFormularioConfig = async () => {
  try {
    const result = await adapter.getFormularioConfig();

    if (result.status === 'success' && result.data) {
      // Mezclar con defaults para que nuevos campos aparezcan automáticamente
      return { status: 'success', data: mergeConDefaults(result.data) };
    }

    // Primera vez: devolver defaults
    return { status: 'success', data: buildConfigDefault(), source: 'default' };

  } catch (error) {
    console.error('Error en obtenerFormularioConfig:', error);
    return { status: 'success', data: buildConfigDefault(), source: 'default' };
  }
};

/**
 * Guarda la configuración de formularios
 */
export const guardarFormularioConfig = async (config) => {
  try {
    return await adapter.saveFormularioConfig(config);
  } catch (error) {
    console.error('Error en guardarFormularioConfig:', error);
    return { status: 'error', message: error.message };
  }
};

/**
 * Restaura un derecho específico a sus defaults legales
 */
export const restaurarDerechoADefault = (derecho) => {
  return {
    activo: true,
    campos: [...CAMPOS_DEFAULT_POR_DERECHO[derecho]],
  };
};

/**
 * Agrega un campo custom a un derecho
 */
export const crearCampoCustom = (derechoKey, override = {}) => {
  const orden = 100 + Date.now() % 1000; // orden alto para que quede al final
  return {
    id:          `custom_${Date.now()}`,
    tipo:        'text',
    label:       'Nuevo campo',
    ayuda:       '',
    placeholder: '',
    obligatorio: false,
    activo:      true,
    editable:    true,
    protegido:   false,
    origen:      'custom',
    orden,
    seccion:     'solicitud',
    opciones:    [],
    ...override,
  };
};

// ── Helpers internos ───────────────────────────────────────

function buildConfigDefault() {
  const config = { version: '1.0', derechos: {} };
  Object.keys(CAMPOS_DEFAULT_POR_DERECHO).forEach(key => {
    config.derechos[key] = {
      activo: true,
      campos: [...CAMPOS_DEFAULT_POR_DERECHO[key]],
    };
  });
  return config;
}

function mergeConDefaults(saved) {
  const defaults = buildConfigDefault();

  Object.keys(defaults.derechos).forEach(key => {
    if (!saved.derechos?.[key]) {
      // Derecho no existe en lo guardado → agregar default completo
      if (!saved.derechos) saved.derechos = {};
      saved.derechos[key] = defaults.derechos[key];
    } else {
      // Derecho existe → agregar campos de ley que falten (nuevos en futuras versiones)
      const savedIds = saved.derechos[key].campos.map(c => c.id);
      const camposNuevos = defaults.derechos[key].campos.filter(
        c => c.origen === 'ley' && !savedIds.includes(c.id)
      );
      if (camposNuevos.length > 0) {
        saved.derechos[key].campos = [...saved.derechos[key].campos, ...camposNuevos];
      }
    }
  });

  return saved;
}