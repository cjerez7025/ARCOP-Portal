import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react';
import { validarIdentidad } from '../services/googleSheetsService';

const ValidarIdentidad = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState('validando');
  const [mensaje, setMensaje] = useState('');
  const [solicitud, setSolicitud] = useState(null);

  useEffect(() => {
    if (token) {
      procesarValidacion();
    }
  }, [token]);

  const procesarValidacion = async () => {
    try {
      setEstado('validando');
      
      const resultado = await validarIdentidad(token);
      
      if (resultado.success) {
        setEstado('exitoso');
        setSolicitud(resultado.solicitud);
        setMensaje('Tu identidad ha sido confirmada exitosamente');
      } else {
        setEstado('error');
        setMensaje(resultado.message || 'No se pudo validar tu identidad');
      }
    } catch (error) {
      setEstado('error');
      setMensaje('Error al procesar la validación');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        
        {/* Estado: Validando */}
        {estado === 'validando' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Loader className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Validando tu identidad...
            </h2>
            <p className="text-gray-600">
              Por favor espera un momento
            </p>
          </div>
        )}

        {/* Estado: Exitoso */}
        {estado === 'exitoso' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Identidad Confirmada!
              </h2>
              <p className="text-gray-600">
                {mensaje}
              </p>
            </div>

            {solicitud && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  📋 Información de tu solicitud
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Número:</span>
                    <span className="font-semibold text-blue-600">
                      {solicitud.numero_solicitud}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <span className="font-semibold text-green-600">
                      Identidad Validada
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plazo máximo:</span>
                    <span className="font-medium">
                      {solicitud.fecha_limite ? 
                        new Date(solicitud.fecha_limite).toLocaleDateString('es-CL') : 
                        '15 días hábiles'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                <strong>✅ Próximos pasos:</strong><br/>
                Procesaremos tu solicitud y te enviaremos un email con tus datos personales 
                en un plazo máximo de 15 días hábiles.
              </p>
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Volver al inicio
            </button>
          </div>
        )}

        {/* Estado: Error */}
        {estado === 'error' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Error al Validar
              </h2>
              <p className="text-gray-600">
                {mensaje}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-900">
                Si el problema persiste, contacta a nuestro DPO en dpo@empresa.cl
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => procesarValidacion()}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Reintentar
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ValidarIdentidad;