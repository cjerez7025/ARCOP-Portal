// ============================================================
// src/pages/LoginDPO.jsx — v2 con AlignDataSeal animado
// ============================================================
import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AlignDataSeal from '../components/AlignDataSeal';

const ERRORES_FIREBASE = {
  'auth/invalid-credential':     'Email o contraseña incorrectos.',
  'auth/user-not-found':         'No existe una cuenta con ese email.',
  'auth/wrong-password':         'Contraseña incorrecta.',
  'auth/too-many-requests':      'Demasiados intentos. Espera unos minutos.',
  'auth/user-disabled':          'Esta cuenta está deshabilitada.',
  'auth/network-request-failed': 'Sin conexión. Verifica tu internet.',
};

export default function LoginDPO() {
  const { user, login } = useAuth();
  const navigate        = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  if (user) return <Navigate to="/dpo" replace />;

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Completa email y contraseña.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dpo', { replace: true });
    } catch (e) {
      setError(ERRORES_FIREBASE[e.code] || 'Error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div style={{
      minHeight:      '100vh',
      background:     'linear-gradient(135deg, #020B16 0%, #0C1F40 50%, #020B16 100%)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '2rem 1rem',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <AlignDataSeal size={120} animated />
          <h1 style={{ marginTop: '1rem', fontSize: '1.5rem', fontWeight: 700, color: '#F0F0F5', letterSpacing: '-0.02em', fontFamily: 'system-ui, sans-serif' }}>
            Portal ARCOP
          </h1>
          <p style={{ color: '#60A5FA', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Acceso exclusivo para el equipo DPO
          </p>
          <p style={{ color: '#334155', fontSize: '0.75rem', marginTop: '0.2rem' }}>
            Ley 21.719 — Chile
          </p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: '1rem', boxShadow: '0 25px 50px rgba(0,0,0,0.4)', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', marginBottom: '1.5rem' }}>
            Iniciar sesión
          </h2>

          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem' }}>
              <AlertCircle style={{ width: 16, height: 16, color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: '0.875rem', color: '#B91C1C', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9CA3AF' }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="dpo@empresa.cl" disabled={loading} autoComplete="email"
                style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.625rem', paddingBottom: '0.625rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none' }}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9CA3AF' }} />
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="••••••••" disabled={loading} autoComplete="current-password"
                style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '2.5rem', paddingRight: '2.5rem', paddingTop: '0.625rem', paddingBottom: '0.625rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none' }}
              />
              <button onClick={() => setShowPass(v => !v)} tabIndex={-1}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}>
                {showPass ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
              </button>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading}
            style={{ width: '100%', padding: '0.675rem', background: loading ? '#93C5FD' : '#2563EB', color: '#fff', fontWeight: 600, fontSize: '0.875rem', border: 'none', borderRadius: '0.5rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Iniciando sesión...' : 'Ingresar al Panel DPO'}
          </button>
        </div>

        <p style={{ textAlign: 'center', color: '#334155', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          ¿Problemas para acceder? Contacta al administrador del sistema.
        </p>
      </div>
    </div>
  );
}