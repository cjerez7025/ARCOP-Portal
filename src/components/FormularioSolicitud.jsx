// ============================================================
// FormularioSolicitud.jsx — v4.2
// v4.2: Preview paso de confirmación antes de enviar
// ============================================================

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Send, CheckCircle, Loader, AlertCircle, ChevronLeft, ArrowRight, Lock, Eye, Edit2 } from 'lucide-react';
import { toast } from 'react-toastify';
import useFormularioConfig from '../hooks/useFormularioConfig';
import CampoRenderer from './CampoRenderer';
import OnboardingTour from './OnboardingTour';
import PasoValidacionContacto from './PasoValidacionContacto';
import adapter from '../adapters';
import { crearSolicitud } from '../services/googleSheetsService';

const validarRutMod11 = (rut) => {
  if (!rut) return false;
  const clean = String(rut).replace(/[.\-\s]/g, '').toUpperCase();
  if (clean.length < 2 || !/^\d+[0-9K]$/.test(clean)) return false;
  const body = clean.slice(0, -1);
  const dv   = clean.slice(-1);
  let sum = 0, mul = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const r = 11 - (sum % 11);
  const expected = r === 11 ? '0' : r === 10 ? 'K' : String(r);
  return dv === expected;
};

const generarToken        = () => Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
const calcularFechaLimite = () => {
  const f = new Date(); let d = 0;
  while (d < 15) { f.setDate(f.getDate() + 1); if (f.getDay() !== 0 && f.getDay() !== 6) d++; }
  return f.toISOString();
};

// ── SVG Icons ─────────────────────────────────────────────
const IconAcceso = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/>
  </svg>
);
const IconRectificacion = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconCancelacion = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IconOposicion = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/>
    <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2"/>
    <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8"/>
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
  </svg>
);
const IconPortabilidad = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/><path d="M3 6h18"/>
  </svg>
);

const ICON_SVG_MAP = {
  search: IconAcceso,
  eye:    IconAcceso,
  edit:   IconRectificacion,
  trash:  IconCancelacion,
  hand:   IconOposicion,
  export: IconPortabilidad,
};

const ARTNUMS_MAP = {
  ACCESO: '5°', RECTIFICACION: '6°', CANCELACION: '7°',
  OPOSICION: '8°', PORTABILIDAD: '9°',
};

const buildCfg = (derecho) => {
  const color = derecho.color || '#6B7280';
  const hex   = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return {
    color,
    colorDim: `rgba(${r},${g},${b},0.12)`,
    glow:     `rgba(${r},${g},${b},0.25)`,
    gradient: `linear-gradient(135deg, rgba(${r},${g},${b},0.15) 0%, rgba(${r},${g},${b},0.03) 100%)`,
    artNum:   ARTNUMS_MAP[derecho.id] || '',
    Icon:     ICON_SVG_MAP[derecho.icono] || null,
  };
};

// ── DerechoCard ───────────────────────────────────────────
const DerechoCard = ({ derecho, onSeleccionar, index }) => {
  const [hovered, setHovered] = useState(false);
  const { color, colorDim, glow, gradient, artNum, Icon } = buildCfg(derecho);

  return (
    <button
      onClick={() => onSeleccionar(derecho)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`animate-fade-up stagger-${(index % 4) + 1}`}
      style={{
        display: 'block', width: '100%', height: '100%', minHeight: '120px', textAlign: 'left',
        background:   hovered ? gradient : 'rgba(22,22,31,0.8)',
        border:       `1px solid ${hovered ? color + '40' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '16px', padding: '24px', cursor: 'pointer',
        transition:   'all 0.2s cubic-bezier(.22,.68,0,1.1)',
        transform:    hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow:    hovered ? `0 8px 32px ${glow}, 0 0 0 1px ${color}20` : '0 1px 3px rgba(0,0,0,0.4)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {artNum && (
        <span style={{ position: 'absolute', right: '-8px', bottom: '-20px', fontSize: '120px', fontFamily: 'var(--font-display)', fontWeight: 400, color: hovered ? color + '14' : 'rgba(255,255,255,0.04)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none', transition: 'color 0.3s' }}>
          {artNum}
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative' }}>
        <div style={{ flexShrink: 0, width: '44px', height: '44px', borderRadius: '12px', background: hovered ? color + '22' : colorDim, border: `1px solid ${hovered ? color + '50' : color + '25'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
          {Icon
            ? <Icon size={20} color={hovered ? color : color + 'BB'} />
            : <span style={{ fontSize: '18px', lineHeight: 1 }}>{derecho.icono || '📋'}</span>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: hovered ? '#F0F0F5' : '#C8C8D8', transition: 'color 0.2s' }}>
              Derecho de {derecho.nombre}
            </h3>
            {derecho.articulo && (
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: hovered ? color : color + '80', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                {derecho.articulo}
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: hovered ? '#9090A8' : '#5A5A72', lineHeight: 1.5 }}>
            {derecho.descripcion}
          </p>
        </div>
        <div style={{ flexShrink: 0, opacity: hovered ? 1 : 0, transform: hovered ? 'translateX(0)' : 'translateX(-4px)', transition: 'all 0.2s', color }}>
          <ArrowRight size={16} />
        </div>
      </div>
    </button>
  );
};

// ── Grid de cards ─────────────────────────────────────────
const CardsGrid = ({ derechos, onSeleccionar }) => {
  const total = derechos.length;
  const isPar = total % 2 === 0;
  return (
    <div className="arcop-derechos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', alignItems: 'stretch' }}>
      {derechos.map((derecho, i) => {
        const isOrfan = i === total - 1 && !isPar;
        return (
          <div key={derecho.id} style={{ gridColumn: isOrfan ? '1 / -1' : 'auto', maxWidth: isOrfan ? 'calc(50% - 6px)' : undefined, margin: isOrfan ? '0 auto' : undefined, width: isOrfan ? '100%' : undefined, display: 'flex' }}>
            <DerechoCard derecho={derecho} onSeleccionar={onSeleccionar} index={i} />
          </div>
        );
      })}
    </div>
  );
};

// ── Nota canal confirmado ─────────────────────────────────
const NotaCanalConfirmado = ({ icon, texto }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(16,185,129,0.07)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.15)', marginTop: '12px' }}>
    <span style={{ fontSize: '14px', flexShrink: 0 }}>{icon}</span>
    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{texto}</p>
  </div>
);

// ── Grid dinámico de campos ────────────────────────────────
const getGridColumn = (campo) => {
  if (campo.id === 'nombre_completo') return '1 / -1';
  switch (campo.tipo) {
    case 'text': case 'email': case 'tel': case 'rut': case 'number': case 'date': return 'auto';
    case 'textarea': case 'radio': case 'checkbox': case 'file': return '1 / -1';
    case 'select': return (campo.opciones?.length ?? 0) > 3 ? '1 / -1' : 'auto';
    default: return '1 / -1';
  }
};

const CamposGrid = ({ campos = [], register, watch, setValue, errors }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
    {(campos || []).map(campo => (
      <div key={campo.id} style={{ gridColumn: getGridColumn(campo) }}>
        <CampoRenderer dark={true} campo={campo} register={register} watch={watch} setValue={campo.tipo === 'rut' || campo.tipo === 'file' ? setValue : undefined} errors={errors} />
      </div>
    ))}
  </div>
);

// ── Preview de confirmación ────────────────────────────────
const LABEL_MAP = {
  nombre_completo:   'Nombre completo',
  rut:               'RUT',
  email:             'Email',
  telefono:          'Teléfono',
  alcance_acceso:    'Alcance',
  formato_preferido: 'Formato',
  dato_incorrecto:   'Dato incorrecto',
  valor_correcto:    'Valor correcto',
  alcance_cancelacion: 'Alcance cancelación',
  causal_supresion:  'Causal de supresión',
  motivo:            'Motivo',
  tipo_oposicion:    'Tipo de oposición',
  formato_portabilidad: 'Formato de portabilidad',
};

const formatValor = (key, val) => {
  if (val === true || val === 'true') return 'Sí';
  if (val === false || val === 'false') return 'No';
  if (Array.isArray(val)) return val.join(', ');
  if (val instanceof FileList || (val && val[0] instanceof File)) {
    const files = Array.from(val);
    return files.map(f => f.name).join(', ');
  }
  return String(val || '—');
};

// ── Preview de archivos ───────────────────────────────────
const FilePreviewItem = ({ file }) => {
  const [url, setUrl] = React.useState(null);
  const esImagen = file.type?.startsWith('image/');
  React.useEffect(() => {
    if (esImagen) {
      const objectUrl = URL.createObjectURL(file);
      setUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [file, esImagen]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100px' }}>
      {esImagen && url
        ? <img src={url} alt={file.name} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
        : <div style={{ width: '100px', height: '100px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span style={{ fontSize: '28px' }}>📄</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{file.name.split('.').pop()}</span>
          </div>
      }
      <span style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', wordBreak: 'break-all', maxWidth: '100px', lineHeight: 1.3 }}>{file.name}</span>
    </div>
  );
};

const PasoPreview = ({ data, identidad, especificos, tipoSeleccionado, onConfirmar, onEditar, loading }) => {
  const { color, Icon } = buildCfg(tipoSeleccionado);
  const todosLosCampos = [...identidad, ...especificos];

  const todasFilas = Object.entries(data)
    .filter(([k, v]) => k !== 'acepta_terminos' && v !== '' && v !== null && v !== undefined && v !== false)
    .map(([k, v]) => {
      const campoMeta = todosLosCampos.find(c => c.id === k);
      const label = campoMeta?.label || LABEL_MAP[k] || k;
      const esArchivo = campoMeta?.tipo === 'file';
      return { label, valor: formatValor(k, v), esArchivo, archivos: esArchivo ? Array.from(v || []) : [] };
    });

  const filasTexto    = todasFilas.filter(f => !f.esArchivo);
  const filasArchivos = todasFilas.filter(f => f.esArchivo && f.archivos.length > 0);

  return (
    <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header preview */}
      <div style={{ background: color + '10', border: `1px solid ${color}30`, borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: color + '20', border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Eye size={18} color={color} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Revisa tu solicitud</p>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Confirma que los datos sean correctos antes de enviar.
          </p>
        </div>
      </div>

      {/* Tabla de datos */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {Icon && <Icon size={14} color={color} />}
          <span style={{ fontSize: '12px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Derecho de {tipoSeleccionado.nombre}
          </span>
        </div>
        <div style={{ padding: '8px 0' }}>
          {filasTexto.map(({ label, valor }, i) => (
            <div key={i} style={{ display: 'flex', gap: '16px', padding: '10px 20px', borderBottom: i < filasTexto.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <span style={{ flexShrink: 0, width: '160px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
              <span style={{ flex: 1, fontSize: '13px', color: '#E0E0F0', wordBreak: 'break-word' }}>{valor}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Preview archivos adjuntos */}
      {filasArchivos.map(({ label, archivos }, i) => (
        <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {archivos.map((file, j) => <FilePreviewItem key={j} file={file} />)}
          </div>
        </div>
      ))}

      {/* Aviso legal */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Lock size={13} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '1px' }} />
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Al confirmar, declaras que los datos son verídicos y autorizas su uso para el procesamiento conforme a la Ley 21.719.
        </p>
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onEditar}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px 20px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <Edit2 size={15} /> Editar datos
        </button>
        <button
          onClick={onConfirmar}
          disabled={loading}
          style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px 24px', background: loading ? color + '80' : color, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
        >
          {loading ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</> : <><Send size={16} /> Confirmar y enviar</>}
        </button>
      </div>
    </div>
  );
};

// ── Componente principal ───────────────────────────────────
const FormularioSolicitud = () => {
  const { config, loading: loadingConfig, getCamposParaFormulario } = useFormularioConfig();
  const [loading,          setLoading]          = useState(false);
  const [success,          setSuccess]          = useState(false);
  const [solicitudCreada,  setSolicitudCreada]  = useState(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [derechos,         setDerechos]         = useState([]);
  const [loadingDerechos,  setLoadingDerechos]  = useState(true);
  const [preview,          setPreview]          = useState(false);
  const [datosPreview,     setDatosPreview]     = useState(null);
  const [rutValidado,      setRutValidado]      = useState(null);
  const [canalValidacion,  setCanalValidacion]  = useState(null);
  const [derivadoAsistido, setDerivadoAsistido] = useState(false);
  const [contactoAnon,     setContactoAnon]     = useState(null);

  useEffect(() => {
    adapter.getDerechos().then(result => {
      if (result.status === 'success') setDerechos(result.data || []);
      setLoadingDerechos(false);
    }).catch(() => setLoadingDerechos(false));
  }, []);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: { alcance_acceso: 'TODOS', formato_preferido: 'PDF', categorias: [], acepta_terminos: false },
  });

  const rutWatched = watch('rut');
  useEffect(() => {
    if (validarRutMod11(rutWatched)) {
      setRutValidado(rutWatched);
    } else {
      setRutValidado(null);
      setCanalValidacion(null);
      setDerivadoAsistido(false);
      setContactoAnon(null);
    }
  }, [rutWatched]);

  // Cuando el canal queda confirmado, silencia la validación del campo oculto
  // poniéndole el valor anonimizado. Cuando se limpia, borra el campo.
  useEffect(() => {
    if (canalValidacion === 'email') {
      setValue('email', contactoAnon?.email_anon || 'canal_email', { shouldValidate: false });
    } else if (canalValidacion === 'whatsapp') {
      setValue('telefono', contactoAnon?.telefono_anon || 'canal_whatsapp', { shouldValidate: false });
    } else {
      // Canal limpiado (usuario hizo "Cambiar") → restaurar campos vacíos
      setValue('email',    '', { shouldValidate: false });
      setValue('telefono', '', { shouldValidate: false });
    }
  }, [canalValidacion, contactoAnon, setValue]);

  const handleSeleccionar = (derecho) => {
    setTipoSeleccionado(derecho);
    setPreview(false);
    setDatosPreview(null);
    setRutValidado(null);
    setCanalValidacion(null);
    setDerivadoAsistido(false);
    setContactoAnon(null);
    reset({ alcance_acceso: 'TODOS', formato_preferido: 'PDF', categorias: [], acepta_terminos: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Al hacer submit del form → ir a preview
  const onSubmitForm = (data) => {
    setDatosPreview(data);
    setPreview(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Desde preview → enviar de verdad
  const onConfirmar = async () => {
    const data = datosPreview;
    setLoading(true);
    try {
      const archivos = data.documentacion;
      const datosLimpios = { ...data };
      delete datosLimpios.documentacion;
      delete datosLimpios.acepta_terminos;

      // Si el canal de validación cubre email o teléfono, el backend usará
      // el dato real desde rut_contactos — no enviamos el valor centinela.
      if (canalValidacion === 'email')    delete datosLimpios.email;
      if (canalValidacion === 'whatsapp') delete datosLimpios.telefono;

      const solicitudData = {
        ...datosLimpios,
        tipo_derecho:        tipoSeleccionado.id,
        canal_validacion:    canalValidacion,
        derivacion_asistida: derivadoAsistido,
      };

      const result = await crearSolicitud(solicitudData);

      if (result.status !== 'success') {
        throw new Error(result.message || 'Error al crear solicitud');
      }

      const solicitudId = result.data?.id;

      if (archivos && archivos.length > 0 && solicitudId) {
        try {
          const uploadResult = await adapter.uploadDocumentacion(solicitudId, archivos);
          if (uploadResult.status === 'success' && uploadResult.data) {
            await adapter.updateSolicitud(solicitudId, {
              documentacion_archivos: uploadResult.data.map(a => ({
                nombre: a.nombre, url: a.url, path: a.path, tipo: a.tipo, tamaño: a.tamaño,
              })),
            });
          } else {
            console.warn('⚠️ Archivos no se pudieron subir:', uploadResult.message);
          }
        } catch (uploadErr) {
          console.warn('⚠️ Error subiendo documentación:', uploadErr.message);
        }
      }

      setSolicitudCreada(result.data);
      setSuccess(true);

    } catch (error) {
      console.error('Error en onConfirmar:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Pantalla de éxito ──────────────────────────────────────
  if (success && solicitudCreada) {
    const cfg = buildCfg(tipoSeleccionado);
    return (
      <div className="arcop-portal-publico" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div className="animate-fade-up" style={{ width: '100%', maxWidth: '440px', background: 'var(--bg-surface)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', padding: '40px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={26} color="#10B981" strokeWidth={2} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: '#F0F0F5', marginBottom: '8px' }}>Solicitud registrada</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>
            Tu solicitud de <strong style={{ color: cfg.color }}>{tipoSeleccionado.nombre}</strong> fue recibida correctamente.
          </p>
          {solicitudCreada.numero_solicitud && (
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Número de caso</p>
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#F0F0F5', fontFamily: 'var(--font-display)' }}>{solicitudCreada.numero_solicitud}</p>
            </div>
          )}
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>
            Revisa tu email para confirmar tu identidad. El plazo legal de respuesta es de <strong style={{ color: '#F0F0F5' }}>15 días hábiles</strong>.
          </p>
          <button onClick={() => { setSuccess(false); setSolicitudCreada(null); setTipoSeleccionado(null); setPreview(false); setDatosPreview(null); }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-secondary)', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '13px' }}>
            Nueva solicitud
          </button>
        </div>
      </div>
    );
  }

  // ── Selección de derecho ───────────────────────────────────
  if (!tipoSeleccionado) {
    return (
      <div className="arcop-portal-publico" style={{ padding: '2rem 1rem 4rem' }}>
        <OnboardingTour />
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div className="animate-fade-up" style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: '20px', padding: '4px 14px', marginBottom: '16px' }}>
              <Lock size={11} color="#60A5FA" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#60A5FA', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Portal ARCOP · Ley 21.719</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 400, color: '#F0F0F5', marginBottom: '12px', lineHeight: 1.1 }}>
              Ejerce tus<br /><em style={{ fontStyle: 'italic', color: '#60A5FA' }}>Derechos</em> ARCOP
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '480px', margin: '0 auto' }}>
              Selecciona el derecho que deseas ejercer conforme a la Ley 21.719 de Protección de Datos Personales.
            </p>
          </div>

          {loadingDerechos || loadingConfig
            ? <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}><Loader size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>
            : derechos.length === 0
              ? <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px', fontSize: '14px' }}>No hay derechos habilitados actualmente.</div>
              : <CardsGrid derechos={derechos} onSeleccionar={handleSeleccionar} />
          }

          <div className="animate-fade-up stagger-5" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '32px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <Lock size={11} /> Datos protegidos conforme a la Ley 21.719 — Chile
          </div>
        </div>
      </div>
    );
  }

  // ── Formulario dinámico + Preview ─────────────────────────
  const { color, gradient, Icon } = buildCfg(tipoSeleccionado);
  const _campos     = getCamposParaFormulario(tipoSeleccionado.id);
  const identidad   = _campos?.identidad   || [];
  const especificos = _campos?.especificos || [];

  return (
    <div className="arcop-portal-publico" style={{ padding: '2rem 1rem 4rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <button onClick={() => { if (preview) { setPreview(false); } else { setTipoSeleccionado(null); } }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', padding: 0 }}>
          <ChevronLeft size={15} /> {preview ? 'Volver al formulario' : 'Cambiar tipo de solicitud'}
        </button>

        <div className="animate-fade-up" style={{ marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: color + '15', border: `1px solid ${color}30`, borderRadius: '20px', padding: '4px 12px 4px 8px', marginBottom: '14px' }}>
            {Icon && <Icon size={14} color={color} />}
            <span style={{ fontSize: '11px', fontWeight: 700, color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Derecho de {tipoSeleccionado.nombre}{tipoSeleccionado.articulo ? ` · ${tipoSeleccionado.articulo}` : ''}
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: '#F0F0F5', marginBottom: '6px' }}>
            {preview ? 'Confirma tu solicitud' : 'Tu solicitud'}
          </h2>
          {!preview && <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{tipoSeleccionado.descripcion}</p>}
        </div>

        {/* Indicador de pasos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
          {['Completar datos', 'Revisar', 'Enviar'].map((paso, i) => {
            const activo = preview ? i === 1 : i === 0;
            const completado = preview ? i === 0 : false;
            return (
              <React.Fragment key={paso}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, background: completado ? '#10B981' : activo ? color : 'rgba(255,255,255,0.08)', color: completado || activo ? '#fff' : 'var(--text-muted)', border: `1px solid ${completado ? '#10B981' : activo ? color : 'rgba(255,255,255,0.12)'}`, transition: 'all 0.3s' }}>
                    {completado ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '12px', color: activo ? '#F0F0F5' : 'var(--text-muted)', fontWeight: activo ? 600 : 400 }}>{paso}</span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: '1px', background: completado ? '#10B98140' : 'rgba(255,255,255,0.08)' }} />}
              </React.Fragment>
            );
          })}
        </div>

        {preview ? (
          <PasoPreview
            data={datosPreview}
            identidad={identidad}
            especificos={especificos}
            tipoSeleccionado={tipoSeleccionado}
            onConfirmar={onConfirmar}
            onEditar={() => { setPreview(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            loading={loading}
          />
        ) : (
          <form onSubmit={handleSubmit(onSubmitForm)} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {identidad.length > 0 && (
              <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', padding: '24px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Tus datos</h3>
                <CamposGrid
                  campos={identidad.filter(c => {
                    if (canalValidacion === 'email'    && c.id === 'email')    return false;
                    if (canalValidacion === 'whatsapp' && c.id === 'telefono') return false;
                    return true;
                  })}
                  register={register} watch={watch} setValue={setValue} errors={errors}
                />
                {canalValidacion === 'email' && (
                  <NotaCanalConfirmado icon="✉️" texto="La respuesta a tu solicitud se enviará al correo registrado en nuestros sistemas." />
                )}
                {canalValidacion === 'whatsapp' && (
                  <NotaCanalConfirmado icon="💬" texto="La respuesta a tu solicitud se enviará al teléfono registrado en nuestros sistemas." />
                )}
                {rutValidado && (
                  <PasoValidacionContacto
                    rut={rutValidado}
                    color={color}
                    onConfirmar={(datos) => {
                      if (!datos) { setCanalValidacion(null); setContactoAnon(null); return; }
                      setCanalValidacion(datos.canal);
                      setContactoAnon({ email_anon: datos.email_anon, telefono_anon: datos.telefono_anon });
                    }}
                    onDerivado={() => setDerivadoAsistido(true)}
                  />
                )}
              </div>
            )}
            {especificos.length > 0 && (
              <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', padding: '24px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Detalles de tu solicitud</h3>
                <CamposGrid campos={especificos} register={register} watch={watch} setValue={setValue} errors={errors} />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <input type="checkbox" id="acepta_terminos" {...register('acepta_terminos', { required: true })} style={{ marginTop: '2px', accentColor: color }} />
              <label htmlFor="acepta_terminos" style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, cursor: 'pointer' }}>
                Declaro que los datos entregados son verídicos y autorizo su uso para el procesamiento de esta solicitud conforme a la Ley 21.719.
              </label>
            </div>
            {errors.acepta_terminos && <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '-16px' }}>Debes aceptar para continuar.</p>}

            <button type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px 24px', background: color, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
              <Eye size={16} /> Revisar solicitud
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default FormularioSolicitud;