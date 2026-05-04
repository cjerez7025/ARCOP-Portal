// ============================================================
// src/pages/ValidarIdentidad.jsx — v3.0
// MMPA-120 — Mostrar datos anonimizados al titular
// MMPA-121 — Selección de canal (WhatsApp o correo)
// MMPA-122 — Derivación a canal asistido
//
// Flujo de pasos:
//   cargando → contacto → canal → enviado → validando → exitoso
//                       ↘ derivado (si no reconoce o sin datos)
//
// El backend NUNCA expone datos completos — solo anonimizados.
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle, XCircle, Loader, Mail, MessageCircle,
  AlertCircle, Phone, Clock, ShieldCheck, ArrowRight,
  RefreshCw,
} from 'lucide-react';
import adapter from '../adapters';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// ── Helper fetch sin auth (público) ──────────────────────
async function _post(path, body) {
  const res  = await fetch(`${API_URL}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data.data;
}

// ════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════
const ValidarIdentidad = () => {
  const { token } = useParams();

  // paso: 'cargando' | 'contacto' | 'canal' | 'enviado' | 'validando' | 'exitoso' | 'derivado' | 'error'
  const [paso,      setPaso]      = useState('cargando');
  const [contacto,  setContacto]  = useState(null);   // datos del backend (anonimizados)
  const [solicitud, setSolicitud] = useState(null);   // info solicitud
  const [canal,     setCanal]     = useState(null);   // 'email' | 'whatsapp'
  const [config,    setConfig]    = useState(null);   // config DPO para derivación
  const [error,     setError]     = useState('');
  const [enviando,  setEnviando]  = useState(false);

  useEffect(() => {
    if (token) iniciarFlujo();
  }, [token]);

  // ── Paso 1: validar token y obtener contacto anonimizado ──
  const iniciarFlujo = async () => {
    setPaso('cargando');
    try {
      // Primero verificar el token para obtener el solicitudId
      const tokenData = await _post('/api/solicitudes/info-token', { token });
      const solicitudId = tokenData?.solicitudId;

      if (!solicitudId) {
        setError('El link de validación es inválido o ya fue usado.');
        setPaso('error');
        return;
      }

      setSolicitud({ id: solicitudId, numero_solicitud: tokenData.numero_solicitud });

      // Consultar datos de contacto anonimizados
      const datos = await _post('/api/validacion/contacto', { solicitudId });
      setContacto(datos);

      if (!datos.encontrado || datos.canales_disponibles.length === 0) {
        // Sin datos → derivar directo
        await derivarAsistido(solicitudId, datos);
        return;
      }

      // Si solo hay un canal, seleccionarlo automáticamente
      if (datos.canales_disponibles.length === 1) {
        setCanal(datos.canales_disponibles[0]);
      }

      setPaso('contacto');

    } catch (e) {
      console.error('[ValidarIdentidad]', e);
      setError(e.message || 'Error al cargar datos de validación');
      setPaso('error');
    }
  };

  // ── Paso 2: titular confirma o no reconoce ────────────────
  const confirmarDatos = () => {
    // Si hay solo un canal ya seleccionado, saltar selección
    if (contacto?.canales_disponibles?.length === 1) {
      enviarLink(contacto.canales_disponibles[0]);
    } else {
      setPaso('canal');
    }
  };

  const noReconozco = async () => {
    await derivarAsistido(solicitud?.id, contacto);
  };

  // ── Paso 3: enviar link por canal elegido ─────────────────
  const enviarLink = async (canalElegido) => {
    setEnviando(true);
    setCanal(canalElegido);
    try {
      await _post('/api/validacion/enviar-link', {
        solicitudId: solicitud.id,
        canal:       canalElegido,
      });
      setPaso('enviado');
    } catch (e) {
      setError(e.message || 'Error al enviar el link');
      setPaso('error');
    } finally {
      setEnviando(false);
    }
  };

  // ── Paso 4: el titular hace clic en el link del email/WA ──
  // Este paso ocurre cuando el token ya está validado (flujo original)
  const procesarValidacionToken = async () => {
    setPaso('validando');
    try {
      const resultado = await adapter.validarIdentidad(token);
      if (resultado.status === 'success') {
        const data = resultado.data || {};
        const sol  = data.solicitud || data;
        setSolicitud(prev => ({
          ...prev,
          numero_solicitud: sol.numero || sol.numero_solicitud || prev?.numero_solicitud || '—',
          estado:           sol.estado || 'VALIDADA',
          fecha_limite:     sol.fecha_limite || null,
        }));
        setPaso('exitoso');
      } else {
        setError(resultado.message || 'No se pudo validar la identidad');
        setPaso('error');
      }
    } catch (e) {
      setError(e.message || 'Error al validar identidad');
      setPaso('error');
    }
  };

  // ── Derivación a canal asistido ───────────────────────────
  const derivarAsistido = async (solicitudId, datosContacto) => {
    try {
      const resp = await _post('/api/validacion/derivar', { solicitudId });
      setConfig({
        dpo_email:    resp.dpo_email,
        dpo_telefono: resp.dpo_telefono,
        dpo_horario:  resp.dpo_horario,
        numero:       resp.numero_solicitud,
      });
      setPaso('derivado');
    } catch (e) {
      // Si falla la derivación, igual mostramos la pantalla con lo que tenemos
      setConfig({ numero: solicitudId });
      setPaso('derivado');
    }
  };

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════

  // ── Wrapper centrado ──────────────────────────────────────
  const Wrap = ({ children }) => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        {children}
      </div>
    </div>
  );

  // ── Cargando ──────────────────────────────────────────────
  if (paso === 'cargando') return (
    <Wrap>
      <div className="flex flex-col items-center gap-4 py-6">
        <Loader className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-gray-600 text-sm">Verificando tu solicitud...</p>
      </div>
    </Wrap>
  );

  // ── Contacto anonimizado ──────────────────────────────────
  if (paso === 'contacto') return (
    <Wrap>
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Verificación de identidad</h1>
          <p className="text-sm text-gray-500 mt-1">
            Para proteger tus datos, necesitamos confirmar que eres tú.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Encontramos estos datos registrados a tu nombre:
          </p>

          {contacto?.email_anon && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Correo electrónico</p>
                <p className="text-sm font-mono font-semibold text-gray-800">{contacto.email_anon}</p>
              </div>
            </div>
          )}

          {contacto?.telefono_anon && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Teléfono</p>
                <p className="text-sm font-mono font-semibold text-gray-800">{contacto.telefono_anon}</p>
              </div>
            </div>
          )}
        </div>

        <p className="text-sm text-center text-gray-600">
          ¿Reconoces estos datos como tuyos?
        </p>

        <div className="space-y-3">
          <button
            onClick={confirmarDatos}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            <CheckCircle className="w-5 h-5" /> Sí, son mis datos
          </button>
          <button
            onClick={noReconozco}
            className="w-full px-5 py-3 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
          >
            No reconozco estos datos
          </button>
        </div>
      </div>
    </Wrap>
  );

  // ── Selección de canal ────────────────────────────────────
  if (paso === 'canal') return (
    <Wrap>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">¿Cómo quieres recibir tu link?</h1>
          <p className="text-sm text-gray-500 mt-1">Elige el canal por donde te enviaremos el link de verificación</p>
        </div>

        <div className="space-y-3">
          {contacto?.canales_disponibles?.includes('email') && (
            <button
              onClick={() => enviarLink('email')}
              disabled={enviando}
              className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-gray-800">Correo electrónico</p>
                <p className="text-xs text-gray-500">{contacto.email_anon}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>
          )}

          {contacto?.canales_disponibles?.includes('whatsapp') && (
            <button
              onClick={() => enviarLink('whatsapp')}
              disabled={enviando}
              className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-gray-800">WhatsApp</p>
                <p className="text-xs text-gray-500">{contacto.telefono_anon}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>
          )}
        </div>

        {enviando && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader className="w-4 h-4 animate-spin" /> Enviando...
          </div>
        )}
      </div>
    </Wrap>
  );

  // ── Link enviado ──────────────────────────────────────────
  if (paso === 'enviado') return (
    <Wrap>
      <div className="space-y-6 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto bg-blue-100">
          {canal === 'whatsapp'
            ? <MessageCircle className="w-7 h-7 text-green-600" />
            : <Mail className="w-7 h-7 text-blue-600" />
          }
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Link enviado</h1>
          <p className="text-sm text-gray-500 mt-2">
            {canal === 'whatsapp'
              ? `Te enviamos el link de verificación por WhatsApp al número ${contacto?.telefono_anon}`
              : `Te enviamos el link de verificación al correo ${contacto?.email_anon}`
            }
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-amber-700">Próximos pasos:</p>
          <p className="text-xs text-amber-700">1. Revisa tu {canal === 'whatsapp' ? 'WhatsApp' : 'bandeja de entrada (incluyendo spam)'}</p>
          <p className="text-xs text-amber-700">2. Haz clic en el link de verificación</p>
          <p className="text-xs text-amber-700">3. El link expira en <strong>30 minutos</strong></p>
        </div>

        <button
          onClick={() => enviarLink(canal)}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Reenviar link
        </button>
      </div>
    </Wrap>
  );

  // ── Validando (spinner mientras procesa el token) ─────────
  if (paso === 'validando') return (
    <Wrap>
      <div className="flex flex-col items-center gap-4 py-6">
        <Loader className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-gray-600 text-sm">Validando tu identidad...</p>
      </div>
    </Wrap>
  );

  // ── Éxito ─────────────────────────────────────────────────
  if (paso === 'exitoso') return (
    <Wrap>
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-9 h-9 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">¡Identidad verificada!</h1>
          <p className="text-gray-500 text-sm mt-2">
            Tu solicitud ha avanzado. Recibirás una respuesta dentro del plazo legal.
          </p>
        </div>
        {solicitud?.numero_solicitud && (
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">N° de solicitud</p>
            <p className="text-lg font-bold text-blue-800 mt-1">{solicitud.numero_solicitud}</p>
            <p className="text-xs text-blue-500 mt-1">Guárdalo para hacer seguimiento</p>
          </div>
        )}
      </div>
    </Wrap>
  );

  // ── Derivado a canal asistido ─────────────────────────────
  if (paso === 'derivado') return (
    <Wrap>
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-7 h-7 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Necesitas ayuda adicional</h1>
          <p className="text-sm text-gray-500 mt-2">
            No fue posible verificar tu identidad de forma automática.
            Tu solicitud está registrada y un agente te contactará.
          </p>
        </div>

        {config?.numero && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Tu número de solicitud</p>
            <p className="text-lg font-bold text-blue-800 mt-1">{config.numero}</p>
            <p className="text-xs text-blue-500 mt-1">Menciona este número al contactarnos</p>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Canales de atención</p>

          {config?.dpo_email && (
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Email DPO</p>
                <a href={`mailto:${config.dpo_email}`} className="text-sm text-blue-600 hover:underline font-medium">
                  {config.dpo_email}
                </a>
              </div>
            </div>
          )}

          {config?.dpo_telefono && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Teléfono</p>
                <a href={`tel:${config.dpo_telefono}`} className="text-sm font-medium text-gray-800">
                  {config.dpo_telefono}
                </a>
              </div>
            </div>
          )}

          {config?.dpo_horario && (
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Horario de atención</p>
                <p className="text-sm text-gray-700">{config.dpo_horario}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Wrap>
  );

  // ── Error ─────────────────────────────────────────────────
  if (paso === 'error') return (
    <Wrap>
      <div className="space-y-5 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-7 h-7 text-red-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">No se pudo continuar</h1>
          <p className="text-sm text-gray-500 mt-2">{error || 'Ocurrió un error inesperado.'}</p>
        </div>
        <button
          onClick={iniciarFlujo}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Intentar nuevamente
        </button>
      </div>
    </Wrap>
  );

  return null;
};

export default ValidarIdentidad;