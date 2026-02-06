import React, { useState, useEffect } from 'react';
import { 
  Building2, User, Palette, Clock, Settings, 
  Save, RotateCcw, Loader, CheckCircle, AlertCircle,
  Mail, Phone, Globe, MapPin, FileText
} from 'lucide-react';
import { obtenerConfiguracion, guardarConfiguracion, restaurarConfiguracion } from '../services/configuracionService';
import { toast } from 'react-toastify';

const Configuracion = () => {
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [tabActiva, setTabActiva] = useState('empresa');
  const [config, setConfig] = useState({});
  const [cambiosPendientes, setCambiosPendientes] = useState(false);

  useEffect(() => {
    cargarConfiguracion();
  }, []);

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
      console.error('Error:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (campo, valor) => {
    setConfig(prev => ({
      ...prev,
      [campo]: valor
    }));
    setCambiosPendientes(true);
  };

  const handleGuardar = async () => {
    try {
      setGuardando(true);
      
      // Validaciones básicas
      if (!config.empresa_nombre || !config.dpo_email) {
        toast.error('Por favor completa los campos obligatorios');
        return;
      }
      
      const result = await guardarConfiguracion(config);
      
      if (result.status === 'success') {
        toast.success('✅ Configuración guardada correctamente');
        setCambiosPendientes(false);
        // Recargar para obtener valores actualizados
        await cargarConfiguracion();
      } else {
        toast.error('Error al guardar: ' + result.message);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setGuardando(false);
    }
  };

  const handleRestaurar = async () => {
    if (!window.confirm('¿Estás seguro de restaurar la configuración a valores predeterminados? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      setGuardando(true);
      const result = await restaurarConfiguracion();
      
      if (result.status === 'success') {
        toast.success('✅ Configuración restaurada');
        await cargarConfiguracion();
        setCambiosPendientes(false);
      } else {
        toast.error('Error al restaurar');
      }
    } catch (error) {
      console.error('Error:', error);
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
    { id: 'empresa', nombre: 'Empresa', icono: Building2 },
    { id: 'dpo', nombre: 'DPO', icono: User },
    { id: 'branding', nombre: 'Branding', icono: Palette },
    { id: 'plazos', nombre: 'Plazos', icono: Clock },
    { id: 'avanzado', nombre: 'Avanzado', icono: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Configuración del Sistema</h1>
          <p className="text-gray-600">Configuración multi-empresa para Portal ARCOP</p>
        </div>

        {/* Alerta de cambios pendientes */}
        {cambiosPendientes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-yellow-800 font-medium">
              Tienes cambios sin guardar. No olvides guardar antes de salir.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          
          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const IconComponent = tab.icono;
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
                    <IconComponent className="w-5 h-5" />
                    {tab.nombre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            
            {/* TAB: EMPRESA */}
            {tabActiva === 'empresa' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">🏢 Datos de la Empresa</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Nombre comercial */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Comercial <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={config.empresa_nombre || ''}
                      onChange={(e) => handleChange('empresa_nombre', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: ARCOP Consultores SpA"
                    />
                  </div>

                  {/* RUT */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RUT <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={config.empresa_rut || ''}
                      onChange={(e) => handleChange('empresa_rut', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: 12.345.678-9"
                    />
                  </div>

                  {/* Razón social */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Razón Social
                    </label>
                    <input
                      type="text"
                      value={config.empresa_razon_social || ''}
                      onChange={(e) => handleChange('empresa_razon_social', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: ARCOP Consultores SpA"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Corporativo
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={config.empresa_email || ''}
                        onChange={(e) => handleChange('empresa_email', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="contacto@empresa.cl"
                      />
                    </div>
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={config.empresa_telefono || ''}
                        onChange={(e) => handleChange('empresa_telefono', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+56 2 2345 6789"
                      />
                    </div>
                  </div>

                  {/* Sitio web */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sitio Web
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={config.empresa_web || ''}
                        onChange={(e) => handleChange('empresa_web', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://empresa.cl"
                      />
                    </div>
                  </div>

                  {/* Dirección - span completo */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        value={config.empresa_direccion || ''}
                        onChange={(e) => handleChange('empresa_direccion', e.target.value)}
                        rows={2}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Av. Providencia 123, Oficina 456, Santiago, Chile"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: DPO */}
            {tabActiva === 'dpo' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">👨‍💼 Delegado de Protección de Datos</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Nombre DPO */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={config.dpo_nombre || ''}
                      onChange={(e) => handleChange('dpo_nombre', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Juan Pérez González"
                    />
                  </div>

                  {/* Email DPO */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email DPO <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={config.dpo_email || ''}
                        onChange={(e) => handleChange('dpo_email', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="dpo@empresa.cl"
                      />
                    </div>
                  </div>

                  {/* Teléfono DPO */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono DPO
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={config.dpo_telefono || ''}
                        onChange={(e) => handleChange('dpo_telefono', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+56 9 8765 4321"
                      />
                    </div>
                  </div>

                  {/* Horario */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horario de Atención
                    </label>
                    <input
                      type="text"
                      value={config.dpo_horario || ''}
                      onChange={(e) => handleChange('dpo_horario', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Lunes a Viernes, 9:00 - 18:00"
                    />
                  </div>
                </div>

                {/* Info box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Información del DPO
                      </p>
                      <p className="text-sm text-blue-700">
                        Esta información aparecerá en el footer del portal y en todos los emails enviados a los usuarios. 
                        Es obligatorio según la Ley 21.719 de Protección de Datos Personales.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: BRANDING */}
            {tabActiva === 'branding' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">🎨 Personalización Visual</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Nombre del portal */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Portal
                    </label>
                    <input
                      type="text"
                      value={config.portal_nombre || ''}
                      onChange={(e) => handleChange('portal_nombre', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Portal ARCOP"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Aparece en el header y en los títulos del portal
                    </p>
                  </div>

                  {/* Color principal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color Principal
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={config.portal_color || '#2563eb'}
                        onChange={(e) => handleChange('portal_color', e.target.value)}
                        className="h-12 w-20 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.portal_color || '#2563eb'}
                        onChange={(e) => handleChange('portal_color', e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        placeholder="#2563eb"
                      />
                    </div>
                  </div>

                  {/* Color secundario */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color Secundario
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={config.portal_color_secundario || '#1e40af'}
                        onChange={(e) => handleChange('portal_color_secundario', e.target.value)}
                        className="h-12 w-20 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.portal_color_secundario || '#1e40af'}
                        onChange={(e) => handleChange('portal_color_secundario', e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        placeholder="#1e40af"
                      />
                    </div>
                  </div>

                  {/* Logo URL */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL del Logo
                    </label>
                    <input
                      type="url"
                      value={config.logo_url || ''}
                      onChange={(e) => handleChange('logo_url', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://ejemplo.com/logo.png"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      URL pública de la imagen del logo (PNG o SVG recomendado)
                    </p>
                  </div>

                  {/* Vista previa */}
                  <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <p className="text-sm font-medium text-gray-700 mb-4">Vista Previa:</p>
                    <div 
                      className="bg-white rounded-lg shadow p-4 flex items-center gap-3"
                      style={{ borderTop: `4px solid ${config.portal_color || '#2563eb'}` }}
                    >
                      {config.logo_url ? (
                        <img 
                          src={config.logo_url} 
                          alt="Logo" 
                          className="h-12 w-auto"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      ) : (
                        <FileText className="w-12 h-12" style={{ color: config.portal_color || '#2563eb' }} />
                      )}
                      <div>
                        <h3 className="font-bold text-lg" style={{ color: config.portal_color || '#2563eb' }}>
                          {config.portal_nombre || 'Portal ARCOP'}
                        </h3>
                        <p className="text-sm text-gray-600">Ley 21.719</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PLAZOS */}
            {tabActiva === 'plazos' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">⏰ Plazos Legales</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Días respuesta */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días para Responder <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={config.dias_respuesta || '15'}
                      onChange={(e) => handleChange('dias_respuesta', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Según Ley 21.719 (default: 15)
                    </p>
                  </div>

                  {/* Días alerta */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días de Alerta Previa
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={config.dias_alerta || '3'}
                      onChange={(e) => handleChange('dias_alerta', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Alertas de vencimiento (default: 3)
                    </p>
                  </div>

                  {/* Días validación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días para Validar Identidad
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={config.dias_validacion || '5'}
                      onChange={(e) => handleChange('dias_validacion', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Expiración token validación (default: 5)
                    </p>
                  </div>
                </div>

                {/* Info legal */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900 mb-1">
                        Ley 21.719 de Protección de Datos Personales
                      </p>
                      <p className="text-sm text-green-700">
                        La ley establece un plazo de <strong>15 días hábiles</strong> para responder solicitudes de acceso a datos personales. 
                        Estos plazos son configurables según las políticas internas de tu empresa.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: AVANZADO */}
            {tabActiva === 'avanzado' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">🔧 Configuración Avanzada</h2>
                
                <div className="space-y-6">
                  
                  {/* Notificaciones */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notificaciones por Email
                    </label>
                    <select
                      value={config.notif_activas || 'SI'}
                      onChange={(e) => handleChange('notif_activas', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="SI">Activadas</option>
                      <option value="NO">Desactivadas</option>
                    </select>
                  </div>

                  {/* Email CC */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Copia (CC)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={config.email_cc || ''}
                        onChange={(e) => handleChange('email_cc', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="admin@empresa.cl (opcional)"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Email que recibirá copia de todas las notificaciones
                    </p>
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zona Horaria
                    </label>
                    <select
                      value={config.timezone || 'America/Santiago'}
                      onChange={(e) => handleChange('timezone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="America/Santiago">Chile (Santiago)</option>
                      <option value="America/Argentina/Buenos_Aires">Argentina (Buenos Aires)</option>
                      <option value="America/Lima">Perú (Lima)</option>
                      <option value="America/Bogota">Colombia (Bogotá)</option>
                      <option value="America/Mexico_City">México (Ciudad de México)</option>
                    </select>
                  </div>

                  {/* Versión */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Versión del Sistema
                    </label>
                    <input
                      type="text"
                      value={config.version || '1.0.0'}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="border-t border-gray-200 px-8 py-6 bg-gray-50 flex items-center justify-between">
            <button
              onClick={handleRestaurar}
              disabled={guardando}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;