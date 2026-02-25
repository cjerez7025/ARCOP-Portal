// ============================================================
// SOLICITUDES TABLE — v3
// Cambios respecto v2:
//   - Cabeceras NOMBRE, ESTADO, TIPO, FECHA son clickeables
//   - Indicador visual ↑↓ en columna activa (ChevronUp/Down)
//   - Columnas inactivas muestran selector neutro (ChevronsUpDown)
//   - Sort interno con useState — no modifica el array del padre
// ============================================================

import React, { useState, useMemo } from 'react';
import { Eye, Edit, CheckCircle, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

const COLOR_CLASSES = {
  yellow: 'bg-yellow-100 text-yellow-800',
  blue:   'bg-blue-100   text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  green:  'bg-green-100  text-green-800',
  gray:   'bg-gray-100   text-gray-700',
  red:    'bg-red-100    text-red-800',
  orange: 'bg-orange-100 text-orange-800',
  teal:   'bg-teal-100   text-teal-800',
  indigo: 'bg-indigo-100 text-indigo-800',
  pink:   'bg-pink-100   text-pink-800',
};

const FALLBACK_COLORS = {
  PENDIENTE:  'bg-yellow-100 text-yellow-800',
  VALIDADA:   'bg-blue-100   text-blue-800',
  EN_PROCESO: 'bg-purple-100 text-purple-800',
  RESUELTA:   'bg-green-100  text-green-800',
  CERRADA:    'bg-gray-100   text-gray-700',
  BLOQUEADO:  'bg-orange-100 text-orange-800',
};

// Columnas que NO son ordenables
const NO_SORT = ['#', 'RUT', 'Email', 'Acciones'];

const SolicitudesTable = ({ solicitudes, estadosDef = [], onVerDetalle, onCambiarEstado, onMarcarResuelta }) => {

  const [sortCol, setSortCol] = useState('fecha_solicitud');
  const [sortDir, setSortDir] = useState('desc');

  const getField = (obj, field) => {
    if (!obj) return '';
    return obj[field] ?? obj[field.toUpperCase()] ?? obj[field.toLowerCase()] ?? '';
  };

  const formatFecha = (sol) => {
    const val = getField(sol, 'fecha_solicitud');
    if (!val) return 'Sin fecha';
    try {
      const d = val instanceof Date ? val : new Date(val);
      return isNaN(d.getTime()) ? 'Sin fecha' : d.toLocaleDateString('es-CL');
    } catch { return 'Sin fecha'; }
  };

  const getEstadoBadge = (estadoId) => {
    const def = estadosDef.find(e => e.id === estadoId);
    if (def) {
      const cls = COLOR_CLASSES[def.color] || COLOR_CLASSES.gray;
      return { cls, label: def.nombre };
    }
    return {
      cls:   FALLBACK_COLORS[estadoId] || COLOR_CLASSES.gray,
      label: estadoId,
    };
  };

  // ── Columnas con su campo de datos ────────────────────────
  const COLS = [
    { label: '#',        field: null },
    { label: 'Nombre',   field: 'nombre_completo' },
    { label: 'RUT',      field: null },
    { label: 'Email',    field: null },
    { label: 'Estado',   field: 'estado' },
    { label: 'Tipo',     field: 'tipo' },
    { label: 'Fecha',    field: 'fecha_solicitud' },
    { label: 'Acciones', field: null },
  ];

  const handleSort = (field) => {
    if (!field) return;
    if (sortCol === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(field);
      setSortDir('asc');
    }
  };

  // ── Sort interno ──────────────────────────────────────────
  const sorted = useMemo(() => {
    if (!sortCol) return solicitudes;
    return [...solicitudes].sort((a, b) => {
      let va = getField(a, sortCol) || '';
      let vb = getField(b, sortCol) || '';
      // Fechas como timestamps
      if (sortCol === 'fecha_solicitud') {
        va = va ? new Date(va).getTime() : 0;
        vb = vb ? new Date(vb).getTime() : 0;
      } else {
        va = va.toString().toLowerCase();
        vb = vb.toString().toLowerCase();
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
  }, [solicitudes, sortCol, sortDir]);

  if (!solicitudes || solicitudes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No hay solicitudes para mostrar</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {COLS.map(({ label, field }) => {
              const sortable = !!field;
              const isActive = sortCol === field;

              return (
                <th
                  key={label}
                  onClick={() => handleSort(field)}
                  className={`px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider select-none
                    ${sortable
                      ? 'cursor-pointer hover:bg-gray-100 transition-colors'
                      : 'cursor-default'}
                    ${isActive ? 'text-indigo-600' : 'text-gray-500'}
                  `}
                >
                  <span className="inline-flex items-center gap-1">
                    {label}
                    {sortable && (
                      isActive
                        ? sortDir === 'asc'
                          ? <ChevronUp   className="w-3.5 h-3.5 text-indigo-500" />
                          : <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />
                        : <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300" />
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sorted.map((sol, idx) => {
            const nombre   = getField(sol, 'nombre_completo') || 'Sin nombre';
            const rut      = getField(sol, 'rut')             || 'Sin RUT';
            const email    = getField(sol, 'email')           || 'Sin email';
            const estadoId = getField(sol, 'estado')          || 'PENDIENTE';
            const tipo     = getField(sol, 'tipo')            || '—';
            const fecha    = formatFecha(sol);
            const { cls, label } = getEstadoBadge(estadoId);
            const esFinal  = ['RESUELTA', 'CERRADA'].includes(estadoId);

            return (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
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
                <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{tipo}</td>
                <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{fecha}</td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button onClick={() => onVerDetalle(sol)} title="Ver detalle"
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    {onCambiarEstado && !esFinal && (
                      <button onClick={() => onCambiarEstado(sol)} title="Cambiar estado"
                        className="p-1.5 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {onMarcarResuelta && !esFinal && (
                      <button onClick={() => onMarcarResuelta(sol)} title="Marcar resuelta"
                        className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors">
                        <CheckCircle className="w-4 h-4" />
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
  );
};

export default SolicitudesTable;