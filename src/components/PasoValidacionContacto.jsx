// ============================================================
// PasoValidacionContacto.jsx — flujo VAL
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { Mail, MessageCircle, AlertTriangle, Loader, ShieldCheck, CheckCircle2, Pencil } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const CANAL_META = {
  email:    { Icon: Mail,          label: 'Correo electrónico', key: 'email_anon' },
  whatsapp: { Icon: MessageCircle, label: 'WhatsApp',           key: 'telefono_anon' },
};

const PasoValidacionContacto = ({ rut, onConfirmar, onDerivado, color }) => {
  const [loading,      setLoading]      = useState(true);
  const [contacto,     setContacto]     = useState(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [canal,        setCanal]        = useState('email');
  const [confirmado,   setConfirmado]   = useState(false);

  const onDerivadoRef = useRef(onDerivado);
  useEffect(() => { onDerivadoRef.current = onDerivado; }, [onDerivado]);

  useEffect(() => {
    if (!rut) return;
    let cancelled = false;
    setLoading(true);
    setContacto(null);
    setNoEncontrado(false);
    setConfirmado(false);

    fetch(`${API_URL}/api/validacion/contacto-por-rut?rut=${encodeURIComponent(rut)}`)
      .then(res => {
        if (!res.ok) throw new Error('not_found');
        return res.json();
      })
      .then(body => {
        if (cancelled) return;
        const datos = body.data || body;
        if (datos && (datos.email_anon || datos.telefono_anon)) {
          setContacto(datos);
          // Pre-seleccionar el primer canal disponible
          setCanal(datos.email_anon ? 'email' : 'whatsapp');
        } else {
          setNoEncontrado(true);
          onDerivadoRef.current();
        }
      })
      .catch(() => {
        if (cancelled) return;
        setNoEncontrado(true);
        onDerivadoRef.current();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [rut]);

  const accent = color || '#60A5FA';

  const handleConfirmar = () => {
    setConfirmado(true);
    onConfirmar({ canal, email_anon: contacto?.email_anon, telefono_anon: contacto?.telefono_anon });
  };

  const handleCambiar = () => {
    setConfirmado(false);
    onConfirmar(null); // resetea en el padre
  };

  // ── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', marginTop: '16px' }}>
        <Loader size={15} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Verificando datos de contacto…</span>
      </div>
    );
  }

  // ── No encontrado ────────────────────────────────────────
  if (noEncontrado) {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', background: 'rgba(245,158,11,0.08)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)', marginTop: '16px' }}>
        <AlertTriangle size={15} color="#F59E0B" style={{ flexShrink: 0, marginTop: '1px' }} />
        <div>
          <p style={{ margin: 0, fontSize: '13px', color: '#F0C060', fontWeight: 600, marginBottom: '3px' }}>
            No se encontraron datos de contacto
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Tu solicitud será procesada con derivación asistida. Un agente se contactará contigo para verificar tu identidad.
          </p>
        </div>
      </div>
    );
  }

  const tieneEmail    = Boolean(contacto?.email_anon);
  const tieneTelefono = Boolean(contacto?.telefono_anon);
  const meta          = CANAL_META[canal];
  const valorCanal    = canal === 'email' ? contacto?.email_anon : contacto?.telefono_anon;

  // ── Confirmado: estado compacto ──────────────────────────
  if (confirmado) {
    return (
      <div className="animate-fade-up" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(16,185,129,0.08)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)' }}>
        <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#10B981', fontWeight: 600 }}>
            Canal confirmado · {meta.label}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
            Recibirás el link de verificación en <strong style={{ color: 'var(--text-secondary)' }}>{valorCanal}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={handleCambiar}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}
        >
          <Pencil size={11} /> Cambiar
        </button>
      </div>
    );
  }

  // ── Selección de canal ───────────────────────────────────
  return (
    <div className="animate-fade-up" style={{ marginTop: '16px', background: 'var(--bg-surface)', borderRadius: '14px', border: `1px solid ${accent}25`, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px', background: accent + '0A' }}>
        <ShieldCheck size={14} color={accent} />
        <span style={{ fontSize: '11px', fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Verificación de contacto
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Encontramos datos asociados a tu RUT. Elige por dónde recibirás el link de verificación.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {tieneEmail && (
            <CanalOption
              activo={canal === 'email'}
              onClick={() => setCanal('email')}
              Icon={Mail}
              label="Correo electrónico"
              valor={contacto.email_anon}
              accent={accent}
            />
          )}
          {tieneTelefono && (
            <CanalOption
              activo={canal === 'whatsapp'}
              onClick={() => setCanal('whatsapp')}
              Icon={MessageCircle}
              label="WhatsApp"
              valor={contacto.telefono_anon}
              accent={accent}
            />
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleConfirmar}
            style={{ flex: 2, padding: '10px 16px', background: accent, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Confirmar canal
          </button>
          <button
            type="button"
            onClick={onDerivado}
            style={{ flex: 1, padding: '10px 16px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            No reconozco estos datos
          </button>
        </div>
      </div>
    </div>
  );
};

const CanalOption = ({ activo, onClick, Icon, label, valor, accent }) => (
  <button
    type="button"
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: activo ? accent + '15' : 'rgba(255,255,255,0.03)', border: `1px solid ${activo ? accent + '40' : 'rgba(255,255,255,0.08)'}`, borderRadius: '10px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', width: '100%' }}
  >
    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: activo ? accent + '20' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
      <Icon size={16} color={activo ? accent : 'var(--text-muted)'} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '14px', color: activo ? '#E8E8F0' : 'var(--text-secondary)', fontWeight: 600, marginTop: '2px', letterSpacing: '0.01em' }}>{valor}</p>
    </div>
    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${activo ? accent : 'rgba(255,255,255,0.2)'}`, background: activo ? accent : 'transparent', flexShrink: 0, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {activo && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fff' }} />}
    </div>
  </button>
);

export default PasoValidacionContacto;
