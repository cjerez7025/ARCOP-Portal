/**
 * SolicitudesTable.jsx
 * Tabla de solicitudes con todas las acciones DPO
 */

import React from 'react';
import { Eye, Edit, CheckCircle } from 'lucide-react';
import { ESTADO_COLORS, ESTADO_LABELS } from '../utils/constants';

const SolicitudesTable = ({ solicitudes, onVerDetalle, onCambiarEstado, onMarcarResuelta }) => {
  
  /**
   * Obtiene valor de campo con fallback a mayúsculas/minúsculas
   */
  const getFieldValue = (solicitud, fieldName) => {
    // Intentar minúsculas
    if (solicitud[fieldName] !== undefined) {
      return solicitud[fieldName];
    }
    
    // Intentar mayúsculas
    const upperField = fieldName.toUpperCase();
    if (solicitud[upperField] !== undefined) {
      return solicitud[upperField];
    }
    
    // Intentar con guiones bajos en mayúsculas
    const snakeUpper = fieldName.replace(/([A-Z])/g, '_$1').toUpperCase();
    if (solicitud[snakeUpper] !== undefined) {
      return solicitud[snakeUpper];
    }
    
    return '';
  };

  /**
   * Formatea fecha desde diferentes formatos posibles
   */
  const formatearFecha = (solicitud) => {
    const fechaSolicitud = getFieldValue(solicitud, 'fecha_solicitud') || 
                          getFieldValue(solicitud, 'FECHA_SOLICITUD');
    
    if (!fechaSolicitud) return 'Sin fecha';
    
    try {
      // Si es objeto Date de Sheets
      if (fechaSolicitud instanceof Date) {
        return fechaSolicitud.toLocaleDateString('es-CL');
      }
      
      // Si es string ISO
      if (typeof fechaSolicitud === 'string') {
        const date = new Date(fechaSolicitud);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('es-CL');
        }
      }
      
      return 'Fecha inválida';
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  /**
   * Obtiene color del badge según estado
   */
  const getEstadoColor = (estado) => {
    const colores = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800',
      'VALIDADA': 'bg-blue-100 text-blue-800',
      'EN_PROCESO': 'bg-purple-100 text-purple-800',
      'RESUELTA': 'bg-green-100 text-green-800',
      'CERRADA': 'bg-gray-100 text-gray-800'
    };
    
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nombre
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              RUT
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Formato
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {solicitudes.map((solicitud, index) => {
            const nombre = getFieldValue(solicitud, 'nombre_completo') || 
                          getFieldValue(solicitud, 'NOMBRE_COMPLETO') || 
                          'Sin nombre';
            
            const rut = getFieldValue(solicitud, 'rut') || 
                       getFieldValue(solicitud, 'RUT') || 
                       'Sin RUT';
            
            const email = getFieldValue(solicitud, 'email') || 
                         getFieldValue(solicitud, 'EMAIL') || 
                         'Sin email';
            
            const estado = getFieldValue(solicitud, 'estado') || 
                          getFieldValue(solicitud, 'ESTADO') || 
                          'PENDIENTE';
            
            const formato = getFieldValue(solicitud, 'formato_preferido') || 
                           getFieldValue(solicitud, 'FORMATO_PREFERIDO') || 
                           'PDF';
            
            const fecha = formatearFecha(solicitud);
            
            return (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{nombre}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{rut}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoColor(estado)}`}>
                    {ESTADO_LABELS[estado] || estado}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formato}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {fecha}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    {/* Ver Detalle */}
                    <button
                      onClick={() => onVerDetalle(solicitud)}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                      title="Ver detalle"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {/* Cambiar Estado (si las funciones están disponibles) */}
                    {onCambiarEstado && (
                      <button
                        onClick={() => onCambiarEstado(solicitud)}
                        className="text-yellow-600 hover:text-yellow-900 inline-flex items-center gap-1"
                        title="Cambiar estado"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* Marcar Resuelta (solo si no está resuelta) */}
                    {onMarcarResuelta && estado !== 'RESUELTA' && estado !== 'CERRADA' && (
                      <button
                        onClick={() => onMarcarResuelta(solicitud)}
                        className="text-green-600 hover:text-green-900 inline-flex items-center gap-1"
                        title="Marcar resuelta"
                      >
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