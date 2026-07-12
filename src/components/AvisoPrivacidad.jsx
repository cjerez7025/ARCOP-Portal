// ============================================================
// AvisoPrivacidad.jsx — MMPA-93
// Muestra datos del responsable del tratamiento (DPO) y el
// texto base de privacidad conforme a la Ley 21.719.
// ============================================================

import React, { useState, useEffect } from 'react';
import { X, Shield } from 'lucide-react';

const AvisoPrivacidad = ({ onCerrar }) => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    fetch(`${API_URL}/api/config`)
      .then(r => r.ok ? r.json() : null)
      .then(body => { if (body?.data) setConfig(body.data); })
      .catch(() => {});
  }, []);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onCerrar}
    >
      <div
        style={{
          background: 'var(--bg-elevated, #1A1A2E)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '28px',
          maxWidth: '480px',
          width: '100%',
          color: '#F0F0F5',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={20} color="#60A5FA" />
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
              Aviso de privacidad
            </h2>
          </div>
          <button onClick={onCerrar}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              color: '#6B6B85', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: '#9090A8', lineHeight: 1.6,
          marginBottom: '20px' }}>
          Sus datos personales son tratados conforme a la{' '}
          <strong style={{ color: '#F0F0F5' }}>Ley 21.719</strong> de Chile
          sobre protección de datos personales. Tiene derecho a acceder,
          rectificar, cancelar y oponerse al tratamiento de sus datos (derechos
          ARCOP).
        </p>

        <div style={{ background: 'rgba(255,255,255,0.04)',
          borderRadius: '10px', padding: '16px',
          border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#60A5FA',
            textTransform: 'uppercase', letterSpacing: '0.07em',
            marginBottom: '12px' }}>
            Responsable del tratamiento
          </p>
          {config ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { label: 'Empresa',  val: config.empresa_nombre },
                { label: 'RUT',      val: config.empresa_rut },
                { label: 'DPO',      val: config.dpo_nombre },
                { label: 'Email',    val: config.dpo_email },
                { label: 'Teléfono', val: config.dpo_telefono },
              ].filter(r => r.val).map(({ label, val }) => (
                <div key={label} style={{ display: 'flex', gap: '8px',
                  fontSize: '12px' }}>
                  <span style={{ color: '#5A5A72', minWidth: '64px' }}>
                    {label}
                  </span>
                  <span style={{ color: '#C0C0D8' }}>{val}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: '#5A5A72' }}>
              Cargando información...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvisoPrivacidad;
