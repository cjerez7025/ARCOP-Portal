// ============================================================
// src/pages/Seguimiento.jsx — v4.1
// FIX: muestra aviso cuando estado es RESUELTA pero url_datos vacío
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Clock, Loader, AlertCircle, Download, PackageCheck, Mail } from 'lucide-react';
import { obtenerSolicitudPorNumero } from '../services/googleSheetsService';
import adapter from '../adapters';

const Seguimiento = () => {
  const { numero } = useParams();
  const [solicitud,   setSolicitud]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [descargando, setDescargando] = useState(false);
  const [descargaOk,  setDescargaOk]  = useState(false);

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

  // ── Evento de descarga ────────────────────────────────
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

  // ── Helpers ──────────────────────────────────────────
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
  };

  const PASOS = [
    { key: 'PENDIENTE',           label: 'Recibida'   },
    { key: 'VALIDADA',            label: 'Validada'   },
    { key: 'EN_PROCESO',          label: 'En proceso' },
    { key: 'RESUELTA',            label: 'Lista'      },
    { key: 'DESCARGA_CONFIRMADA', label: 'Descargada' },
    { key: 'CERRADA',             label: 'Cerrada'    },
  ];

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Cargando seguimiento...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitud no encontrada</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <a href="/#/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Volver al inicio
        </a>
      </div>
    </div>
  );

  const info           = ESTADOS_INFO[solicitud.estado] || ESTADOS_INFO['PENDIENTE'];
  const Icon           = info.icon;
  const stepActual     = PASOS.findIndex(p => p.key === solicitud.estado);
  const urlDescarga    = solicitud.url_descarga || solicitud.url_datos;
  const esResuelta     = ['RESUELTA', 'DESCARGA_CONFIRMADA'].includes(solicitud.estado);
  const puedeDescargar = esResuelta && !!urlDescarga;
  const esperandoUrl   = esResuelta && !urlDescarga;  // ← NUEVO: resuelta pero sin URL

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Título */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Seguimiento de Solicitud</h1>
          <p className="text-gray-500 mt-1">
            Número: <span className="font-mono font-semibold text-blue-600">{numero}</span>
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

        {/* Barra de progreso */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start">
            {PASOS.map((paso, i) => {
              const completado = i <= stepActual;
              const esActual   = i === stepActual;
              return (
                <React.Fragment key={paso.key}>
                  <div className="flex flex-col items-center flex-shrink-0" style={{ minWidth: 0 }}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      esActual   ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                      completado ? 'bg-green-500 text-white' :
                                   'bg-gray-200 text-gray-400'}`}>
                      {completado && !esActual ? '✓' : i + 1}
                    </div>
                    <p className={`text-xs mt-1 text-center leading-tight px-0.5 ${completado ? 'text-gray-700 font-medium' : 'text-gray-400'}`}
                       style={{ fontSize: '10px', maxWidth: '48px' }}>
                      {paso.label}
                    </p>
                    {esActual && <p className="text-blue-600 mt-0.5" style={{ fontSize: '9px' }}>▲ actual</p>}
                  </div>
                  {i < PASOS.length - 1 && (
                    <div className={`flex-1 h-1 mt-3.5 mx-1 rounded-full ${i < stepActual ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── Sección descarga disponible ─────────────────── */}
        {puedeDescargar && (
          <div className={`rounded-2xl border-2 p-5 ${descargaOk ? 'bg-teal-50 border-teal-200' : 'bg-green-50 border-green-200'}`}>
            {descargaOk ? (
              <div className="text-center space-y-3">
                <PackageCheck className="w-12 h-12 text-teal-600 mx-auto" />
                <div>
                  <h3 className="text-lg font-bold text-teal-800">Descarga registrada ✓</h3>
                  <p className="text-sm text-teal-700 mt-1">
                    Hemos confirmado que accediste a tus datos personales.
                  </p>
                  {solicitud.descarga_confirmada_en && (
                    <p className="text-xs text-teal-600 mt-1">
                      Registrado el {formatFecha(solicitud.descarga_confirmada_en)}
                    </p>
                  )}
                </div>
                <button onClick={handleDescargar} disabled={descargando}
                  className="text-sm text-teal-700 underline hover:text-teal-900 inline-flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" />
                  Descargar nuevamente
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-green-800">📥 Tus datos están listos</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Haz clic para descargar. Registraremos este acceso como evidencia de
                    cumplimiento de la Ley 21.719.
                  </p>
                </div>
                {solicitud.formato_entrega && (
                  <p className="text-xs text-green-600">
                    Formato: <span className="font-semibold">{solicitud.formato_entrega}</span>
                  </p>
                )}
                <button onClick={handleDescargar} disabled={descargando}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-base transition-all shadow-sm disabled:opacity-60">
                  {descargando
                    ? <><Loader className="w-5 h-5 animate-spin" /> Registrando...</>
                    : <><Download className="w-5 h-5" /> Descargar mis datos personales</>}
                </button>
                <p className="text-xs text-green-600 text-center">
                  Al descargar, confirmas que recibiste tus datos según lo solicitado.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── NUEVO: Resuelta pero link aún no disponible ── */}
        {esperandoUrl && (
          <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <Mail className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-amber-800">Tu solicitud está completada</h3>
                <p className="text-sm text-amber-700 mt-1">
                  El enlace de descarga de tus datos será enviado a tu correo electrónico en breve.
                  Si no lo recibes en los próximos minutos, revisa tu carpeta de spam.
                </p>
              </div>
            </div>
            <div className="bg-white border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <p className="font-semibold mb-1">¿No recibiste el email?</p>
              <p className="text-xs text-amber-700">
                Intenta recargar esta página en unos minutos. Si el problema persiste,
                contacta al DPO de la organización indicando tu número de solicitud: <strong>{numero}</strong>
              </p>
            </div>
            <button onClick={cargarSeguimiento}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-sm font-medium transition-colors">
              <Loader className="w-4 h-4" />
              Recargar estado
            </button>
          </div>
        )}

        {/* Detalle */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Detalle</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Tipo',          solicitud.tipo || 'ACCESO'],
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

      </div>
    </div>
  );
};

export default Seguimiento;