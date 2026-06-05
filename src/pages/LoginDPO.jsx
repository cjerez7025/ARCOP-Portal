// ============================================================
// src/pages/LoginDPO.jsx — v3 con recuperación de contraseña
// ============================================================
import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
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

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [modoReset,   setModoReset]   = useState(false);
  const [resetOk,     setResetOk]     = useState(false);
  const [mounted,     setMounted]     = useState(false);

  React.useEffect(() => { setMounted(true); }, []);

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

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Ingresa tu email para recuperar la contraseña.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(getAuth(), email.trim());
      setResetOk(true);
    } catch (e) {
      setError(ERRORES_FIREBASE[e.code] || 'Error al enviar el correo. Verifica el email.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') modoReset ? handleReset() : handleSubmit(); };

  return (
    <div style={{
      background:     'linear-gradient(160deg, #0A2463 0%, #1D4ED8 50%, #0EA5E9 100%)',
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        24,
      position:       'relative',
      overflow:       'hidden',
    }}>
      {/* Dot pattern overlay */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '40px 40px' }} />

      <div style={{ width: '100%', maxWidth: 400, opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 300ms ease-out, transform 300ms ease-out', position: 'relative', zIndex: 1 }}>

        {/* Card */}
        <div className="corp-card" style={{ padding: 40 }}>

          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #0A2463 0%, #1D4ED8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: '0 8px 20px rgba(29,78,216,0.30)' }}>
              <ShieldCheck size={36} color="white" />
            </div>
            <h1 style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
              Panel de Administración
            </h1>
            <p style={{ color: '#6B7280', fontSize: '0.8125rem', marginTop: 6, marginBottom: 0 }}>
              Portal ARCOP · Acceso restringido
            </p>
          </div>

          <div style={{ borderTop: '1px solid #E5E7EB', marginBottom: 24 }} />

          <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#374151', marginBottom: 20, marginTop: 0 }}>
            {modoReset ? 'Recuperar contraseña' : 'Iniciar sesión'}
          </h2>

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <AlertCircle style={{ width: 16, height: 16, color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: '0.875rem', color: '#B91C1C', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Confirmación reset */}
          {resetOk && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <CheckCircle style={{ width: 16, height: 16, color: '#16A34A', flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: '0.875rem', color: '#15803D', margin: 0 }}>
                Correo enviado. Revisa tu bandeja de entrada y sigue las instrucciones.
              </p>
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9CA3AF' }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="dpo@empresa.cl" disabled={loading} autoComplete="email"
                className="corp-input"
                style={{ paddingLeft: 40 }}
              />
            </div>
          </div>

          {/* Contraseña — solo en modo login */}
          {!modoReset && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9CA3AF' }} />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="••••••••" disabled={loading} autoComplete="current-password"
                  className="corp-input"
                  style={{ paddingLeft: 40, paddingRight: 40 }}
                />
                <button onClick={() => setShowPass(v => !v)} tabIndex={-1}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}>
                  {showPass ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>
            </div>
          )}

          {/* Botón principal */}
          <button
            onClick={modoReset ? handleReset : handleSubmit}
            disabled={loading || (modoReset && resetOk)}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading && (
              <svg style={{ width: 16, height: 16, animation: 'spin 1s linear infinite', flexShrink: 0 }} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            )}
            {loading ? (modoReset ? 'Enviando...' : 'Iniciando sesión...') : modoReset ? 'Enviar correo de recuperación' : 'Iniciar sesión'}
          </button>

          {/* Toggle modo + footer */}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              onClick={() => { setModoReset(v => !v); setError(''); setResetOk(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', color: '#2563EB' }}
            >
              {modoReset ? '← Volver al inicio de sesión' : '¿Olvidaste tu contraseña?'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid #F3F4F6', marginTop: 20, paddingTop: 16, textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: 0 }}>
              ¿Problemas para ingresar?{' '}
              <a href="mailto:soporte@arcop.cl" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 500 }}>
                Contacta soporte
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}