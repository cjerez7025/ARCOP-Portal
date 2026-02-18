// ============================================================
// TAB FORMULARIOS — Configurador dinámico de campos ARCOP
// Se incluye como una tab más en Configuracion.jsx
// ============================================================

import React, { useState } from 'react';
import {
  ChevronUp, ChevronDown, Plus, Trash2, RotateCcw,
  Eye, EyeOff, AlertCircle, GripVertical, Edit2, Check, X
} from 'lucide-react';
import { DERECHOS_META } from '../services/formularioService';

const COLOR_MAP = {
  blue:   { badge: 'bg-blue-100 text-blue-800',     border: 'border-blue-300', header: 'bg-blue-50'   },
  yellow: { badge: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-300', header: 'bg-yellow-50' },
  red:    { badge: 'bg-red-100 text-red-800',       border: 'border-red-300',  header: 'bg-red-50'    },
  orange: { badge: 'bg-orange-100 text-orange-800', border: 'border-orange-300', header: 'bg-orange-50' },
  green:  { badge: 'bg-green-100 text-green-800',   border: 'border-green-300', header: 'bg-green-50'  },
};

const TIPOS_CAMPO = [
  { value: 'text',           label: 'Texto corto' },
  { value: 'textarea',       label: 'Texto largo' },
  { value: 'select',         label: 'Lista desplegable' },
  { value: 'radio',          label: 'Selección única' },
  { value: 'checkbox_single',label: 'Casilla de verificación' },
];

// ── Componente de campo editable inline ───────────────────
const FilaCampo = ({ campo, onToggle, onToggleObligatorio, onEditar, onMover, onEliminar, isFirst, isLast }) => {
  const [editando, setEditando] = useState(false);
  const [draft, setDraft]       = useState({ label: campo.label, ayuda: campo.ayuda, placeholder: campo.placeholder || '' });

  const confirmarEdicion = () => {
    onEditar(campo.id, draft);
    setEditando(false);
  };

  const cancelarEdicion = () => {
    setDraft({ label: campo.label, ayuda: campo.ayuda, placeholder: campo.placeholder || '' });
    setEditando(false);
  };

  const origenBadge = {
    ley:    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Ley</span>,
    sistema:<span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Sistema</span>,
    custom: <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Custom</span>,
  };

  return (
    <div className={`border rounded-lg p-3 transition-all ${
      campo.activo ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
    }`}>
      <div className="flex items-start gap-3">

        {/* Ordenar */}
        <div className="flex flex-col gap-0.5 pt-1">
          <button onClick={() => onMover(campo.id, 'up')}  disabled={isFirst}  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20"><ChevronUp  className="w-3.5 h-3.5" /></button>
          <button onClick={() => onMover(campo.id, 'down')} disabled={isLast} className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20"><ChevronDown className="w-3.5 h-3.5" /></button>
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {editando ? (
            <div className="space-y-2">
              <input
                value={draft.label}
                onChange={e => setDraft(p => ({ ...p, label: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Etiqueta del campo"
              />
              <input
                value={draft.ayuda}
                onChange={e => setDraft(p => ({ ...p, ayuda: e.target.value }))}
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none"
                placeholder="Texto de ayuda (opcional)"
              />
              {campo.tipo === 'text' || campo.tipo === 'textarea' ? (
                <input
                  value={draft.placeholder}
                  onChange={e => setDraft(p => ({ ...p, placeholder: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none"
                  placeholder="Placeholder (opcional)"
                />
              ) : null}
              <div className="flex gap-2">
                <button onClick={confirmarEdicion} className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">
                  <Check className="w-3 h-3" /> Guardar
                </button>
                <button onClick={cancelarEdicion} className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                  <X className="w-3 h-3" /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-medium text-sm ${campo.activo ? 'text-gray-900' : 'text-gray-400'}`}>
                  {campo.label}
                </span>
                {campo.obligatorio && <span className="text-red-500 text-xs">*obligatorio</span>}
                {origenBadge[campo.origen]}
                <span className="text-xs text-gray-400">{campo.tipo}</span>
                {campo.protegido && (
                  <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> protegido por ley
                  </span>
                )}
              </div>
              {campo.ayuda && <p className="text-xs text-gray-500 mt-0.5">{campo.ayuda}</p>}
            </>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Editar label */}
          {campo.editable && !editando && (
            <button onClick={() => setEditando(true)} title="Editar texto"
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Toggle obligatorio */}
          {!campo.protegido && (
            <button onClick={() => onToggleObligatorio(campo.id)}
              title={campo.obligatorio ? 'Hacer opcional' : 'Hacer obligatorio'}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                campo.obligatorio
                  ? 'border-red-300 text-red-600 bg-red-50 hover:bg-red-100'
                  : 'border-gray-300 text-gray-500 hover:border-gray-400'
              }`}>
              {campo.obligatorio ? '✱ Obl.' : 'Opc.'}
            </button>
          )}

          {/* Activar/desactivar */}
          {!campo.protegido && (
            <button onClick={() => onToggle(campo.id)}
              title={campo.activo ? 'Desactivar campo' : 'Activar campo'}
              className={`p-1.5 rounded transition-colors ${
                campo.activo
                  ? 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
              }`}>
              {campo.activo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}

          {/* Eliminar (solo custom) */}
          {campo.origen === 'custom' && (
            <button onClick={() => onEliminar(campo.id)} title="Eliminar campo"
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Modal agregar campo custom ────────────────────────────
const ModalNuevoCampo = ({ onConfirmar, onCancelar }) => {
  const [form, setForm] = useState({ tipo: 'text', label: '', ayuda: '', placeholder: '', obligatorio: false });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">➕ Agregar campo personalizado</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de campo</label>
            <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              {TIPOS_CAMPO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Etiqueta del campo <span className="text-red-500">*</span>
            </label>
            <input value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Número de cliente" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Texto de ayuda</label>
            <input value={form.ayuda} onChange={e => setForm(p => ({ ...p, ayuda: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Instrucción breve para el usuario" />
          </div>

          {(form.tipo === 'text' || form.tipo === 'textarea') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
              <input value={form.placeholder} onChange={e => setForm(p => ({ ...p, placeholder: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Texto de ejemplo en el campo" />
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.obligatorio}
              onChange={e => setForm(p => ({ ...p, obligatorio: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded" />
            <span className="text-sm text-gray-700">Campo obligatorio</span>
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCancelar}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
            Cancelar
          </button>
          <button
            onClick={() => form.label.trim() && onConfirmar(form)}
            disabled={!form.label.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
            Agregar campo
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Componente principal TabFormularios ───────────────────
const TabFormularios = ({ hook }) => {
  const {
    config, loading, dirty, guardando,
    toggleDerecho, toggleCampo, toggleObligatorio,
    editarCampo, moverCampo, agregarCampo, eliminarCampo, restaurarDerecho,
  } = hook;

  const [derechoActivo, setDerechoActivo] = useState('ACCESO');
  const [modalNuevo, setModalNuevo]       = useState(false);

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-gray-500">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
          Cargando configuración...
        </div>
      </div>
    );
  }

  const derechos   = Object.keys(DERECHOS_META);
  const meta       = DERECHOS_META[derechoActivo];
  const colores    = COLOR_MAP[meta.color];
  const derechoConfig = config.derechos?.[derechoActivo];
  const campos     = derechoConfig?.campos || [];
  const camposOrdenados = [...campos].sort((a, b) => a.orden - b.orden);

  const camposActivos   = camposOrdenados.filter(c => c.activo).length;
  const camposTotal     = camposOrdenados.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">📋 Configuración de Formularios</h2>
        <p className="text-sm text-gray-500">
          Personalice los campos que se solicitan en cada derecho ARCOP. Los campos marcados como
          <span className="mx-1 font-medium text-yellow-700">protegidos por ley</span>
          no pueden desactivarse.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Sidebar: lista de derechos */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Derechos ARCOP</p>
          {derechos.map(key => {
            const m  = DERECHOS_META[key];
            const c  = COLOR_MAP[m.color];
            const dc = config.derechos?.[key];
            const activo = dc?.activo !== false;
            return (
              <button
                key={key}
                onClick={() => setDerechoActivo(key)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                  derechoActivo === key
                    ? `${c.border} ${c.header} border`
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">
                    {m.icono} {m.nombre}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activo ? c.badge : 'bg-gray-100 text-gray-400'}`}>
                    {activo ? `${dc?.campos?.filter(c => c.activo).length || 0} campos` : 'inactivo'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{m.articulo}</p>
              </button>
            );
          })}
        </div>

        {/* Panel principal: campos del derecho */}
        <div className="lg:col-span-3">
          <div className={`border-2 ${colores.border} rounded-xl overflow-hidden`}>

            {/* Header del derecho */}
            <div className={`${colores.header} px-5 py-4 flex items-center justify-between`}>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  {meta.icono} Derecho de {meta.nombre}
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  {meta.descripcion} — <span className="font-medium">{meta.articulo} Ley 21.719</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{camposActivos}/{camposTotal} campos activos</span>
                <button
                  onClick={() => { if (window.confirm(`¿Restaurar los campos de ${meta.nombre} a los valores legales por defecto?`)) restaurarDerecho(derechoActivo); }}
                  title="Restaurar a defaults"
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                </button>
              </div>
            </div>

            {/* Campos de identidad — solo informativos */}
            <div className="px-5 pt-4 pb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
                Datos de identidad — fijos por ley (Art. 11)
              </p>
              <div className="space-y-1.5 opacity-70 pointer-events-none select-none">
                {['Nombre Completo', 'RUT', 'Correo Electrónico'].map(n => (
                  <div key={n} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-600">{n}</span>
                    <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Ley</span>
                    <span className="text-red-500 text-xs">*</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-600">Teléfono</span>
                  <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">opcional</span>
                </div>
              </div>
            </div>

            {/* Campos específicos del derecho */}
            <div className="px-5 pb-4 pt-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Campos específicos del derecho
              </p>

              {camposOrdenados.length === 0 ? (
                <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                  No hay campos configurados. Agrega campos con el botón de abajo.
                </div>
              ) : (
                <div className="space-y-2">
                  {camposOrdenados.map((campo, idx) => (
                    <FilaCampo
                      key={campo.id}
                      campo={campo}
                      isFirst={idx === 0}
                      isLast={idx === camposOrdenados.length - 1}
                      onToggle={(id)             => toggleCampo(derechoActivo, id)}
                      onToggleObligatorio={(id)  => toggleObligatorio(derechoActivo, id)}
                      onEditar={(id, changes)    => editarCampo(derechoActivo, id, changes)}
                      onMover={(id, dir)         => moverCampo(derechoActivo, id, dir)}
                      onEliminar={(id)           => eliminarCampo(derechoActivo, id)}
                    />
                  ))}
                </div>
              )}

              {/* Agregar campo */}
              <button
                onClick={() => setModalNuevo(true)}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all text-sm">
                <Plus className="w-4 h-4" /> Agregar campo personalizado
              </button>
            </div>
          </div>

          {/* Nota */}
          <div className="mt-3 flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-200">
            <AlertCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            Los cambios se aplican al formulario público inmediatamente después de guardar.
            Los campos de origen <span className="font-medium mx-0.5">Ley</span> no pueden eliminarse, solo desactivarse si no aplican a su organización.
          </div>
        </div>
      </div>

      {/* Modal nuevo campo */}
      {modalNuevo && (
        <ModalNuevoCampo
          onCancelar={() => setModalNuevo(false)}
          onConfirmar={(form) => {
            agregarCampo(derechoActivo, form);
            setModalNuevo(false);
          }}
        />
      )}
    </div>
  );
};

export default TabFormularios;