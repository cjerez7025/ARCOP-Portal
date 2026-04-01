// ============================================================
// TAB FLUJOS — v4
// Agrega: SlackWebhookPanel — configura webhook por derecho
// desde la UI, sin tocar código.
// ============================================================

import React, { useState } from 'react';
import {
  ChevronUp, ChevronDown, Plus, Trash2, RotateCcw,
  Eye, EyeOff, AlertCircle, Edit2, Check, X,
  ArrowRight, Mail, Shield, ShieldOff, GitBranch,
  CheckSquare, AlertTriangle, Clock, User, UserPlus,
  Settings, Link2,
} from 'lucide-react';
import {
  DERECHOS_META_FLUJO, COLORES_ESTADO, TIPOS_CAMPO_TRANSICION,
  crearCampoTransicion, COLOR_CLASSES, getColor,
} from '../services/flujoService';
import FlowDiagramEditor from './FlowDiagramEditor';

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
        <>
          <input value={draft.label} onChange={e => setDraft(p => ({ ...p, label: e.target.value }))}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <select value={draft.tipo} onChange={e => setDraft(p => ({ ...p, tipo: e.target.value }))}
            className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none">
            {TIPOS_CAMPO_TRANSICION.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={draft.obligatorio} onChange={e => setDraft(p => ({ ...p, obligatorio: e.target.checked }))} className="w-3 h-3" />
            Requerido
          </label>
          <button onClick={confirmar} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={() => setEditando(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="w-3.5 h-3.5" /></button>
        </>
      ) : (
        <>
          <span className="flex-1 text-xs text-gray-700 font-medium">{campo.label}</span>
          <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{campo.tipo}</span>
          {campo.obligatorio && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">*</span>}
          {!protegido && (
            <>
              <button onClick={() => setEditando(true)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-3 h-3" /></button>
              <button onClick={onEliminar} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3" /></button>
            </>
          )}
        </>
      )}
    </div>
  );
};

// ── Panel de estado (fila expandible) ─────────────────────
const PanelEstado = ({
  estado, todos, isFirst, isLast,
  onToggle, onEditar, onToggleProtegido, onMover, onEliminar,
  onAgregarCampo, onEditarCampo, onEliminarCampo,
  onToggleTransicion, onEditarSLA,
  onAgregarActor, onEditarActor, onEliminarActor,
}) => {
  const [expandido,      setExpandido]      = useState(false);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [borrador,       setBorrador]       = useState(estado.nombre);
  const [editandoSLA,    setEditandoSLA]    = useState(false);
  const [slaForm,        setSlaForm]        = useState({
    sla_dias:        estado.sla_dias        ?? 15,
    sla_alerta_dias: estado.sla_alerta_dias ?? 3,
  });

  const c           = getColor(estado.color);
  const esLeyNativo = estado.origen === 'ley';

  const confirmarNombre = () => {
    if (borrador.trim()) onEditar(estado.id, { nombre: borrador.trim() });
    setEditandoNombre(false);
  };

  return (
    <div className={`border rounded-xl transition-all ${estado.activo !== false
      ? 'border-gray-200 bg-white shadow-sm'
      : 'border-gray-100 bg-gray-50 opacity-60'
    }`}>
      {/* Cabecera del estado */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Badge color */}
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${c.bg.replace('bg-', 'bg-').replace('-100', '-400')}`}
          style={{ backgroundColor: getColor(estado.color).text.replace('text-', '') }} />

        {/* Nombre */}
        <div className="flex-1 min-w-0">
          {editandoNombre ? (
            <div className="flex items-center gap-2">
              <input value={borrador}
                onChange={e => setBorrador(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') confirmarNombre(); if (e.key === 'Escape') setEditandoNombre(false); }}
                className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                autoFocus />
              <button onClick={confirmarNombre} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4" /></button>
              <button onClick={() => setEditandoNombre(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-800 truncate">{estado.nombre}</span>
              {esLeyNativo && (
                <span className="text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 px-1.5 py-0.5 rounded">L</span>
              )}
              {estado.protegido && <Shield className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
              {estado.envia_email && <Mail className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
              {estado.requiere_confirmacion && <CheckSquare className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
              {(estado.sla_dias > 0) && <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
              {(estado.actores?.length > 0) && <User className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />}
            </div>
          )}
        </div>

        {/* Acciones inline */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {!esLeyNativo && !editandoNombre && (
            <button onClick={() => setEditandoNombre(true)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => onMover(estado.id, 'up')} disabled={isFirst}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onMover(estado.id, 'down')} disabled={isLast}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onToggle(estado.id)}
            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title={estado.activo !== false ? 'Desactivar' : 'Activar'}>
            {estado.activo !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          {!esLeyNativo && (
            <button onClick={() => { if (window.confirm(`¿Eliminar el estado "${estado.nombre}"?`)) onEliminar(estado.id); }}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => setExpandido(!expandido)}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ml-1">
            {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Panel expandido */}
      {expandido && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Descripción</label>
            <textarea value={estado.descripcion || ''} rows={2}
              onChange={e => onEditar(estado.id, { descripcion: e.target.value })}
              placeholder="Descripción del estado..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORES_ESTADO.map(col => (
                <button key={col.value} onClick={() => onEditar(estado.id, { color: col.value })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
                    ${estado.color === col.value
                      ? 'ring-2 ring-offset-1 ring-gray-400 scale-105'
                      : 'opacity-60 hover:opacity-100'}`}>
                  <span className={`w-3 h-3 rounded-full ${col.bg.replace('-100', '-400')}`} />
                  {col.label}
                </button>
              ))}
            </div>
          </div>

          {/* Opciones */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={estado.envia_email || false}
                onChange={e => onEditar(estado.id, { envia_email: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-sm text-gray-700">Envía email</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={estado.requiere_confirmacion || false}
                onChange={e => onEditar(estado.id, { requiere_confirmacion: e.target.checked })}
                className="w-4 h-4 text-green-600 rounded" />
              <span className="text-sm text-gray-700">Requiere confirmación</span>
            </label>
          </div>

          {/* SLA */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> SLA
              </p>
              <button onClick={() => setEditandoSLA(!editandoSLA)}
                className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg">
                {editandoSLA ? 'Cancelar' : 'Editar'}
              </button>
            </div>
            {editandoSLA ? (
              <div className="flex gap-4 items-center bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                <label className="text-xs text-gray-700 flex items-center gap-2">
                  Plazo límite:
                  <input type="number" min="0" max="60" value={slaForm.sla_dias}
                    onChange={e => setSlaForm(p => ({ ...p, sla_dias: parseInt(e.target.value) || 0 }))}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none" />
                  días
                </label>
                <label className="text-xs text-gray-700 flex items-center gap-2">
                  Alerta a:
                  <input type="number" min="0" max="30" value={slaForm.sla_alerta_dias}
                    onChange={e => setSlaForm(p => ({ ...p, sla_alerta_dias: parseInt(e.target.value) || 0 }))}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none" />
                  días
                </label>
                <button onClick={() => { onEditarSLA(estado.id, slaForm); setEditandoSLA(false); }}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
                  Guardar
                </button>
              </div>
            ) : (
              <div className="flex gap-4 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                <span>Plazo: <strong>{estado.sla_dias ?? 15} días</strong></span>
                <span>Alerta: <strong>{estado.sla_alerta_dias ?? 3} días antes</strong></span>
              </div>
            )}
          </div>

          {/* Actores */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-500" /> Actores responsables
              </p>
              <button onClick={() => onAgregarActor(estado.id)}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors">
                <UserPlus className="w-3.5 h-3.5" /> Agregar
              </button>
            </div>
            {(estado.actores || []).length === 0 ? (
              <p className="text-xs text-gray-400 italic">Sin actores asignados</p>
            ) : (
              <div className="space-y-2">
                {estado.actores.map(actor => (
                  <div key={actor.id} className="flex items-center gap-2">
                    <input value={actor.nombre} placeholder="Nombre"
                      onChange={e => onEditarActor(estado.id, actor.id, { nombre: e.target.value })}
                      className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                    <input value={actor.email} placeholder="Email"
                      onChange={e => onEditarActor(estado.id, actor.id, { email: e.target.value })}
                      className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                    <button onClick={() => onEliminarActor(estado.id, actor.id)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transiciones posibles */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-blue-500" /> Transiciones posibles
            </p>
            <div className="flex flex-wrap gap-2">
              {todos.filter(e => e.id !== estado.id).map(dest => {
                const activo = (estado.transiciones_posibles || []).includes(dest.id);
                const cd = getColor(dest.color);
                return (
                  <button key={dest.id} onClick={() => onToggleTransicion(estado.id, dest.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      activo
                        ? `${cd.bg} ${cd.text} ${cd.border} ring-2 ring-offset-1 ring-blue-300`
                        : 'bg-gray-50 text-gray-500 border-gray-200 opacity-60 hover:opacity-100'
                    }`}>
                    {activo && <Check className="w-3 h-3" />}
                    {dest.nombre}
                  </button>
                );
              })}
              {todos.filter(e => e.id !== estado.id).length === 0 && (
                <p className="text-xs text-gray-400 italic">No hay otros estados en este flujo</p>
              )}
            </div>
          </div>

          {/* Campos de transición */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-purple-500" /> Campos al entrar a este estado
              </p>
              <button onClick={() => onAgregarCampo(estado.id)}
                className="flex items-center gap-1 text-xs text-purple-600 hover:bg-purple-50 px-2 py-1 rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5" /> Agregar
              </button>
            </div>
            {(estado.campos_transicion || []).length === 0 ? (
              <p className="text-xs text-gray-400 italic">Sin campos adicionales</p>
            ) : (
              <div className="space-y-1">
                {estado.campos_transicion.map(campo => (
                  <CampoTransicionRow
                    key={campo.id}
                    campo={campo}
                    protegido={estado.protegido}
                    onEditar={(ch) => onEditarCampo(estado.id, campo.id, ch)}
                    onEliminar={() => onEliminarCampo(estado.id, campo.id)}
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

// ── Modal nuevo estado ────────────────────────────────────
const ModalNuevoEstado = ({ estadosExistentes, onCancelar, onConfirmar }) => {
  const [form, setForm] = useState({
    nombre: '', descripcion: '', color: 'blue',
    envia_email: false, requiere_confirmacion: false,
    sla_dias: 15, sla_alerta_dias: 3,
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Nuevo estado personalizado</h3>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre del estado *</label>
          <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
            placeholder="Ej: EN_REVISION_LEGAL"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          <p className="text-xs text-gray-400 mt-1">Se convertirá a MAYÚSCULAS_SIN_ESPACIOS</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción</label>
          <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
            rows={2} placeholder="¿Qué ocurre en este estado?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLORES_ESTADO.map(col => (
              <button key={col.value} onClick={() => set('color', col.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
                  ${form.color === col.value
                    ? 'ring-2 ring-offset-1 ring-gray-400 scale-105'
                    : 'opacity-60 hover:opacity-100'}`}>
                {col.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.envia_email}
              onChange={e => set('envia_email', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded" />
            <span className="text-sm text-gray-700">Envía email</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.requiere_confirmacion}
              onChange={e => set('requiere_confirmacion', e.target.checked)}
              className="w-4 h-4 text-green-600 rounded" />
            <span className="text-sm text-gray-700">Requiere confirmación</span>
          </label>
        </div>

        <div className="flex gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">SLA (días)</label>
            <input type="number" min="0" value={form.sla_dias}
              onChange={e => set('sla_dias', parseInt(e.target.value) || 0)}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Alerta (días)</label>
            <input type="number" min="0" value={form.sla_alerta_dias}
              onChange={e => set('sla_alerta_dias', parseInt(e.target.value) || 0)}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
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

// ── Panel Slack Webhook por derecho ── NUEVO ──────────────
const SlackWebhookPanel = ({ derechoKey, webhook, onGuardar }) => {
  const [editando, setEditando] = useState(false);
  const [draft,    setDraft]    = useState(webhook || '');
  const [probando, setProbando] = useState(false);

  // Sincronizar cuando cambia el derecho activo
  React.useEffect(() => {
    setDraft(webhook || '');
    setEditando(false);
  }, [derechoKey, webhook]);

  const esValida = (url) =>
    !url || url.startsWith('https://hooks.slack.com/services/');

  const handleGuardar = () => {
    if (!esValida(draft)) return;
    onGuardar(draft);
    setEditando(false);
  };

  const handleProbar = async () => {
    if (!webhook) return;
    setProbando(true);
    try {
      const appsScriptUrl = process.env.REACT_APP_APPS_SCRIPT_URL;
      // Apps Script lee `action` desde e.parameter (query string)
      // y el body desde e.postData.contents
      const resp = await fetch(appsScriptUrl + '?action=probarSlackWebhook', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          webhook_url: webhook,
          derecho:     derechoKey,
        }),
      });
      const text = await resp.text();
      const data = JSON.parse(text);
      if (data.status === 'success') {
        alert('✅ Mensaje de prueba enviado al canal de Slack');
      } else {
        alert('❌ Error: ' + (data.message || 'Revisa la URL del webhook'));
      }
    } catch (e) {
      alert('❌ Error de conexión: ' + e.message);
    } finally {
      setProbando(false);
    }
  };

  const tieneWebhook = !!webhook;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 space-y-3">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
            tieneWebhook ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            <Link2 className={`w-3.5 h-3.5 ${tieneWebhook ? 'text-green-600' : 'text-gray-400'}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Canal Slack</p>
            <p className="text-xs text-gray-400">
              {tieneWebhook
                ? '✅ Webhook configurado — notificaciones activas en este canal'
                : 'Sin canal propio — usa el webhook general (SLACK_WEBHOOK_URL)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {tieneWebhook && !editando && (
            <button
              onClick={handleProbar}
              disabled={probando}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors"
            >
              {probando ? '⏳' : '🧪'} {probando ? 'Enviando...' : 'Probar'}
            </button>
          )}
          <button
            onClick={() => { setEditando(!editando); setDraft(webhook || ''); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {editando
              ? <><X className="w-3.5 h-3.5" /> Cancelar</>
              : <><Edit2 className="w-3.5 h-3.5" /> {tieneWebhook ? 'Editar' : 'Configurar'}</>
            }
          </button>
        </div>
      </div>

      {/* URL actual (solo lectura) */}
      {tieneWebhook && !editando && (
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
          <code className="text-xs text-gray-500 truncate flex-1">
            {webhook.replace('https://hooks.slack.com/services/', 'hooks.slack.com/…/')}
          </code>
        </div>
      )}

      {/* Formulario edición */}
      {editando && (
        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Webhook URL de Slack</label>
            <input
              type="url"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="https://hooks.slack.com/services/T.../B.../..."
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                draft && !esValida(draft)
                  ? 'border-red-300 focus:ring-red-200 bg-red-50'
                  : 'border-gray-300 focus:ring-blue-200'
              }`}
            />
            {draft && !esValida(draft) && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                La URL debe comenzar con https://hooks.slack.com/services/
              </p>
            )}
            {!draft && (
              <p className="text-xs text-gray-400">
                Deja vacío para usar el webhook general (SLACK_WEBHOOK_URL en Script Properties)
              </p>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { setDraft(''); onGuardar(''); setEditando(false); }}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 border border-gray-200 rounded-lg transition-colors"
            >
              Limpiar
            </button>
            <button
              onClick={handleGuardar}
              disabled={!esValida(draft)}
              className="flex-1 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              Guardar webhook
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Componente principal ──────────────────────────────────
const TabFlujos = ({ hook, derechoActivoExterno }) => {
  const {
    config, loading,
    toggleEstado, editarEstado, toggleProtegidoPorLey,
    moverEstado, agregarEstado, eliminarEstado, restaurarDerecho,
    agregarCampoTransicion, editarCampoTransicion, eliminarCampoTransicion,
    toggleTransicion,
    editarSLA,
    agregarActor, editarActor, eliminarActor,
    getEstadosOrdenados,
    editarSlackWebhook,
  } = hook;

  const [derechoActivoInterno, setDerechoActivoInterno] = useState('ACCESO');
  const derechoActivo    = derechoActivoExterno || derechoActivoInterno;
  const setDerechoActivo = derechoActivoExterno ? () => {} : setDerechoActivoInterno;
  const [vista,         setVista]         = useState('lista'); // 'lista' | 'diagrama'
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
    blue:   { sidebar: 'border-blue-500 bg-blue-50',     header: 'from-blue-700 to-blue-600'    },
    yellow: { sidebar: 'border-yellow-500 bg-yellow-50', header: 'from-yellow-600 to-yellow-500' },
    red:    { sidebar: 'border-red-500 bg-red-50',       header: 'from-red-700 to-red-600'      },
    orange: { sidebar: 'border-orange-500 bg-orange-50', header: 'from-orange-600 to-orange-500' },
    green:  { sidebar: 'border-green-500 bg-green-50',   header: 'from-green-700 to-green-600'  },
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

       {/* Sidebar — oculto cuando viene prop externa */}
      {!derechoActivoExterno && (
      <div className="lg:col-span-1 space-y-1.5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Derechos ARCOP</p>
            {derechos.map(key => {
            const m    = DERECHOS_META_FLUJO[key];
            const dc2  = DERECHO_COLORS[m.color] || DERECHO_COLORS.blue;
            const est  = config.derechos?.[key]?.estados || [];
            const hook_url = config.derechos?.[key]?.slack_webhook;
            return (
              <button key={key}
                onClick={() => { setDerechoActivo(key); setVista('lista'); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${
                  derechoActivo === key
                    ? `${dc2.sidebar} border-2`
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">{m.icono} {m.nombre}</span>
                  <div className="flex items-center gap-1">
                    {hook_url && (
                      <span title="Webhook Slack configurado">
                        <Link2 className="w-3 h-3 text-green-500" />
                      </span>
                    )}
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {est.filter(e => e.activo !== false).length} estados
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{m.articulo}</p>
              </button>
            );
          })}
        </div>)}

        {/* Panel principal */}
        <div className="lg:col-span-3 space-y-4">

          {/* Header con toggle Editar | Diagrama */}
          <div className={`bg-gradient-to-r ${dc.header} rounded-2xl px-5 py-4`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-lg">{meta.icono} Derecho de {meta.nombre}</h3>
                <p className="text-sm text-white/75 mt-0.5">
                  {estados.filter(e => e.activo !== false).length} estados activos
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Toggle lista / diagrama */}
                <div className="flex bg-white/20 rounded-xl p-1 gap-1">
                  <button onClick={() => setVista('lista')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      vista === 'lista' ? 'bg-white text-gray-800 shadow-sm' : 'text-white/80 hover:bg-white/10'
                    }`}>
                    <Settings className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button onClick={() => setVista('diagrama')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      vista === 'diagrama' ? 'bg-white text-gray-800 shadow-sm' : 'text-white/80 hover:bg-white/10'
                    }`}>
                    <GitBranch className="w-3.5 h-3.5" /> Diagrama
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`¿Restaurar flujo de ${meta.nombre} a los estados por defecto?`))
                      restaurarDerecho(derechoActivo);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/90 bg-white/20 border border-white/30 rounded-xl hover:bg-white/30">
                  <RotateCcw className="w-3.5 h-3.5" /> Restaurar defaults
                </button>
              </div>
            </div>
          </div>

          {/* ── Canal Slack por derecho ── NUEVO v4 ── */}
          <SlackWebhookPanel
            derechoKey={derechoActivo}
            webhook={config.derechos?.[derechoActivo]?.slack_webhook || ''}
            onGuardar={(url) => editarSlackWebhook(derechoActivo, url)}
          />

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
            <div className="space-y-3">
              {/* Leyenda */}
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 bg-white rounded-xl border border-gray-200 px-4 py-2.5">
                <span className="font-semibold text-gray-400 uppercase tracking-wider">Leyenda:</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-blue-500 font-bold text-xs border border-blue-200 bg-blue-50 px-1.5 py-0.5 rounded">L</span>
                  Obligatorio por ley
                </span>
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-amber-500" /> Protegido</span>
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-blue-400" /> Envía email</span>
                <span className="flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5 text-green-500" /> Requiere confirmación</span>
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
                  onToggle={(id)                 => toggleEstado(derechoActivo, id)}
                  onEditar={(id, changes)         => editarEstado(derechoActivo, id, changes)}
                  onToggleProtegido={(id)         => toggleProtegidoPorLey(derechoActivo, id)}
                  onMover={(id, dir)              => moverEstado(derechoActivo, id, dir)}
                  onEliminar={(id)                => eliminarEstado(derechoActivo, id)}
                  onAgregarCampo={(id)            => agregarCampoTransicion(derechoActivo, id)}
                  onEditarCampo={(eid, cid, ch)   => editarCampoTransicion(derechoActivo, eid, cid, ch)}
                  onEliminarCampo={(eid, cid)     => eliminarCampoTransicion(derechoActivo, eid, cid)}
                  onToggleTransicion={(eid, tid)  => toggleTransicion(derechoActivo, eid, tid)}
                  onEditarSLA={(id, sla)          => editarSLA(derechoActivo, id, sla)}
                  onAgregarActor={(id)            => agregarActor(derechoActivo, id)}
                  onEditarActor={(eid, aid, ch)   => editarActor(derechoActivo, eid, aid, ch)}
                  onEliminarActor={(eid, aid)     => eliminarActor(derechoActivo, eid, aid)}
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
          )}

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