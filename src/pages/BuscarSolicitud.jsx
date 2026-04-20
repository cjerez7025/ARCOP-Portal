// ============================================================
// src/pages/BuscarSolicitud.jsx
// Página pública para buscar seguimiento por número de solicitud
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertCircle, Loader, FileSearch } from 'lucide-react';

const BuscarSolicitud = () => {
  const [numero,   setNumero]   = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  const handleBuscar = async () => {
    const limpio = numero.trim().toUpperCase();
    if (!limpio) { setError('Ingresa el número de solicitud.'); return; }
    if (!limpio.startsWith('ARC-')) { setError('El número debe comenzar con ARC- (ej: ARC-2026-00001).'); return; }

    setError('');
    setLoading(true);
    // Pequeña pausa visual antes de navegar
    setTimeout(() => {
      setLoading(false);
      navigate(`/seguimiento/${limpio}`);
    }, 400);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleBuscar(); };

  return (
    <div className="arcop-portal-publico" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', minHeight: '60vh' }}>
      <div className="animate-fade-up" style={{ width: '100%', maxWidth: '440px' }}>

        {/* Icono */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileSearch size={28} color="#60A5FA" />
          </div>
        </div>

        {/* Título */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: '#F0F0F5', marginBottom: '8px' }}>
            Buscar mi solicitud
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
            Ingresa el número de solicitud que recibiste por email para consultar su estado.
          </p>
        </div>

        {/* Formulario */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Número de solicitud
            </label>
            <input
              type="text"
              value={numero}
              onChange={e => { setNumero(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              placeholder="ARC-2026-00001"
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${error ? '#EF4444' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: '12px',
                fontSize: '16px', fontFamily: 'monospace',
                color: '#F0F0F5',
                outline: 'none',
                letterSpacing: '0.05em',
              }}
            />
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                <AlertCircle size={13} color="#EF4444" />
                <p style={{ fontSize: '12px', color: '#EF4444', margin: 0 }}>{error}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleBuscar}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '13px 24px',
              background: loading ? 'rgba(37,99,235,0.5)' : '#2563EB',
              color: '#fff', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}>
            {loading
              ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Buscando...</>
              : <><Search size={16} /> Ver estado de mi solicitud</>
            }
          </button>
        </div>

        {/* Ayuda */}
        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px', lineHeight: 1.5 }}>
          El número de solicitud fue enviado a tu email al momento de registrar tu solicitud. Tiene el formato <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>ARC-YYYY-NNNNN</span>.
        </p>

      </div>
    </div>
  );
};

export default BuscarSolicitud;