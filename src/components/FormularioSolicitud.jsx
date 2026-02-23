// ============================================================
// FORMULARIO SOLICITUD v3 — Fintech Dark
// DM Serif Display + DM Sans | Dark surfaces | SVG icons inline
// Sin dependencias extras. CSS variables + Tailwind.
// ============================================================

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Send, CheckCircle, Loader, AlertCircle, ChevronLeft, ArrowRight, Lock } from 'lucide-react';
import { toast } from 'react-toastify';
import useFormularioConfig from '../hooks/useFormularioConfig';
import CampoRenderer from './CampoRenderer';
import adapter from '../adapters';

// ── Helpers ────────────────────────────────────────────────
const generarId     = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const generarNumero = () => `SOL-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
const generarToken  = () => Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
const calcularFechaLimite = () => {
  const f = new Date(); let d = 0;
  while (d < 15) { f.setDate(f.getDate() + 1); if (f.getDay() !== 0 && f.getDay() !== 6) d++; }
  return f.toISOString();
};

// ── SVG Icons custom por derecho ──────────────────────────
// Completamente independientes de lucide versión
const IconAcceso = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.35-4.35"/>
    <path d="M11 8v6M8 11h6"/>
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
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const IconOposicion = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
  </svg>
);

const IconPortabilidad = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
    <path d="M3 6h18"/>
  </svg>
);

// ── Config visual por derecho ─────────────────────────────
const DERECHOS_CONFIG = {
  ACCESO: {
    Icon:      IconAcceso,
    color:     '#3B82F6',
    colorDim:  'rgba(59,130,246,0.12)',
    glow:      'rgba(59,130,246,0.25)',
    gradient:  'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.03) 100%)',
    artNum:    '5°',
  },
  RECTIFICACION: {
    Icon:      IconRectificacion,
    color:     '#F59E0B',
    colorDim:  'rgba(245,158,11,0.12)',
    glow:      'rgba(245,158,11,0.25)',
    gradient:  'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.03) 100%)',
    artNum:    '6°',
  },
  CANCELACION: {
    Icon:      IconCancelacion,
    color:     '#EF4444',
    colorDim:  'rgba(239,68,68,0.12)',
    glow:      'rgba(239,68,68,0.25)',
    gradient:  'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.03) 100%)',
    artNum:    '7°',
  },
  OPOSICION: {
    Icon:      IconOposicion,
    color:     '#8B5CF6',
    colorDim:  'rgba(139,92,246,0.12)',
    glow:      'rgba(139,92,246,0.25)',
    gradient:  'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.03) 100%)',
    artNum:    '8°',
  },
  PORTABILIDAD: {
    Icon:      IconPortabilidad,
    color:     '#10B981',
    colorDim:  'rgba(16,185,129,0.12)',
    glow:      'rgba(16,185,129,0.25)',
    gradient:  'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.03) 100%)',
    artNum:    '9°',
  },
};

// ── Componente Card de derecho ─────────────────────────────
const DerechoCard = ({ keyDerecho, meta, onSeleccionar, index }) => {
  const [hovered, setHovered] = useState(false);
  const cfg = DERECHOS_CONFIG[keyDerecho];
  if (!cfg) return null;
  const { Icon, color, colorDim, glow, gradient, artNum } = cfg;

  return (
    <button
      onClick={() => onSeleccionar(keyDerecho, meta)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`animate-fade-up stagger-${index + 1}`}
      style={{
        display:       'block',
        width:         '100%',
        textAlign:     'left',
        background:    hovered ? gradient : 'rgba(22,22,31,0.8)',
        border:        `1px solid ${hovered ? color + '40' : 'rgba(255,255,255,0.08)'}`,
        borderRadius:  '16px',
        padding:       '24px',
        cursor:        'pointer',
        transition:    'all 0.2s cubic-bezier(.22,.68,0,1.1)',
        transform:     hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow:     hovered ? `0 8px 32px ${glow}, 0 0 0 1px ${color}20` : '0 1px 3px rgba(0,0,0,0.4)',
        position:      'relative',
        overflow:      'hidden',
      }}
    >
      {/* Número artículo como watermark de fondo */}
      <span style={{
        position:   'absolute',
        right:      '-8px',
        bottom:     '-20px',
        fontSize:   '120px',
        fontFamily: 'var(--font-display)',
        fontWeight: 400,
        color:      hovered ? color + '14' : 'rgba(255,255,255,0.04)',
        lineHeight: 1,
        pointerEvents: 'none',
        userSelect: 'none',
        transition: 'color 0.3s',
      }}>
        {artNum}
      </span>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative' }}>
        {/* Chip icono */}
        <div style={{
          flexShrink: 0,
          width:   '44px',
          height:  '44px',
          borderRadius: '12px',
          background: hovered ? color + '22' : colorDim,
          border:  `1px solid ${hovered ? color + '50' : color + '25'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
        }}>
          <Icon size={20} color={hovered ? color : color + 'BB'} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header con badge Art */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <h3 style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              color: hovered ? '#F0F0F5' : '#C8C8D8',
              transition: 'color 0.2s',
            }}>
              Derecho de {meta.nombre}
            </h3>
            <span style={{
              fontSize:     '10px',
              fontWeight:   700,
              letterSpacing:'0.08em',
              textTransform:'uppercase',
              color:        hovered ? color : color + '80',
              transition:   'color 0.2s',
            }}>
              Art. {artNum}
            </span>
          </div>

          <p style={{
            margin:     0,
            fontSize:   '13px',
            color:      hovered ? '#9090A8' : '#5A5A72',
            lineHeight: 1.5,
            transition: 'color 0.2s',
          }}>
            {meta.descripcion}
          </p>
        </div>

        {/* Arrow */}
        <div style={{
          flexShrink: 0,
          opacity:    hovered ? 1 : 0,
          transform:  hovered ? 'translateX(0)' : 'translateX(-4px)',
          transition: 'all 0.2s',
          color,
        }}>
          <ArrowRight size={16} />
        </div>
      </div>
    </button>
  );
};

// ── Componente principal ───────────────────────────────────
const FormularioSolicitud = () => {
  const { config, loading: loadingConfig, getCamposParaFormulario } = useFormularioConfig();

  const [loading,          setLoading]          = useState(false);
  const [success,          setSuccess]          = useState(false);
  const [solicitudCreada,  setSolicitudCreada]  = useState(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: { alcance_acceso: 'TODOS', formato_preferido: 'PDF', categorias: [], acepta_terminos: false },
  });

  const handleSeleccionar = (key, meta) => {
    setTipoSeleccionado({ key, meta });
    reset({ alcance_acceso: 'TODOS', formato_preferido: 'PDF', categorias: [], acepta_terminos: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const token  = generarToken();
      const numero = generarNumero();
      const solicitud = {
        id:               generarId(),
        numero_solicitud: numero,
        fecha_solicitud:  new Date().toISOString(),
        tipo:             tipoSeleccionado.key,
        estado:           'PENDIENTE',
        token_validacion: token,
        token_expiracion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_limite:     calcularFechaLimite(),
        dias_restantes:   15,
        frontend_url:     process.env.REACT_APP_FRONTEND_URL || window.location.origin,
        ip_origen:        window.location.hostname,
        user_agent:       navigator.userAgent,
        creado_en:        new Date().toISOString(),
        ...data,
        email:      data.email?.toLowerCase(),
        categorias: JSON.stringify(data.categorias || []),
      };

      const result = await adapter.createSolicitud(solicitud);
      if (result.status === 'error') throw new Error(result.message);

      setSolicitudCreada({ numero_solicitud: numero });
      setSuccess(true);
      toast.success('Solicitud enviada');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error(err.message || 'Error al enviar solicitud');
    } finally {
      setLoading(false);
    }
  };

  // ── Pantalla éxito ──────────────────────────────────────
  if (success && solicitudCreada) {
    const meta = tipoSeleccionado?.meta;
    const cfg  = DERECHOS_CONFIG[tipoSeleccionado?.key];
    return (
      <div style={{
        minHeight:      '100vh',
        background:     '#0E0E17',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '2rem 1rem',
      }}>
        <div className="animate-fade-up" style={{
          width:        '100%',
          maxWidth:     '440px',
          background:   '#141420',
          borderRadius: '20px',
          border:       '1px solid rgba(255,255,255,0.08)',
          padding:      '40px',
          textAlign:    'center',
        }}>
          {/* Check circle */}
          <div style={{
            width:          '56px',
            height:         '56px',
            borderRadius:   '50%',
            background:     'rgba(16,185,129,0.15)',
            border:         '1px solid rgba(16,185,129,0.3)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            margin:         '0 auto 20px',
          }}>
            <CheckCircle size={26} color="#10B981" strokeWidth={2} />
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: '#F0F0F5', marginBottom: '8px' }}>
            Solicitud registrada
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>
            Su solicitud de <strong style={{ color: cfg?.color }}>{meta?.nombre}</strong> fue recibida correctamente.
          </p>

          {/* Info row */}
          <div style={{
            background:   'rgba(30,30,48,0.8)',
            borderRadius: '12px',
            border:       '1px solid rgba(255,255,255,0.07)',
            padding:      '20px',
            marginBottom: '20px',
            textAlign:    'left',
          }}>
            {[
              { label: 'Número', value: solicitudCreada.numero_solicitud, mono: true },
              { label: 'Derecho', value: `${meta?.articulo} — ${meta?.nombre}` },
              { label: 'Estado', value: 'Pendiente de validación', highlight: '#F59E0B' },
            ].map(({ label, value, mono, highlight }) => (
              <div key={label} style={{
                display:       'flex',
                justifyContent:'space-between',
                alignItems:    'center',
                padding:       '8px 0',
                borderBottom:  '1px solid rgba(255,255,255,0.05)',
              }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                <span style={{
                  fontSize:   '13px',
                  fontWeight: 600,
                  color:      highlight || '#F0F0F5',
                  fontFamily: mono ? 'monospace' : 'inherit',
                }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Alerta */}
          <div style={{
            display:      'flex',
            alignItems:   'flex-start',
            gap:          '10px',
            background:   'rgba(99,102,241,0.1)',
            border:       '1px solid rgba(99,102,241,0.25)',
            borderRadius: '10px',
            padding:      '14px',
            textAlign:    'left',
            marginBottom: '24px',
          }}>
            <AlertCircle size={15} color="#818CF8" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '13px', color: '#A5B4FC', margin: 0, lineHeight: 1.5 }}>
              Revise su email y confirme su identidad con el enlace enviado.
              Expira en <strong>30 minutos</strong>.
            </p>
          </div>

          <button
            onClick={() => { setSuccess(false); setSolicitudCreada(null); setTipoSeleccionado(null); }}
            style={{
              background: 'none',
              border:     'none',
              cursor:     'pointer',
              display:    'flex',
              alignItems: 'center',
              gap:        '6px',
              fontSize:   '13px',
              color:      'var(--text-secondary)',
              margin:     '0 auto',
            }}
          >
            <ChevronLeft size={14} />
            Enviar otra solicitud
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ─────────────────────────────────────────────
  if (loadingConfig) {
    return (
      <div style={{ minHeight: '100vh', background: '#0E0E17', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size={28} color="var(--text-muted)" className="animate-spin" />
      </div>
    );
  }

  // ── Pantalla selección de derecho ───────────────────────
  if (!tipoSeleccionado) {
    const derechos = config?.derechos || {};
    const entries  = Object.entries(derechos).filter(([, dc]) => dc.activo !== false);

    return (
      <div style={{
        minHeight:      '100vh',
        background:     '#0E0E17',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '3rem 1rem',
      }}>
        {/* Glow de fondo decorativo */}
        <div style={{
          position:     'fixed',
          top:          '20%',
          left:         '50%',
          transform:    'translateX(-50%)',
          width:        '600px',
          height:       '300px',
          background:   'radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)',
          pointerEvents:'none',
          zIndex:       0,
        }} />

        <div style={{ width: '100%', maxWidth: '640px', position: 'relative', zIndex: 1 }}>

          {/* Header */}
          <div className="animate-fade-up" style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            '6px',
              background:     'rgba(99,102,241,0.1)',
              border:         '1px solid rgba(99,102,241,0.2)',
              borderRadius:   '20px',
              padding:        '4px 14px',
              fontSize:       '11px',
              fontWeight:     600,
              letterSpacing:  '0.1em',
              textTransform:  'uppercase',
              color:          '#818CF8',
              marginBottom:   '20px',
            }}>
              <Lock size={10} />
              Portal ARCOP · Ley 21.719
            </div>

            <h1 style={{
              fontFamily:   'var(--font-display)',
              fontSize:     'clamp(32px, 5vw, 48px)',
              fontWeight:   400,
              color:        '#F0F0F5',
              lineHeight:   1.1,
              marginBottom: '12px',
              letterSpacing:'-0.02em',
            }}>
              Ejercer mis<br />
              <em style={{ color: '#818CF8', fontStyle: 'italic' }}>Derechos</em> ARCOP
            </h1>

            <p style={{
              fontSize:   '14px',
              color:      'var(--text-secondary)',
              maxWidth:   '380px',
              margin:     '0 auto',
              lineHeight: 1.6,
            }}>
              Seleccione el derecho que desea ejercer conforme a la Ley 21.719 de Protección de Datos Personales.
            </p>
          </div>

          {/* Grid de cards */}
          <div style={{
            display:             'grid',
            gridTemplateColumns: entries.length === 5 ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
            gap:                 '12px',
          }}>
            {entries.map(([key, ], i) => {
              const { DERECHOS_META } = require('../services/formularioService');
              const meta = DERECHOS_META[key];
              if (!meta) return null;
              // Card de portabilidad (5ta) ocupa todo el ancho
              const isLast = i === entries.length - 1 && entries.length % 2 !== 0;
              return (
                <div key={key} style={{ gridColumn: isLast ? '1 / -1' : 'auto' }}>
                  <DerechoCard
                    keyDerecho={key}
                    meta={meta}
                    onSeleccionar={handleSeleccionar}
                    index={i}
                  />
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="animate-fade-up stagger-5" style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '6px',
            marginTop:      '32px',
            fontSize:       '12px',
            color:          'var(--text-muted)',
          }}>
            <Lock size={11} />
            Datos protegidos conforme a la Ley 21.719 — Chile
          </div>

        </div>
      </div>
    );
  }

  // ── Formulario dinámico ────────────────────────────────
  const { meta }                   = tipoSeleccionado;
  const cfg                        = DERECHOS_CONFIG[tipoSeleccionado.key] || {};
  const { Icon, color, gradient }  = cfg;
  const { identidad, especificos } = getCamposParaFormulario(tipoSeleccionado.key);

  return (
    <div style={{ minHeight: '100vh', background: '#0E0E17', padding: '2rem 1rem 4rem' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        {/* Back */}
        <button
          onClick={() => setTipoSeleccionado(null)}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '6px',
            background: 'none',
            border:     'none',
            cursor:     'pointer',
            fontSize:   '13px',
            color:      'var(--text-secondary)',
            marginBottom:'24px',
            padding:    0,
          }}
        >
          <ChevronLeft size={15} />
          Cambiar tipo de solicitud
        </button>

        {/* Header del formulario */}
        <div className="animate-fade-up" style={{ marginBottom: '28px' }}>
          <div style={{
            display:     'inline-flex',
            alignItems:  'center',
            gap:         '8px',
            background:  color + '15',
            border:      `1px solid ${color}30`,
            borderRadius:'20px',
            padding:     '4px 12px 4px 8px',
            marginBottom:'14px',
          }}>
            {Icon && <Icon size={14} color={color} />}
            <span style={{ fontSize: '11px', fontWeight: 700, color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Derecho de {meta.nombre} · {meta.articulo}
            </span>
          </div>
          <h1 style={{
            fontFamily:   'var(--font-display)',
            fontSize:     '28px',
            fontWeight:   400,
            color:        '#F0F0F5',
            margin:       '0 0 6px',
            letterSpacing:'-0.01em',
          }}>
            Solicitud de {meta.nombre}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            {meta.descripcion}
          </p>
        </div>

        {/* Card formulario */}
        <div className="animate-fade-up" style={{
          background:   '#141420',
          borderRadius: '20px',
          border:       '1px solid rgba(255,255,255,0.08)',
          overflow:     'hidden',
        }}>
          {/* Línea de acento top */}
          <div style={{ height: '2px', background: `linear-gradient(90deg, ${color}, transparent)` }} />

          <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '28px' }}>

            {/* Datos personales */}
            <div style={{ marginBottom: '28px' }}>
              <p style={{
                fontSize:     '10px',
                fontWeight:   700,
                letterSpacing:'0.12em',
                textTransform:'uppercase',
                color:        'var(--text-muted)',
                marginBottom: '16px',
              }}>
                Datos personales
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {identidad.map(campo => (
                  <CampoRenderer dark={true}
                    key={campo.id}
                    campo={campo}
                    register={register}
                    watch={watch}
                    setValue={campo.tipo === 'rut' ? setValue : undefined}
                    errors={errors}
                  />
                ))}
              </div>
            </div>

            {/* Detalles del derecho */}
            {especificos.length > 0 && (
              <div style={{
                borderTop:    '1px solid rgba(255,255,255,0.06)',
                paddingTop:   '24px',
                marginBottom: '28px',
              }}>
                <p style={{
                  fontSize:     '10px',
                  fontWeight:   700,
                  letterSpacing:'0.12em',
                  textTransform:'uppercase',
                  color:        'var(--text-muted)',
                  marginBottom: '16px',
                }}>
                  Detalles de la solicitud
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {especificos.map(campo => (
                    <CampoRenderer dark={true}
                      key={campo.id}
                      campo={campo}
                      register={register}
                      watch={watch}
                      setValue={setValue}
                      errors={errors}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Términos */}
            <div style={{
              borderTop:  '1px solid rgba(255,255,255,0.06)',
              paddingTop: '24px',
              marginBottom:'24px',
            }}>
              <label style={{
                display:      'flex',
                alignItems:   'flex-start',
                gap:          '12px',
                background:   errors.acepta_terminos ? 'rgba(239,68,68,0.08)' : 'rgba(30,30,48,0.8)',
                border:       `1px solid ${errors.acepta_terminos ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '12px',
                padding:      '16px',
                cursor:       'pointer',
              }}>
                <input
                  {...register('acepta_terminos', { required: 'Debe aceptar para continuar' })}
                  type="checkbox"
                  style={{ width: '15px', height: '15px', marginTop: '2px', flexShrink: 0, accentColor: color }}
                />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Declaro que la información es verídica y acepto el tratamiento de mis datos
                  para gestionar esta solicitud conforme a la{' '}
                  <strong style={{ color: '#F0F0F5' }}>Ley 21.719</strong>.
                </span>
              </label>
              {errors.acepta_terminos && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                  <AlertCircle size={12} color="#EF4444" />
                  <span style={{ fontSize: '12px', color: '#EF4444' }}>{errors.acepta_terminos.message}</span>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width:          '100%',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '8px',
                padding:        '14px 24px',
                background:     loading ? 'rgba(255,255,255,0.05)' : color,
                border:         'none',
                borderRadius:   '12px',
                color:          '#fff',
                fontSize:       '14px',
                fontWeight:     600,
                fontFamily:     'var(--font-body)',
                cursor:         loading ? 'not-allowed' : 'pointer',
                opacity:        loading ? 0.6 : 1,
                transition:     'all 0.2s',
                boxShadow:      loading ? 'none' : `0 4px 20px ${color}40`,
              }}
            >
              {loading ? (
                <><Loader size={15} className="animate-spin" /> Enviando...</>
              ) : (
                <><Send size={15} /> Enviar Solicitud</>
              )}
            </button>

          </form>
        </div>

        {/* Footer */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            '6px',
          marginTop:      '20px',
          fontSize:       '11px',
          color:          'var(--text-muted)',
        }}>
          <Lock size={11} />
          Datos protegidos conforme a la Ley 21.719 — Chile
        </div>

      </div>
    </div>
  );
};

export default FormularioSolicitud;