import React, { useState, useEffect } from 'react';
import {
  Building2, User, Palette, Clock, Settings,
  Save, RotateCcw, Loader, AlertCircle,
  Mail, Phone, Globe, MapPin, Link2
} from 'lucide-react';
import { obtenerConfiguracion, guardarConfiguracion, restaurarConfiguracion } from '../services/configuracionService';
import { toast } from 'react-toastify';

const Configuracion = () => {
  const [loading, setLoading]                   = useState(true);
  const [guardando, setGuardando]               = useState(false);
  const [tabActiva, setTabActiva]               = useState('empresa');
  const [config, setConfig]                     = useState({});
  const [cambiosPendientes, setCambiosPendientes] = useState(false);

  useEffect(() => { cargarConfiguracion(); }, []);

  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      const result = await obtenerConfiguracion();
      if (result.status === 'success') {
        setConfig(result.data);
      } else {
        toast.error('Error al cargar configuración');
      }
    } catch (error) {
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (campo, valor) => {
    setConfig(prev => ({ ...prev, [campo]: valor }));
    setCambiosPendientes(true);
  };

  const handleGuardar = async () => {
    try {
      setGuardando(true);
      if (!config.empresa_nombre || !config.dpo_email) {
        toast.error('Completa los campos obligatorios (Nombre empresa y Email DPO)');
        return;
      }
      const result = await guardarConfiguracion(config);
      if (result.status === 'success') {
        toast.success('✅ Configuración guardada correctamente');
        setCambiosPendientes(false);
        await cargarConfiguracion();
      } else {
        toast.error('Error al guardar: ' + (result.message || ''));
      }
    } catch (error) {
      toast.error('Error al guardar configuración');
    } finally {
      setGuardando(false);
    }
  };

  const handleRestaurar = async () => {
    if (!window.confirm('¿Restaurar la configuración a valores predeterminados? Esta acción no se puede deshacer.')) return;
    try {
      setGuardando(true);
      const result = await restaurarConfiguracion();
      if (result.status === 'success') {
        toast.success('✅ Configuración restaurada');
        await cargarConfiguracion();
        setCambiosPendientes(false);
      } else {
        toast.error('Error al restaurar: ' + (result.message || ''));
      }
    } catch (error) {
      toast.error('Error al restaurar configuración');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'empresa',  nombre: 'Empresa',  icono: Building2 },
    { id: 'dpo',      nombre: 'DPO',      icono: User      },
    { id: 'branding', nombre: 'Branding', icono: Palette   },
    { id: 'plazos',   nombre: 'Plazos',   icono: Clock     },
    { id: 'avanzado', nombre: 'Avanzado', icono: Settings  },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Configuración del Sistema</h1>
          <p className="text-gray-600">Configuración de Portal ARCOP</p>
        </div>

        {/* Alerta cambios pendientes */}
        {cambiosPendientes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-yellow-800 font-medium">Tienes cambios sin guardar.</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">

          {/* Tabs Nav */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex overflow-x-auto">
              {tabs.map(tab => {
                const Icono = tab.icono;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTabActiva(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-colors border-b-2 ${
                      tabActiva === tab.id
                        ? 'border-blue-600 text-blue-600 bg-white'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icono className="w-5 h-5" />
                    {tab.nombre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">

            {/* ── EMPRESA ── */}
            {tabActiva === 'empresa' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">🏢 Datos de la Empresa</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Comercial <span className="text-red-500">*</span>
                    </label>
                    <input type="text" value={config.empresa_nombre || ''}
                      onChange={e => handleChange('empresa_nombre', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ARCOP Consultores SpA" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RUT <span className="text-red-500">*</span>
                    </label>
                    <input type="text" value={config.empresa_rut || ''}
                      onChange={e => handleChange('empresa_rut', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="12.345.678-9" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Razón Social</label>
                    <input type="text" value={config.empresa_razon_social || ''}
                      onChange={e => handleChange('empresa_razon_social', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ARCOP Consultores SpA" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="tel" value={config.empresa_telefono || ''}
                        onChange={e => handleChange('empresa_telefono', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+56 2 2345 6789" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Corporativo</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="email" value={config.empresa_email || ''}
                        onChange={e => handleChange('empresa_email', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="contacto@empresa.cl" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sitio Web</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="url" value={config.empresa_web || ''}
                        onChange={e => handleChange('empresa_web', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://empresa.cl" />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea value={config.empresa_direccion || ''}
                        onChange={e => handleChange('empresa_direccion', e.target.value)}
                        rows={2}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Av. Providencia 123, Santiago, Chile" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── DPO ── */}
            {tabActiva === 'dpo' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">👨‍💼 Delegado de Protección de Datos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
                    <input type="text" value={config.dpo_nombre || ''}
                      onChange={e => handleChange('dpo_nombre', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Juan Pérez González" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email DPO <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="email" value={config.dpo_email || ''}
                        onChange={e => handleChange('dpo_email', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="dpo@empresa.cl" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono DPO</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="tel" value={config.dpo_telefono || ''}
                        onChange={e => handleChange('dpo_telefono', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+56 9 8765 4321" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Horario de Atención</label>
                    <input type="text" value={config.dpo_horario || ''}
                      onChange={e => handleChange('dpo_horario', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Lunes a Viernes, 9:00 - 18:00" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email CC (copia notificaciones)</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="email" value={config.email_cc || ''}
                        onChange={e => handleChange('email_cc', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="gerencia@empresa.cl (opcional)" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Recibirá copia de todas las notificaciones</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notificaciones activas</label>
                    <select value={config.notif_activas || 'SI'}
                      onChange={e => handleChange('notif_activas', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="SI">Sí - Enviar emails automáticos</option>
                      <option value="NO">No - Solo registrar sin emails</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700">
                      El email del DPO aparece en todos los emails enviados a los usuarios y es obligatorio según la Ley 21.719.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── BRANDING ── */}
            {tabActiva === 'branding' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">🎨 Personalización Visual</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Portal</label>
                    <input type="text" value={config.portal_nombre || ''}
                      onChange={e => handleChange('portal_nombre', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Portal ARCOP" />
                    <p className="text-sm text-gray-500 mt-1">Aparece en el header y títulos del portal</p>
                  </div>

                  {/* ✅ URL del Portal - NUEVO */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL del Portal <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="url" value={config.portal_url || ''}
                        onChange={e => handleChange('portal_url', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://arcop-portal.vercel.app" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      URL pública donde está desplegado el portal. Se usa en los links de los emails enviados a los usuarios.
                      <span className="text-red-600 font-medium"> No usar localhost.</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color Principal</label>
                    <div className="flex gap-3 items-center">
                      <input type="color" value={config.portal_color || '#2563eb'}
                        onChange={e => handleChange('portal_color', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer p-1" />
                      <input type="text" value={config.portal_color || '#2563eb'}
                        onChange={e => handleChange('portal_color', e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        placeholder="#2563eb" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color Secundario</label>
                    <div className="flex gap-3 items-center">
                      <input type="color" value={config.portal_color_secundario || '#1e40af'}
                        onChange={e => handleChange('portal_color_secundario', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer p-1" />
                      <input type="text" value={config.portal_color_secundario || '#1e40af'}
                        onChange={e => handleChange('portal_color_secundario', e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        placeholder="#1e40af" />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL del Logo</label>
                    <input type="url" value={config.logo_url || ''}
                      onChange={e => handleChange('logo_url', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://ejemplo.com/logo.png" />
                    <p className="text-sm text-gray-500 mt-1">URL pública del logo (PNG o SVG recomendado)</p>
                  </div>

                  {/* Vista previa */}
                  <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <p className="text-sm font-medium text-gray-700 mb-4">Vista Previa del Header:</p>
                    <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3"
                      style={{ borderTop: `4px solid ${config.portal_color || '#2563eb'}` }}>
                      {config.logo_url && (
                        <img src={config.logo_url} alt="Logo" className="h-10 w-auto object-contain"
                          onError={e => { e.target.style.display = 'none'; }} />
                      )}
                      <div>
                        <p className="font-bold text-gray-900" style={{ color: config.portal_color || '#2563eb' }}>
                          {config.portal_nombre || 'Portal ARCOP'}
                        </p>
                        <p className="text-xs text-gray-500">Ley 21.719</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── PLAZOS ── */}
            {tabActiva === 'plazos' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">⏱️ Plazos y Tiempos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días de Respuesta (hábiles)
                    </label>
                    <input type="number" min="1" max="30" value={config.dias_respuesta || '15'}
                      onChange={e => handleChange('dias_respuesta', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    <p className="text-sm text-gray-500 mt-1">Plazo máximo para resolver. Ley 21.719 establece 15 días hábiles.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días de Alerta Anticipada
                    </label>
                    <input type="number" min="1" max="10" value={config.dias_alerta || '3'}
                      onChange={e => handleChange('dias_alerta', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    <p className="text-sm text-gray-500 mt-1">Días antes del vencimiento para mostrar alerta en el dashboard.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días para Validar Identidad
                    </label>
                    <input type="number" min="1" max="15" value={config.dias_validacion || '5'}
                      onChange={e => handleChange('dias_validacion', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    <p className="text-sm text-gray-500 mt-1">Días que tiene el usuario para completar la validación de identidad.</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      La Ley 21.719 establece un plazo máximo de 15 días hábiles para responder solicitudes ARCOP.
                      Modificar este valor no cambia la obligación legal.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── AVANZADO ── */}
            {tabActiva === 'avanzado' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">🔧 Configuración Avanzada</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Zona Horaria</label>
                    <select value={config.timezone || 'America/Santiago'}
                      onChange={e => handleChange('timezone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="America/Santiago">Chile - Santiago (GMT-3/GMT-4)</option>
                      <option value="America/Argentina/Buenos_Aires">Argentina - Buenos Aires (GMT-3)</option>
                      <option value="America/Lima">Perú - Lima (GMT-5)</option>
                      <option value="America/Bogota">Colombia - Bogotá (GMT-5)</option>
                      <option value="America/Mexico_City">México - Ciudad de México (GMT-6)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Versión del Sistema</label>
                    <input type="text" value={config.version || '1.0.0'} disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500" />
                  </div>

                  <div className="md:col-span-2">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-3">Acciones de Mantenimiento</p>
                      <div className="flex gap-3">
                        <button
                          onClick={handleRestaurar}
                          disabled={guardando}
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Restaurar valores por defecto
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Restaura todos los parámetros a sus valores originales. No afecta las solicitudes guardadas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>{/* fin Tab Content */}

          {/* Botones Acción */}
          <div className="border-t border-gray-200 px-8 py-6 bg-gray-50 flex items-center justify-between">
            <button
              onClick={handleRestaurar}
              disabled={guardando}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar Predeterminados
            </button>

            <button
              onClick={handleGuardar}
              disabled={guardando || !cambiosPendientes}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando ? (
                <><Loader className="w-5 h-5 animate-spin" />Guardando...</>
              ) : (
                <><Save className="w-5 h-5" />Guardar Cambios</>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Configuracion;