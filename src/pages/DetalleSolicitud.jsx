// ============================================================
// src/pages/DetalleSolicitud.jsx — v1.0
// Detalle de solicitud: timeline vertical, datos técnicos
// colapsables, botón de acción sticky en mobile.
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronDown, ChevronUp,
  Clock, CheckCircle, Loader, AlertCircle,
  User, FileText, Shield,
} from 'lucide-react';
import httpAdapter from '../adapters/httpAdapter';

// ── Estado badges (mismo contrato que SolicitudesTable) ──────
const ESTADO_BADGES = {
  PENDIENTE:            { cls: 'bg-amber-100 text-amber-700 border border-amber-200',    label: 'Pendiente' },
  VALIDADA:             { cls: 'bg-blue-100 text-blue-700 border border-blue-200',       label: 'Validada' },
  EN_PROCESO:           { cls: 'bg-violet-100 text-violet-700 border border-violet-200', label: 'En proceso' },
  RESUELTA:             { cls: 'bg-green-100 text-green-700 border border-green-200',    label: 'Resuelta' },
  DESCARGA_CONFIRMADA:  { cls: 'bg-green-100 text-green-700 border border-green-200',    label: 'Descarga confirmada' },
  CERRADA:              { cls: 'bg-gray-100 text-gray-600 border border-gray-200',       label: 'Cerrada' },
  DESISTIDA:            { cls: 'bg-rose-100 text-rose-600 border border-rose-200',       label: 'Desistida' },
};

const getBadge = (estado) =>
  ESTADO_BADGES[estado] || { cls: 'bg-gray-100 text-gray-600 border border-gray-200', label: estado || 'Desconocido' };

const formatFecha = (val) => {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-CL', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
};

// ── Evento de la línea de tiempo vertical ───────────────────
const EventoTimeline = ({ evento, esMasReciente, index }) => {
  const badge = getBadge(evento.estado);
  return (
    <div
      className="flex gap-4 animate-fade-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Indicador vertical */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            esMasReciente
              ? 'border-2 border-indigo-500'
              : 'border-2 border-emerald-400'
          }`}
          style={{ background: esMasReciente ? '#e0e7ff' : '#d1fae5' }}
        >
          {esMasReciente
            ? <Clock className="w-3.5 h-3.5 text-indigo-600" />
            : <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          }
        </div>
        {!esMasReciente && (
          <div className="w-0.5 flex-1 mt-1 min-h-[28px] bg-gray-200" />
        )}
      </div>

      {/* Contenido */}
      <div className={`pb-6 flex-1 min-w-0 ${esMasReciente ? 'pb-1' : ''}`}>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badge.cls}`}>
            {badge.label}
          </span>
          {evento.actor && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <User className="w-3 h-3 flex-shrink-0" />
              <span className={`${esMasReciente ? 'font-semibold text-blue-700' : 'font-medium text-gray-700'}`}>
                {evento.actor}
              </span>
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400">
          {formatFecha(evento.timestamp || evento.fecha || evento.fecha_entrada_estado)}
        </p>
        {evento.comentario && (
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">{evento.comentario}</p>
        )}
        {evento.notas && (
          <p className="text-sm text-gray-500 mt-1 italic">{evento.notas}</p>
        )}
      </div>
    </div>
  );
};

// ── Componente principal ─────────────────────────────────────
export default function DetalleSolicitud() {
  const { numero } = useParams();
  const navigate   = useNavigate();

  const [solicitud,      setSolicitud]      = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [tecnicoAbierto, setTecnicoAbierto] = useState(false);

  useEffect(() => {
    if (!numero) return;
    setLoading(true);
    httpAdapter.getSolicitudPorNumero(numero)
      .then(result => {
        if (result.status === 'success') {
          setSolicitud(result.data);
        } else {
          setError(result.message || 'No se encontró la solicitud');
        }
      })
      .catch(() => setError('Error al cargar la solicitud'))
      .finally(() => setLoading(false));
  }, [numero]);

  // ── Loading ──────────────────────────────────────────────
  if (loading) return (
    <div className="dpo-layout flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Loader className="w-8 h-8 animate-spin" />
        <span className="text-sm font-medium">Cargando solicitud...</span>
      </div>
    </div>
  );

  // ── Error / no encontrada ────────────────────────────────
  if (error) return (
    <div className="dpo-layout flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">No encontrada</h2>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Volver
        </button>
      </div>
    </div>
  );

  const badge = getBadge(solicitud.estado);

  // ── Construir historial ──────────────────────────────────
  // Si el objeto tiene un array `historial`, lo usamos.
  // Si no, sintetizamos una entrada con el estado actual.
  const historialRaw = Array.isArray(solicitud.historial) && solicitud.historial.length > 0
    ? solicitud.historial
    : [{
        estado:    solicitud.estado,
        timestamp: solicitud.fecha_solicitud,
        actor:     'Sistema',
        comentario: null,
      }];

  // Más reciente primero
  const historial = [...historialRaw].reverse();

  // ── Campos de datos del titular / solicitud ──────────────
  const camposDetalle = [
    ['Nombre completo',   solicitud.nombre_completo],
    ['RUT',               solicitud.rut],
    ['Email',             solicitud.email],
    ['Teléfono',          solicitud.telefono],
    ['Tipo de derecho',   solicitud.tipo_derecho || solicitud.tipo],
    ['Formato preferido', solicitud.formato_preferido],
    ['Asignado a',        solicitud.asignado_a],
    ['Fecha ingreso',     formatFecha(solicitud.fecha_solicitud)],
    ['Fecha límite',      formatFecha(solicitud.fecha_limite)],
    ['Fecha SLA',         formatFecha(solicitud.fecha_termino_sla)],
    ['Notas DPO',         solicitud.notas_dpo],
  ].filter(([, v]) => v);

  // ── Campos técnicos colapsables ──────────────────────────
  const camposTecnicos = [
    ['IP origen',        solicitud.ip_origen],
    ['User Agent',       solicitud.user_agent],
    ['Token validación', solicitud.token_validacion],
    ['Canal validación', solicitud.canal_validacion],
    ['ID interno',       solicitud.id],
    ['Recaptcha score',  solicitud.recaptcha_score != null ? String(solicitud.recaptcha_score) : null],
  ].filter(([, v]) => v);

  return (
    <div className="dpo-layout py-6 px-4 pb-28 md:pb-6">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Botón volver ─────────────────────────────── */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        {/* ── Header ───────────────────────────────────── */}
        <div className="glass-card p-5 animate-fade-up">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Solicitud
              </p>
              <h1 className="text-xl font-bold text-gray-900 font-mono">
                {solicitud.numero_solicitud || numero}
              </h1>
              {solicitud.nombre_completo && (
                <p className="text-sm text-gray-500 mt-1">{solicitud.nombre_completo}</p>
              )}
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
        </div>

        {/* ── Datos del titular y la solicitud ──────────── */}
        <div className="glass-card p-5 animate-fade-up" style={{ animationDelay: '60ms' }}>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2" style={{ fontFamily: "'DM Sans', Inter, system-ui, sans-serif" }}>
            <FileText className="w-3.5 h-3.5" style={{ color: '#6366f1' }} /> Datos de la solicitud
          </h2>
          {camposDetalle.length > 0 ? (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {camposDetalle.map(([label, valor]) => (
                <div key={label}>
                  <dt className="text-xs text-gray-400 font-medium">{label}</dt>
                  <dd className="text-sm font-medium text-gray-900 mt-0.5 break-words">{valor}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-slate-400">Sin datos adicionales.</p>
          )}
        </div>

        {/* ── Historial — línea de tiempo vertical ───────── */}
        <div className="glass-card p-5 animate-fade-up" style={{ animationDelay: '120ms' }}>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2" style={{ fontFamily: "'DM Sans', Inter, system-ui, sans-serif" }}>
            <Clock className="w-3.5 h-3.5" style={{ color: '#6366f1' }} /> Historial de estados
          </h2>
          <div>
            {historial.map((evento, i) => (
              <EventoTimeline
                key={i}
                evento={evento}
                esMasReciente={i === 0}
                index={i}
              />
            ))}
          </div>
        </div>

        {/* ── Datos técnicos colapsables ─────────────────── */}
        {camposTecnicos.length > 0 && (
          <div
            className="glass-card overflow-hidden animate-fade-up"
            style={{ animationDelay: '180ms' }}
          >
            <button
              onClick={() => setTecnicoAbierto(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: "'DM Sans', Inter, system-ui, sans-serif" }}>
                <Shield className="w-3.5 h-3.5" style={{ color: '#6366f1' }} /> Ver datos técnicos
              </span>
              {tecnicoAbierto
                ? <ChevronUp  className="w-4 h-4 text-gray-400 flex-shrink-0" />
                : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              }
            </button>
            {tecnicoAbierto && (
              <div className="px-5 pb-5 border-t border-gray-100">
                <dl className="space-y-2.5 mt-4">
                  {camposTecnicos.map(([label, valor]) => (
                    <div key={label} className="flex gap-4 text-xs">
                      <dt className="text-gray-400 w-36 flex-shrink-0 font-medium">{label}</dt>
                      <dd className="text-gray-600 font-mono break-all">{valor}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        )}

        {/* Spacer para que el contenido no quede bajo el botón sticky */}
        <div className="h-2" />
      </div>

      {/* ── Botón de acción sticky en mobile ──────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-10 shadow-lg">
        <button
          onClick={() => navigate(-1)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors min-h-[44px]"
        >
          <CheckCircle className="w-4 h-4" /> Volver y gestionar
        </button>
      </div>

      {/* ── Botón de acción visible en desktop ─────────────── */}
      <div className="hidden md:flex max-w-2xl mx-auto mt-4 px-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors"
        >
          <CheckCircle className="w-4 h-4" /> Volver y gestionar
        </button>
      </div>
    </div>
  );
}
