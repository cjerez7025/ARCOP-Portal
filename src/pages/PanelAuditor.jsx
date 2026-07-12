import React, { useState, useEffect } from 'react';
import { Eye, Download, BarChart2 } from 'lucide-react';
import { useRol } from '../hooks/useRol';
import adapter from '../adapters';

export default function PanelAuditor() {
  const { esAuditor } = useRol();
  const [solicitudes, setSolicitudes] = useState([]);
  const [stats, setStats]             = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    async function cargar() {
      const [solRes, statsRes] = await Promise.all([
        adapter.getSolicitudes({}),
        adapter.getEstadisticas(),
      ]);
      if (solRes.status === 'success')   setSolicitudes(solRes.data);
      if (statsRes.status === 'success') setStats(statsRes.data);
      setLoading(false);
    }
    cargar();
  }, []);

  function exportarCSV() {
    const headers = ['Número', 'Tipo', 'Titular', 'RUT', 'Estado',
      'Fecha solicitud', 'Asignado a'];
    const rows = solicitudes.map(s => [
      s.numero_solicitud, s.tipo_derecho, s.nombre_completo,
      s.rut, s.estado,
      s.fecha_solicitud
        ? new Date(s.fecha_solicitud).toLocaleDateString('es-CL') : '—',
      s.asignado_a || '—',
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `audit_solicitudes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!esAuditor) return (
    <div className="p-8 text-center text-slate-400">
      No tienes permisos para esta sección.
    </div>
  );

  return (
    <div className="dpo-layout">
      <div className="max-w-6xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Vista de Auditoría</h1>
            <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-medium">
              Solo lectura
            </span>
          </div>
          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total solicitudes', value: stats.total },
              { label: 'Pendientes',        value: stats.pendientes },
              { label: 'En proceso',        value: stats.en_proceso },
              { label: 'Vencidas',          value: stats.vencidas, danger: stats.vencidas > 0 },
            ].map(({ label, value, danger }) => (
              <div key={label} className={`rounded-xl p-4 border ${
                danger ? 'bg-red-50 border-red-200' : 'glass-card'
              }`}>
                <p className={`text-2xl font-bold ${danger ? 'text-red-600' : 'text-gray-900'}`}>{value ?? '—'}</p>
                <p className={`text-xs mt-1 ${danger ? 'text-red-500' : 'text-gray-500'}`}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-400 py-12">Cargando...</p>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Número', 'Tipo', 'Titular', 'Estado', 'Fecha', 'Asignado a'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {solicitudes.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">
                      {s.numero_solicitud}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.tipo_derecho}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{s.nombre_completo}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2 py-1 rounded-full">
                        {s.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {s.fecha_solicitud
                        ? new Date(s.fecha_solicitud).toLocaleDateString('es-CL')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {s.asignado_a || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {solicitudes.length === 0 && (
              <p className="text-center text-gray-400 py-8 text-sm">No hay solicitudes</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
