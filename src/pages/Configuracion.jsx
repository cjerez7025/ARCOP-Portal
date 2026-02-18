import React, { useState, useEffect } from 'react';
import {
  Building2, User, Palette, Clock, Settings, FileText,
  Save, RotateCcw, Loader, AlertCircle, GitBranch,
  Mail, Phone, Globe, MapPin, Link2
} from 'lucide-react';

import { obtenerConfiguracion, guardarConfiguracion, restaurarConfiguracion } from '../services/configuracionService';
import { toast } from 'react-toastify';

import TabFormularios from '../components/TabFormularios';
import TabFlujos from '../components/TabFlujos';

import useFormularioConfig from '../hooks/useFormularioConfig';
import useFlujoConfig from '../hooks/useFlujoConfig';

const Configuracion = () => {

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [tabActiva, setTabActiva] = useState('empresa');
  const [config, setConfig] = useState({});
  const [cambiosPendientes, setCambiosPendientes] = useState(false);

  const formularioHook = useFormularioConfig();
  const flujoHook = useFlujoConfig();

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
    } catch {
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

    } catch {
      toast.error('Error al guardar configuración');
    } finally {
      setGuardando(false);
    }
  };

  const handleRestaurar = async () => {
    if (!window.confirm('¿Restaurar la configuración a valores predeterminados?')) return;

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

    } catch {
      toast.error('Error al restaurar configuración');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'empresa', nombre: 'Empresa', icono: Building2 },
    { id: 'dpo', nombre: 'DPO', icono: User },
    { id: 'branding', nombre: 'Branding', icono: Palette },
    { id: 'plazos', nombre: 'Plazos', icono: Clock },
    { id: 'avanzado', nombre: 'Avanzado', icono: Settings },
    { id: 'formularios', nombre: 'Formularios', icono: FileText },
    { id: 'flujos', nombre: 'Flujos', icono: GitBranch }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          ⚙️ Configuración del Sistema
        </h1>

        {cambiosPendientes && tabActiva !== 'formularios' && tabActiva !== 'flujos' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-yellow-700 text-sm">Tienes cambios sin guardar</span>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex overflow-x-auto">
              {tabs.map(tab => {
                const Icono = tab.icono;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTabActiva(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                      tabActiva === tab.id
                        ? 'border-blue-600 text-blue-600 bg-white'
                        : 'border-transparent text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icono className="w-5 h-5" />
                    {tab.nombre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contenido */}
          <div className="p-8">

            {tabActiva === 'empresa' && <div>Contenido Empresa...</div>}
            {tabActiva === 'dpo' && <div>Contenido DPO...</div>}
            {tabActiva === 'branding' && <div>Contenido Branding...</div>}
            {tabActiva === 'plazos' && <div>Contenido Plazos...</div>}
            {tabActiva === 'avanzado' && <div>Contenido Avanzado...</div>}

            {tabActiva === 'formularios' && (
              <TabFormularios hook={formularioHook} />
            )}

            {tabActiva === 'flujos' && (
              <TabFlujos hook={flujoHook} />
            )}

          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-8 py-6 bg-gray-50 flex justify-between items-center">

            {/* FORMULARIOS */}
            {tabActiva === 'formularios' ? (
              <>
                <div>
                  {formularioHook.dirty && (
                    <span className="text-yellow-600 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Cambios sin guardar
                    </span>
                  )}
                </div>

                <button
                  onClick={formularioHook.guardar}
                  disabled={formularioHook.guardando || !formularioHook.dirty}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  {formularioHook.guardando
                    ? <><Loader className="w-5 h-5 animate-spin" />Guardando...</>
                    : <><Save className="w-5 h-5" />Guardar Formularios</>
                  }
                </button>
              </>
            )

            /* FLUJOS */
            : tabActiva === 'flujos' ? (
              <>
                <div>
                  {flujoHook.dirty && (
                    <span className="text-yellow-600 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Cambios sin guardar
                    </span>
                  )}
                </div>

                <button
                  onClick={flujoHook.guardar}
                  disabled={flujoHook.guardando || !flujoHook.dirty}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  {flujoHook.guardando
                    ? <><Loader className="w-5 h-5 animate-spin" />Guardando...</>
                    : <><Save className="w-5 h-5" />Guardar Flujos</>
                  }
                </button>
              </>
            )

            /* RESTO CONFIG GENERAL */
            : (
              <>
                <button
                  onClick={handleRestaurar}
                  disabled={guardando}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restaurar
                </button>

                <button
                  onClick={handleGuardar}
                  disabled={guardando || !cambiosPendientes}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  {guardando
                    ? <><Loader className="w-5 h-5 animate-spin" />Guardando...</>
                    : <><Save className="w-5 h-5" />Guardar Cambios</>
                  }
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Configuracion;
