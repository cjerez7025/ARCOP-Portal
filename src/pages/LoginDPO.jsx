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
      background: 'linear-gradient(160deg, #0D1117 0%, #0F172A 50%, #131929 100%)',
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      {/* Orbs */}
      <div className="orb orb-brand" style={{ top: '-10%', right: '-5%', width: '28rem', height: '28rem', opacity: 0.5 }} />
      <div className="orb orb-violet" style={{ bottom: '-10%', left: '-5%', width: '22rem', height: '22rem', opacity: 0.4 }} />

      <div style={{ width: '100%', maxWidth: 420, opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 350ms ease-out, transform 350ms ease-out', position: 'relative', zIndex: 1 }}>

        {/* Logo / marca */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 0 28px rgba(99,102,241,0.4)', marginBottom: 14 }}>
            <ShieldCheck size={28} color="white" />
          </div>
          <h1 style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', margin: 0 }}>
            Portal ARCOP
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', marginTop: 4 }}>
            Panel de administración · Acceso restringido
          </p>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: '32px 36px', backdropFilter: 'blur(12px)' }}>

          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 20, marginTop: 0 }}>
            {modoReset ? 'Recuperar contraseña' : 'Iniciar sesión'}
          </p>

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <AlertCircle style={{ width: 15, height: 15, color: '#FCA5A5', flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: '0.8125rem', color: '#FCA5A5', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Confirmación reset */}
          {resetOk && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <CheckCircle style={{ width: 15, height: 15, color: '#6EE7B7', flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: '0.8125rem', color: '#6EE7B7', margin: 0 }}>
                Correo enviado. Revisa tu bandeja de entrada y sigue las instrucciones.
              </p>
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'rgba(255,255,255,0.3)' }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="dpo@empresa.cl" disabled={loading} autoComplete="email"
                className="corp-input" style={{ paddingLeft: 38 }} />
            </div>
          </div>

          {/* Contraseña */}
          {!modoReset && (
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'rgba(255,255,255,0.3)' }} />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="••••••••" disabled={loading} autoComplete="current-password"
                  className="corp-input" style={{ paddingLeft: 38, paddingRight: 38 }} />
                <button onClick={() => setShowPass(v => !v)} tabIndex={-1}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 0 }}>
                  {showPass ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>
            </div>
          )}

          {/* Botón principal */}
          <button onClick={modoReset ? handleReset : handleSubmit}
            disabled={loading || (modoReset && resetOk)}
            className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            {loading && (
              <svg style={{ width: 15, height: 15, animation: 'spin 1s linear infinite', flexShrink: 0 }} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            )}
            {loading ? (modoReset ? 'Enviando...' : 'Iniciando sesión...') : modoReset ? 'Enviar correo de recuperación' : 'Iniciar sesión'}
          </button>

          {/* Toggle modo */}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button onClick={() => { setModoReset(v => !v); setError(''); setResetOk(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#A5B4FC' }}>
              {modoReset ? '← Volver al inicio de sesión' : '¿Olvidaste tu contraseña?'}
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', marginTop: 20 }}>
          ¿Problemas para ingresar?{' '}
          <a href="mailto:soporte@arcop.cl" style={{ color: 'rgba(165,180,252,0.7)', textDecoration: 'none' }}>
            Contacta soporte
          </a>
        </p>
      </div>
    </div>
  );
}