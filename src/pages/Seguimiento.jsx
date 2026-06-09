// ============================================================
// src/pages/Seguimiento.jsx — v4.2
// v4.2: Desistimiento de solicitud (HU-T-10)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Clock, Loader, AlertCircle, Download, PackageCheck, Mail, XCircle, Ban } from 'lucide-react';
import { obtenerSolicitudPorNumero } from '../services/googleSheetsService';
import adapter from '../adapters';

const Seguimiento = () => {
  const { numero } = useParams();
  const [solicitud,    setSolicitud]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [descargando,  setDescargando]  = useState(false);
  const [descargaOk,   setDescargaOk]   = useState(false);
  const [desistiendo,  setDesistiendo]  = useState(false);
  const [modalDesistir, setModalDesistir] = useState(false);
  const [motivoDesistir, setMotivoDesistir] = useState('');

  useEffect(() => { cargarSeguimiento(); }, [numero]);

  const cargarSeguimiento = async () => {
    try {
      setLoading(true);
      const result = await obtenerSolicitudPorNumero(numero);
      if (result.status === 'success') {
        setSolicitud(result.data);
        if (result.data.descarga_confirmada_en || result.data.estado === 'DESCARGA_CONFIRMADA') {
          setDescargaOk(true);
        }
      } else {
        setError(result.message || 'Solicitud no encontrada');
      }
    } catch (err) {
      setError('Error al cargar seguimiento');
    } finally {
      setLoading(false);
    }
  };

  const handleDescargar = async () => {
    if (descargando) return;
    const url = solicitud.url_descarga || solicitud.url_datos;
    if (!url) return;
    setDescargando(true);
    try {
      await adapter.confirmarDescarga(solicitud.id || solicitud.numero_solicitud);
      setDescargaOk(true);
    } catch (err) {
      console.warn('Registro de descarga falló, pero se abre el archivo igual:', err);
    }
    window.open(url, '_blank');
    setTimeout(() => { cargarSeguimiento(); setDescargando(false); }, 1500);
  };

  const handleDesistir = async () => {
    setDesistiendo(true);
    try {
      const result = await adapter.desistirSolicitud(solicitud.id || solicitud.numero_solicitud, motivoDesistir);
      if (result.status === 'success') {
        setModalDesistir(false);
        await cargarSeguimiento();
      } else {
        alert('Error: ' + (result.message || 'No se pudo procesar el desistimiento'));
      }
    } catch (err) {
      alert('Error al desistir: ' + err.message);
    } finally {
      setDesistiendo(false);
    }
  };

  const formatFecha = (valor) => {
    if (!valor || valor === '' || valor === 0) return 'No disponible';
    try {
      const d = new Date(valor);
      if (isNaN(d.getTime())) return 'No disponible';
      return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch { return 'No disponible'; }
  };

  const ESTADOS_INFO = {
    PENDIENTE:           { icon: Clock,        color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', texto: 'Pendiente de validación',  desc: 'Hemos recibido tu solicitud. Valida tu identidad con el link enviado a tu email.' },
    VALIDADA:            { icon: CheckCircle,  color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',   texto: 'Identidad validada',        desc: 'Tu identidad ha sido confirmada. Estamos procesando tu solicitud.' },
    EN_PROCESO:          { icon: Loader,       color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', texto: 'En proceso',                desc: 'Estamos recopilando tus datos personales activamente.' },
    RESUELTA:            { icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200',  texto: '¡Datos listos!',            desc: 'Tus datos personales están disponibles. Descárgalos a continuación.' },
    DESCARGA_CONFIRMADA: { icon: PackageCheck, color: 'text-teal-600',   bg: 'bg-teal-50',   border: 'border-teal-200',   texto: 'Descarga confirmada',       desc: 'Has descargado tus datos correctamente. Solicitud completada.' },
    CERRADA:             { icon: CheckCircle,  color: 'text-gray-600',   bg: 'bg-gray-50',   border: 'border-gray-200',   texto: 'Cerrada',                   desc: 'Solicitud completada y archivada exitosamente.' },
    DESISTIDA:           { icon: Ban,          color: 'text-rose-600',   bg: 'bg-rose-50',   border: 'border-rose-200',   texto: 'Desistida',                 desc: 'Has desistido de esta solicitud. El proceso fue cancelado.' },
  };

  const PASOS = [
    { key: 'PENDIENTE',           label: 'Recibida'   },
    { key: 'VALIDADA',            label: 'Validada'   },
    { key: 'EN_PROCESO',          label: 'En proceso' },
    { key: 'RESUELTA',            label: 'Lista'      },
    { key: 'DESCARGA_CONFIRMADA', label: 'Descargada' },
    { key: 'CERRADA',             label: 'Cerrada'    },
  ];

  const ESTADOS_FINALES = ['CERRADA', 'DESCARGA_CONFIRMADA', 'DESISTIDA'];

  if (loading) return (
    <div className="portal-bg flex items-center justify-center">
      <div className="text-center">
        <Loader className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: 'var(--color-primario, #818cf8)' }} />
        <p className="text-slate-300">Cargando seguimiento...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="portal-bg flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
        <svg className="mx-auto mb-6" width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="12" y="8" width="40" height="52" rx="4" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2"/>
          <line x1="20" y1="22" x2="44" y2="22" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"/>
          <line x1="20" y1="30" x2="44" y2="30" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"/>
          <line x1="20" y1="38" x2="36" y2="38" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="56" cy="52" r="16" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="2"/>
          <circle cx="62" cy="58" r="5" fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="65.5" y1="61.5" x2="69" y2="65" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="56" cy="52" r="7" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitud no encontrada</h2>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <a href="/#/" className="btn-brand inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm">
          Volver al formulario
        </a>
      </div>
    </div>
  );

  const info           = ESTADOS_INFO[solicitud.estado] || ESTADOS_INFO['PENDIENTE'];
  const Icon           = info.icon;
  const stepActual     = PASOS.findIndex(p => p.key === solicitud.estado);

  const calcTiempoRestante = (fechaLimite) => {
    if (!fechaLimite) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(fechaLimite);
    limite.setHours(0, 0, 0, 0);
    let diasHabiles = 0;
    const cursor = new Date(hoy);
    if (limite <= hoy) return { texto: 'Plazo vencido', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', vencido: true };
    while (cursor < limite) {
      cursor.setDate(cursor.getDate() + 1);
      if (cursor.getDay() !== 0 && cursor.getDay() !== 6) diasHabiles++;
    }
    if (diasHabiles < 3)  return { texto: `Vence en ${diasHabiles} día${diasHabiles !== 1 ? 's' : ''}`, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', vencido: false };
    if (diasHabiles <= 5) return { texto: `Faltan ${diasHabiles} días hábiles`, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', vencido: false };
    return { texto: `Faltan ${diasHabiles} días hábiles`, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', vencido: false };
  };

  const tiempoRestante = !ESTADOS_FINALES.includes(solicitud.estado) ? calcTiempoRestante(solicitud.fecha_limite) : null;
  const urlDescarga    = solicitud.url_descarga || solicitud.url_datos;
  const esResuelta     = ['RESUELTA', 'DESCARGA_CONFIRMADA'].includes(solicitud.estado);
  const puedeDescargar = esResuelta && !!urlDescarga;
  const esperandoUrl   = esResuelta && !urlDescarga;
  const puedeDesistir  = !ESTADOS_FINALES.includes(solicitud.estado);

  return (
    <div className="portal-bg py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Título */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Seguimiento de Solicitud</h1>
          <p className="text-slate-300 mt-1">
            Número: <span className="font-mono font-semibold" style={{ color: 'var(--color-primario, #818cf8)' }}>{numero}</span>
          </p>
        </div>

        {/* Estado actual */}
        <div className={`rounded-2xl border-2 p-5 ${info.bg} ${info.border}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-white shadow-sm">
              <Icon className={`w-6 h-6 ${info.color}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado actual</p>
              <h2 className={`text-lg font-bold ${info.color}`}>{info.texto}</h2>
              <p className="text-sm text-gray-600">{info.desc}</p>
            </div>
          </div>
        </div>

        {/* Tiempo restante */}
        {tiempoRestante && (
          <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${tiempoRestante.bg} ${tiempoRestante.border}`}>
            <span className={`text-sm font-semibold ${tiempoRestante.color}`}>{tiempoRestante.texto}</span>
            {tiempoRestante.vencido && <span className="text-xs text-red-500 font-medium">— Se requiere atención inmediata</span>}
          </div>
        )}

        {/* Barra de progreso — oculta si desistida */}
        {solicitud.estado !== 'DESISTIDA' && (
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-start">
              {PASOS.map((paso, i) => {
                const completado = i <= stepActual;
                const esActual   = i === stepActual;
                return (
                  <React.Fragment key={paso.key}>
                    <div className="flex flex-col items-center flex-shrink-0" style={{ minWidth: 0 }}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        esActual   ? 'bg-brand-600 text-white ring-4 ring-brand-100 animate-pulse' :
                        completado ? 'bg-green-500 text-white' :
                                     'bg-gray-200 text-gray-400'}`}
                        style={esActual ? { backgroundColor: 'var(--color-primario, #4f46e5)', boxShadow: '0 0 0 4px rgba(79,70,229,0.2)' } : {}}>
                        {completado && !esActual ? '✓' : i + 1}
                      </div>
                      <p className={`text-xs mt-1 text-center leading-tight px-0.5 ${completado ? 'text-gray-700 font-medium' : 'text-gray-400'}`}
                         style={{ fontSize: '10px', maxWidth: '48px' }}>
                        {paso.label}
                      </p>
                      {esActual && <p style={{ color: 'var(--color-primario, #818cf8)', marginTop: '2px', fontSize: '9px' }}>▲ actual</p>}
                    </div>
                    {i < PASOS.length - 1 && (
                      <div className={`flex-1 h-1 mt-3.5 mx-1 rounded-full ${i < stepActual ? 'bg-green-400' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Sección descarga */}
        {puedeDescargar && (
          <div className={`rounded-2xl border-2 p-5 ${descargaOk ? 'bg-teal-50 border-teal-200' : 'bg-green-50 border-green-200'}`}>
            {descargaOk ? (
              <div className="text-center space-y-3">
                <PackageCheck className="w-12 h-12 text-teal-600 mx-auto" />
                <div>
                  <h3 className="text-lg font-bold text-teal-800">Descarga registrada ✓</h3>
                  <p className="text-sm text-teal-700 mt-1">Hemos confirmado que accediste a tus datos personales.</p>
                  {solicitud.descarga_confirmada_en && (
                    <p className="text-xs text-teal-600 mt-1">Registrado el {formatFecha(solicitud.descarga_confirmada_en)}</p>
                  )}
                </div>
                <button onClick={handleDescargar} disabled={descargando}
                  className="text-sm text-teal-700 underline hover:text-teal-900 inline-flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" /> Descargar nuevamente
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-green-800">📥 Tus datos están listos</h3>
                  <p className="text-sm text-green-700 mt-1">Haz clic para descargar. Registraremos este acceso como evidencia de cumplimiento de la Ley 21.719.</p>
                </div>
                {solicitud.formato_entrega && (
                  <p className="text-xs text-green-600">Formato: <span className="font-semibold">{solicitud.formato_entrega}</span></p>
                )}
                <button onClick={handleDescargar} disabled={descargando}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-base transition-all shadow-sm disabled:opacity-60">
                  {descargando
                    ? <><Loader className="w-5 h-5 animate-spin" /> Registrando...</>
                    : <><Download className="w-5 h-5" /> Descargar mis datos personales</>}
                </button>
                <p className="text-xs text-green-600 text-center">Al descargar, confirmas que recibiste tus datos según lo solicitado.</p>
              </div>
            )}
          </div>
        )}

        {/* Resuelta sin URL */}
        {esperandoUrl && (
          <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <Mail className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-amber-800">Tu solicitud está completada</h3>
                <p className="text-sm text-amber-700 mt-1">El enlace de descarga será enviado a tu correo en breve.</p>
              </div>
            </div>
            <button onClick={cargarSeguimiento}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-sm font-medium transition-colors">
              <Loader className="w-4 h-4" /> Recargar estado
            </button>
          </div>
        )}

        {/* Desistida — info motivo */}
        {solicitud.estado === 'DESISTIDA' && (
          <div className="glass-card rounded-2xl border border-rose-100 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Motivo del desistimiento</p>
            <p className="text-sm text-gray-700">{solicitud.motivo_desistimiento || 'No indicado'}</p>
            {solicitud.fecha_desistimiento && (
              <p className="text-xs text-gray-400 mt-2">Registrado el {formatFecha(solicitud.fecha_desistimiento)}</p>
            )}
          </div>
        )}

        {/* Detalle */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3" style={{ fontFamily: "'DM Sans', Inter, system-ui, sans-serif" }}>Detalle</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Tipo',          solicitud.tipo_derecho || solicitud.tipo || 'ACCESO'],
              ['Fecha ingreso', formatFecha(solicitud.fecha_solicitud)],
              ['Fecha límite',  formatFecha(solicitud.fecha_limite)],
              ['Formato',       solicitud.formato_preferido || '—'],
            ].map(([label, valor]) => (
              <div key={label}>
                <p className="text-gray-400 text-xs">{label}</p>
                <p className="font-medium text-gray-800">{valor}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Botón desistir */}
        {puedeDesistir && (
          <div className="glass-card rounded-2xl p-5">
            <p className="text-xs text-gray-400 mb-3">¿Ya no necesitas esta solicitud?</p>
            <button
              onClick={() => setModalDesistir(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors">
              <XCircle className="w-4 h-4" /> Desistir de esta solicitud
            </button>
          </div>
        )}

      </div>

      {/* Modal confirmación desistimiento */}
      {modalDesistir && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">¿Desistir de la solicitud?</h3>
                <p className="text-xs text-gray-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Al desistir, la solicitud <span className="font-mono font-semibold text-gray-800">{numero}</span> quedará cancelada
              y se notificará al equipo responsable.
            </p>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Motivo (opcional)</label>
              <textarea
                value={motivoDesistir}
                onChange={e => setMotivoDesistir(e.target.value)}
                rows={3}
                placeholder="Ej: Ya no necesito ejercer este derecho..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setModalDesistir(false); setMotivoDesistir(''); }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                Cancelar
              </button>
              <button
                onClick={handleDesistir}
                disabled={desistiendo}
                className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 text-sm font-medium">
                {desistiendo ? 'Procesando...' : 'Confirmar desistimiento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Seguimiento;