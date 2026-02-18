// ============================================================
// TAB FLUJOS — Configurador de flujos de estado por derecho
// Se incluye como tab en Configuracion.jsx
// ============================================================

import React, { useState } from 'react';
import {
  ChevronUp, ChevronDown, Plus, Trash2, RotateCcw,
  Eye, EyeOff, AlertCircle, Edit2, Check, X,
  ArrowRight, Mail, Shield, ShieldOff, GitBranch,
  CheckSquare, AlertTriangle
} from 'lucide-react';
import {
  DERECHOS_META_FLUJO, COLORES_ESTADO, TIPOS_CAMPO_TRANSICION, crearCampoTransicion
} from '../services/flujoService';

// ── Helpers visuales ──────────────────────────────────────
const COLOR_CLASSES = {
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', dot: 'bg-yellow-400' },
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300',   dot: 'bg-blue-400'   },
  purple: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', dot: 'bg-purple-400' },
  green:  { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300',  dot: 'bg-green-400'  },
  gray:   { bg: 'bg-gray-100',   text: 'text-gray-700',   border: 'border-gray-300',   dot: 'bg-gray-400'   },
  red:    { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300',    dot: 'bg-red-400'    },
  orange: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-400' },
  teal:   { bg: 'bg-teal-100',   text: 'text-teal-800',   border: 'border-teal-300',   dot: 'bg-teal-400'   },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300', dot: 'bg-indigo-400' },
  pink:   { bg: 'bg-pink-100',   text: 'text-pink-800',   border: 'border-pink-300',   dot: 'bg-pink-400'   },
};

const getColor = (color) => COLOR_CLASSES[color] || COLOR_CLASSES.gray;

const Badge = ({ color, children }) => {
  const c = getColor(color);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {children}
    </span>
  );
};

// ── Modal: agregar estado custom ──────────────────────────
const ModalNuevoEstado = ({ estadosExistentes, onConfirmar, onCancelar }) => {
  const [form, setForm] = useState({
    nombre: '', descripcion: '', color: 'gray',
    requiere_confirmacion: false, envia_email: false,
    protegido: false, articulo: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-5">➕ Agregar estado personalizado</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del estado <span className="text-red-500">*</span>
            </label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: EN_REVISION_LEGAL" />
            <p className="text-xs text-gray-400 mt-1">Se convertirá automáticamente a MAYÚSCULAS_SIN_ESPACIOS</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="¿Qué significa este estado para el proceso?" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color del badge</label>
            <div className="flex flex-wrap gap-2">
              {COLORES_ESTADO.map(c => (
                <button key={c.value} onClick={() => set('color', c.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                    COLOR_CLASSES[c.value]?.bg} ${COLOR_CLASSES[c.value]?.text} ${
                    form.color === c.value ? 'border-gray-800 scale-105' : 'border-transparent'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" checked={form.requiere_confirmacion}
                onChange={e => set('requiere_confirmacion', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-800">Requiere confirmación</p>
                <p className="text-xs text-gray-500">Muestra dialog antes de ejecutar</p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" checked={form.envia_email}
                onChange={e => set('envia_email', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-800">Envía email</p>
                <p className="text-xs text-gray-500">Notifica al titular al llegar aquí</p>
              </div>
            </label>
          </div>

          {/* Protección por ley futura */}
          <div className={`p-3 rounded-lg border-2 transition-colors cursor-pointer ${
            form.protegido ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-gray-300'
          }`} onClick={() => set('protegido', !form.protegido)}>
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={form.protegido} onChange={() => {}}
                className="w-4 h-4 text-amber-600 rounded mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  Marcar como protegido por ley
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Si la normativa cambia y este estado pasa a ser obligatorio, activa esta opción.
                  No podrá eliminarse ni desactivarse.
                </p>
                {form.protegido && (
                  <input value={form.articulo} onChange={e => { e.stopPropagation(); set('articulo', e.target.value); }}
                    onClick={e => e.stopPropagation()}
                    className="mt-2 w-full px-2 py-1 text-xs border border-amber-300 rounded focus:outline-none"
                    placeholder="Ej: Art. 12° Ley 21.719 (modificación 2026)" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCancelar}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
            Cancelar
          </button>
          <button
            disabled={!form.nombre.trim()}
            onClick={() => onConfirmar({
              ...form,
              nombre: form.nombre.trim().toUpperCase().replace(/\s+/g, '_'),
            })}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
            Agregar estado
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Panel de edición de un estado (expandible) ────────────
const PanelEstado = ({
  estado, todos, isFirst, isLast,
  onToggle, onEditar, onToggleProtegido,
  onMover, onEliminar,
  onAgregarCampo, onEditarCampo, onEliminarCampo,
  onToggleTransicion,
}) => {
  const [expandido, setExpandido] = useState(false);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [draft, setDraft] = useState({ nombre: estado.nombre, descripcion: estado.descripcion, color: estado.color, articulo: estado.articulo || '' });

  const c = getColor(estado.color);
  const esLeyFutura = estado.origen === 'ley_futura';
  const esLeyNativo = estado.origen === 'ley';
  const esCustom    = estado.origen === 'custom';

  const confirmarNombre = () => {
    onEditar(estado.id, draft);
    setEditandoNombre(false);
  };

  const origenBadge = esLeyNativo
    ? <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">Ley</span>
    : esLeyFutura
    ? <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1"><Shield className="w-3 h-3" />Ley futura</span>
    : <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">Custom</span>;

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${
      estado.activo ? `border-gray-200 ${expandido ? 'shadow-md' : ''}` : 'border-gray-100 opacity-50'
    }`}>
      {/* Cabecera del estado */}
      <div className={`flex items-center gap-3 px-4 py-3 ${expandido ? 'bg-gray-50 border-b border-gray-100' : 'bg-white'}`}>

        {/* Ordenar */}
        <div className="flex flex-col gap-0.5">
          <button onClick={() => onMover(estado.id, 'up')} disabled={isFirst || estado.protegido}
            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onMover(estado.id, 'down')} disabled={isLast || estado.protegido}
            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Badge de color */}
        <Badge color={estado.color}>{estado.nombre}</Badge>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {editandoNombre && !estado.protegido ? (
            <div className="flex items-center gap-2">
              <input value={draft.nombre} onChange={e => setDraft(p => ({ ...p, nombre: e.target.value }))}
                className="px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none flex-1" />
              <button onClick={confirmarNombre} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4" /></button>
              <button onClick={() => setEditandoNombre(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              {origenBadge}
              {estado.protegido && (
                <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" /> protegido
                </span>
              )}
              {estado.envia_email && (
                <span className="text-xs text-blue-600 flex items-center gap-1"><Mail className="w-3 h-3" />email</span>
              )}
              {estado.requiere_confirmacion && (
                <span className="text-xs text-purple-600 flex items-center gap-1"><CheckSquare className="w-3 h-3" />confirmación</span>
              )}
              {estado.articulo && (
                <span className="text-xs text-gray-500">{estado.articulo}</span>
              )}
              {estado.campos_transicion?.length > 0 && (
                <span className="text-xs text-gray-500">{estado.campos_transicion.length} campo{estado.campos_transicion.length > 1 ? 's' : ''} requerido{estado.campos_transicion.length > 1 ? 's' : ''}</span>
              )}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Expandir */}
          <button onClick={() => setExpandido(!expandido)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded text-xs font-medium">
            {expandido ? 'cerrar' : 'editar'}
          </button>

          {/* Editar nombre (solo no-protegidos) */}
          {!estado.protegido && !editandoNombre && (
            <button onClick={() => setEditandoNombre(true)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Toggle protegido por ley (solo custom / ley_futura) */}
          {!esLeyNativo && (
            <button onClick={() => onToggleProtegido(estado.id)}
              title={estado.protegido ? 'Quitar protección por ley' : 'Marcar como protegido por ley'}
              className={`p-1.5 rounded transition-colors ${estado.protegido ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'}`}>
              {estado.protegido ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
            </button>
          )}

          {/* Activar/desactivar */}
          {!estado.protegido && (
            <button onClick={() => onToggle(estado.id)}
              className={`p-1.5 rounded transition-colors ${estado.activo ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}>
              {estado.activo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}

          {/* Eliminar (solo custom no-protegido) */}
          {esCustom && !estado.protegido && (
            <button onClick={() => {
              if (window.confirm(`¿Eliminar el estado "${estado.nombre}"? Se quitará de todas las transiciones.`))
                onEliminar(estado.id);
            }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Panel expandido */}
      {expandido && (
        <div className="bg-white px-5 py-4 space-y-5">

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Descripción</label>
            <textarea value={draft.descripcion}
              onChange={e => { setDraft(p => ({ ...p, descripcion: e.target.value })); onEditar(estado.id, { descripcion: e.target.value }); }}
              rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción del estado para el DPO..." />
          </div>

          {/* Color — solo editable si no es ley nativo */}
          {!esLeyNativo && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Color del badge</label>
              <div className="flex flex-wrap gap-2">
                {COLORES_ESTADO.map(col => (
                  <button key={col.value}
                    onClick={() => { setDraft(p => ({ ...p, color: col.value })); onEditar(estado.id, { color: col.value }); }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border-2 transition-all ${
                      COLOR_CLASSES[col.value]?.bg} ${COLOR_CLASSES[col.value]?.text} ${
                      draft.color === col.value ? 'border-gray-800 scale-105' : 'border-transparent'}`}>
                    {col.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Referencia legal (editable siempre) */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Referencia legal {!esLeyNativo && <span className="text-gray-400 font-normal normal-case">(opcional)</span>}
            </label>
            <input value={draft.articulo}
              onChange={e => { setDraft(p => ({ ...p, articulo: e.target.value })); onEditar(estado.id, { articulo: e.target.value }); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Art. 8° ter Ley 21.719"
              readOnly={esLeyNativo} />
          </div>

          {/* Opciones del estado */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Comportamiento</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={estado.requiere_confirmacion}
                  onChange={e => onEditar(estado.id, { requiere_confirmacion: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Requiere confirmación</p>
                  <p className="text-xs text-gray-500">Dialog antes de mover al estado</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={estado.envia_email}
                  onChange={e => onEditar(estado.id, { envia_email: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Envía email al titular</p>
                  <p className="text-xs text-gray-500">Notificación automática</p>
                </div>
              </label>
            </div>
          </div>

          {/* Transiciones posibles */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              <GitBranch className="w-3.5 h-3.5 inline mr-1" />
              Transiciones posibles desde este estado
            </label>
            {todos.filter(e => e.id !== estado.id).length === 0 ? (
              <p className="text-sm text-gray-400 italic">No hay otros estados disponibles</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {todos.filter(e => e.id !== estado.id).map(target => {
                  const seleccionado = estado.transiciones_posibles?.includes(target.id);
                  const ct = getColor(target.color);
                  return (
                    <button key={target.id}
                      onClick={() => onToggleTransicion(estado.id, target.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                        seleccionado
                          ? `${ct.bg} ${ct.text} border-current`
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400'
                      }`}>
                      {seleccionado && <ArrowRight className="w-3 h-3" />}
                      {target.nombre}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Campos requeridos al transicionar */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Campos que debe completar el DPO al mover a este estado
            </label>

            {estado.campos_transicion?.length === 0 && (
              <p className="text-xs text-gray-400 italic mb-2">Ninguno. El DPO puede mover sin completar campos adicionales.</p>
            )}

            <div className="space-y-2">
              {(estado.campos_transicion || []).map((campo) => (
                <CampoTransicionRow
                  key={campo.id}
                  campo={campo}
                  protegido={esLeyNativo}
                  onEditar={(changes) => onEditarCampo(estado.id, campo.id, changes)}
                  onEliminar={() => onEliminarCampo(estado.id, campo.id)}
                />
              ))}
            </div>

            <button onClick={() => onAgregarCampo(estado.id)}
              className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all text-xs">
              <Plus className="w-3.5 h-3.5" /> Agregar campo requerido
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

// ── Fila de campo de transición ───────────────────────────
const CampoTransicionRow = ({ campo, protegido, onEditar, onEliminar }) => {
  const [editando, setEditando] = useState(false);
  const [draft, setDraft] = useState({ label: campo.label, tipo: campo.tipo, obligatorio: campo.obligatorio });

  const confirmar = () => { onEditar(draft); setEditando(false); };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
      {editando ? (
        <div className="flex-1 flex items-center gap-2 flex-wrap">
          <input value={draft.label} onChange={e => setDraft(p => ({ ...p, label: e.target.value }))}
            className="flex-1 px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none" placeholder="Etiqueta" />
          <select value={draft.tipo} onChange={e => setDraft(p => ({ ...p, tipo: e.target.value }))}
            className="px-2 py-1 text-xs border border-gray-300 rounded">
            {TIPOS_CAMPO_TRANSICION.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={draft.obligatorio} onChange={e => setDraft(p => ({ ...p, obligatorio: e.target.checked }))} className="w-3 h-3" />
            Obligatorio
          </label>
          <button onClick={confirmar} className="p-1 text-green-600 hover:bg-green-100 rounded"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={() => setEditando(false)} className="p-1 text-gray-400 hover:bg-gray-200 rounded"><X className="w-3.5 h-3.5" /></button>
        </div>
      ) : (
        <>
          <span className="text-sm font-medium text-gray-800 flex-1">{campo.label}</span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{campo.tipo}</span>
          {campo.obligatorio && <span className="text-xs text-red-600 font-medium">*</span>}
          {!protegido && (
            <>
              <button onClick={() => setEditando(true)} className="p-1 text-gray-400 hover:text-blue-600 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={onEliminar} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
            </>
          )}
        </>
      )}
    </div>
  );
};

// ── Componente principal ──────────────────────────────────
const TabFlujos = ({ hook }) => {
  const {
    config, loading,
    toggleEstado, editarEstado, toggleProtegidoPorLey,
    moverEstado, agregarEstado, eliminarEstado, restaurarDerecho,
    agregarCampoTransicion, editarCampoTransicion, eliminarCampoTransicion,
    toggleTransicion, getEstadosOrdenados,
  } = hook;

  const [derechoActivo, setDerechoActivo] = useState('ACCESO');
  const [modalNuevo,    setModalNuevo]    = useState(false);

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
  const totalActivos = estados.filter(e => e.activo).length;

  const DERECHO_COLORS = {
    blue:   { sidebar: 'border-blue-500 bg-blue-50',   header: 'bg-blue-600' },
    yellow: { sidebar: 'border-yellow-500 bg-yellow-50', header: 'bg-yellow-500' },
    red:    { sidebar: 'border-red-500 bg-red-50',     header: 'bg-red-600' },
    orange: { sidebar: 'border-orange-500 bg-orange-50', header: 'bg-orange-500' },
    green:  { sidebar: 'border-green-500 bg-green-50', header: 'bg-green-600' },
  };
  const dc = DERECHO_COLORS[meta.color] || DERECHO_COLORS.blue;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">🔄 Configuración de Flujos</h2>
        <p className="text-sm text-gray-500">
          Define los estados y transiciones del proceso para cada derecho ARCOP. Los estados marcados como
          <span className="mx-1 font-medium text-amber-700">protegidos por ley</span>
          no pueden eliminarse ni desactivarse.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Sidebar: lista de derechos */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Derechos ARCOP</p>
          {derechos.map(key => {
            const m  = DERECHOS_META_FLUJO[key];
            const dc2 = DERECHO_COLORS[m.color] || DERECHO_COLORS.blue;
            const totalKey = (config.derechos?.[key]?.estados || []).filter(e => e.activo).length;
            return (
              <button key={key} onClick={() => setDerechoActivo(key)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                  derechoActivo === key ? `${dc2.sidebar} border-2` : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">{m.icono} {m.nombre}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{totalKey} estados</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{m.articulo}</p>
              </button>
            );
          })}
        </div>

        {/* Panel principal */}
        <div className="lg:col-span-3">
          {/* Header del derecho */}
          <div className={`${dc.header} rounded-t-xl px-5 py-4 flex items-center justify-between`}>
            <div>
              <h3 className="font-bold text-white text-lg">{meta.icono} Flujo de {meta.nombre}</h3>
              <p className="text-sm text-white/80 mt-0.5">{totalActivos} estados activos — {meta.articulo} Ley 21.719</p>
            </div>
            <button
              onClick={() => { if (window.confirm(`¿Restaurar el flujo de ${meta.nombre} a los estados legales por defecto?`)) restaurarDerecho(derechoActivo); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/90 bg-white/20 border border-white/30 rounded-lg hover:bg-white/30">
              <RotateCcw className="w-3.5 h-3.5" /> Restaurar
            </button>
          </div>

          {/* Lista de estados */}
          <div className="border border-t-0 border-gray-200 rounded-b-xl p-4 bg-white space-y-3">

            {/* Leyenda */}
            <div className="flex flex-wrap gap-3 pb-3 border-b border-gray-100 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-4 h-4 bg-blue-100 border border-blue-200 rounded text-blue-700 text-center text-xs leading-4">L</span> Obligatorio por ley</span>
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-amber-500" /> Protegido (no eliminable)</span>
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-blue-500" /> Envía email</span>
              <span className="flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5 text-purple-500" /> Requiere confirmación</span>
              <span className="flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5 text-gray-400" /> Transición posible</span>
            </div>

            {estados.map((estado, idx) => (
              <PanelEstado
                key={estado.id}
                estado={estado}
                todos={estados}
                isFirst={idx === 0}
                isLast={idx === estados.length - 1}
                onToggle={(id)              => toggleEstado(derechoActivo, id)}
                onEditar={(id, changes)     => editarEstado(derechoActivo, id, changes)}
                onToggleProtegido={(id)     => toggleProtegidoPorLey(derechoActivo, id)}
                onMover={(id, dir)          => moverEstado(derechoActivo, id, dir)}
                onEliminar={(id)            => eliminarEstado(derechoActivo, id)}
                onAgregarCampo={(id)        => agregarCampoTransicion(derechoActivo, id)}
                onEditarCampo={(eid, cid, ch) => editarCampoTransicion(derechoActivo, eid, cid, ch)}
                onEliminarCampo={(eid, cid) => eliminarCampoTransicion(derechoActivo, eid, cid)}
                onToggleTransicion={(eid, tid) => toggleTransicion(derechoActivo, eid, tid)}
              />
            ))}

            {/* Agregar estado custom */}
            <button onClick={() => setModalNuevo(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all text-sm">
              <Plus className="w-4 h-4" /> Agregar estado personalizado
            </button>

            {/* Nota */}
            <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-200">
              <AlertCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
              Los cambios se aplican al Panel DPO después de guardar. Los estados de origen
              <span className="font-medium mx-0.5">Ley</span>
              no pueden eliminarse. Si la normativa cambia, agrega un estado custom y márcalo como protegido por ley.
            </div>
          </div>
        </div>
      </div>

      {/* Modal nuevo estado */}
      {modalNuevo && (
        <ModalNuevoEstado
          estadosExistentes={estados}
          onCancelar={() => setModalNuevo(false)}
          onConfirmar={(form) => {
            agregarEstado(derechoActivo, form);
            setModalNuevo(false);
          }}
        />
      )}
    </div>
  );
};

export default TabFlujos;