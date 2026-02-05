import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader, AlertTriangle, TrendingUp, ArrowRight, Eye } from 'lucide-react';
import { obtenerTodasSolicitudes, obtenerEstadisticas } from '../services/dpoService';
import DashboardStats from '../components/dpo/DashboardStats';
import GraficosPanel from '../components/dpo/GraficosPanel';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      console.log('📊 Cargando datos del dashboard...');
      
      const [statsResult, solicitudesResult] = await Promise.all([
        obtenerEstadisticas(),
        obtenerTodasSolicitudes({})
      ]);

      if (statsResult.status === 'success') {
        setStats(statsResult.data);
        console.log('✅ Estadísticas cargadas:', statsResult.data);
      }
      
      if (solicitudesResult.status === 'success') {
        setSolicitudes(solicitudesResult.data);
        console.log('✅ Solicitudes cargadas:', solicitudesResult.data.length);
      }
    } catch (error) {
      console.error('❌ Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Calcular solicitudes recientes (últimas 5)
  const solicitudesRecientes = [...solicitudes]
    .sort((a, b) => new Date(b.fecha_solicitud) - new Date(a.fecha_solicitud))
    .slice(0, 5);

  // Calcular alertas
  const alertas = [];
  
  if (stats && stats.por_vencer > 0) {
    alertas.push({
      tipo: 'urgente',
      icono: AlertTriangle,
      mensaje: `${stats.por_vencer} solicitud${stats.por_vencer > 1 ? 'es' : ''} ${stats.por_vencer > 1 ? 'vencen' : 'vence'} en menos de 3 días`,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200'
    });
  }

  const sinAsignar = solicitudes.filter(s => !s.asignado_a && s.estado !== 'CERRADA' && s.estado !== 'RESUELTA').length;
  if (sinAsignar > 0) {
    alertas.push({
      tipo: 'warning',
      icono: AlertTriangle,
      mensaje: `${sinAsignar} solicitud${sinAsignar > 1 ? 'es' : ''} sin asignar`,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200'
    });
  }

  const pendientesValidacion = solicitudes.filter(s => s.estado === 'PENDIENTE').length;
  if (pendientesValidacion > 3) {
    alertas.push({
      tipo: 'info',
      icono: TrendingUp,
      mensaje: `${pendientesValidacion} solicitudes pendientes de validación`,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    });
  }

  const getEstadoBadge = (estado) => {
    const badges = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800',
      'VALIDADA': 'bg-blue-100 text-blue-800',
      'EN_PROCESO': 'bg-purple-100 text-purple-800',
      'RESUELTA': 'bg-green-100 text-green-800',
      'CERRADA': 'bg-gray-100 text-gray-800'
    };
    return badges[estado] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Vista general del sistema de gestión ARCOP</p>
        </div>

        {/* Estadísticas */}
        {stats && <DashboardStats stats={stats} />}

        {/* Alertas */}
        {alertas.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">⚠️ Alertas Importantes</h2>
            <div className="space-y-3">
              {alertas.map((alerta, index) => {
                const IconoAlerta = alerta.icono;
                return (
                  <div
                    key={index}
                    className={`${alerta.bg} border ${alerta.border} rounded-lg p-4 flex items-center gap-3`}
                  >
                    <IconoAlerta className={`w-6 h-6 ${alerta.color} flex-shrink-0`} />
                    <p className={`font-medium ${alerta.color} flex-grow`}>{alerta.mensaje}</p>
                    <Link
                      to="/dpo"
                      className={`text-sm ${alerta.color} hover:underline flex items-center gap-1 whitespace-nowrap`}
                    >
                      Ver solicitudes
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Gráficos */}
        {solicitudes.length > 0 && <GraficosPanel solicitudes={solicitudes} />}

        {/* Solicitudes Recientes */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">📋 Solicitudes Recientes</h2>
            <Link
              to="/dpo"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
            >
              Ver todas
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {solicitudesRecientes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay solicitudes recientes</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {solicitudesRecientes.map((sol) => (
                    <tr key={sol.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {sol.numero_solicitud}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {sol.nombre_completo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {sol.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoBadge(sol.estado)}`}>
                          {sol.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(sol.fecha_solicitud).toLocaleDateString('es-CL')}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/seguimiento/${sol.numero_solicitud}`}
                          target="_blank"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/dpo"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <div className="text-3xl mb-3">📋</div>
            <h3 className="font-semibold text-gray-900 mb-2">Gestionar Solicitudes</h3>
            <p className="text-sm text-gray-600">Ver y gestionar todas las solicitudes</p>
          </Link>

          <Link
            to="/dpo/reportes"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">Generar Reportes</h3>
            <p className="text-sm text-gray-600">Exportar datos y métricas</p>
          </Link>

          <Link
            to="/dpo/configuracion"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <div className="text-3xl mb-3">⚙️</div>
            <h3 className="font-semibold text-gray-900 mb-2">Configuración</h3>
            <p className="text-sm text-gray-600">Ajustes del sistema</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;