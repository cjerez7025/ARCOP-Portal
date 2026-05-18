import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import adapter from '../adapters';

const ValidarIdentidad = () => {
  const { token } = useParams();

  const [paso,     setPaso]     = useState('cargando');
  const [error,    setError]    = useState('');
  const [solicitud, setSolicitud] = useState(null);

  useEffect(() => {
    if (token) procesarValidacionToken();
  }, [token]);

  const procesarValidacionToken = async () => {
    setPaso('validando');
    try {
      const resultado = await adapter.validarIdentidad(token);
      if (resultado.status === 'success') {
        const data = resultado.data || {};
        const sol  = data.solicitud || data;
        setSolicitud({
          numero_solicitud: sol.numero || sol.numero_solicitud || '—',
          estado:           sol.estado || 'VALIDADA',
          fecha_limite:     sol.fecha_limite || null,
        });
        setPaso('exitoso');
      } else {
        setError(resultado.message || 'No se pudo validar la identidad');
        setPaso('error');
      }
    } catch (e) {
      setError(e.message || 'Error al validar identidad');
      setPaso('error');
    }
  };

  const Wrap = ({ children }) => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        {children}
      </div>
    </div>
  );

  if (paso === 'cargando') return (
    <Wrap>
      <div className="flex flex-col items-center gap-4 py-6">
        <Loader className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-gray-600 text-sm">Verificando tu solicitud...</p>
      </div>
    </Wrap>
  );

  if (paso === 'validando') return (
    <Wrap>
      <div className="flex flex-col items-center gap-4 py-6">
        <Loader className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-gray-600 text-sm">Validando tu identidad...</p>
      </div>
    </Wrap>
  );

  if (paso === 'exitoso') return (
    <Wrap>
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-9 h-9 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">¡Identidad verificada!</h1>
          <p className="text-gray-500 text-sm mt-2">
            Tu solicitud ha avanzado. Recibirás una respuesta dentro del plazo legal.
          </p>
        </div>
        {solicitud?.numero_solicitud && (
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">N° de solicitud</p>
            <p className="text-lg font-bold text-blue-800 mt-1">{solicitud.numero_solicitud}</p>
            <p className="text-xs text-blue-500 mt-1">Guárdalo para hacer seguimiento</p>
          </div>
        )}
      </div>
    </Wrap>
  );

  if (paso === 'error') return (
    <Wrap>
      <div className="space-y-5 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-7 h-7 text-red-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">No se pudo continuar</h1>
          <p className="text-sm text-gray-500 mt-2">{error || 'Ocurrió un error inesperado.'}</p>
        </div>
      </div>
    </Wrap>
  );

  return null;
};

export default ValidarIdentidad;
