import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Clock, Loader, AlertCircle, Download } from 'lucide-react';

const APPS_SCRIPT_URL = process.env.REACT_APP_APPS_SCRIPT_URL;

const Seguimiento = () => {
  const { numero } = useParams();
  const [solicitud, setSolicitud] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarSeguimiento();
  }, [numero]);

  const cargarSeguimiento = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        action: 'obtenerSeguimiento',
        numero: numero
      });
      
      const response = await fetch(`${APPS_SCRIPT_URL}?${params}`);
      const result = await response.json();
      
      if (result.status === 'success') {
        setSolicitud(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error al cargar seguimiento');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoInfo = (estado) => {
    const estados = {
      'PENDIENTE': { 
        icon: Clock, 
        color: 'text-yellow-600', 
        bg: 'bg-yellow-50', 
        texto: 'Pendiente de validación',
        descripcion: 'Hemos recibido tu solicitud y está en proceso de validación.'
      },
      'VALIDADA': { 
        icon: CheckCircle, 
        color: 'text-blue-600', 
        bg: 'bg-blue-50', 
        texto: 'Identidad validada',
        descripcion: 'Tu identidad ha sido confirmada. Estamos procesando tu solicitud.'
      },
      'EN_PROCESO': { 
        icon: Loader, 
        color: 'text-purple-600', 
        bg: 'bg-purple-50', 
        texto: 'En proceso',
        descripcion: 'Estamos recopilando tus datos personales activamente.'
      },
      'RESUELTA': { 
        icon: CheckCircle, 
        color: 'text-green-600', 
        bg: 'bg-green-50', 
        texto: '¡Datos listos!',
        descripcion: 'Tus datos personales están disponibles para descarga.'
      },
      'CERRADA': { 
        icon: CheckCircle, 
        color: 'text-gray-600', 
        bg: 'bg-gray-50', 
        texto: 'Cerrada',
        descripcion: 'Solicitud completada exitosamente.'
      }
    };
    return estados[estado] || estados['PENDIENTE'];
  };

  const getEstadoStep = (estadoActual) => {
    const orden = ['PENDIENTE', 'VALIDADA', 'EN_PROCESO', 'RESUELTA', 'CERRADA'];
    return orden.indexOf(estadoActual);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando seguimiento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitud no encontrada</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <a 
            href="/#/" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  const estadoInfo = getEstadoInfo(solicitud.estado);
  const EstadoIcon = estadoInfo.icon;
  const stepActual = getEstadoStep(solicitud.estado);

  const steps = [
    { nombre: 'Recibida', estado: 'PENDIENTE' },
    { nombre: 'Validada', estado: 'VALIDADA' },
    { nombre: 'En Proceso', estado: 'EN_PROCESO' },
    { nombre: 'Resuelta', estado: 'RESUELTA' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Seguimiento de Solicitud
              </h1>
              <p className="text-lg text-gray-600">#{solicitud.numero_solicitud}</p>
            </div>
            <div className={`${estadoInfo.bg} ${estadoInfo.color} px-4 py-2 rounded-lg flex items-center gap-2`}>
              <EstadoIcon className="w-5 h-5" />
              <span className="font-semibold">{estadoInfo.texto}</span>
            </div>
          </div>

          {/* Información del Solicitante */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Nombre completo</p>
              <p className="font-semibold text-gray-900">{solicitud.nombre_completo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">RUT</p>
              <p className="font-semibold text-gray-900">{solicitud.rut}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-semibold text-gray-900">{solicitud.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Teléfono</p>
              <p className="font-semibold text-gray-900">{solicitud.telefono || 'No proporcionado'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fecha de solicitud</p>
              <p className="font-semibold text-gray-900">
                {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-CL', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fecha límite</p>
              <p className="font-semibold text-gray-900">
                {new Date(solicitud.fecha_limite).toLocaleDateString('es-CL', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Estado Actual */}
        <div className={`${estadoInfo.bg} rounded-lg shadow-lg p-6 mb-6`}>
          <div className="flex items-center gap-4 mb-4">
            <EstadoIcon className={`w-12 h-12 ${estadoInfo.color}`} />
            <div>
              <h2 className={`text-2xl font-bold ${estadoInfo.color}`}>
                {estadoInfo.texto}
              </h2>
              <p className="text-gray-700 mt-1">{estadoInfo.descripcion}</p>
            </div>
          </div>

          {solicitud.dias_restantes > 0 && solicitud.estado !== 'RESUELTA' && solicitud.estado !== 'CERRADA' && (
            <div className="mt-4 p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-600">
                ⏰ Quedan <span className="font-bold text-gray-900">{solicitud.dias_restantes} días</span> para el plazo legal
              </p>
            </div>
          )}

          {/* Botón de descarga si está resuelta */}
          {solicitud.estado === 'RESUELTA' && solicitud.url_descarga && (
            <div className="mt-4">
              <a
                href={solicitud.url_descarga}
                className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
              >
                <Download className="w-6 h-6" />
                Descargar mis datos ({solicitud.formato_preferido})
              </a>
              <p className="text-sm text-gray-600 text-center mt-2">
                ⚠️ Este link expira en 48 horas por seguridad
              </p>
            </div>
          )}
        </div>

        {/* Timeline de progreso */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Progreso de la solicitud</h3>
          
          <div className="space-y-4">
            {steps.map((step, index) => {
              const completado = index <= stepActual;
              const actual = index === stepActual;
              
              return (
                <div key={step.estado} className="flex items-center gap-4">
                  <div className={`
                    flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                    ${completado ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}
                    ${actual ? 'ring-4 ring-blue-200' : ''}
                  `}>
                    {completado ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  
                  <div className="flex-1">
                    <p className={`font-semibold ${completado ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.nombre}
                    </p>
                    {actual && (
                      <p className="text-sm text-blue-600 font-medium">En curso</p>
                    )}
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`absolute left-5 top-10 w-0.5 h-12 ${completado ? 'bg-blue-600' : 'bg-gray-200'}`} 
                         style={{marginLeft: '20px'}} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Histórico detallado */}
          {solicitud.historico && solicitud.historico.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Historial detallado</h4>
              <div className="space-y-3">
                {[...solicitud.historico].reverse().map((item, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-600">
                      {new Date(item.fecha).toLocaleDateString('es-CL', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className="font-medium text-gray-900">{item.estado}</span>
                    <span className="text-gray-500">por {item.usuario}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer con info */}
        <div className="mt-6 bg-blue-50 rounded-lg p-6 text-center">
          <p className="text-gray-700">
            ℹ️ Recibirás un email cada vez que el estado de tu solicitud cambie.
          </p>
          <p className="text-sm text-gray-600 mt-2">
            ¿Tienes preguntas? Contáctanos en{' '}
            <a href="mailto:dpo@empresa.cl" className="text-blue-600 hover:underline">
              dpo@empresa.cl
            </a>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Seguimiento;