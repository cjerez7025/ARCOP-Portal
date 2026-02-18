// ============================================================
// FORMULARIO SOLICITUD — Versión dinámica
// Lee campos desde useFormularioConfig → formularioService → adapter
// ============================================================

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Send, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { formatearRUT } from '../utils/validators';
import useFormularioConfig from '../hooks/useFormularioConfig';
import CampoRenderer from './CampoRenderer';
import adapter from '../adapters';

// Helpers para generar solicitud
const generarId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const generarNumero = () => `SOL-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
const generarToken = () => Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
const calcularFechaLimite = () => {
  const f = new Date(); let d = 0;
  while (d < 15) { f.setDate(f.getDate() + 1); if (f.getDay() !== 0 && f.getDay() !== 6) d++; }
  return f.toISOString();
};

const COLOR_MAP = {
  blue:   { card: 'border-blue-500 bg-blue-50',   badge: 'bg-blue-100 text-blue-800',   btn: 'bg-blue-600 hover:bg-blue-700'   },
  yellow: { card: 'border-yellow-500 bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800', btn: 'bg-yellow-600 hover:bg-yellow-700' },
  red:    { card: 'border-red-500 bg-red-50',     badge: 'bg-red-100 text-red-800',     btn: 'bg-red-600 hover:bg-red-700'     },
  orange: { card: 'border-orange-500 bg-orange-50', badge: 'bg-orange-100 text-orange-800', btn: 'bg-orange-600 hover:bg-orange-700' },
  green:  { card: 'border-green-500 bg-green-50', badge: 'bg-green-100 text-green-800', btn: 'bg-green-600 hover:bg-green-700' },
};

const FormularioSolicitud = () => {
  const { config, loading: loadingConfig, getCamposParaFormulario } = useFormularioConfig();

  const [loading, setLoading]               = useState(false);
  const [success, setSuccess]               = useState(false);
  const [solicitudCreada, setSolicitudCreada] = useState(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: { alcance_acceso: 'TODOS', formato_preferido: 'PDF', categorias: [], acepta_terminos: false },
  });

  const handleSeleccionar = (key, meta) => {
    setTipoSeleccionado({ key, meta });
    reset({ alcance_acceso: 'TODOS', formato_preferido: 'PDF', categorias: [], acepta_terminos: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const token  = generarToken();
      const numero = generarNumero();
      const solicitud = {
        id:               generarId(),
        numero_solicitud: numero,
        fecha_solicitud:  new Date().toISOString(),
        tipo:             tipoSeleccionado.key,
        estado:           'PENDIENTE',
        token_validacion: token,
        token_expiracion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_limite:     calcularFechaLimite(),
        dias_restantes:   15,
        frontend_url:     process.env.REACT_APP_FRONTEND_URL || window.location.origin,
        ip_origen:        window.location.hostname,
        user_agent:       navigator.userAgent,
        creado_en:        new Date().toISOString(),
        // datos del formulario
        ...data,
        email:      data.email?.toLowerCase(),
        categorias: JSON.stringify(data.categorias || []),
      };

      const result = await adapter.createSolicitud(solicitud);

      if (result.status === 'error') throw new Error(result.message);

      setSolicitudCreada({ numero_solicitud: numero, tipo: tipoSeleccionado.key });
      setSuccess(true);
      toast.success('¡Solicitud enviada exitosamente!');
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      toast.error(err.message || 'Error al enviar solicitud');
    } finally {
      setLoading(false);
    }
  };

  // ── Pantalla éxito ──────────────────────────────────────
  if (success && solicitudCreada) {
    const meta = tipoSeleccionado?.meta;
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud Registrada!</h2>
          <p className="text-gray-600 mb-6">Tu solicitud de <strong>{meta?.nombre}</strong> ha sido registrada.</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Número:</span>
              <span className="font-bold">{solicitudCreada.numero_solicitud}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tipo:</span>
              <span>{meta?.icono} {meta?.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estado:</span>
              <span className="text-yellow-700 font-medium">Pendiente de validación</span>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left text-sm text-blue-800">
            <strong>Próximo paso:</strong> Revisa tu email y confirma tu identidad con el link que enviamos.
            El link expira en 30 minutos.
          </div>
          <button onClick={() => { setSuccess(false); setSolicitudCreada(null); setTipoSeleccionado(null); }}
            className="text-blue-600 hover:text-blue-700 font-medium underline text-sm">
            ← Enviar otra solicitud
          </button>
        </div>
      </div>
    );
  }

  // ── Cargando config ─────────────────────────────────────
  if (loadingConfig) {
    return (
      <div className="max-w-3xl mx-auto p-6 flex justify-center items-center py-16">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // ── Pantalla selección de derecho ───────────────────────
  if (!tipoSeleccionado) {
    const derechos = config?.derechos || {};
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Ejercer mis Derechos ARCOP</h1>
          <p className="text-gray-600">Seleccione el derecho que desea ejercer según la Ley 21.719</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(derechos).map(([key, dc]) => {
            if (dc.activo === false) return null;
            // Importar meta desde formularioService via config
            const { DERECHOS_META } = require('../services/formularioService');
            const meta = DERECHOS_META[key];
            if (!meta) return null;
            const c = COLOR_MAP[meta.color];
            return (
              <button key={key} onClick={() => handleSeleccionar(key, meta)}
                className="text-left p-5 rounded-xl border-2 border-gray-200 bg-white hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{meta.icono}</span>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Derecho de {meta.nombre}</h3>
                    <p className="text-sm text-gray-600">{meta.descripcion}</p>
                    <p className="text-xs text-gray-400 mt-1">{meta.articulo} Ley 21.719</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-center text-xs text-gray-500 mt-6">
          🔒 Sus datos están protegidos según la Ley 21.719
        </p>
      </div>
    );
  }

  // ── Formulario dinámico ─────────────────────────────────
  const { meta } = tipoSeleccionado;
  const colores  = COLOR_MAP[meta.color];
  const { identidad, especificos } = getCamposParaFormulario(tipoSeleccionado.key);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">

        {/* Header */}
        <div className="mb-6">
          <button onClick={() => setTipoSeleccionado(null)}
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 block">
            ← Cambiar tipo de solicitud
          </button>
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-3 ${colores.badge}`}>
            {meta.icono} Derecho de {meta.nombre}
          </span>
          <h1 className="text-2xl font-bold text-gray-900">Solicitud de {meta.nombre}</h1>
          <p className="text-gray-600 mt-1">{meta.descripcion}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Campos de identidad */}
          <div className="border-b border-gray-100 pb-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Datos Personales</h2>
            <div className="space-y-4">
              {identidad.map(campo => (
                <CampoRenderer
                  key={campo.id}
                  campo={campo}
                  register={register}
                  watch={watch}
                  setValue={campo.tipo === 'rut' ? setValue : undefined}
                  errors={errors}
                />
              ))}
            </div>
          </div>

          {/* Campos específicos del derecho */}
          {especificos.length > 0 && (
            <div className="border-b border-gray-100 pb-5">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Detalles de la Solicitud
              </h2>
              <div className="space-y-4">
                {especificos.map(campo => (
                  <CampoRenderer
                    key={campo.id}
                    campo={campo}
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    errors={errors}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Términos */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <label className="flex items-start cursor-pointer">
              <input
                {...register('acepta_terminos', { required: 'Debes aceptar los términos' })}
                type="checkbox"
                className="w-5 h-5 text-blue-600 rounded mt-0.5"
              />
              <span className="ml-3 text-sm text-gray-700">
                Declaro que la información es verídica y acepto el tratamiento de mis datos para
                gestionar esta solicitud conforme a la <strong>Ley 21.719</strong>.
                <span className="text-red-500"> *</span>
              </span>
            </label>
            {errors.acepta_terminos && (
              <p className="mt-2 text-sm text-red-600 ml-8 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />{errors.acepta_terminos.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            className={`w-full flex items-center justify-center px-6 py-4 text-white font-medium text-lg rounded-lg transition-all shadow-lg disabled:opacity-50 ${colores.btn}`}>
            {loading
              ? <><Loader className="animate-spin mr-3 h-6 w-6" />Enviando...</>
              : <><Send className="mr-3 h-6 w-6" />Enviar Solicitud de {meta.nombre}</>
            }
          </button>

          <p className="text-xs text-center text-gray-500">🔒 Sus datos están protegidos según la Ley 21.719</p>
        </form>
      </div>
    </div>
  );
};

export default FormularioSolicitud;