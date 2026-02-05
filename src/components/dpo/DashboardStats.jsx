import React from 'react';
import { FolderOpen, Clock, FileCheck, Repeat, CheckCheck, Bell } from 'lucide-react';

const DashboardStats = ({ stats }) => {
  if (!stats) return null;

  const tarjetas = [
    {
      titulo: 'Total',
      valor: stats.total,
      icono: FolderOpen,
      color: 'text-gray-400',
      bg: 'bg-white'
    },
    {
      titulo: 'Pendientes',
      valor: stats.pendientes,
      icono: Clock,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50'
    },
    {
      titulo: 'Validadas',
      valor: stats.validadas,
      icono: FileCheck,
      color: 'text-blue-500',
      bg: 'bg-blue-50'
    },
    {
      titulo: 'En Proceso',
      valor: stats.en_proceso,
      icono: Repeat,
      color: 'text-purple-500',
      bg: 'bg-purple-50'
    },
    {
      titulo: 'Resueltas',
      valor: stats.resueltas,
      icono: CheckCheck,
      color: 'text-green-500',
      bg: 'bg-green-50'
    },
    {
      titulo: 'Por Vencer',
      valor: stats.por_vencer,
      icono: Bell,
      color: 'text-red-500',
      bg: 'bg-red-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {tarjetas.map((tarjeta, index) => {
        const Icono = tarjeta.icono;
        return (
          <div key={index} className={`${tarjeta.bg} rounded-lg shadow p-6 transition-transform hover:scale-105`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">{tarjeta.titulo}</div>
              <Icono className={`w-8 h-8 ${tarjeta.color}`} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{tarjeta.valor}</div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;