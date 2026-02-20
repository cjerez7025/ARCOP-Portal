// ============================================================
// TAB FLUJOS — v2
// Agrega configuración de SLA y actores responsables por estado
// ============================================================

import React, { useState } from 'react';
import {
  ChevronUp, ChevronDown, Plus, Trash2, RotateCcw,
  Eye, EyeOff, AlertCircle, Edit2, Check, X,
  ArrowRight, Mail, Shield, ShieldOff, GitBranch,
  CheckSquare, AlertTriangle, Clock, User, UserPlus,
} from 'lucide-react';
import {
  DERECHOS_META_FLUJO, COLORES_ESTADO, TIPOS_CAMPO_TRANSICION,
  crearCampoTransicion, COLOR_CLASSES, getColor,
} from '../services/flujoService';

// ── Badge de color ────────────────────────────────────────
const Badge = ({ color, children }) => {
  const c = getColor(color);
  const dot = {
    yellow: 'bg-yellow-400', blue: 'bg-blue-400', purple: 'bg-purple-400',
    green: 'bg-green-400', gray: 'bg-gray-400', red: 'bg-red-400',
    orange: 'bg-orange-400', teal: 'bg-teal-400', indigo: 'bg-indigo-400', pink: 'bg-pink-400',
  }[color] || 'bg-gray-400';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {children}
    </span>
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

// ── Fila de actor responsable ─────────────────────────────
const ActorRow = ({ actor, onEditar, onEliminar }) => {
  const [editando, setEditando] = useState(!actor.nombre); // nuevo actor abre en edición
  const [draft, setDraft] = useState({ nombre: actor.nombre, email: actor.email });
  const confirmar = () => {
    if (!draft.nombre.trim()) return;
    onEditar(draft);
    setEditando(false);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
      {editando ? (
        <div className="flex-1 flex items-center gap-2 flex-wrap">
          <input
            value={draft.nombre}
            onChange={e => setDraft(p => ({ ...p, nombre: e.target.value }))}
            className="flex-1 min-w-[120px] px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none"
            placeholder="Nombre del responsable"
            autoFocus
          />
          <input
            value={draft.email}
            onChange={e => setDraft(p => ({ ...p, email: e.target.value }))}
            className="flex-1 min-w-[160px] px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none"
            placeholder="email@empresa.cl"
            type="email"
          />
          <button onClick={confirmar} className="p-1 text-green-600 hover:bg-green-100 rounded"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={() => { if (!actor.nombre) onEliminar(); else setEditando(false); }}
            className="p-1 text-gray-400 hover:bg-gray-200 rounded"><X className="w-3.5 h-3.5" /></button>
        </div>
      ) : (
        <>
          <User className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-800 flex-1">{actor.nombre}</span>
          {actor.email && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Mail className="w-3 h-3" />{actor.email}
            </span>
          )}
          <button onClick={() => setEditando(true)} className="p-1 text-gray-400 hover:text-blue-600 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
          <button onClick={onEliminar} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
        </>
      )}
    </div>
  );
};

// ── Panel de edición de un estado ─────────────────────────
const PanelEstado = ({
  estado, todos, isFirst, isLast,
  onToggle, onEditar, onToggleProtegido,
  onMover, onEliminar,
  onAgregarCampo, onEditarCampo, onEliminarCampo,
  onToggleTransicion,
  onEditarSLA,
  onAgregarActor, onEditarActor, onEliminarActor,
}) => {
  const [expandido, setExpandido] = useState(false);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [draft, setDraft] = useState({
    nombre:      estado.nombre,
    descripcion: estado.descripcion,
    color:       estado.color,
    articulo:    estado.articulo || '',
  });

  const c          = getColor(estado.color);
  const esLeyNativo = estado.origen === 'ley';
  const esLeyFutura = estado.origen === 'ley_futura';
  const esCustom    = estado.origen === 'custom';

  const confirmarNombre = () => { onEditar(estado.id, draft); setEditandoNombre(false); };

  const actores     = estado.actores     || [];
  const sla_dias    = estado.sla_dias    ?? 0;
  const sla_alerta  = estado.sla_alerta_dias ?? 0;
  const tieneSLA    = sla_dias > 0;

  const origenBadge = esLeyNativo
    ? <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">Ley</span>
    : esLeyFutura
    ? <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1"><Shield className="w-3 h-3" />Ley futura</span>
    : <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">Custom</span>;

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${
      estado.activo ? `border-gray-200 ${expandido ? 'shadow-md' : ''}` : 'border-gray-100 opacity-50'
    }`}>
      {/* Cabecera */}
      <div className={`flex items-center gap-3 px-4 py-3 ${expandido ? 'bg-gray-50 border-b border-gray-200' : 'bg-white hover:bg-gray-50'}`}>

        {/* Orden / mover */}
        <div className="flex flex-col gap-0.5">
          <button disabled={isFirst || esLeyNativo} onClick={() => onMover(estado.id, 'up')}
            className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed rounded">
            <ChevronUp className="w-3 h-3" />
          </button>
          <button disabled={isLast || esLeyNativo} onClick={() => onMover(estado.id, 'down')}
            className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed rounded">
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Badge + nombre */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <Badge color={estado.color}>{estado.nombre}</Badge>
          {origenBadge}

          {/* Indicadores rápidos */}
          <div className="flex items-center gap-1 ml-1">
            {estado.envia_email && <Mail className="w-3.5 h-3.5 text-blue-400" title="Envía email" />}
            {estado.requiere_confirmacion && <CheckSquare className="w-3.5 h-3.5 text-purple-400" title="Requiere confirmación" />}
            {tieneSLA && (
              <span className="flex items-center gap-0.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                <Clock className="w-3 h-3" />{sla_dias}d
              </span>
            )}
            {actores.length > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full">
                <User className="w-3 h-3" />{actores.length}
              </span>
            )}
            {estado.campos_transicion?.length > 0 && (
              <span className="text-xs text-gray-500">
                {estado.campos_transicion.length} campo{estado.campos_transicion.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setExpandido(!expandido)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded text-xs font-medium">
            {expandido ? 'cerrar' : 'editar'}
          </button>
          {!estado.protegido && !editandoNombre && (
            <button onClick={() => setEditandoNombre(true)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {!esLeyNativo && (
            <button onClick={() => onToggleProtegido(estado.id)}
              title={estado.protegido ? 'Quitar protección' : 'Marcar como ley futura'}
              className={`p-1.5 rounded ${estado.protegido ? 'text-amber-600 bg-amber-50' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'}`}>
              {estado.protegido ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
            </button>
          )}
          {!estado.protegido && (
            <button onClick={() => onToggle(estado.id)}
              className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50">
              {estado.activo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
          {esCustom && !estado.protegido && (
            <button onClick={() => {
              if (window.confirm(`¿Eliminar el estado "${estado.nombre}"?`)) onEliminar(estado.id);
            }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Panel expandido */}
      {expandido && (
        <div className="bg-white px-5 py-4 space-y-6">

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
                      draft.color === col.value ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'opacity-60 hover:opacity-100'}`}>
                    {col.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Opciones */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input type="checkbox" checked={estado.envia_email}
                onChange={e => onEditar(estado.id, { envia_email: e.target.checked })}
                className="w-4 h-4 accent-blue-600" />
              <Mail className="w-4 h-4 text-blue-500" /> Envía email al titular
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input type="checkbox" checked={estado.requiere_confirmacion}
                onChange={e => onEditar(estado.id, { requiere_confirmacion: e.target.checked })}
                className="w-4 h-4 accent-purple-600" />
              <CheckSquare className="w-4 h-4 text-purple-500" /> Requiere confirmación DPO
            </label>
          </div>

          {/* ── SLA ─────────────────────────────────────────── */}
          <div className="border border-amber-200 rounded-xl p-4 bg-amber-50">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-amber-600" />
              <h4 className="text-sm font-semibold text-amber-800">SLA — Plazo máximo en este estado</h4>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <label className="block text-xs text-amber-700 mb-1 font-medium">Días hábiles máximos</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="0" max="30"
                    value={sla_dias}
                    onChange={e => onEditarSLA(estado.id, { sla_dias: e.target.value })}
                    className="w-20 px-2 py-1.5 text-sm border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white"
                  />
                  <span className="text-xs text-amber-600">días hábiles</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-amber-700 mb-1 font-medium">Alertar con anticipación</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="0" max="30"
                    value={sla_alerta}
                    onChange={e => onEditarSLA(estado.id, { sla_alerta_dias: e.target.value })}
                    className="w-20 px-2 py-1.5 text-sm border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white"
                  />
                  <span className="text-xs text-amber-600">días antes</span>
                </div>
              </div>
            </div>
            {tieneSLA && sla_alerta > 0 && (
              <p className="mt-2 text-xs text-amber-600">
                Se alertará al responsable cuando queden <strong>{sla_alerta}</strong> día{sla_alerta > 1 ? 's' : ''} para el vencimiento ({sla_dias - sla_alerta} día{sla_dias - sla_alerta !== 1 ? 's' : ''} después de entrar al estado).
              </p>
            )}
            {sla_dias === 0 && (
              <p className="mt-2 text-xs text-amber-500 italic">Sin SLA configurado — el estado no tiene plazo máximo.</p>
            )}
          </div>

          {/* ── Actores responsables ─────────────────────────── */}
          <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-semibold text-indigo-800">Actores responsables</h4>
                <span className="text-xs text-indigo-500">Al asignar, solo aparecerán estos responsables</span>
              </div>
              <button
                onClick={() => onAgregarActor(estado.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-white border border-indigo-300 rounded-lg hover:bg-indigo-100 transition-colors">
                <UserPlus className="w-3.5 h-3.5" /> Agregar
              </button>
            </div>

            {actores.length === 0 ? (
              <p className="text-xs text-indigo-400 italic">
                Sin actores configurados — el DPO podrá escribir libremente el responsable.
              </p>
            ) : (
              <div className="space-y-2">
                {actores.map(actor => (
                  <ActorRow
                    key={actor.id}
                    actor={actor}
                    onEditar={(changes) => onEditarActor(estado.id, actor.id, changes)}
                    onEliminar={() => onEliminarActor(estado.id, actor.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Transiciones posibles ────────────────────────── */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
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
                        seleccionado ? `${ct.bg} ${ct.text} border-current` : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400'
                      }`}>
                      {seleccionado && <ArrowRight className="w-3 h-3" />}
                      {target.nombre}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Campos que el DPO completa al transicionar ───── */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Campos que debe completar el DPO al mover a este estado
            </label>
            {estado.campos_transicion?.length === 0 && (
              <p className="text-xs text-gray-400 italic mb-2">Ninguno. El DPO puede mover sin completar campos adicionales.</p>
            )}
            <div className="space-y-2">
              {(estado.campos_transicion || []).map(campo => (
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

          {/* ── Artículo (ley futura/custom) ─────────────────── */}
          {!esLeyNativo && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-amber-700 font-medium mb-1">
                    {estado.protegido ? 'Estado protegido por ley futura' : 'Estado personalizado'}. No podrá eliminarse ni desactivarse.
                  </p>
                  {estado.protegido && (
                    <input value={draft.articulo}
                      onChange={e => { setDraft(p => ({ ...p, articulo: e.target.value })); onEditar(estado.id, { articulo: e.target.value }); }}
                      className="mt-1 w-full px-2 py-1 text-xs border border-amber-300 rounded focus:outline-none bg-white"
                      placeholder="Ej: Art. 12° Ley 21.719 (modificación 2026)" />
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

// ── Modal: nuevo estado custom ────────────────────────────
const ModalNuevoEstado = ({ estadosExistentes, onConfirmar, onCancelar }) => {
  const [form, setForm] = useState({
    nombre: '', descripcion: '', color: 'gray',
    requiere_confirmacion: false, envia_email: false,
    protegido: false, articulo: '',
    sla_dias: 0, sla_alerta_dias: 0, actores: [],
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Nuevo estado personalizado</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Ej: PENDIENTE_APROBACION" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="¿Qué sucede en este estado?" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORES_ESTADO.map(col => (
                <button key={col.value} onClick={() => set('color', col.value)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${
                    COLOR_CLASSES[col.value]?.bg} ${COLOR_CLASSES[col.value]?.text} ${
                    form.color === col.value ? 'ring-2 ring-offset-1 ring-gray-400' : 'opacity-60'}`}>
                  {col.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.envia_email} onChange={e => set('envia_email', e.target.checked)} className="w-4 h-4" />
              Envía email
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.requiere_confirmacion} onChange={e => set('requiere_confirmacion', e.target.checked)} className="w-4 h-4" />
              Requiere confirmación
            </label>
          </div>
          <div className="flex gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">SLA (días hábiles)</label>
              <input type="number" min="0" value={form.sla_dias} onChange={e => set('sla_dias', parseInt(e.target.value) || 0)}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Alertar antes (días)</label>
              <input type="number" min="0" value={form.sla_alerta_dias} onChange={e => set('sla_alerta_dias', parseInt(e.target.value) || 0)}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none" />
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
            onClick={() => onConfirmar({ ...form, nombre: form.nombre.trim().toUpperCase().replace(/\s+/g, '_') })}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
            Agregar estado
          </button>
        </div>
      </div>
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
    toggleTransicion,
    editarSLA,
    agregarActor, editarActor, eliminarActor,
    getEstadosOrdenados,
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

  const derechos = Object.keys(DERECHOS_META_FLUJO);
  const meta     = DERECHOS_META_FLUJO[derechoActivo];
  const estados  = getEstadosOrdenados(derechoActivo);

  const DERECHO_COLORS = {
    blue:   { sidebar: 'border-blue-500 bg-blue-50',    header: 'bg-blue-600' },
    yellow: { sidebar: 'border-yellow-500 bg-yellow-50', header: 'bg-yellow-500' },
    red:    { sidebar: 'border-red-500 bg-red-50',      header: 'bg-red-600' },
    orange: { sidebar: 'border-orange-500 bg-orange-50', header: 'bg-orange-500' },
    green:  { sidebar: 'border-green-500 bg-green-50',  header: 'bg-green-600' },
  };
  const dc = DERECHO_COLORS[meta.color] || DERECHO_COLORS.blue;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">🔄 Configuración de Flujos</h2>
        <p className="text-sm text-gray-500">
          Define estados, transiciones, SLA y actores responsables por derecho ARCOP.
          Los estados <span className="font-medium text-amber-700">protegidos por ley</span> no pueden eliminarse.
        </p>
      </div>

      <div className="flex gap-6">

        {/* Sidebar derechos */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {derechos.map(key => {
            const m  = DERECHOS_META_FLUJO[key];
            const dc2 = DERECHO_COLORS[m.color] || DERECHO_COLORS.blue;
            const activo = key === derechoActivo;
            return (
              <button key={key} onClick={() => setDerechoActivo(key)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border-l-4 transition-all text-left ${
                  activo ? dc2.sidebar + ' text-gray-800' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}>
                <span>{m.icono}</span>
                <span>{m.nombre}</span>
              </button>
            );
          })}
        </div>

        {/* Panel derecho */}
        <div className="flex-1 min-w-0">

          {/* Header */}
          <div className={`${dc.header} text-white rounded-t-xl px-5 py-4 flex items-center justify-between`}>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-lg">{meta.icono}</span>
                <h3 className="font-bold text-lg">Derecho de {meta.nombre}</h3>
                <span className="text-xs opacity-75 bg-white/20 px-2 py-0.5 rounded-full">{meta.articulo}</span>
              </div>
              <p className="text-xs opacity-80">{estados.filter(e => e.activo).length} estados activos</p>
            </div>
            <button onClick={() => {
              if (window.confirm('¿Restaurar este flujo a los estados legales por defecto?'))
                restaurarDerecho(derechoActivo);
            }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Restaurar defaults
            </button>
          </div>

          {/* Lista de estados */}
          <div className="border border-t-0 border-gray-200 rounded-b-xl p-4 bg-white space-y-3">

            {/* Leyenda */}
            <div className="flex flex-wrap gap-3 pb-3 border-b border-gray-100 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-4 h-4 bg-blue-100 border border-blue-200 rounded text-blue-700 text-center text-xs leading-4">L</span> Obligatorio por ley</span>
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-amber-500" /> Protegido</span>
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-blue-500" /> Envía email</span>
              <span className="flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5 text-purple-500" /> Requiere confirmación</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-500" /> SLA configurado</span>
              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-indigo-500" /> Actores asignados</span>
            </div>

            {estados.map((estado, idx) => (
              <PanelEstado
                key={estado.id}
                estado={estado}
                todos={estados}
                isFirst={idx === 0}
                isLast={idx === estados.length - 1}
                onToggle={(id)                  => toggleEstado(derechoActivo, id)}
                onEditar={(id, changes)          => editarEstado(derechoActivo, id, changes)}
                onToggleProtegido={(id)          => toggleProtegidoPorLey(derechoActivo, id)}
                onMover={(id, dir)               => moverEstado(derechoActivo, id, dir)}
                onEliminar={(id)                 => eliminarEstado(derechoActivo, id)}
                onAgregarCampo={(id)             => agregarCampoTransicion(derechoActivo, id)}
                onEditarCampo={(eid, cid, ch)    => editarCampoTransicion(derechoActivo, eid, cid, ch)}
                onEliminarCampo={(eid, cid)      => eliminarCampoTransicion(derechoActivo, eid, cid)}
                onToggleTransicion={(eid, tid)   => toggleTransicion(derechoActivo, eid, tid)}
                onEditarSLA={(id, sla)           => editarSLA(derechoActivo, id, sla)}
                onAgregarActor={(id)             => agregarActor(derechoActivo, id)}
                onEditarActor={(eid, aid, ch)    => editarActor(derechoActivo, eid, aid, ch)}
                onEliminarActor={(eid, aid)      => eliminarActor(derechoActivo, eid, aid)}
              />
            ))}

            <button onClick={() => setModalNuevo(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all text-sm">
              <Plus className="w-4 h-4" /> Agregar estado personalizado
            </button>

            <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-200">
              <AlertCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
              Los cambios se aplican al Panel DPO después de guardar.
              Los estados de origen <span className="font-medium mx-0.5">Ley</span> no pueden eliminarse.
            </div>
          </div>
        </div>
      </div>

      {modalNuevo && (
        <ModalNuevoEstado
          estadosExistentes={estados}
          onCancelar={() => setModalNuevo(false)}
          onConfirmar={(form) => { agregarEstado(derechoActivo, form); setModalNuevo(false); }}
        />
      )}
    </div>
  );
};

export default TabFlujos;