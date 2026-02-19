// ============================================================
// TAB FLUJOS v2 — Editor de grafo + diagrama SVG interactivo
// ============================================================

import React, { useState } from 'react';
import {
  Plus, Trash2, RotateCcw,
  ChevronUp, ChevronDown, Eye, EyeOff,
  Shield, ShieldOff, ArrowRight, GitBranch,
  Zap, Hand, Info, Settings
} from 'lucide-react';
import FlowDiagramEditor from './FlowDiagramEditor';
import {
  DERECHOS_META_FLUJO, COLOR_CLASSES, COLORES_ESTADO,
  COLORES_TRANSICION, TIPOS_CAMPO, crearTransicion, crearCampoRequerido,
} from '../services/flujoService';

const getC = (color) => COLOR_CLASSES[color] || COLOR_CLASSES.gray;


// ── Editor de una transición ─────────────────────────────
const TransicionEditor = ({ tr, estadosDisponibles, onEditar, onEliminar, onMover, isFirst, isLast, onAgregarCampo, onEditarCampo, onEliminarCampo }) => {
  const [abierto, setAbierto] = useState(false);
  const c = (COLOR_CLASSES[tr.color] || COLOR_CLASSES.blue);

  return (
    <div className={`border rounded-xl overflow-hidden ${abierto ? 'border-gray-300 shadow-sm' : 'border-gray-200'}`}>
      {/* Cabecera */}
      <div className={`flex items-center gap-2 px-3 py-2.5 ${abierto ? 'bg-gray-50 border-b border-gray-100' : 'bg-white'}`}>
        <div className="flex flex-col gap-0.5">
          <button onClick={() => onMover('up')}  disabled={isFirst} className="p-0.5 text-gray-300 hover:text-gray-500 disabled:opacity-20"><ChevronUp className="w-3 h-3" /></button>
          <button onClick={() => onMover('down')} disabled={isLast}  className="p-0.5 text-gray-300 hover:text-gray-500 disabled:opacity-20"><ChevronDown className="w-3 h-3" /></button>
        </div>

        {/* Color pill */}
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0`} style={{ background: c.stroke }} />

        {/* Etiqueta → destino */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-800 truncate">{tr.etiqueta || '(sin etiqueta)'}</span>
          <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>
            {estadosDisponibles.find(e => e.id === tr.hacia)?.nombre || tr.hacia || '???'}
          </span>
          {tr.condicion === 'automatica' && (
            <span className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded-full">
              <Zap className="w-3 h-3" /> auto
            </span>
          )}
          {(tr.campos_requeridos || []).length > 0 && (
            <span className="text-xs text-purple-600">{tr.campos_requeridos.length} campo{tr.campos_requeridos.length > 1 ? 's' : ''}</span>
          )}
        </div>

        <button onClick={() => setAbierto(!abierto)} className="text-xs text-gray-400 hover:text-blue-600 px-2">
          {abierto ? 'cerrar' : 'editar'}
        </button>
        <button onClick={onEliminar} className="p-1 text-gray-300 hover:text-red-500 rounded">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Panel edición */}
      {abierto && (
        <div className="bg-white px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Etiqueta *</label>
              <input value={tr.etiqueta || ''} onChange={e => onEditar({ etiqueta: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Aprobada, Denegar, Escalar..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Estado destino *</label>
              <select value={tr.hacia || ''} onChange={e => onEditar({ hacia: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                <option value="">Seleccionar...</option>
                {estadosDisponibles.map(e => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Descripción / ayuda</label>
            <input value={tr.descripcion || ''} onChange={e => onEditar({ descripcion: e.target.value })}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Texto de ayuda que verá el DPO al elegir esta transición" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Color de la flecha</label>
              <div className="flex flex-wrap gap-1.5">
                {COLORES_TRANSICION.map(col => (
                  <button key={col.value} onClick={() => onEditar({ color: col.value })}
                    title={col.label}
                    className="w-6 h-6 rounded-full border-2 transition-all"
                    style={{ background: (COLOR_CLASSES[col.value]?.stroke || '#6B7280'),
                             borderColor: tr.color === col.value ? '#1E293B' : 'transparent',
                             transform: tr.color === col.value ? 'scale(1.25)' : 'scale(1)' }} />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tipo de condición</label>
              <div className="flex gap-2">
                <button onClick={() => onEditar({ condicion: 'dpo_elige', condicion_campo: null, condicion_valor: null })}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    tr.condicion !== 'automatica' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
                  <Hand className="w-3.5 h-3.5" /> DPO elige
                </button>
                <button onClick={() => onEditar({ condicion: 'automatica' })}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    tr.condicion === 'automatica' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-gray-600 border-gray-300 hover:border-yellow-400'}`}>
                  <Zap className="w-3.5 h-3.5" /> Automática
                </button>
              </div>
            </div>
          </div>

          {/* Condición automática */}
          {tr.condicion === 'automatica' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-yellow-700 mb-1">Campo que dispara</label>
                <input value={tr.condicion_campo || ''} onChange={e => onEditar({ condicion_campo: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-yellow-300 rounded-lg text-xs bg-white"
                  placeholder="Ej: identidad_validada" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-yellow-700 mb-1">Valor que activa</label>
                <input value={tr.condicion_valor || ''} onChange={e => onEditar({ condicion_valor: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-yellow-300 rounded-lg text-xs bg-white"
                  placeholder="Ej: TRUE" />
              </div>
            </div>
          )}

          {/* Campos requeridos al tomar esta transición */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Campos que debe completar el DPO al tomar esta transición
            </label>
            <div className="space-y-2">
              {(tr.campos_requeridos || []).map(campo => (
                <div key={campo.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <span className="flex-1 text-sm text-gray-800">{campo.label}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{campo.tipo}</span>
                  {campo.obligatorio && <span className="text-xs text-red-500 font-bold">*</span>}
                  <button onClick={() => onEditarCampo(campo.id, { obligatorio: !campo.obligatorio })}
                    className="text-xs text-gray-400 hover:text-orange-600 px-1">
                    {campo.obligatorio ? 'opt.' : 'obl.'}
                  </button>
                  <button onClick={() => onEliminarCampo(campo.id)}
                    className="p-1 text-gray-300 hover:text-red-500 rounded"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              {TIPOS_CAMPO.map(tc => (
                <button key={tc.value} onClick={() => onAgregarCampo({ tipo: tc.value, label: tc.label })}
                  className="flex-1 py-1.5 text-xs border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-all truncate px-1">
                  + {tc.label.split('/')[0].trim()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Panel de un estado ────────────────────────────────────
const EstadoPanel = ({ estado, todos, isFirst, isLast, hook, derechoKey }) => {
  const [abierto, setAbierto] = useState(false);
  const [editNombre, setEditNombre] = useState(false);
  const [draftNombre, setDraftNombre] = useState(estado.nombre);

  const { toggleEstado, editarEstado, toggleProtegidoPorLey,
          moverEstado, eliminarEstado,
          agregarTransicion, editarTransicion, eliminarTransicion, reordenarTransicion,
          agregarCampoTransicion, editarCampoTransicion, eliminarCampoTransicion } = hook;

  const c = getC(estado.color);
  const esLeyNativo = estado.origen === 'ley';
  const esCustom    = estado.origen === 'custom';
  const otrosEstados = todos.filter(e => e.id !== estado.id);

  const origenLabel = esLeyNativo
    ? <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">Ley</span>
    : estado.origen === 'ley_futura'
    ? <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1"><Shield className="w-3 h-3" />Ley futura</span>
    : <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">Custom</span>;

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${estado.activo ? 'border-gray-200' : 'border-gray-100 opacity-50'} ${abierto ? 'shadow-md' : ''}`}>
      <div className={`flex items-center gap-2 px-4 py-3 ${abierto ? 'bg-gray-50 border-b border-gray-100' : 'bg-white'}`}>
        {/* Ordenar */}
        <div className="flex flex-col gap-0.5">
          <button onClick={() => moverEstado(derechoKey, estado.id, 'up')} disabled={isFirst || estado.protegido}
            className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20"><ChevronUp className="w-3.5 h-3.5" /></button>
          <button onClick={() => moverEstado(derechoKey, estado.id, 'down')} disabled={isLast || estado.protegido}
            className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20"><ChevronDown className="w-3.5 h-3.5" /></button>
        </div>

        {/* Badge color */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
          {estado.nombre}
        </span>

        <div className="flex items-center gap-2 flex-1 flex-wrap">
          {origenLabel}
          {estado.protegido && <Shield className="w-3.5 h-3.5 text-amber-500" title="Protegido" />}
          {estado.envia_email && <span className="text-xs text-blue-500">✉ email</span>}
          {estado.es_final && <span className="text-xs text-gray-400">FINAL</span>}
          <span className="text-xs text-gray-400">
            {(estado.transiciones || []).length} salida{(estado.transiciones || []).length !== 1 ? 's' : ''}
          </span>
          {estado.articulo && <span className="text-xs text-gray-400">{estado.articulo}</span>}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setAbierto(!abierto)} className="text-xs text-gray-400 hover:text-blue-600 px-2">
            {abierto ? 'cerrar' : 'editar'}
          </button>
          {!esLeyNativo && (
            <button onClick={() => toggleProtegidoPorLey(derechoKey, estado.id)}
              className={`p-1.5 rounded transition-colors ${estado.protegido ? 'text-amber-600 bg-amber-50' : 'text-gray-300 hover:text-amber-600'}`}>
              {estado.protegido ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
            </button>
          )}
          {!estado.protegido && (
            <button onClick={() => toggleEstado(derechoKey, estado.id)}
              className="p-1.5 text-gray-300 hover:text-red-400 rounded">
              {estado.activo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
          {esCustom && !estado.protegido && (
            <button onClick={() => { if (window.confirm(`¿Eliminar "${estado.nombre}"?`)) eliminarEstado(derechoKey, estado.id); }}
              className="p-1.5 text-gray-300 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
          )}
        </div>
      </div>

      {/* Panel expandido */}
      {abierto && (
        <div className="bg-white px-5 py-4 space-y-5">
          {/* Nombre y descripción */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre</label>
              <input value={estado.nombre} readOnly={esLeyNativo}
                onChange={e => !esLeyNativo && editarEstado(derechoKey, estado.id, { nombre: e.target.value })}
                className={`w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm ${esLeyNativo ? 'bg-gray-50 text-gray-400' : 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Referencia legal</label>
              <input value={estado.articulo || ''}
                onChange={e => editarEstado(derechoKey, estado.id, { articulo: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Art. 8° Ley 21.719" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Descripción</label>
            <textarea value={estado.descripcion || ''}
              onChange={e => editarEstado(derechoKey, estado.id, { descripcion: e.target.value })}
              rows={2} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          {/* Color (solo no-ley) */}
          {!esLeyNativo && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORES_ESTADO.map(col => (
                  <button key={col.value} onClick={() => editarEstado(derechoKey, estado.id, { color: col.value })}
                    className="w-6 h-6 rounded-full border-2 transition-all"
                    style={{ background: COLOR_CLASSES[col.value]?.stroke || '#6B7280',
                             borderColor: estado.color === col.value ? '#1E293B' : 'transparent',
                             transform: estado.color === col.value ? 'scale(1.3)' : 'scale(1)' }} />
                ))}
              </div>
            </div>
          )}

          {/* Comportamiento */}
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={estado.requiere_confirmacion}
                onChange={e => editarEstado(derechoKey, estado.id, { requiere_confirmacion: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-sm text-gray-700">Requiere confirmación</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={estado.envia_email}
                onChange={e => editarEstado(derechoKey, estado.id, { envia_email: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-sm text-gray-700">Envía email al titular</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={estado.es_final}
                onChange={e => editarEstado(derechoKey, estado.id, { es_final: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-sm text-gray-700">Estado final (no permite salidas)</span>
            </label>
          </div>

          {/* ── TRANSICIONES ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5" /> Transiciones salientes
              </label>
              <button onClick={() => agregarTransicion(derechoKey, estado.id)}
                className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-100">
                <Plus className="w-3 h-3" /> Agregar transición
              </button>
            </div>

            {(estado.transiciones || []).length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">Sin transiciones — este estado es un callejón sin salida.</p>
            ) : (
              <div className="space-y-2">
                {(estado.transiciones || []).map((tr, idx) => (
                  <TransicionEditor
                    key={tr.id}
                    tr={tr}
                    estadosDisponibles={otrosEstados}
                    isFirst={idx === 0}
                    isLast={idx === estado.transiciones.length - 1}
                    onEditar={(changes) => editarTransicion(derechoKey, estado.id, tr.id, changes)}
                    onEliminar={() => { if (window.confirm(`¿Eliminar la transición "${tr.etiqueta}"?`)) eliminarTransicion(derechoKey, estado.id, tr.id); }}
                    onMover={(dir) => reordenarTransicion(derechoKey, estado.id, tr.id, dir)}
                    onAgregarCampo={(ov) => agregarCampoTransicion(derechoKey, estado.id, tr.id, ov)}
                    onEditarCampo={(cid, ch) => editarCampoTransicion(derechoKey, estado.id, tr.id, cid, ch)}
                    onEliminarCampo={(cid) => eliminarCampoTransicion(derechoKey, estado.id, tr.id, cid)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Modal nuevo estado custom ─────────────────────────────
const ModalNuevoEstado = ({ onConfirmar, onCancelar }) => {
  const [form, setForm] = useState({ nombre: '', descripcion: '', color: 'gray', protegido: false, articulo: '' });
  const s = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Agregar estado personalizado</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre *</label>
            <input value={form.nombre} onChange={e => s('nombre', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: EN_REVISION_LEGAL" />
            <p className="text-xs text-gray-400 mt-1">Se guardará como MAYÚSCULAS_SIN_ESPACIOS</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={e => s('descripcion', e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORES_ESTADO.map(c => (
                <button key={c.value} onClick={() => s('color', c.value)}
                  className="w-6 h-6 rounded-full border-2 transition-all"
                  style={{ background: COLOR_CLASSES[c.value]?.stroke,
                           borderColor: form.color === c.value ? '#1E293B' : 'transparent',
                           transform: form.color === c.value ? 'scale(1.3)' : 'scale(1)' }} />
              ))}
            </div>
          </div>
          <label className="flex items-start gap-3 p-3 border rounded-xl cursor-pointer hover:bg-amber-50"
            onClick={() => s('protegido', !form.protegido)}>
            <input type="checkbox" checked={form.protegido} onChange={() => {}} className="w-4 h-4 text-amber-600 rounded mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-amber-600" />Protegido por ley</p>
              <p className="text-xs text-gray-500">Si la normativa cambió y este estado es ahora obligatorio</p>
              {form.protegido && (
                <input value={form.articulo} onClick={e => e.stopPropagation()}
                  onChange={e => { e.stopPropagation(); s('articulo', e.target.value); }}
                  className="mt-1.5 w-full px-2 py-1 text-xs border border-amber-300 rounded focus:outline-none"
                  placeholder="Ej: Art. 12° Ley 21.719 (modificación 2026)" />
              )}
            </div>
          </label>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancelar} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm">Cancelar</button>
          <button disabled={!form.nombre.trim()}
            onClick={() => onConfirmar({ ...form, nombre: form.nombre.trim().toUpperCase().replace(/\s+/g, '_') })}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold">
            Agregar estado
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────
const TabFlujos = ({ hook }) => {
  const { config, loading, getEstadosOrdenados, agregarEstado, restaurarDerecho, moverNodo } = hook;
  const [derechoActivo,     setDerechoActivo]     = useState('ACCESO');
  const [vista,             setVista]             = useState('lista'); // 'lista' | 'diagrama'
  const [modalNuevo,        setModalNuevo]        = useState(false);

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center text-gray-500">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
          Cargando configuración de flujos...
        </div>
      </div>
    );
  }

  const derechos    = Object.keys(DERECHOS_META_FLUJO);
  const meta        = DERECHOS_META_FLUJO[derechoActivo];
  const estados     = getEstadosOrdenados(derechoActivo);

  const DC = {
    blue:   { sidebar: 'border-blue-500 bg-blue-50',    header: 'from-blue-700 to-blue-600'   },
    yellow: { sidebar: 'border-yellow-500 bg-yellow-50', header: 'from-yellow-600 to-yellow-500'},
    red:    { sidebar: 'border-red-500 bg-red-50',      header: 'from-red-700 to-red-600'     },
    orange: { sidebar: 'border-orange-500 bg-orange-50', header: 'from-orange-600 to-orange-500'},
    green:  { sidebar: 'border-green-500 bg-green-50',  header: 'from-green-700 to-green-600' },
  };
  const dc = DC[meta.color] || DC.blue;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">🔄 Configuración de Flujos</h2>
        <p className="text-sm text-gray-500">
          Define el grafo de estados y transiciones para cada derecho ARCOP.
          Cada flecha tiene etiqueta, color y campos propios.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-1.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Derechos ARCOP</p>
          {derechos.map(key => {
            const m   = DERECHOS_META_FLUJO[key];
            const dc2 = DC[m.color] || DC.blue;
            const est = (config.derechos?.[key]?.estados || []);
            const nTr = est.reduce((acc, e) => acc + (e.transiciones || []).length, 0);
            return (
              <button key={key} onClick={() => setDerechoActivo(key)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${
                  derechoActivo === key ? `${dc2.sidebar} border-2` : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">{m.icono} {m.nombre}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{est.length} estados</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{nTr} transición{nTr !== 1 ? 'es' : ''} · {m.articulo}</p>
              </button>
            );
          })}
        </div>

        {/* Panel principal */}
        <div className="lg:col-span-3 space-y-4">
          {/* Header con tabs lista/diagrama */}
          <div className={`bg-gradient-to-r ${dc.header} rounded-2xl px-5 py-4`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-lg">{meta.icono} Flujo de {meta.nombre}</h3>
                <p className="text-sm text-white/75 mt-0.5">
                  {estados.filter(e => e.activo).length} estados · {estados.reduce((a, e) => a + (e.transiciones || []).length, 0)} transiciones
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Toggle vista */}
                <div className="flex bg-white/20 rounded-xl p-1 gap-1">
                  <button onClick={() => setVista('lista')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${vista === 'lista' ? 'bg-white text-gray-800' : 'text-white/80 hover:bg-white/10'}`}>
                    <Settings className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button onClick={() => setVista('diagrama')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${vista === 'diagrama' ? 'bg-white text-gray-800' : 'text-white/80 hover:bg-white/10'}`}>
                    <GitBranch className="w-3.5 h-3.5" /> Diagrama
                  </button>
                </div>
                <button
                  onClick={() => { if (window.confirm(`¿Restaurar flujo de ${meta.nombre} a los estados legales?`)) restaurarDerecho(derechoActivo); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/90 bg-white/20 border border-white/30 rounded-xl hover:bg-white/30">
                  <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                </button>
              </div>
            </div>
          </div>

          {/* ── Vista Diagrama ── */}
          {vista === 'diagrama' && (
            <FlowDiagramEditor
              estados={estados}
              hook={hook}
              derechoKey={derechoActivo}
            />
          )}

          {/* ── Vista Lista ── */}
          {vista === 'lista' && (
            <div className="border border-gray-200 rounded-2xl p-4 bg-white space-y-3">
              {/* Leyenda */}
              <div className="flex flex-wrap gap-3 pb-3 border-b border-gray-100 text-xs text-gray-400">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-100 border border-blue-300 rounded-sm" /> Ley</span>
                <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-amber-400" /> Protegido</span>
                <span className="flex items-center gap-1"><Hand className="w-3 h-3" /> DPO elige</span>
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400" /> Automática</span>
                <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> N salidas = N transiciones del estado</span>
              </div>

              {estados.map((estado, idx) => (
                <EstadoPanel key={estado.id} estado={estado} todos={estados}
                  isFirst={idx === 0} isLast={idx === estados.length - 1}
                  hook={hook} derechoKey={derechoActivo} />
              ))}

              <button onClick={() => setModalNuevo(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all text-sm">
                <Plus className="w-4 h-4" /> Agregar estado personalizado
              </button>

              <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                Los estados de origen Ley no pueden eliminarse. El diagrama se genera automáticamente con las posiciones configuradas.
              </div>
            </div>
          )}
        </div>
      </div>

      {modalNuevo && (
        <ModalNuevoEstado
          onCancelar={() => setModalNuevo(false)}
          onConfirmar={(form) => { agregarEstado(derechoActivo, form); setModalNuevo(false); }}
        />
      )}
    </div>
  );
};

export default TabFlujos;