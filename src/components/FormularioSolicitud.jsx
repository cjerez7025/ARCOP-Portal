import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { solicitudAccesoSchema, formatearRUT } from '../utils/validators';
import { crearSolicitud } from '../services/googleSheetsService';
import { toast } from 'react-toastify';
import { Send, CheckCircle, Loader } from 'lucide-react';

const FormularioSolicitud = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [solicitudCreada, setSolicitudCreada] = useState(null);
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(solicitudAccesoSchema),
    defaultValues: {
      alcance_acceso: 'TODOS',
      formato_preferido: 'PDF',
      acepta_terminos: false
    }
  });
  
  const handleRUTChange = (e) => {
    const formatted = formatearRUT(e.target.value);
    setValue('rut', formatted);
  };
  
  const onSubmit = async (data) => {
    setLoading(true);
    
    try {
      const datosConMetadata = {
        ...data,
        metadata: {
          ip_origen: window.location.hostname,
          user_agent: navigator.userAgent
        }
      };
      
      const response = await crearSolicitud(datosConMetadata);
      
      setSolicitudCreada(response.data);
      setSuccess(true);
      toast.success('¡Solicitud enviada exitosamente!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al enviar solicitud');
    } finally {
      setLoading(false);
    }
  };
  
  if (success && solicitudCreada) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Solicitud Registrada!
            </h2>
            <p className="text-gray-600 mb-6">
              Hemos enviado un email de confirmación a:
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-900 font-semibold text-lg">
                {solicitudCreada.email}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-4 text-center">
                📋 Detalles de su solicitud
              </h3>
              <dl className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-gray-600">Número:</dt>
                  <dd className="font-mono font-semibold text-blue-600">
                    {solicitudCreada.numero_solicitud}
                  </dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-gray-600">Fecha:</dt>
                  <dd>{new Date(solicitudCreada.fecha_solicitud).toLocaleString('es-CL')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Plazo máximo:</dt>
                  <dd>{new Date(solicitudCreada.fecha_limite).toLocaleDateString('es-CL')}</dd>
                </div>
              </dl>
            </div>
            <button
              onClick={() => {
                setSuccess(false);
                setSolicitudCreada(null);
              }}
              className="text-blue-600 hover:text-blue-700 font-medium underline"
            >
              ← Enviar otra solicitud
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Solicitud de Acceso a Datos Personales
        </h1>
        <p className="text-gray-600 mb-8">
          Complete el formulario para solicitar acceso a sus datos personales.
        </p>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              {...register('nombre_completo')}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Juan Pérez"
            />
            {errors.nombre_completo && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre_completo.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RUT <span className="text-red-500">*</span>
            </label>
            <input
              {...register('rut')}
              type="text"
              onChange={handleRUTChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="12.345.678-9"
              maxLength="12"
            />
            {errors.rut && (
              <p className="mt-1 text-sm text-red-600">{errors.rut.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="juan@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              📧 Enviaremos un link de confirmación a este correo
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono (opcional)
            </label>
            <input
              {...register('telefono')}
              type="tel"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="+56 9 8765 4321"
            />
            {errors.telefono && (
              <p className="mt-1 text-sm text-red-600">{errors.telefono.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ¿Qué datos desea acceder? <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  {...register('alcance_acceso')}
                  type="radio"
                  value="TODOS"
                  className="w-4 h-4 text-blue-600 mt-1"
                />
                <div className="ml-3">
                  <span className="font-medium text-gray-900">Todos mis datos</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Toda la información que tenemos sobre usted
                  </p>
                </div>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formato <span className="text-red-500">*</span>
            </label>
            <select
              {...register('formato_preferido')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="PDF">📄 PDF (recomendado)</option>
              <option value="CSV">📊 CSV (Excel)</option>
              <option value="JSON">💻 JSON (técnico)</option>
            </select>
          </div>
          
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <label className="flex items-start cursor-pointer">
              <input
                {...register('acepta_terminos')}
                type="checkbox"
                className="w-5 h-5 text-blue-600 rounded mt-0.5"
              />
              <span className="ml-3 text-sm text-gray-700">
                Acepto los términos y condiciones conforme a la Ley 21.719
                <span className="text-red-500"> *</span>
              </span>
            </label>
            {errors.acepta_terminos && (
              <p className="mt-2 text-sm text-red-600 ml-8">{errors.acepta_terminos.message}</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center px-6 py-4 bg-blue-600 text-white font-medium text-lg rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all shadow-lg"
          >
            {loading ? (
              <>
                <Loader className="animate-spin -ml-1 mr-3 h-6 w-6" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="-ml-1 mr-3 h-6 w-6" />
                Enviar Solicitud
              </>
            )}
          </button>
          
        </form>
      </div>
    </div>
  );
};

export default FormularioSolicitud;
