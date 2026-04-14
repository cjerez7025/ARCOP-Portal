// ============================================================
// src/components/OnboardingTour.jsx — v4.1
// Fix: todas las tarjetas flotan correctamente
// ============================================================
import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Lock, FileSearch, Send, CheckCircle } from 'lucide-react';

const TOUR_KEY = 'arcop_tour_completado';

const POSICIONES = [
  { bottom: '40px', left: '50%',  right: 'auto', top: 'auto', xform: 'translateX(-50%)' },
  { bottom: '40px', right: '24px', left: 'auto', top: 'auto', xform: 'none' },
  { top: '40%',    left: '24px',  right: 'auto', bottom: 'auto', xform: 'none' },
  { bottom: '40px', left: '50%',  right: 'auto', top: 'auto', xform: 'translateX(-50%)' },
];

const PASOS = [
  {
    icon: <Lock size={26} color="#60A5FA" strokeWidth={1.5} />,
    color: '#2563EB',
    label: 'Bienvenida',
    title: 'Portal ARCOP · Ley 21.719',
    desc: 'Este portal te permite ejercer tus derechos de protección de datos personales conforme a la Ley 21.719 de Chile. Te guiaremos en 3 pasos.',
  },
  {
    icon: <FileSearch size={26} color="#10B981" strokeWidth={1.5} />,
    color: '#10B981',
    label: 'Paso 1',
    title: 'Elige tu derecho',
    desc: 'Selecciona el derecho que deseas ejercer: Acceso, Rectificación, Cancelación, Oposición o Portabilidad. Cada tarjeta tiene su propio formulario.',
    target: '.arcop-derechos-grid',
  },
  {
    icon: <Send size={26} color="#F59E0B" strokeWidth={1.5} />,
    color: '#F59E0B',
    label: 'Paso 2',
    title: 'Completa y envía',
    desc: 'Llena el formulario con tus datos y envía tu solicitud. Recibirás un email para confirmar tu identidad y activar el proceso.',
  },
  {
    icon: <CheckCircle size={26} color="#8B5CF6" strokeWidth={1.5} />,
    color: '#8B5CF6',
    label: 'Paso 3',
    title: 'Seguimiento',
    desc: 'Usa el número de caso que recibirás por email para hacer seguimiento. El plazo legal de respuesta es de 15 días hábiles.',
  },
];

const KEYFRAMES = `
  @keyframes arcop-float {
    0%, 100% { margin-bottom: 0px; }
    50%       { margin-bottom: 10px; }
  }
  @keyframes arcop-slide-in {
    from { opacity: 0; margin-bottom: -20px; transform: scale(0.95); }
    to   { opacity: 1; margin-bottom: 0px;  transform: scale(1); }
  }
  @keyframes arcop-pulse-ring {
    0%   { transform: scale(1);   opacity: 0.5; }
    100% { transform: scale(2.2); opacity: 0; }
  }
`;

const OnboardingTour = () => {
  const [visible,  setVisible]  = useState(false);
  const [paso,     setPaso]     = useState(0);
  const [saliendo, setSaliendo] = useState(false);
  const [fase,     setFase]     = useState('slide'); // 'slide' | 'float'

  // Hacer visible tras delay
  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) {
      const t = setTimeout(() => setVisible(true), 700);
      return () => clearTimeout(t);
    }
  }, []);

  // Cuando se hace visible o cambia el paso, iniciar slide-in → float
  useEffect(() => {
    if (!visible) return;
    setFase('slide');
    const t = setTimeout(() => setFase('float'), 420);
    return () => clearTimeout(t);
  }, [visible, paso]);

  // Scroll al target del paso actual
  useEffect(() => {
    const target = PASOS[paso]?.target;
    if (target) {
      const el = document.querySelector(target);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [paso]);

  const cerrar = () => {
    setSaliendo(true);
    setTimeout(() => {
      localStorage.setItem(TOUR_KEY, '1');
      setVisible(false);
    }, 280);
  };

  const irAPaso = (nuevo) => {
    setSaliendo(true);
    setTimeout(() => {
      setSaliendo(false);
      setPaso(nuevo);
    }, 220);
  };

  const siguiente = () => paso < PASOS.length - 1 ? irAPaso(paso + 1) : cerrar();
  const anterior  = () => paso > 0 && irAPaso(paso - 1);

  if (!visible) return null;

  const p   = PASOS[paso];
  const pos = POSICIONES[paso];
  const esUltimo = paso === PASOS.length - 1;

  return (
    <>
      <style>{KEYFRAMES}</style>

      {/* Indicador pulsante sobre el target */}
      {PASOS[paso]?.target && (() => {
        const el = document.querySelector(PASOS[paso].target);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return (
          <div style={{
            position: 'fixed',
            top:  rect.top - 14,
            left: rect.left + rect.width / 2 - 12,
            width: '24px', height: '24px',
            zIndex: 9998, pointerEvents: 'none',
          }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: p.color, opacity: 0.7,
              animation: 'arcop-pulse-ring 1.1s ease-out infinite',
            }} />
          </div>
        );
      })()}

      {/* Card flotante */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position:  'fixed',
          bottom:    pos.bottom,
          top:       pos.top,
          left:      pos.left,
          right:     pos.right,
          transform: pos.xform,
          zIndex:    9999,
          width:     '100%',
          maxWidth:  '380px',
          padding:   '0 16px',
          opacity:   saliendo ? 0 : 1,
          transition: 'opacity 0.22s ease, bottom 0.5s cubic-bezier(.22,.68,0,1.1), top 0.5s cubic-bezier(.22,.68,0,1.1), left 0.5s cubic-bezier(.22,.68,0,1.1), right 0.5s cubic-bezier(.22,.68,0,1.1)',
          animation: fase === 'slide'
            ? 'arcop-slide-in 0.38s cubic-bezier(.22,.68,0,1.2) forwards'
            : 'arcop-float 2.8s ease-in-out infinite',
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg, rgba(8,15,30,0.97) 0%, rgba(18,28,50,0.97) 100%)',
          borderRadius: '20px',
          border: `1px solid ${p.color}45`,
          boxShadow: `0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px ${p.color}12, inset 0 1px 0 rgba(255,255,255,0.07), 0 0 40px ${p.color}12`,
          padding: '22px',
          position: 'relative',
          overflow: 'hidden',
        }}>

          {/* Glows decorativos */}
          <div style={{ position:'absolute', right:'-40px', top:'-40px', width:'160px', height:'160px', borderRadius:'50%', background:`radial-gradient(circle, ${p.color}20 0%, transparent 65%)`, pointerEvents:'none' }} />
          <div style={{ position:'absolute', left:'-20px', bottom:'-20px', width:'100px', height:'100px', borderRadius:'50%', background:`radial-gradient(circle, ${p.color}10 0%, transparent 70%)`, pointerEvents:'none' }} />

          {/* Progress bar clickeable */}
          <div style={{ display:'flex', gap:'4px', marginBottom:'16px' }}>
            {PASOS.map((_, i) => (
              <div key={i} onClick={() => irAPaso(i)} style={{
                flex:1, height:'3px', borderRadius:'2px', cursor:'pointer',
                background: i <= paso ? (i === paso ? p.color : p.color+'70') : 'rgba(255,255,255,0.08)',
                transition: 'background 0.4s',
                boxShadow: i === paso ? `0 0 8px ${p.color}60` : 'none',
              }} />
            ))}
          </div>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'12px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{
                width:'42px', height:'42px', borderRadius:'12px', flexShrink:0,
                background:`${p.color}15`, border:`1px solid ${p.color}30`,
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:`0 4px 12px ${p.color}20`,
              }}>
                {p.icon}
              </div>
              <div>
                <div style={{ fontSize:'10px', fontWeight:700, color:p.color, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'2px' }}>
                  {p.label}
                </div>
                <h3 style={{ margin:0, fontSize:'15px', fontWeight:700, color:'#F0F0F5', lineHeight:1.2 }}>
                  {p.title}
                </h3>
              </div>
            </div>
            <button onClick={cerrar} style={{
              background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:'8px', width:'28px', height:'28px', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#475569', flexShrink:0,
            }}>
              <X size={12} />
            </button>
          </div>

          {/* Descripción */}
          <p style={{ fontSize:'13px', color:'#8B9AB5', lineHeight:1.65, margin:'0 0 18px', paddingLeft:'54px' }}>
            {p.desc}
          </p>

          {/* Botones */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <button onClick={cerrar} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'11px', color:'#3D4F6B', padding:'4px 0' }}>
              Omitir
            </button>
            <div style={{ display:'flex', gap:'6px' }}>
              {paso > 0 && (
                <button onClick={anterior} style={{
                  display:'flex', alignItems:'center', gap:'4px',
                  background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)',
                  borderRadius:'10px', padding:'7px 12px', cursor:'pointer',
                  fontSize:'12px', fontWeight:600, color:'#64748B',
                }}>
                  <ArrowLeft size={12} /> Anterior
                </button>
              )}
              <button onClick={siguiente} style={{
                display:'flex', alignItems:'center', gap:'5px',
                background:`linear-gradient(135deg, ${p.color} 0%, ${p.color}CC 100%)`,
                border:'none', borderRadius:'10px', padding:'7px 16px', cursor:'pointer',
                fontSize:'12px', fontWeight:700, color:'#fff',
                boxShadow:`0 4px 16px ${p.color}45`,
              }}>
                {esUltimo ? '¡Entendido!' : <>Siguiente <ArrowRight size={12} /></>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingTour;