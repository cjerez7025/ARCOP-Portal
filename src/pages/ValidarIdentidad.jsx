// ============================================================
// src/pages/ValidarIdentidad.jsx
// FIX: adapter retorna { status, data: { numero_solicitud, ... } }
//      el código anterior buscaba resultado.success y resultado.solicitud
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import adapter from '../adapters';

const ValidarIdentidad = () => {
  const { token }   = useParams();
  const navigate    = useNavigate();
  const [estado,    setEstado]    = useState('validando');
  const [mensaje,   setMensaje]   = useState('');
  const [solicitud, setSolicitud] = useState(null);

  useEffect(() => {
    if (token) procesarValidacion();
  }, [token]);

  const procesarValidacion = async () => {
    setEstado('validando');
    try {
      // adapter.validarIdentidad retorna { status, data: { numero_solicitud, email, nuevo_estado } }
      const resultado = await adapter.validarIdentidad(token);

      if (resultado.status === 'success') {
        setSolicitud(resultado.data || {});
        setEstado('exitoso');
        setMensaje('Tu identidad ha sido confirmada exitosamente');
      } else {
        setEstado('error');
        setMensaje(resultado.message || 'No se pudo validar tu identidad');
      }
    } catch (error) {
      setEstado('error');
      setMensaje('Error al procesar la validación');
      console.error(error);
    }
  };

  return (
    <div className="arcop-portal-publico" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ maxWidth: '560px', width: '100%' }}>

        {/* Validando */}
        {estado === 'validando' && (
          <div style={{ background: 'var(--bg-surface)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', padding: '48px', textAlign: 'center' }}>
            <Loader size={48} color="#6366F1" style={{ margin: '0 auto 16px', display: 'block', animation: 'spin 1s linear infinite' }} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: '#F0F0F5', marginBottom: '8px' }}>
              Validando tu identidad...
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Por favor espera un momento</p>
          </div>
        )}

        {/* Éxito */}
        {estado === 'exitoso' && (
          <div style={{ background: 'var(--bg-surface)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', padding: '40px' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={30} color="#10B981" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: '#F0F0F5', marginBottom: '8px' }}>
                Identidad Confirmada
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{mensaje}</p>
            </div>

            {/* Datos de la solicitud */}
            <div style={{ background: 'var(--bg-overlay)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', padding: '20px', marginBottom: '20px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Información de tu solicitud
              </p>
              {[
                { label: 'Número',  value: solicitud?.numero_solicitud || '—', mono: true },
                { label: 'Estado',  value: 'Identidad Validada', color: '#10B981' },
                { label: 'Plazo máximo', value: solicitud?.fecha_limite
                    ? new Date(solicitud.fecha_limite).toLocaleDateString('es-CL')
                    : '15 días hábiles' },
              ].map(({ label, value, mono, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: color || '#F0F0F5', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Próximos pasos */}
            <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '10px', padding: '14px', marginBottom: '24px' }}>
              <p style={{ fontSize: '13px', color: '#A5B4FC', margin: 0, lineHeight: 1.6 }}>
                <strong>Próximos pasos:</strong><br />
                Procesaremos tu solicitud y te enviaremos un email con tus datos personales en un plazo máximo de <strong>15 días hábiles</strong>.
              </p>
            </div>

            <button onClick={() => navigate('/')}
              style={{ width: '100%', padding: '14px', background: '#6366F1', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>
              Volver al inicio
            </button>
          </div>
        )}

        {/* Error */}
        {estado === 'error' && (
          <div style={{ background: 'var(--bg-surface)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', padding: '40px' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <XCircle size={30} color="#EF4444" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: '#F0F0F5', marginBottom: '8px' }}>
                Error al Validar
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{mensaje}</p>
            </div>

            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '14px', marginBottom: '24px' }}>
              <p style={{ fontSize: '13px', color: '#FCA5A5', margin: 0 }}>
                Si el problema persiste, contacta a nuestro DPO para asistencia.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={procesarValidacion}
                style={{ flex: 1, padding: '14px', background: '#6366F1', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                Reintentar
              </button>
              <button onClick={() => navigate('/')}
                style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#C8C8D8', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                Volver al inicio
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ValidarIdentidad;