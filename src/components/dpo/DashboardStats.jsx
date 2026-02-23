// ============================================================
// DashboardStats v2 — Cards estadísticas refinadas
// Línea de acento de color, números grandes, sin sombras
// ============================================================

import React from 'react';
import {
  Layers, Clock, BadgeCheck, RefreshCw,
  CheckCircle2, AlertCircle
} from 'lucide-react';

const TARJETAS = [
  {
    key:    'total',
    titulo: 'Total',
    icon:   Layers,
    accent: 'bg-slate-700',
    iconColor: 'text-slate-500',
    numColor:  'text-slate-900',
  },
  {
    key:    'pendientes',
    titulo: 'Pendientes',
    icon:   Clock,
    accent: 'bg-amber-500',
    iconColor: 'text-amber-500',
    numColor:  'text-amber-700',
  },
  {
    key:    'validadas',
    titulo: 'Validadas',
    icon:   BadgeCheck,
    accent: 'bg-sky-500',
    iconColor: 'text-sky-500',
    numColor:  'text-sky-700',
  },
  {
    key:    'en_proceso',
    titulo: 'En Proceso',
    icon:   RefreshCw,
    accent: 'bg-violet-500',
    iconColor: 'text-violet-500',
    numColor:  'text-violet-700',
  },
  {
    key:    'resueltas',
    titulo: 'Resueltas',
    icon:   CheckCircle2,
    accent: 'bg-emerald-500',
    iconColor: 'text-emerald-500',
    numColor:  'text-emerald-700',
  },
  {
    key:    'por_vencer',
    titulo: 'Por Vencer',
    icon:   AlertCircle,
    accent: 'bg-rose-500',
    iconColor: 'text-rose-500',
    numColor:  'text-rose-700',
  },
];

const DashboardStats = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {TARJETAS.map(({ key, titulo, icon: Icon, accent, iconColor, numColor }) => (
        <div
          key={key}
          className="bg-white rounded-lg border border-slate-200 overflow-hidden"
        >
          {/* Línea de acento superior */}
          <div className={`h-0.5 w-full ${accent}`} />
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {titulo}
              </span>
              <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={2} />
            </div>
            <span className={`text-3xl font-bold tabular-nums ${numColor}`}>
              {stats[key] ?? 0}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;