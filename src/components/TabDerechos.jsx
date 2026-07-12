// ============================================================
// src/components/TabDerechos.jsx
// MMPA-104 — Sección Derechos en Configuración
// Layout: panel izquierdo (listado) + panel derecho (3 sub-tabs)
// Sub-tabs: General | Formulario | Flujo de estados
// ============================================================

import React, { useState, useEffect } from 'react';
import { Plus, Save, Loader, AlertCircle, ChevronRight, ChevronUp, ChevronDown, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'react-toastify';
import useDerechosConfig, { ICONOS_DISPONIBLES, buildDerechoVacio } from '../hooks/useDerechosConfig';
import TabFormularios from './TabFormularios';
import TabFlujos, { NotifWebhookPanel } from './TabFlujos';

// ── Sub-tab General ───────────────────────────────────────
const TabGeneral = ({ derecho, esNuevo, onGuardar, onGuardarYContinuar, guardando, webhookUrl, onGuardarWebhook }) => {
  const [form, setForm] = useState(
    derecho || buildDerechoVacio()
  );
  const [nuevoId, setNuevoId] = useState('');
  const [dirty, setDirty]     = useState(false);

  // Resetear form cuando cambia el derecho seleccionado
  useEffect(() => {
    setForm(derecho || buildDerechoVacio());
    setNuevoId('');
    setDirty(false);
  }, [derecho?.id]);

  const set = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
    setDirty(true);
  };

  const handleGuardar = async (continuar = false) => {
    if (!form.nombre?.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (esNuevo && !nuevoId?.trim()) {
      toast.error('El ID del derecho es obligatorio');
      return;
    }
    if (form.sla_dias > 15) {
      toast.error('El SLA no puede superar 15 días (Art. 11 Ley 21.719)');
      return;
    }

    const ok = await onGuardar(esNuevo ? nuevoId : derecho.id, form, esNuevo);
    if (ok) {
      setDirty(false);
      if (continuar) onGuardarYContinuar(esNuevo ? nuevoId.toUpperCase().replace(/\s+/g, '_') : derecho.id);
    }
  };

  return (
    <div className="space-y-5">
      {esNuevo && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          <strong>Nuevo derecho:</strong> el ID es inmutable una vez creado. Usa mayúsculas y guiones bajos (ej: ANONIMIZACION).
        </div>
      )}

      {/* ID — solo en creación */}
      {esNuevo && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            ID del derecho <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={nuevoId}
            onChange={e => setNuevoId(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
            placeholder="Ej: ANONIMIZACION"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1">Solo mayúsculas y guiones bajos. No puede cambiarse después.</p>
        </div>
      )}

      {/* Nombre + Artículo */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.nombre || ''}
            onChange={e => set('nombre', e.target.value)}
            placeholder="Ej: Acceso"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Artículo legal</label>
          <input
            type="text"
            value={form.articulo || ''}
            onChange={e => set('articulo', e.target.value)}
            placeholder="Ej: Art. 5° Ley 21.719"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Descripción <span className="text-xs text-gray-400 font-normal">(visible al titular en el portal público)</span>
        </label>
        <input
          type="text"
          value={form.descripcion || ''}
          onChange={e => set('descripcion', e.target.value)}
          placeholder="Ej: Conoce qué datos personales tenemos sobre ti"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* SLA + Orden + Color */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            SLA (días hábiles)
          </label>
          <input
            type="number"
            min={1}
            max={15}
            value={form.sla_dias || 15}
            onChange={e => set('sla_dias', Math.min(15, Math.max(1, parseInt(e.target.value) || 15)))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1">Máximo 15 (Art. 11)</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Orden en formulario</label>
          <input
            type="number"
            min={1}
            value={form.orden || 99}
            onChange={e => set('orden', parseInt(e.target.value) || 99)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Color</label>
          <input
            type="color"
            value={form.color || '#3B82F6'}
            onChange={e => set('color', e.target.value)}
            className="w-full h-9 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Selector de icono */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Icono</label>
        <div className="flex gap-2 flex-wrap">
          {ICONOS_DISPONIBLES.map(icono => (
            <button
              key={icono.id}
              onClick={() => set('icono', icono.id)}
              title={icono.label}
              className={`w-10 h-10 rounded-lg border text-lg flex items-center justify-content-center transition-all ${
                form.icono === icono.id
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              style={{ justifyContent: 'center' }}
            >
              {icono.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle activo — solo en edición */}
      {!esNuevo && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <p className="text-sm font-semibold text-gray-700">Estado del derecho</p>
            <p className="text-xs text-gray-400">Los derechos inactivos no aparecen en el formulario público</p>
          </div>
          <button
            onClick={() => set('activo', !form.activo)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              form.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {form.activo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            {form.activo ? 'Activo' : 'Inactivo'}
          </button>
        </div>
      )}

      {/* Protegido por ley — info */}
      {!esNuevo && derecho?.protegido && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Este es un derecho protegido por la Ley 21.719. Puede desactivarse pero no eliminarse.
          </p>
        </div>
      )}

      {/* Notificaciones (Google Chat / Slack / Teams) */}
      {!esNuevo && derecho?.id && (
        <div className="space-y-2">
          <div className="border-b border-gray-100 pb-2">
            <h3 className="text-base font-bold text-gray-800">🔔 Notificaciones</h3>
            <p className="text-xs text-gray-500 mt-0.5">Canal de notificaciones internas para el equipo DPO cuando lleguen solicitudes de este derecho.</p>
          </div>
          <NotifWebhookPanel
            derechoKey={derecho.id}
            webhook={webhookUrl || ''}
            onGuardar={onGuardarWebhook}
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        {!dirty ? (
          <p className="text-sm text-gray-400 self-center">Sin cambios pendientes</p>
        ) : null}
        <button
          onClick={() => handleGuardar(true)}
          disabled={guardando || !dirty}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-40 transition-colors"
        >
          {guardando ? <Loader className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          Guardar y ver Formulario →
        </button>
        <button
          onClick={() => handleGuardar(false)}
          disabled={guardando || !dirty}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50 transition-colors"
        >
          {guardando ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar
        </button>
      </div>
    </div>
  );
};

// ── Componente principal TabDerechos ──────────────────────
const TabDerechos = ({ formularioHook, flujoHook }) => {
  const {
    derechos, loading, guardando,
    crearDerecho, editarDerecho, toggleActivo,
  } = useDerechosConfig();

  const [derechoSeleccionado, setDerechoSeleccionado] = useState(null);
  const [esNuevo,             setEsNuevo]             = useState(false);
  const [subTab,              setSubTab]              = useState('general');

  // Seleccionar el primer derecho al cargar
  useEffect(() => {
    if (derechos.length > 0 && !derechoSeleccionado && !esNuevo) {
      setDerechoSeleccionado(derechos[0]);
    }
  }, [derechos]);

  const handleSeleccionar = (derecho) => {
    setDerechoSeleccionado(derecho);
    setEsNuevo(false);
    setSubTab('general');
  };

  const handleNuevo = () => {
    setDerechoSeleccionado(null);
    setEsNuevo(true);
    setSubTab('general');
  };

  const handleGuardar = async (id, datos, esCreacion) => {
    if (esCreacion) {
      const nuevoId = await crearDerecho(id, datos);
      if (nuevoId) {
        const nuevo = { id: nuevoId, ...datos };
        setDerechoSeleccionado(nuevo);
        setEsNuevo(false);
        return nuevoId;
      }
      return false;
    } else {
      const ok = await editarDerecho(id, datos);
      if (ok) {
        setDerechoSeleccionado(prev => ({ ...prev, ...datos }));
      }
      return ok;
    }
  };

  const handleGuardarYContinuar = (id) => {
    setSubTab('formulario');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">⚖️ Derechos ARCOP</h2>
        <p className="text-sm text-gray-500">
          Configura los derechos que los titulares pueden ejercer. Cada derecho tiene su propio formulario y flujo de estados.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 border border-gray-200 rounded-xl overflow-hidden">

        {/* ── Panel izquierdo: listado ── */}
        <div className="lg:col-span-1 border-r border-gray-200 bg-gray-50">
          <div className="p-4 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {derechos.length} derechos configurados
            </p>
          </div>

          <div className="p-2 space-y-1">
            {derechos.map(derecho => (
              <button
                key={derecho.id}
                onClick={() => handleSeleccionar(derecho)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  derechoSeleccionado?.id === derecho.id && !esNuevo
                    ? 'bg-white border border-blue-200 shadow-sm'
                    : 'hover:bg-white'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: derecho.color || '#6B7280' }}
                />
                <span className="flex-1 text-sm text-gray-700 truncate">{derecho.nombre}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  derecho.activo
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {derecho.activo ? 'activo' : 'inactivo'}
                </span>
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-gray-200">
            <button
              onClick={handleNuevo}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed rounded-lg text-sm transition-colors ${
                esNuevo
                  ? 'border-blue-400 text-blue-600 bg-blue-50'
                  : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600'
              }`}
            >
              <Plus className="w-4 h-4" />
              Nuevo derecho
            </button>
          </div>
        </div>

        {/* ── Panel derecho: editor ── */}
        <div className="lg:col-span-3 bg-white">

          {/* Sub-tabs */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'general',   label: 'General' },
              { id: 'formulario', label: 'Formulario' },
              { id: 'flujo',     label: 'Flujo de estados' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                disabled={esNuevo && tab.id !== 'general'}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                  subTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Contenido del sub-tab */}
          <div className="p-6">
            {(derechoSeleccionado || esNuevo) ? (
              <>
                {subTab === 'general' && (
                  <TabGeneral
                    derecho={derechoSeleccionado}
                    esNuevo={esNuevo}
                    onGuardar={handleGuardar}
                    onGuardarYContinuar={handleGuardarYContinuar}
                    guardando={guardando}
                    webhookUrl={
                      derechoSeleccionado?.id
                        ? flujoHook?.config?.derechos?.[derechoSeleccionado.id]?.google_chat_webhook || ''
                        : ''
                    }
                    onGuardarWebhook={async (url) => {
                      if (derechoSeleccionado?.id) {
                        flujoHook?.editarGChatWebhook(derechoSeleccionado.id, url);
                        setTimeout(() => flujoHook?.guardar?.(), 100);
                      }
                    }}
                  />
                )}
  {subTab === 'formulario' && derechoSeleccionado && (() => {
  if (!formularioHook?.config?.derechos?.[derechoSeleccionado.id]) {
    formularioHook?.updateConfig?.(c => {
      if (!c.derechos) c.derechos = {};
      c.derechos[derechoSeleccionado.id] = { activo: true, campos: [] };
    });
  }
  return <TabFormularios hook={formularioHook} derechoActivoExterno={derechoSeleccionado.id} />;
})()}
{subTab === 'flujo' && derechoSeleccionado && (() => {
  if (!flujoHook?.config?.derechos?.[derechoSeleccionado.id]) {
    flujoHook?.update?.(c => {
      if (!c.derechos) c.derechos = {};
      c.derechos[derechoSeleccionado.id] = { activo: true, estados: [] };
    });
  }
  return <TabFlujos hook={flujoHook} derechoActivoExterno={derechoSeleccionado.id} />;
})()}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <div className="text-4xl mb-3">⚖️</div>
                <p className="text-sm">Selecciona un derecho del panel izquierdo o crea uno nuevo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabDerechos;