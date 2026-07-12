// ============================================================
// Dashboard v2 — Sin emojis, estética institucional refinada
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader, AlertTriangle, TrendingUp, ArrowRight, Eye,
  ClipboardList, BarChart2, Settings, AlertOctagon
} from 'lucide-react';
import { obtenerTodasSolicitudes, obtenerEstadisticas } from '../services/dpoService';
import DashboardStats from '../components/dpo/DashboardStats';
import GraficosPanel from '../components/dpo/GraficosPanel';

const ESTADO_STYLES = {
  PENDIENTE:  { label: 'Pendiente',  cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'    },
  VALIDADA:   { label: 'Validada',   cls: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'          },
  EN_PROCESO: { label: 'En Proceso', cls: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' },
  RESUELTA:   { label: 'Resuelta',   cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  CERRADA:    { label: 'Cerrada',    cls: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'   },
};

const Dashboard = () => {
  const [stats, setStats]             = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [statsRes, solRes] = await Promise.all([
        obtenerEstadisticas(),
        obtenerTodasSolicitudes({}),
      ]);
      if (statsRes.status === 'success') setStats(statsRes.data);
      if (solRes.status   === 'success') setSolicitudes(solRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="dpo-layout flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Loader className="w-8 h-8 animate-spin" />
        <span className="text-sm font-medium">Cargando datos...</span>
      </div>
    </div>
  );

  const recientes = [...solicitudes]
    .sort((a, b) => new Date(b.fecha_solicitud) - new Date(a.fecha_solicitud))
    .slice(0, 5);

  // Alertas
  const alertas = [];
  if (stats?.por_vencer > 0) alertas.push({
    icon:   AlertOctagon,
    msg:    `${stats.por_vencer} solicitud${stats.por_vencer > 1 ? 'es' : ''} vence${stats.por_vencer > 1 ? 'n' : ''} en menos de 3 días`,
    color:  'text-rose-700',
    bg:     'bg-rose-50',
    border: 'border-rose-200',
    filtro: { por_vencer: true },
  });

  const sinAsignar = solicitudes.filter(
    s => !s.asignado_a && !['CERRADA','RESUELTA'].includes(s.estado)
  ).length;
  if (sinAsignar > 0) alertas.push({
    icon:   AlertTriangle,
    msg:    `${sinAsignar} solicitud${sinAsignar > 1 ? 'es' : ''} sin responsable asignado`,
    color:  'text-amber-700',
    bg:     'bg-amber-50',
    border: 'border-amber-200',
    filtro: { sin_asignar: true },
  });

  const pendVal = solicitudes.filter(s => s.estado === 'PENDIENTE').length;
  if (pendVal > 3) alertas.push({
    icon:   TrendingUp,
    msg:    `${pendVal} solicitudes pendientes de validación`,
    color:  'text-sky-700',
    bg:     'bg-sky-50',
    border: 'border-sky-200',
    filtro: { estado: 'PENDIENTE' },
  });

  const ACCIONES = [
    {
      to:     '/dpo',
      icon:   ClipboardList,
      titulo: 'Gestionar Solicitudes',
      desc:   'Revisar y cambiar el estado de las solicitudes activas',
      color:  'text-indigo-600',
      bg:     'bg-indigo-50',
    },
    {
      to:     '/dpo/reportes',
      icon:   BarChart2,
      titulo: 'Generar Reportes',
      desc:   'Exportar métricas y datos de cumplimiento',
      color:  'text-emerald-600',
      bg:     'bg-emerald-50',
    },
    {
      to:     '/dpo/configuracion',
      icon:   Settings,
      titulo: 'Configuración',
      desc:   'Ajustes del sistema, flujos y notificaciones',
      color:  'text-slate-600',
      bg:     'bg-slate-100',
    },
  ];

  return (
    <div className="dpo-layout py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-indigo-500 mb-1">
              Panel de control
            </p>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Sistema de gestión ARCOP — Ley 21.719
            </p>
          </div>
          <button
            onClick={cargarDatos}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-md hover:bg-white transition-colors"
          >
            Actualizar
          </button>
        </div>

        {/* Stats */}
        {stats && <DashboardStats stats={stats} />}

        {/* Alertas */}
        {alertas.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-slate-400">
              Alertas activas
            </h2>
            {alertas.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${a.bg} ${a.border}`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${a.color}`} strokeWidth={2} />
                  <p className={`text-sm font-medium flex-grow ${a.color}`}>{a.msg}</p>
                  <Link
                    to="/dpo"
                    state={{ filtro: a.filtro }}
                    className={`flex items-center gap-1 text-xs font-semibold ${a.color} hover:opacity-70 whitespace-nowrap`}
                  >
                    Ver <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Gráficos */}
        {solicitudes.length > 0 && <GraficosPanel solicitudes={solicitudes} />}

        {/* Solicitudes recientes */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-gray-900">Solicitudes recientes</h2>
            <Link to="/dpo"
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recientes.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">Sin solicitudes registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Número','Titular','Email','Estado','Fecha',''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recientes.map(sol => {
                    const est = ESTADO_STYLES[sol.estado] || ESTADO_STYLES.CERRADA;
                    return (
                      <tr key={sol.id || sol.numero_solicitud}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-700">
                          {sol.numero_solicitud}
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-800">
                          {sol.nombre_completo}
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {sol.email}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${est.cls}`}>
                            {est.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-400 tabular-nums">
                          {new Date(sol.fecha_solicitud).toLocaleDateString('es-CL')}
                        </td>
                        <td className="px-5 py-3">
                          <Link
                            to={`/seguimiento/${sol.numero_solicitud}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            <Eye className="w-3.5 h-3.5" /> Ver
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div>
          <h2 className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-3">
            Acciones rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {ACCIONES.map(({ to, icon: Icon, titulo, desc, color, bg }) => (
              <Link key={to} to={to}
                className="group flex items-start gap-4 glass-card rounded-xl p-5 hover:border-blue-300 transition-all"
              >
                <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                    {titulo}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;