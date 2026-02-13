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
      const params = new URLSearchParams({ action: 'obtenerSeguimiento', numero });
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

  const handleDescargar = async () => {
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'registrarDescarga', numero_solicitud: numero })
      });
      window.open(solicitud.url_descarga, '_blank');
      setTimeout(() => cargarSeguimiento(), 1000);
    } catch (error) {
      window.open(solicitud.url_descarga, '_blank');
    }
  };

  /**
   * Formatea fecha de forma segura — evita bug "31 dic 1969"
   * cuando el valor es null, '', 0 o fecha inválida
   */
  const formatFecha = (valor) => {
    if (!valor || valor === '' || valor === 0 || valor === '0') return 'No disponible';
    try {
      const d = new Date(valor);
      // getTime() === 0 significa epoch (1 ene 1970 o 31 dic 1969 UTC)
      if (isNaN(d.getTime()) || d.getTime() <= 0) return 'No disponible';
      return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return 'No disponible';
    }
  };

  const getEstadoInfo = (estado) => {
    const estados = {
      'PENDIENTE':  { icon: Clock,        color: 'text-yellow-600', bg: 'bg-yellow-50', texto: 'Pendiente de validación', descripcion: 'Hemos recibido tu solicitud y está en proceso de validación.' },
      'VALIDADA':   { icon: CheckCircle,  color: 'text-blue-600',   bg: 'bg-blue-50',   texto: 'Identidad validada',      descripcion: 'Tu identidad ha sido confirmada. Estamos procesando tu solicitud.' },
      'EN_PROCESO': { icon: Loader,       color: 'text-purple-600', bg: 'bg-purple-50', texto: 'En proceso',              descripcion: 'Estamos recopilando tus datos personales activamente.' },
      'RESUELTA':   { icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50',  texto: '¡Datos listos!',          descripcion: 'Tus datos personales están disponibles para descarga.' },
      'CERRADA':    { icon: CheckCircle,  color: 'text-gray-600',   bg: 'bg-gray-50',   texto: 'Cerrada',                 descripcion: 'Solicitud completada exitosamente.' }
    };
    return estados[estado] || estados['PENDIENTE'];
  };

  const getEstadoStep = (estadoActual) => {
    const orden = ['PENDIENTE', 'VALIDADA', 'EN_PROCESO', 'RESUELTA', 'CERRADA'];
    return orden.indexOf(estadoActual);
  };

  // ── Pantallas de carga / error ──────────────────────────────
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
          <a href="/#/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
    { nombre: 'Recibida',   estado: 'PENDIENTE'  },
    { nombre: 'Validada',   estado: 'VALIDADA'   },
    { nombre: 'En Proceso', estado: 'EN_PROCESO' },
    { nombre: 'Resuelta',   estado: 'RESUELTA'   }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Seguimiento de Solicitud</h1>
              <p className="text-gray-500 mt-1">#{solicitud.numero_solicitud}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${estadoInfo.bg} ${estadoInfo.color} border`}>
              <EstadoIcon className="w-4 h-4 inline mr-1" />
              {estadoInfo.texto}
            </span>
          </div>

          {/* Datos del solicitante */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
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
              {/* ✅ formatFecha seguro — evita bug "31 dic 1969" */}
              <p className="font-semibold text-gray-900">{formatFecha(solicitud.fecha_solicitud)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fecha límite</p>
              {/* ✅ formatFecha seguro */}
              <p className="font-semibold text-gray-900">{formatFecha(solicitud.fecha_limite)}</p>
            </div>
          </div>
        </div>

        {/* Estado actual */}
        <div className={`${estadoInfo.bg} rounded-lg shadow-lg p-6 mb-6`}>
          <div className="flex items-center gap-4 mb-4">
            <EstadoIcon className={`w-12 h-12 ${estadoInfo.color}`} />
            <div>
              <h2 className={`text-2xl font-bold ${estadoInfo.color}`}>{estadoInfo.texto}</h2>
              <p className="text-gray-700 mt-1">{estadoInfo.descripcion}</p>
            </div>
          </div>

          {solicitud.dias_restantes > 0 && solicitud.estado !== 'RESUELTA' && solicitud.estado !== 'CERRADA' && (
            <div className="mt-4 p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-600">
                ⏰ Días restantes para resolver: <strong>{solicitud.dias_restantes}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Botón descarga si está resuelta */}
        {solicitud.estado === 'RESUELTA' && solicitud.url_descarga && (
          <div className="bg-green-50 rounded-lg shadow-lg p-6 mb-6 text-center">
            <Download className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-green-800 mb-2">Sus datos están disponibles</h3>
            <p className="text-green-700 mb-4">Formato: {solicitud.formato_preferido || 'PDF'}</p>
            <button
              onClick={handleDescargar}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
            >
              Descargar mis datos
            </button>
          </div>
        )}

        {/* Progreso de la solicitud */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Progreso de la solicitud</h3>
          <div className="relative">
            {steps.map((step, index) => {
              const completado = index <= stepActual;
              const actual = index === stepActual;
              return (
                <div key={step.estado} className="flex items-start gap-4 mb-4 relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                    completado ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                  } ${actual ? 'ring-4 ring-blue-200' : ''}`}>
                    {completado ? <CheckCircle className="w-5 h-5" /> : <span className="text-sm font-bold">{index + 1}</span>}
                  </div>
                  <div className="pt-1">
                    <p className={`font-semibold ${completado ? 'text-gray-900' : 'text-gray-400'}`}>{step.nombre}</p>
                    {actual && <p className="text-sm text-blue-600 font-medium">En curso</p>}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`absolute left-5 top-10 w-0.5 h-8 ${completado && index < stepActual ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <p className="text-gray-700">ℹ️ Recibirás un email cada vez que el estado de tu solicitud cambie.</p>
          <p className="text-sm text-gray-600 mt-2">
            ¿Tienes preguntas? Contáctanos en{' '}
            <a href="mailto:dpo@empresa.cl" className="text-blue-600 hover:underline">dpo@empresa.cl</a>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Seguimiento;