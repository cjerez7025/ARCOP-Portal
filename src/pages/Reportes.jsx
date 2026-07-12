// ============================================================
// src/pages/Reportes.jsx — v1.1
// FIX: tipo_derecho || tipo en todos los lugares que leen el tipo
// ============================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart2, Download, Filter, Search, RefreshCw,
  CheckCircle, Clock, AlertTriangle, TrendingUp,
  FileText, Shield, ChevronDown, ChevronUp, X,
  Calendar, Users, Award, AlertOctagon, ArrowUpRight,
  Loader, Info,
} from 'lucide-react';
import { obtenerTodasSolicitudes, obtenerEstadisticas } from '../services/dpoService';

const fmt = (fecha) => {
  if (!fecha) return '—';
  try { return new Date(fecha).toLocaleDateString('es-CL'); }
  catch { return '—'; }
};

const fmtFull = (fecha) => {
  if (!fecha) return '—';
  try {
    return new Date(fecha).toLocaleString('es-CL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
};

const diasHabilesEntre = (desde, hasta) => {
  if (!desde || !hasta) return null;
  let d = new Date(desde);
  const h = new Date(hasta);
  let dias = 0;
  while (d < h) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) dias++;
    d.setDate(d.getDate() + 1);
  }
  return dias;
};

const getSolicitudId = (s) =>
  s?.id || s?.rowIndex || s?.row_index || s?.numero_solicitud || null;

const getTipo = (s) => s.tipo_derecho || s.tipo || '';

const getTipoLabel = (tipo) => ({
  ACCESO:        'Acceso',
  RECTIFICACION: 'Rectificación',
  CANCELACION:   'Cancelación',
  OPOSICION:     'Oposición',
  PORTABILIDAD:  'Portabilidad',
}[tipo] || tipo || '—');

const TIPO_COLORS = {
  ACCESO:        'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  RECTIFICACION: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  CANCELACION:   'bg-red-50 text-red-700 ring-1 ring-red-200',
  OPOSICION:     'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  PORTABILIDAD:  'bg-green-50 text-green-700 ring-1 ring-green-200',
};

const ESTADO_COLORS = {
  PENDIENTE:            'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  VALIDADA:             'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  EN_PROCESO:           'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  RESUELTA:             'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  CERRADA:              'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  BLOQUEADO:            'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  DATOS_ELIMINADOS:     'bg-red-50 text-red-700 ring-1 ring-red-200',
  TRATAMIENTO_CESADO:   'bg-red-50 text-red-700 ring-1 ring-red-200',
  DATOS_PREPARADOS:     'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  COMUNICADO_A_TERCEROS:'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  DESCARGA_CONFIRMADA:  'bg-green-50 text-green-800 ring-1 ring-green-300',
  DESISTIDA:            'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
};

const ESTADO_LABELS = {
  PENDIENTE:            'Pendiente',
  VALIDADA:             'Validada',
  EN_PROCESO:           'En Proceso',
  RESUELTA:             'Resuelta',
  CERRADA:              'Cerrada',
  BLOQUEADO:            'Bloqueado',
  DATOS_ELIMINADOS:     'Datos Eliminados',
  TRATAMIENTO_CESADO:   'Tratamiento Cesado',
  DATOS_PREPARADOS:     'Datos Preparados',
  COMUNICADO_A_TERCEROS:'Comunicado a Terceros',
  DESCARGA_CONFIRMADA:  'Descarga Confirmada',
  DESISTIDA:            'Desistida',
};

const esFinalizada = (estado) =>
  ['RESUELTA', 'CERRADA', 'DESCARGA_CONFIRMADA', 'DESISTIDA'].includes(estado);

// ── Exportación CSV ───────────────────────────────────────

const exportarCSV = (solicitudes) => {
  const cols = [
    'Número Solicitud', 'Tipo', 'Estado', 'Nombre Titular', 'RUT', 'Email',
    'Fecha Solicitud', 'Fecha Límite SLA', 'Fecha Resolución',
    'Días Hábiles Usados', 'Cumplió SLA', 'Asignado A', 'Formato',
  ];

  const rows = solicitudes.map(s => {
    const tipo        = getTipoLabel(getTipo(s));
    const estado      = ESTADO_LABELS[s.estado] || s.estado || '';
    const nombre      = s.nombre_completo || s.nombre || '';
    const rut         = s.rut || '';
    const email       = s.email || '';
    const fSol        = fmt(s.fecha_solicitud);
    const fLimite     = fmt(s.fecha_limite || s.fecha_termino_sla);
    const fResolucion = esFinalizada(s.estado) ? fmt(s.fecha_ultima_actualizacion || s.updated_at) : '';
    const diasUsados  = esFinalizada(s.estado) && s.fecha_solicitud
      ? (diasHabilesEntre(s.fecha_solicitud, s.fecha_ultima_actualizacion || s.updated_at) ?? '')
      : '';
    const cumplioSLA = (() => {
      if (!esFinalizada(s.estado)) return 'En curso';
      if (!s.fecha_limite && !s.fecha_termino_sla) return 'Sin SLA';
      const limite = new Date(s.fecha_limite || s.fecha_termino_sla);
      const resol  = new Date(s.fecha_ultima_actualizacion || s.updated_at || Date.now());
      return resol <= limite ? 'Sí' : 'No';
    })();
    const asignado = s.asignado_a || '';
    const formato  = s.formato_preferido || s.formato_entrega || '';

    return [
      s.numero_solicitud, tipo, estado, nombre, rut, email,
      fSol, fLimite, fResolucion,
      diasUsados, cumplioSLA, asignado, formato,
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  const csv  = [cols.map(c => `"${c}"`).join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `reporte_arcop_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ── Reporte Ejecutivo TXT ─────────────────────────────────

const exportarReporteEjecutivo = (solicitudes, stats, periodo) => {
  const hoy      = new Date().toLocaleDateString('es-CL');
  const totales  = solicitudes.length;
  const resueltas = solicitudes.filter(s => esFinalizada(s.estado)).length;
  const tasaCumplimiento = totales > 0 ? Math.round((resueltas / totales) * 100) : 0;

  const DERECHOS = ['ACCESO','RECTIFICACION','CANCELACION','OPOSICION','PORTABILIDAD'];
  const porDerecho = DERECHOS
    .map(d => {
      const n = solicitudes.filter(s => getTipo(s) === d).length;
      return n > 0 ? `  - ${getTipoLabel(d)}: ${n} solicitud${n !== 1 ? 'es' : ''}` : null;
    }).filter(Boolean).join('\n');

  const slaVencidas = solicitudes.filter(s => {
    if (!esFinalizada(s.estado)) return false;
    const limite = s.fecha_limite || s.fecha_termino_sla;
    if (!limite) return false;
    const resol = s.fecha_ultima_actualizacion || s.updated_at;
    if (!resol) return false;
    return new Date(resol) > new Date(limite);
  }).length;

  const texto = `
================================================================================
  REPORTE DE CUMPLIMIENTO — PORTAL ARCOP
  Ley 21.719 sobre Protección de Datos Personales de Chile
================================================================================

Fecha de generación : ${hoy}
Período analizado   : ${periodo}

--------------------------------------------------------------------------------
1. RESUMEN EJECUTIVO
--------------------------------------------------------------------------------

Total de solicitudes recibidas   : ${totales}
Solicitudes resueltas            : ${resueltas}
Solicitudes en curso             : ${totales - resueltas}
Tasa de cumplimiento             : ${tasaCumplimiento}%
Solicitudes que excedieron SLA   : ${slaVencidas}
SLA legal (Ley 21.719 Art. 11)   : 15 días hábiles

--------------------------------------------------------------------------------
2. DISTRIBUCIÓN POR DERECHO ARCOP
--------------------------------------------------------------------------------

${porDerecho || '  Sin datos suficientes.'}

--------------------------------------------------------------------------------
3. DISTRIBUCIÓN POR ESTADO ACTUAL
--------------------------------------------------------------------------------

  - Pendientes  : ${stats?.pendientes  || 0}
  - Validadas   : ${stats?.validadas   || 0}
  - En Proceso  : ${stats?.en_proceso  || 0}
  - Resueltas   : ${stats?.resueltas   || 0}
  - Cerradas    : ${stats?.cerradas    || 0}

--------------------------------------------------------------------------------
4. INDICADORES DE CUMPLIMIENTO
--------------------------------------------------------------------------------

  Solicitudes respondidas dentro del plazo legal (15 días hábiles):
    ${slaVencidas === 0 ? '✓ Todas las solicitudes cumplieron con el plazo.' : `⚠ ${slaVencidas} solicitud(es) excedieron el plazo legal.`}

  Solicitudes con titular identificado: ${solicitudes.filter(s => s.rut).length} de ${totales}

--------------------------------------------------------------------------------
5. OBSERVACIONES PARA LA APDP
--------------------------------------------------------------------------------

  Este reporte ha sido generado automáticamente por Portal ARCOP en
  cumplimiento de los requisitos de documentación de la Ley 21.719.
  Los datos corresponden a solicitudes de derechos ARCOP gestionadas
  mediante el sistema de gestión digital del Responsable del Tratamiento.

  Para fiscalización: conservar junto al registro de actividades de tratamiento
  (RAT) y la política de privacidad vigente.

================================================================================
  Portal ARCOP — Sistema de gestión Ley 21.719
  Generado: ${new Date().toLocaleString('es-CL')}
================================================================================
`.trim();

  const blob = new Blob([texto], { type: 'text/plain;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `reporte_ejecutivo_arcop_${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ── Mini Bar Chart ────────────────────────────────────────

const MiniBarChart = ({ data, colorClass }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.valor), 1);
  return (
    <div className="flex items-end gap-1.5 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <div className="w-full flex items-end justify-center" style={{ height: 48 }}>
            <div
              className={`w-full rounded-t transition-all duration-500 ${colorClass}`}
              style={{ height: `${Math.max((d.valor / max) * 48, d.valor > 0 ? 4 : 0)}px` }}
              title={`${d.label}: ${d.valor}`}
            />
          </div>
          <span className="text-xs text-slate-400 truncate w-full text-center" style={{ fontSize: 10 }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Donut Chart ───────────────────────────────────────────

const DonutChart = ({ segments, size = 100 }) => {
  const r = 38;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.valor, 0);
  if (total === 0) return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="14" />
    </svg>
  );
  let offset = 0;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {segments.map((s, i) => {
        const pct  = s.valor / total;
        const dash = pct * circ;
        const gap  = circ - dash;
        const el   = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.stroke} strokeWidth="14"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
};

// ── KPI Card ──────────────────────────────────────────────

const KPICard = ({ icon: Icon, label, valor, sub, color, trend }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon style={{ width: 18, height: 18 }} />
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-semibold flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
          <ArrowUpRight style={{ width: 12, height: 12, transform: trend < 0 ? 'rotate(90deg)' : undefined }} />
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-900 leading-none">{valor}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── Tabla de Solicitudes ──────────────────────────────────

const TablaSolicitudes = ({ solicitudes }) => {
  const [sortCol, setSortCol] = useState('fecha_solicitud');
  const [sortDir, setSortDir] = useState('desc');
  const [pagina, setPagina]   = useState(1);
  const POR_PAGINA = 15;

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
    setPagina(1);
  };

  const sorted = useMemo(() => {
    return [...solicitudes].sort((a, b) => {
      let va = a[sortCol] || '';
      let vb = b[sortCol] || '';
      if (sortCol === 'fecha_solicitud' || sortCol === 'fecha_limite') {
        va = va ? new Date(va).getTime() : 0;
        vb = vb ? new Date(vb).getTime() : 0;
      }
      return sortDir === 'asc' ? (va < vb ? -1 : va > vb ? 1 : 0)
                               : (va > vb ? -1 : va < vb ? 1 : 0);
    });
  }, [solicitudes, sortCol, sortDir]);

  const total = sorted.length;
  const pages = Math.ceil(total / POR_PAGINA);
  const slice = sorted.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const Th = ({ col, label }) => (
    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 cursor-pointer select-none hover:text-slate-800 transition-colors whitespace-nowrap"
        onClick={() => toggleSort(col)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {sortCol === col
          ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
          : <ChevronDown className="w-3 h-3 text-slate-300" />}
      </span>
    </th>
  );

  const getSLAStatus = (s) => {
    const limite = s.fecha_limite || s.fecha_termino_sla;
    if (!limite) return null;
    if (esFinalizada(s.estado)) {
      const resol = s.fecha_ultima_actualizacion || s.updated_at;
      if (!resol) return null;
      return new Date(resol) <= new Date(limite)
        ? { label: 'Cumplió', cls: 'text-emerald-600' }
        : { label: 'Excedió', cls: 'text-rose-600' };
    }
    const diff = Math.ceil((new Date(limite) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0)  return { label: 'Vencido', cls: 'text-rose-700 font-semibold' };
    if (diff <= 3) return { label: `${diff}d`,  cls: 'text-amber-600 font-semibold' };
    return { label: `${diff}d`, cls: 'text-slate-400' };
  };

  if (solicitudes.length === 0) return (
    <div className="text-center py-16 text-slate-400">
      <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm">No hay solicitudes que coincidan con los filtros.</p>
    </div>
  );

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <Th col="numero_solicitud" label="N° Solicitud" />
              <Th col="tipo_derecho"     label="Derecho" />
              <Th col="estado"           label="Estado" />
              <Th col="nombre_completo"  label="Titular" />
              <Th col="fecha_solicitud"  label="Fecha ingreso" />
              <Th col="fecha_limite"     label="SLA / Plazo" />
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">Asignado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {slice.map((s, i) => {
              const sla  = getSLAStatus(s);
              const tipo = getTipo(s);
              return (
                <tr key={getSolicitudId(s) || i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700 whitespace-nowrap">
                    {s.numero_solicitud || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TIPO_COLORS[tipo] || 'bg-slate-100 text-slate-600'}`}>
                      {getTipoLabel(tipo) || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[s.estado] || 'bg-slate-100 text-slate-600'}`}>
                      {ESTADO_LABELS[s.estado] || s.estado || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-800 font-medium truncate max-w-[160px]">
                      {s.nombre_completo || s.nombre || '—'}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{s.rut || ''}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {fmt(s.fecha_solicitud)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs text-slate-500">{fmt(s.fecha_limite || s.fecha_termino_sla)}</div>
                    {sla && <div className={`text-xs mt-0.5 ${sla.cls}`}>{sla.label}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap max-w-[120px] truncate">
                    {s.asignado_a || <span className="text-slate-300">Sin asignar</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
          <span className="text-xs text-slate-500">
            Mostrando {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, total)} de {total}
          </span>
          <div className="flex gap-1">
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
              className="px-3 py-1.5 text-xs rounded border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors">
              Anterior
            </button>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
              const pg = pages <= 7 ? i + 1 : i === 0 ? 1 : i === 6 ? pages : pagina - 2 + i;
              return (
                <button key={pg} onClick={() => setPagina(pg)}
                  className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                    pagina === pg ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 hover:bg-white text-slate-600'
                  }`}>
                  {pg}
                </button>
              );
            })}
            <button onClick={() => setPagina(p => Math.min(pages, p + 1))} disabled={pagina === pages}
              className="px-3 py-1.5 text-xs rounded border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors">
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Panel de Gráficos ─────────────────────────────────────

const PanelGraficos = ({ solicitudes }) => {
  const DERECHOS = ['ACCESO','RECTIFICACION','CANCELACION','OPOSICION','PORTABILIDAD'];
  const DERECHO_COLORS = {
    ACCESO:        '#3b82f6',
    RECTIFICACION: '#f59e0b',
    CANCELACION:   '#ef4444',
    OPOSICION:     '#f97316',
    PORTABILIDAD:  '#22c55e',
  };

  const porDerecho = DERECHOS.map(d => ({
    label:  getTipoLabel(d).slice(0, 4),
    valor:  solicitudes.filter(s => getTipo(s) === d).length,
    stroke: DERECHO_COLORS[d],
  }));

  const porEstado = [
    { label: 'Pend.', valor: solicitudes.filter(s => s.estado === 'PENDIENTE').length,  stroke: '#f59e0b' },
    { label: 'Val.',  valor: solicitudes.filter(s => s.estado === 'VALIDADA').length,   stroke: '#0ea5e9' },
    { label: 'Proc.', valor: solicitudes.filter(s => s.estado === 'EN_PROCESO').length, stroke: '#8b5cf6' },
    { label: 'Res.',  valor: solicitudes.filter(s => esFinalizada(s.estado)).length,    stroke: '#22c55e' },
  ];

  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString('es-CL', { month: 'short' }) };
  });
  const tendencia = meses.map(m => ({
    label: m.label,
    valor: solicitudes.filter(s => {
      if (!s.fecha_solicitud) return false;
      const d = new Date(s.fecha_solicitud);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    }).length,
  }));

  const totalSol     = solicitudes.length;
  const donutDerecho = porDerecho.filter(d => d.valor > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* Donut por derecho */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Por derecho</h3>
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <DonutChart segments={donutDerecho.length > 0 ? donutDerecho : [{ valor: 1, stroke: '#e2e8f0' }]} size={90} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-slate-700">{totalSol}</span>
            </div>
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            {DERECHOS.map(d => {
              const n   = solicitudes.filter(s => getTipo(s) === d).length;
              const pct = totalSol > 0 ? Math.round((n / totalSol) * 100) : 0;
              return (
                <div key={d} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: DERECHO_COLORS[d] }} />
                  <span className="truncate text-slate-600 flex-1">{getTipoLabel(d)}</span>
                  <span className="font-semibold text-slate-700 flex-shrink-0">{n}</span>
                  <span className="text-slate-400 flex-shrink-0 w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Donut por estado */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Por estado actual</h3>
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <DonutChart segments={porEstado.filter(d => d.valor > 0)} size={90} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-slate-700">{totalSol}</span>
            </div>
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            {porEstado.map(e => {
              const pct = totalSol > 0 ? Math.round((e.valor / totalSol) * 100) : 0;
              return (
                <div key={e.label} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.stroke }} />
                  <span className="truncate text-slate-600 flex-1">{e.label}</span>
                  <span className="font-semibold text-slate-700 flex-shrink-0">{e.valor}</span>
                  <span className="text-slate-400 flex-shrink-0 w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tendencia mensual */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Tendencia (6 meses)</h3>
        <MiniBarChart data={tendencia} colorClass="bg-indigo-400" />
        <div className="mt-3 text-xs text-slate-400 flex justify-between">
          <span>Solicitudes por mes</span>
          <span>Total: {solicitudes.length}</span>
        </div>
      </div>

    </div>
  );
};

// ── Componente Principal ──────────────────────────────────

const Reportes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [stats, setStats]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const [busqueda, setBusqueda]         = useState('');
  const [filtroTipo, setFiltroTipo]     = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroSLA, setFiltroSLA]       = useState('');
  const [filtroDesde, setFiltroDesde]   = useState('');
  const [filtroHasta, setFiltroHasta]   = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, solRes] = await Promise.all([
        obtenerEstadisticas(),
        obtenerTodasSolicitudes({}),
      ]);
      if (statsRes.status === 'success') setStats(statsRes.data);
      if (solRes.status === 'success')   setSolicitudes(solRes.data || []);
      else setError('No se pudieron cargar las solicitudes.');
    } catch (e) {
      setError('Error de conexión: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const solicitudesFiltradas = useMemo(() => {
    let s = [...solicitudes];
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      s = s.filter(x =>
        (x.numero_solicitud || '').toLowerCase().includes(q) ||
        (x.nombre_completo || x.nombre || '').toLowerCase().includes(q) ||
        (x.rut || '').toLowerCase().includes(q) ||
        (x.email || '').toLowerCase().includes(q)
      );
    }
    if (filtroTipo)   s = s.filter(x => getTipo(x) === filtroTipo);
    if (filtroEstado) s = s.filter(x => x.estado === filtroEstado);
    if (filtroSLA === 'CUMPLE') s = s.filter(x => {
      if (!esFinalizada(x.estado)) return false;
      const l = x.fecha_limite || x.fecha_termino_sla; if (!l) return false;
      const r = x.fecha_ultima_actualizacion || x.updated_at; if (!r) return false;
      return new Date(r) <= new Date(l);
    });
    if (filtroSLA === 'EXCEDE') s = s.filter(x => {
      if (!esFinalizada(x.estado)) return false;
      const l = x.fecha_limite || x.fecha_termino_sla; if (!l) return false;
      const r = x.fecha_ultima_actualizacion || x.updated_at; if (!r) return false;
      return new Date(r) > new Date(l);
    });
    if (filtroSLA === 'EN_CURSO') s = s.filter(x => !esFinalizada(x.estado));
    if (filtroDesde) s = s.filter(x => x.fecha_solicitud && new Date(x.fecha_solicitud) >= new Date(filtroDesde));
    if (filtroHasta) s = s.filter(x => x.fecha_solicitud && new Date(x.fecha_solicitud) <= new Date(filtroHasta + 'T23:59:59'));
    return s;
  }, [solicitudes, busqueda, filtroTipo, filtroEstado, filtroSLA, filtroDesde, filtroHasta]);

  const hayFiltros = busqueda || filtroTipo || filtroEstado || filtroSLA || filtroDesde || filtroHasta;

  const limpiarFiltros = () => {
    setBusqueda(''); setFiltroTipo(''); setFiltroEstado('');
    setFiltroSLA(''); setFiltroDesde(''); setFiltroHasta('');
  };

  const kpis = useMemo(() => {
    const total     = solicitudes.length;
    const resueltas = solicitudes.filter(s => esFinalizada(s.estado)).length;
    const tasa      = total > 0 ? Math.round((resueltas / total) * 100) : 0;

    const conSLA = solicitudes.filter(s => {
      const l = s.fecha_limite || s.fecha_termino_sla;
      const r = s.fecha_ultima_actualizacion || s.updated_at;
      return esFinalizada(s.estado) && l && r;
    });
    const cumplieronSLA = conSLA.filter(s => {
      return new Date(s.fecha_ultima_actualizacion || s.updated_at) <= new Date(s.fecha_limite || s.fecha_termino_sla);
    }).length;
    const tasaSLA = conSLA.length > 0 ? Math.round((cumplieronSLA / conSLA.length) * 100) : null;

    const tiempos = conSLA.map(s =>
      diasHabilesEntre(s.fecha_solicitud, s.fecha_ultima_actualizacion || s.updated_at)
    ).filter(d => d !== null);
    const promedio = tiempos.length > 0
      ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length)
      : null;

    const vencen3d = solicitudes.filter(s => {
      if (esFinalizada(s.estado)) return false;
      const l = s.fecha_limite || s.fecha_termino_sla; if (!l) return false;
      const diff = (new Date(l) - new Date()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 3;
    }).length;

    return { total, tasa, tasaSLA, promedio, vencen3d };
  }, [solicitudes]);

  const periodo = (() => {
    if (filtroDesde && filtroHasta) return `${fmt(filtroDesde)} — ${fmt(filtroHasta)}`;
    if (filtroDesde) return `Desde ${fmt(filtroDesde)}`;
    if (filtroHasta) return `Hasta ${fmt(filtroHasta)}`;
    return 'Todas las fechas';
  })();

  if (loading) return (
    <div className="dpo-layout flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Loader className="w-8 h-8 animate-spin" />
        <span className="text-sm font-medium">Cargando reportes...</span>
      </div>
    </div>
  );

  return (
    <div className="dpo-layout py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-indigo-500 mb-1">Gestión de cumplimiento</p>
            <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>
            <p className="text-sm text-slate-400 mt-0.5">Métricas y evidencia de cumplimiento — Ley 21.719</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={cargarDatos}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-white transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Actualizar
            </button>
            <button onClick={() => exportarCSV(solicitudesFiltradas)}
              className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg transition-colors font-medium">
              <Download className="w-3.5 h-3.5" /> Exportar CSV
            </button>
            <button onClick={() => exportarReporteEjecutivo(solicitudesFiltradas, stats, periodo)}
              className="flex items-center gap-1.5 text-sm bg-slate-800 hover:bg-slate-900 text-white px-4 py-1.5 rounded-lg transition-colors font-medium">
              <FileText className="w-3.5 h-3.5" /> Reporte ejecutivo
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
            <AlertOctagon className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard icon={FileText}    label="Total solicitudes"  valor={kpis.total}  sub="Historial completo"  color="bg-indigo-50 text-indigo-600" />
          <KPICard icon={CheckCircle} label="Tasa de resolución" valor={`${kpis.tasa}%`} sub="Resueltas vs total" color="bg-emerald-50 text-emerald-600" />
          <KPICard icon={Award}       label="Cumplimiento SLA"   valor={kpis.tasaSLA !== null ? `${kpis.tasaSLA}%` : 'N/A'} sub="Respondidas dentro del plazo legal"
            color={kpis.tasaSLA !== null && kpis.tasaSLA < 80 ? 'bg-rose-50 text-rose-600' : 'bg-sky-50 text-sky-600'} />
          <KPICard icon={Clock}       label="Tiempo promedio"    valor={kpis.promedio !== null ? `${kpis.promedio}d` : 'N/A'} sub="Días hábiles por solicitud" color="bg-amber-50 text-amber-600" />
        </div>

        {kpis.vencen3d > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm font-medium">
              {kpis.vencen3d} solicitud{kpis.vencen3d !== 1 ? 'es' : ''} {kpis.vencen3d !== 1 ? 'vencen' : 'vence'} en los próximos 3 días
            </p>
          </div>
        )}

        {solicitudes.length > 0 && <PanelGraficos solicitudes={solicitudesFiltradas.length > 0 ? solicitudesFiltradas : solicitudes} />}

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Detalle de solicitudes</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {solicitudesFiltradas.length} de {solicitudes.length} solicitudes{hayFiltros && ' (filtrado)'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hayFiltros && (
                <button onClick={limpiarFiltros}
                  className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-lg transition-colors">
                  <X className="w-3 h-3" /> Limpiar
                </button>
              )}
              <button onClick={() => setMostrarFiltros(f => !f)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  mostrarFiltros || hayFiltros ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}>
                <Filter className="w-3.5 h-3.5" /> Filtros
                {hayFiltros && (
                  <span className="ml-1 bg-indigo-600 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                    {[busqueda, filtroTipo, filtroEstado, filtroSLA, filtroDesde, filtroHasta].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="px-5 py-3 border-b border-slate-100 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Buscar por número, nombre, RUT o email..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition" />
            </div>

            {mostrarFiltros && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Derecho</label>
                  <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                    <option value="">Todos</option>
                    {['ACCESO','RECTIFICACION','CANCELACION','OPOSICION','PORTABILIDAD'].map(d => (
                      <option key={d} value={d}>{getTipoLabel(d)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Estado</label>
                  <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                    <option value="">Todos</option>
                    {Object.entries(ESTADO_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">SLA</label>
                  <select value={filtroSLA} onChange={e => setFiltroSLA(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                    <option value="">Todos</option>
                    <option value="CUMPLE">Cumplió plazo</option>
                    <option value="EXCEDE">Excedió plazo</option>
                    <option value="EN_CURSO">En curso</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Desde</label>
                  <input type="date" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Hasta</label>
                  <input type="date" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white" />
                </div>
              </div>
            )}
          </div>

          <TablaSolicitudes solicitudes={solicitudesFiltradas} />
        </div>

        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Documentación para la Agencia de Protección de Datos (APDP)</p>
            <p>
              El reporte ejecutivo y el CSV exportados constituyen evidencia de cumplimiento según Art. 11 Ley 21.719.
              Conservarlos junto al Registro de Actividades de Tratamiento (RAT) y la Política de Privacidad vigente.
              El plazo legal máximo de respuesta es <strong>15 días hábiles</strong>.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Reportes;