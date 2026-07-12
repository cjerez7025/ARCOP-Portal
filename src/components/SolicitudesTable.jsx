// ============================================================
// src/components/SolicitudesTable.jsx
// CAMBIOS:
//   - tipo: usa tipo_derecho || tipo (fallback para datos legacy)
//   - getField busca tipo_derecho primero, luego tipo
// ============================================================

import React, { useState, useMemo } from 'react';
import { Eye, Edit2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────

const getField = (sol, field) => {
  if (!sol) return null;

  if (field === 'tipo_derecho' || field === 'tipo') {
    const v = sol['tipo_derecho'] ?? sol['tipo'];
    return (v !== undefined && v !== null && v !== '') ? v : null;
  }

  for (const k of [field, field.toUpperCase(), field.toLowerCase()]) {
    if (sol[k] !== undefined && sol[k] !== null && sol[k] !== '') return sol[k];
  }
  return null;
};

const formatFecha = (sol) => {
  const raw = sol.fecha_solicitud || sol.creado_en || sol.updatedAt;
  if (!raw) return 'Sin fecha';
  try {
    return new Date(raw).toLocaleDateString('es-CL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch { return 'Sin fecha'; }
};

const ESTADO_BADGES = {
  PENDIENTE:           { cls: 'bg-amber-100 text-amber-700 border border-amber-200',    label: 'Pendiente' },
  VALIDADA:            { cls: 'bg-blue-100 text-blue-700 border border-blue-200',       label: 'Validada' },
  EN_PROCESO:          { cls: 'bg-violet-100 text-violet-700 border border-violet-200', label: 'En proceso' },
  RESUELTA:            { cls: 'bg-green-100 text-green-700 border border-green-200',    label: 'Resuelta' },
  DESCARGA_CONFIRMADA: { cls: 'bg-green-100 text-green-700 border border-green-200',    label: 'Descarga confirmada' },
  CERRADA:             { cls: 'bg-gray-100 text-gray-600 border border-gray-200',       label: 'Cerrada' },
  DESISTIDA:           { cls: 'bg-rose-100 text-rose-600 border border-rose-200',       label: 'Desistida' },
};

const getEstadoBadge = (estadoId) =>
  ESTADO_BADGES[estadoId] || { cls: 'bg-gray-100 text-gray-600 border border-gray-200', label: estadoId || 'Desconocido' };

const TIPO_LABELS = {
  ACCESO:        'Acceso',
  RECTIFICACION: 'Rectificación',
  CANCELACION:   'Cancelación',
  OPOSICION:     'Oposición',
  PORTABILIDAD:  'Portabilidad',
};

const getTipoLabel = (tipo) => TIPO_LABELS[tipo] || tipo || '—';

// ── Columnas ──────────────────────────────────────────────
const COLUMNS = [
  { label: '#',        field: null },
  { label: 'Nombre',   field: 'nombre_completo' },
  { label: 'RUT',      field: 'rut' },
  { label: 'Email',    field: 'email' },
  { label: 'Estado',   field: 'estado' },
  { label: 'Tipo',     field: 'tipo_derecho' },
  { label: 'Fecha',    field: 'fecha_solicitud' },
  { label: 'Acciones', field: null },
];

// ── Componente ────────────────────────────────────────────
const SolicitudesTable = ({ solicitudes = [], onVerDetalle, onCambiarEstado, onMarcarResuelta }) => {
  const [sortCol, setSortCol] = useState('fecha_solicitud');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (field) => {
    if (!field) return;
    if (sortCol === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(field);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    if (!sortCol) return solicitudes;
    return [...solicitudes].sort((a, b) => {
      let va = getField(a, sortCol) ?? '';
      let vb = getField(b, sortCol) ?? '';
      if (sortCol.includes('fecha')) {
        va = va ? new Date(va).getTime() : 0;
        vb = vb ? new Date(vb).getTime() : 0;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [solicitudes, sortCol, sortDir]);

  if (!solicitudes.length) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        No hay solicitudes para mostrar.
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile cards (< md) ─────────────────────────── */}
      <div className="md:hidden divide-y divide-gray-100">
        {sorted.map((sol, idx) => {
          const nombre   = getField(sol, 'nombre_completo') || 'Sin nombre';
          const rut      = getField(sol, 'rut')             || 'Sin RUT';
          const email    = getField(sol, 'email')           || 'Sin email';
          const estadoId = getField(sol, 'estado')          || 'PENDIENTE';
          const tipoRaw  = getField(sol, 'tipo_derecho')    || null;
          const tipo     = getTipoLabel(tipoRaw);
          const fecha    = formatFecha(sol);
          const { cls, label } = getEstadoBadge(estadoId);
          const esFinal  = ['RESUELTA', 'CERRADA', 'DESCARGA_CONFIRMADA'].includes(estadoId);
          return (
            <div key={sol.id || idx} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{nombre}</p>
                  <p className="text-xs text-gray-500">{rut}</p>
                </div>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${cls}`}>{label}</span>
              </div>
              <p className="text-xs text-gray-500 truncate">{email}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {tipoRaw && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {tipo}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{fecha}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onVerDetalle?.(sol)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  {!esFinal && (
                    <button onClick={() => onCambiarEstado?.(sol)}
                      className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Desktop table (≥ md) ─────────────────────────── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {COLUMNS.map(({ label, field }) => {
                const sortable = !!field;
                const isActive = sortCol === field;
                return (
                  <th
                    key={label}
                    onClick={() => handleSort(field)}
                    className={`px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider select-none
                      ${sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors' : 'cursor-default'}
                      ${isActive ? 'text-blue-600' : 'text-gray-500'}
                    `}
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {sortable && (
                        isActive
                          ? sortDir === 'asc'
                            ? <ChevronUp   className="w-3.5 h-3.5 text-blue-500" />
                            : <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
                          : <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300" />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {sorted.map((sol, idx) => {
              const nombre   = getField(sol, 'nombre_completo') || 'Sin nombre';
              const rut      = getField(sol, 'rut')             || 'Sin RUT';
              const email    = getField(sol, 'email')           || 'Sin email';
              const estadoId = getField(sol, 'estado')          || 'PENDIENTE';
              const tipoRaw  = getField(sol, 'tipo_derecho')    || null;
              const tipo     = getTipoLabel(tipoRaw);
              const fecha    = formatFecha(sol);
              const { cls, label } = getEstadoBadge(estadoId);
              const esFinal  = ['RESUELTA', 'CERRADA', 'DESCARGA_CONFIRMADA'].includes(estadoId);

              return (
                <tr key={sol.id || idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 text-sm text-gray-400">{idx + 1}</td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-gray-900">{nombre}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{rut}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{email}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full ${cls}`}>
                      {label}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {tipoRaw
                      ? <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">{tipo}</span>
                      : <span className="text-gray-300">—</span>
                    }
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{fecha}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button onClick={() => onVerDetalle?.(sol)} title="Ver detalle"
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      {!esFinal && (
                        <button onClick={() => onCambiarEstado?.(sol)} title="Cambiar estado"
                          className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default SolicitudesTable;
