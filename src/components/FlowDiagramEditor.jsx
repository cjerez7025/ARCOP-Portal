// ============================================================
// FLOW DIAGRAM EDITOR
// Diagrama SVG interactivo con 3 modos de edición:
// 1. Click en nodo      → panel de propiedades del estado
// 2. Click en flecha    → panel de propiedades de la transición
// 3. Drag desde puerto  → crea transición nueva al soltar en nodo
// ============================================================

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Plus, Trash2, ChevronRight, Zap, Hand,
  Mail, Shield, CheckSquare, GitBranch, Check, AlertCircle
} from 'lucide-react';
import { COLOR_CLASSES, COLORES_TRANSICION, COLORES_ESTADO, TIPOS_CAMPO, crearTransicion, crearCampoRequerido } from '../services/flujoService';

const NODE_W  = 148;
const NODE_H  = 60;
const PORT_R  = 7;   // radio del puerto de conexión

const getC = (color) => COLOR_CLASSES[color] || COLOR_CLASSES.gray;

// ── Utilidades geométricas ────────────────────────────────
const getPosicion = (estado, idx, allEstados) => ({
  x: estado.pos_x ?? 60 + (idx % 5) * 190,
  y: estado.pos_y ?? 80 + Math.floor(idx / 5) * 150,
});

// 8 puertos por nodo (N NE E SE S SW W NW)
const PORTS = [
  { id: 'n',  px: 0.5, py: 0   },
  { id: 'ne', px: 1,   py: 0   },
  { id: 'e',  px: 1,   py: 0.5 },
  { id: 'se', px: 1,   py: 1   },
  { id: 's',  px: 0.5, py: 1   },
  { id: 'sw', px: 0,   py: 1   },
  { id: 'w',  px: 0,   py: 0.5 },
  { id: 'nw', px: 0,   py: 0   },
];

const portXY = (pos, portId) => {
  const p = PORTS.find(pp => pp.id === portId) || PORTS[2];
  return { x: pos.x + p.px * NODE_W, y: pos.y + p.py * NODE_H };
};

// Mejor par de puertos entre dos nodos
const bestPorts = (srcPos, dstPos) => {
  let best = { src: 'e', dst: 'w', dist: Infinity };
  for (const sp of PORTS) {
    for (const dp of PORTS) {
      const sx = srcPos.x + sp.px * NODE_W, sy = srcPos.y + sp.py * NODE_H;
      const dx = dstPos.x + dp.px * NODE_W, dy = dstPos.y + dp.py * NODE_H;
      const d  = Math.hypot(dx - sx, dy - sy);
      if (d < best.dist) best = { src: sp.id, dst: dp.id, dist: d };
    }
  }
  return best;
};

// Bezier entre dos puntos
const bezierPath = (fx, fy, tx, ty) => {
  const dx = tx - fx, dy = ty - fy;
  const cx1 = fx + dx * 0.5, cy1 = fy;
  const cx2 = fx + dx * 0.5, cy2 = ty;
  return `M ${fx} ${fy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`;
};

// Punto medio de una bezier cubica (t=0.5)
const bezierMid = (fx, fy, tx, ty) => {
  const dx = tx - fx, dy = ty - fy;
  const cx1 = fx + dx * 0.5, cy1 = fy;
  const cx2 = fx + dx * 0.5, cy2 = ty;
  const t = 0.5;
  const mt = 1 - t;
  return {
    x: mt*mt*mt*fx + 3*mt*mt*t*cx1 + 3*mt*t*t*cx2 + t*t*t*tx,
    y: mt*mt*mt*fy + 3*mt*mt*t*cy1 + 3*mt*t*t*cy2 + t*t*t*ty,
  };
};

// ── Panel lateral de propiedades ─────────────────────────
const PanelEstado = ({ estado, todos, onEditar, onEliminar, onAgregarTransicion, onCerrar }) => {
  const c = getC(estado.color);
  const esLey = estado.origen === 'ley' || estado.origen === 'ley_futura';
  const otrosActivos = todos.filter(e => e.id !== estado.id && e.activo);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`px-4 py-3 flex items-start justify-between flex-shrink-0 border-b border-gray-100`}
           style={{ background: c.fill, borderLeft: `4px solid ${c.stroke}` }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 text-sm">{estado.nombre}</span>
            {esLey && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">Ley</span>}
            {estado.es_final && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">FINAL</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{estado.articulo || 'Estado personalizado'}</p>
        </div>
        <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 p-0.5 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Descripción */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Descripción</label>
          <textarea value={estado.descripcion || ''}
            onChange={e => onEditar({ descripcion: e.target.value })}
            rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
        </div>

        {/* Color — solo custom */}
        {!esLey && (
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORES_ESTADO.map(col => (
                <button key={col.value} onClick={() => onEditar({ color: col.value })}
                  title={col.label}
                  className="w-5 h-5 rounded-full border-2 transition-all"
                  style={{ background: COLOR_CLASSES[col.value]?.stroke || '#6B7280',
                           borderColor: estado.color === col.value ? '#1E293B' : 'transparent',
                           transform: estado.color === col.value ? 'scale(1.3)' : 'scale(1)' }} />
              ))}
            </div>
          </div>
        )}

        {/* Comportamiento */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Comportamiento</label>
          <div className="space-y-2">
            {[
              { key: 'requiere_confirmacion', label: 'Requiere confirmación', icon: CheckSquare },
              { key: 'envia_email',           label: 'Envía email al titular', icon: Mail       },
              { key: 'es_final',              label: 'Estado final (sin salidas)', icon: null  },
            ].map(({ key, label, icon: Icon }) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={!!estado[key]}
                  onChange={e => onEditar({ [key]: e.target.checked })}
                  className="w-3.5 h-3.5 text-blue-600 rounded" />
                <span className="text-xs text-gray-700 flex items-center gap-1">
                  {Icon && <Icon className="w-3 h-3 text-gray-400" />} {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Transiciones salientes */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Transiciones salientes ({(estado.transiciones || []).length})
          </label>
          {(estado.transiciones || []).length === 0
            ? <p className="text-xs text-gray-400 italic">Sin transiciones. Arrastra desde un puerto para crear una.</p>
            : (
              <div className="space-y-1.5">
                {(estado.transiciones || []).map(tr => {
                  const tc = getC(tr.color);
                  const dst = todos.find(e => e.id === tr.hacia);
                  return (
                    <div key={tr.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-100 bg-gray-50 text-xs">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tc.stroke }} />
                      <span className="font-medium text-gray-800 flex-1 truncate">{tr.etiqueta}</span>
                      <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                      <span className="text-gray-500 truncate">{dst?.nombre || '???'}</span>
                    </div>
                  );
                })}
              </div>
            )
          }

          {/* Agregar transición manualmente */}
          <div className="mt-2">
            <p className="text-xs text-gray-400 mb-1.5">Agregar hacia:</p>
            <div className="flex flex-wrap gap-1.5">
              {otrosActivos.map(dest => {
                const dc = getC(dest.color);
                const yaExiste = (estado.transiciones || []).some(t => t.hacia === dest.id);
                return (
                  <button key={dest.id} onClick={() => !yaExiste && onAgregarTransicion(dest.id)}
                    disabled={yaExiste}
                    className={`px-2 py-1 rounded-lg text-xs font-medium border transition-all ${
                      yaExiste
                        ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400'
                        : `${dc.bg} ${dc.text} ${dc.border} hover:shadow-sm cursor-pointer`
                    }`}>
                    {yaExiste ? '✓' : '+'} {dest.nombre}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Eliminar (solo custom no-protegido) */}
        {estado.origen === 'custom' && !estado.protegido && (
          <button onClick={() => { if (window.confirm(`¿Eliminar "${estado.nombre}"?`)) onEliminar(); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 text-xs">
            <Trash2 className="w-3.5 h-3.5" /> Eliminar estado
          </button>
        )}
      </div>
    </div>
  );
};

// ── Panel lateral de transición ──────────────────────────
const PanelTransicion = ({ tr, estadoSrc, estadoDst, todos, onEditar, onEliminar, onCerrar,
                           onAgregarCampo, onEditarCampo, onEliminarCampo }) => {
  const c = getC(tr.color);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 flex items-start justify-between flex-shrink-0 border-b border-gray-100 bg-gray-50">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.stroke }} />
            <span className="font-bold text-gray-900 text-sm">{tr.etiqueta || '(sin etiqueta)'}</span>
            {tr.condicion === 'automatica' && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                <Zap className="w-3 h-3" /> auto
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {estadoSrc?.nombre} → {estadoDst?.nombre || tr.hacia}
          </p>
        </div>
        <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 p-0.5"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Etiqueta */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Etiqueta *</label>
          <input value={tr.etiqueta || ''} onChange={e => onEditar({ etiqueta: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Aprobada, Denegar, Escalar..." />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Descripción / ayuda</label>
          <input value={tr.descripcion || ''} onChange={e => onEditar({ descripcion: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Texto de ayuda para el DPO" />
        </div>

        {/* Estado destino */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Estado destino</label>
          <select value={tr.hacia || ''} onChange={e => onEditar({ hacia: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
            <option value="">Seleccionar...</option>
            {todos.filter(e => e.id !== estadoSrc?.id).map(e => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
        </div>

        {/* Color */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Color de la flecha</label>
          <div className="flex flex-wrap gap-2">
            {COLORES_TRANSICION.map(col => (
              <button key={col.value} onClick={() => onEditar({ color: col.value })}
                title={col.label}
                className="w-5 h-5 rounded-full border-2 transition-all"
                style={{ background: COLOR_CLASSES[col.value]?.stroke || '#6B7280',
                         borderColor: tr.color === col.value ? '#1E293B' : 'transparent',
                         transform: tr.color === col.value ? 'scale(1.3)' : 'scale(1)' }} />
            ))}
          </div>
        </div>

        {/* Tipo condición */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tipo de condición</label>
          <div className="flex gap-2">
            <button onClick={() => onEditar({ condicion: 'dpo_elige', condicion_campo: null, condicion_valor: null })}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                tr.condicion !== 'automatica' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-300 hover:border-blue-400'}`}>
              <Hand className="w-3.5 h-3.5" /> DPO elige
            </button>
            <button onClick={() => onEditar({ condicion: 'automatica' })}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                tr.condicion === 'automatica' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-gray-500 border-gray-300 hover:border-yellow-400'}`}>
              <Zap className="w-3.5 h-3.5" /> Automática
            </button>
          </div>
        </div>

        {/* Condición automática */}
        {tr.condicion === 'automatica' && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl space-y-2">
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

        {/* Campos requeridos */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Campos que completa el DPO al tomar esta transición
          </label>
          <div className="space-y-2">
            {(tr.campos_requeridos || []).map(campo => (
              <div key={campo.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <input value={campo.label} onChange={e => onEditarCampo(campo.id, { label: e.target.value })}
                    className="w-full text-xs bg-transparent border-none focus:outline-none font-medium text-gray-800" />
                </div>
                <select value={campo.tipo} onChange={e => onEditarCampo(campo.id, { tipo: e.target.value })}
                  className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white">
                  {TIPOS_CAMPO.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}
                </select>
                <button onClick={() => onEditarCampo(campo.id, { obligatorio: !campo.obligatorio })}
                  title={campo.obligatorio ? 'Obligatorio — click para hacer opcional' : 'Opcional — click para hacer obligatorio'}
                  className={`text-xs px-1.5 py-0.5 rounded font-bold ${campo.obligatorio ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                  {campo.obligatorio ? '*' : 'opt'}
                </button>
                <button onClick={() => onEliminarCampo(campo.id)}
                  className="text-gray-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1 mt-2">
            {TIPOS_CAMPO.slice(0, 6).map(tc => (
              <button key={tc.value} onClick={() => onAgregarCampo({ tipo: tc.value, label: tc.label.split('/')[0].trim() })}
                className="py-1 text-xs border border-dashed border-gray-300 text-gray-400 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-all truncate px-1">
                + {tc.value}
              </button>
            ))}
          </div>
        </div>

        {/* Eliminar transición */}
        <button onClick={() => { if (window.confirm(`¿Eliminar la transición "${tr.etiqueta}"?`)) onEliminar(); }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 text-xs">
          <Trash2 className="w-3.5 h-3.5" /> Eliminar transición
        </button>
      </div>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────
const FlowDiagramEditor = ({ estados, hook, derechoKey }) => {
  const {
    editarEstado, eliminarEstado, agregarTransicion,
    editarTransicion, eliminarTransicion,
    agregarCampoTransicion, editarCampoTransicion, eliminarCampoTransicion,
    moverNodo,
  } = hook;

  const svgRef = useRef(null);

  // Selección
  const [selNodo,   setSelNodo]   = useState(null); // id de estado
  const [selFlecha, setSelFlecha] = useState(null); // { estadoId, trId }

  // Drag nodo
  const [dragNodo, setDragNodo] = useState(null); // { id, offX, offY, rect, scaleX, scaleY }

  // Drag-to-connect: arrastrando desde un puerto
  const [dragConn, setDragConn] = useState(null); // { srcId, curX, curY }
  const [hoverNodo, setHoverNodo] = useState(null);
  const [hoverPuerto, setHoverPuerto] = useState(null); // { estadoId, portId }

  const activos = estados.filter(e => e.activo);

  // ViewBox dinámico
  const VW = Math.max(900, ...activos.map((e, i) => getPosicion(e, i).x + NODE_W + 80));
  const VH = Math.max(460, ...activos.map((e, i) => getPosicion(e, i).y + NODE_H + 100));

  // ── Conversión cliente → SVG ─────────────────────────────
  const clientToSVG = useCallback((cx, cy) => {
    const rect   = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (cx - rect.left) / rect.width  * VW,
      y: (cy - rect.top)  / rect.height * VH,
    };
  }, [VW, VH]);

  // ── Drag nodo ─────────────────────────────────────────────
  const startDragNodo = useCallback((e, estado, idx) => {
    e.stopPropagation();
    const { x, y } = clientToSVG(e.clientX, e.clientY);
    const pos = getPosicion(estado, idx);
    setDragNodo({ id: estado.id, offX: x - pos.x, offY: y - pos.y });
  }, [clientToSVG]);

  // ── Drag-to-connect (puerto) ─────────────────────────────
  const startDragConn = useCallback((e, estadoId) => {
    e.stopPropagation();
    e.preventDefault();
    const { x, y } = clientToSVG(e.clientX, e.clientY);
    setDragConn({ srcId: estadoId, curX: x, curY: y });
  }, [clientToSVG]);

  // ── Mouse move global ────────────────────────────────────
  const onMouseMove = useCallback((e) => {
    const { x, y } = clientToSVG(e.clientX, e.clientY);
    if (dragNodo) {
      moverNodo(derechoKey, dragNodo.id,
        Math.max(0, x - dragNodo.offX),
        Math.max(0, y - dragNodo.offY)
      );
    }
    if (dragConn) {
      setDragConn(prev => ({ ...prev, curX: x, curY: y }));
    }
  }, [dragNodo, dragConn, clientToSVG, moverNodo, derechoKey]);

  // ── Mouse up global ──────────────────────────────────────
  const onMouseUp = useCallback((e) => {
    if (dragConn && hoverNodo && hoverNodo !== dragConn.srcId) {
      // Crear transición srcId → hoverNodo
      const src = activos.find(a => a.id === dragConn.srcId);
      const yaExiste = (src?.transiciones || []).some(t => t.hacia === hoverNodo);
      if (!yaExiste) {
        agregarTransicion(derechoKey, dragConn.srcId,
          crearTransicion({ hacia: hoverNodo, etiqueta: 'Nueva transición', color: 'blue' })
        );
        // Seleccionar la nueva flecha automáticamente
        const newTrId = `tr_${dragConn.srcId}_${hoverNodo}_new`; // buscaremos por último id
        setSelNodo(null);
        // Leve delay para que el estado se actualice
        setTimeout(() => {
          const updatedSrc = activos.find(a => a.id === dragConn.srcId);
          if (updatedSrc?.transiciones?.length) {
            const last = updatedSrc.transiciones[updatedSrc.transiciones.length - 1];
            setSelFlecha({ estadoId: dragConn.srcId, trId: last?.id });
          }
        }, 50);
      }
    }
    setDragNodo(null);
    setDragConn(null);
  }, [dragConn, hoverNodo, activos, agregarTransicion, derechoKey]);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  // ── Click en el SVG (deseleccionar) ─────────────────────
  const onSVGClick = () => { setSelNodo(null); setSelFlecha(null); };

  // ── Selección de flecha ──────────────────────────────────
  const selectFlecha = (e, estadoId, trId) => {
    e.stopPropagation();
    setSelNodo(null);
    setSelFlecha({ estadoId, trId });
  };

  // ── Selección de nodo ────────────────────────────────────
  const selectNodo = (e, estadoId) => {
    e.stopPropagation();
    if (dragConn) return;
    setSelFlecha(null);
    setSelNodo(estadoId);
  };

  // ── Panel lateral actual ─────────────────────────────────
  const panelEstado = selNodo
    ? activos.find(e => e.id === selNodo)
    : null;

  const panelFlecha = selFlecha
    ? (() => {
        const src = activos.find(e => e.id === selFlecha.estadoId);
        const tr  = src?.transiciones?.find(t => t.id === selFlecha.trId);
        const dst = tr ? activos.find(e => e.id === tr.hacia) : null;
        return src && tr ? { src, tr, dst } : null;
      })()
    : null;

  // ── Calcular flechas ─────────────────────────────────────
  const flechas = [];
  activos.forEach((src, si) => {
    const srcPos = getPosicion(src, si);
    (src.transiciones || []).forEach((tr, ti) => {
      const di  = activos.findIndex(e => e.id === tr.hacia);
      if (di === -1) return;
      const dstPos = getPosicion(activos[di], di);
      const { src: sp, dst: dp } = bestPorts(srcPos, dstPos);
      const from = portXY(srcPos, sp);
      const to   = portXY(dstPos, dp);
      // Offset para flechas paralelas
      const paralelas  = (src.transiciones || []).filter(t => t.hacia === tr.hacia).length;
      const pIdx       = (src.transiciones || []).filter(t => t.hacia === tr.hacia).findIndex(t => t.id === tr.id);
      const offset     = paralelas > 1 ? (pIdx - (paralelas - 1) / 2) * 20 : 0;
      const seleccionada = selFlecha?.estadoId === src.id && selFlecha?.trId === tr.id;
      flechas.push({ tr, src, si, di, from, to, offset, seleccionada });
    });
  });

  const strokeOf = (color) => getC(color)?.stroke || '#6B7280';

  const colores = ['green','red','blue','orange','gray','purple','teal','indigo','yellow','pink'];

  return (
    <div className="flex gap-0 rounded-2xl overflow-hidden border border-slate-700" style={{ minHeight: 480 }}>

      {/* ── SVG área ─────────────────────────────────────── */}
      <div className="relative flex-1 bg-slate-950 overflow-hidden">
        {/* Grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <pattern id="fdgrid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="rgba(148,163,184,0.12)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#fdgrid)" />
        </svg>

        <svg ref={svgRef}
             viewBox={`0 0 ${VW} ${VH}`}
             style={{ width: '100%', height: '100%', minHeight: 460, display: 'block', position: 'relative',
                      cursor: dragConn ? 'crosshair' : dragNodo ? 'grabbing' : 'default' }}
             onClick={onSVGClick}>

          <defs>
            {colores.map(c => (
              <marker key={c} id={`fdarrow-${c}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill={strokeOf(c)} />
              </marker>
            ))}
          </defs>

          {/* Flechas */}
          {flechas.map(({ tr, src, from, to, offset, seleccionada }) => {
            const sc   = strokeOf(tr.color || 'blue');
            const path = bezierPath(from.x, from.y + offset, to.x, to.y + offset);
            const mid  = bezierMid(from.x, from.y + offset, to.x, to.y + offset);
            const esAuto = tr.condicion === 'automatica';
            const labelW = Math.min(90, tr.etiqueta ? tr.etiqueta.length * 7 + 16 : 80);

            return (
              <g key={tr.id}>
                {/* Zona clickeable invisible (más ancha) */}
                <path d={path} fill="none" stroke="transparent" strokeWidth="16"
                      style={{ cursor: 'pointer' }}
                      onClick={e => selectFlecha(e, src.id, tr.id)} />
                {/* Flecha visible */}
                <path d={path} fill="none" stroke={sc} strokeWidth={seleccionada ? 3 : 2}
                      strokeDasharray={esAuto ? '6 3' : 'none'}
                      markerEnd={`url(#fdarrow-${tr.color || 'blue'})`}
                      opacity={seleccionada ? 1 : 0.8}
                      style={{ transition: 'stroke-width 0.1s' }} />
                {/* Halo de selección */}
                {seleccionada && (
                  <path d={path} fill="none" stroke={sc} strokeWidth="8" opacity="0.15" />
                )}
                {/* Etiqueta */}
                <g style={{ cursor: 'pointer' }} onClick={e => selectFlecha(e, src.id, tr.id)}>
                  <rect x={mid.x - labelW / 2} y={mid.y - 10} width={labelW} height={20} rx="5"
                        fill="rgba(15,23,42,0.9)" stroke={seleccionada ? sc : 'rgba(100,116,139,0.4)'}
                        strokeWidth={seleccionada ? 1.5 : 1} />
                  <text x={mid.x} y={mid.y + 4} textAnchor="middle" fontSize="9" fill={sc}
                        fontWeight="600" fontFamily="system-ui, sans-serif">
                    {esAuto && '⚡ '}
                    {tr.etiqueta?.length > 14 ? tr.etiqueta.slice(0, 13) + '…' : (tr.etiqueta || '—')}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Línea provisional drag-to-connect */}
          {dragConn && (() => {
            const srcIdx = activos.findIndex(e => e.id === dragConn.srcId);
            if (srcIdx === -1) return null;
            const srcPos = getPosicion(activos[srcIdx], srcIdx);
            const center = { x: srcPos.x + NODE_W / 2, y: srcPos.y + NODE_H / 2 };
            return (
              <g>
                <line x1={center.x} y1={center.y} x2={dragConn.curX} y2={dragConn.curY}
                      stroke="#60A5FA" strokeWidth="2" strokeDasharray="6 3" opacity="0.8" />
                <circle cx={dragConn.curX} cy={dragConn.curY} r="6"
                        fill="#60A5FA" opacity="0.6" />
              </g>
            );
          })()}

          {/* Nodos */}
          {activos.map((estado, idx) => {
            const pos = getPosicion(estado, idx);
            const c   = getC(estado.color);
            const sel = selNodo === estado.id;
            const hov = hoverNodo === estado.id;
            const esLey = estado.origen === 'ley' || estado.origen === 'ley_futura';
            const isDragTarget = dragConn && hoverNodo === estado.id && hoverNodo !== dragConn.srcId;

            return (
              <g key={estado.id}
                 onMouseEnter={() => setHoverNodo(estado.id)}
                 onMouseLeave={() => setHoverNodo(null)}>

                {/* Sombra */}
                <rect x={pos.x + 3} y={pos.y + 4} width={NODE_W} height={NODE_H} rx="10"
                      fill="rgba(0,0,0,0.45)" />

                {/* Fondo nodo */}
                <rect x={pos.x} y={pos.y} width={NODE_W} height={NODE_H} rx="10"
                      fill={c.fill}
                      stroke={isDragTarget ? '#60A5FA' : sel ? '#F8FAFC' : c.stroke}
                      strokeWidth={isDragTarget ? 3 : sel ? 2.5 : hov ? 2 : 1.5}
                      style={{ cursor: dragConn ? 'crosshair' : 'pointer', transition: 'stroke 0.1s' }}
                      onMouseDown={e => !dragConn && startDragNodo(e, estado, idx)}
                      onClick={e => !dragConn && selectNodo(e, estado.id)} />

                {/* Barra color */}
                <rect x={pos.x + 10} y={pos.y + 5} width={NODE_W - 20} height="4" rx="2"
                      fill={c.stroke} opacity="0.55" />

                {/* Badge Ley */}
                {esLey && <>
                  <rect x={pos.x + NODE_W - 20} y={pos.y + 4} width="16" height="14" rx="3"
                        fill={c.stroke} opacity="0.9" />
                  <text x={pos.x + NODE_W - 12} y={pos.y + 15} textAnchor="middle" fontSize="8"
                        fill="white" fontWeight="700" fontFamily="system-ui">L</text>
                </>}

                {/* Nombre */}
                <text x={pos.x + NODE_W / 2} y={pos.y + 30}
                      textAnchor="middle" fontSize="11.5" fontWeight="700"
                      fill="#1E293B" fontFamily="system-ui, sans-serif"
                      style={{ cursor: 'pointer', userSelect: 'none', pointerEvents: 'none' }}>
                  {estado.nombre.length > 17 ? estado.nombre.slice(0, 16) + '…' : estado.nombre}
                </text>

                {/* Subtexto */}
                <text x={pos.x + NODE_W / 2} y={pos.y + 46}
                      textAnchor="middle" fontSize="9" fill="#64748B"
                      fontFamily="system-ui" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  {(estado.transiciones || []).length} salida{(estado.transiciones || []).length !== 1 ? 's' : ''}
                  {estado.es_final && ' · FINAL'}
                </text>

                {/* Puerto de conexión — aparece al hover */}
                {(hov || sel) && !estado.es_final && (
                  <g>
                    <circle cx={pos.x + NODE_W} cy={pos.y + NODE_H / 2} r={PORT_R + 3}
                            fill="transparent" style={{ cursor: 'crosshair' }}
                            onMouseDown={e => startDragConn(e, estado.id)} />
                    <circle cx={pos.x + NODE_W} cy={pos.y + NODE_H / 2} r={PORT_R}
                            fill={dragConn?.srcId === estado.id ? '#60A5FA' : '#1E293B'}
                            stroke="white" strokeWidth="2"
                            style={{ cursor: 'crosshair', pointerEvents: 'none' }} />
                    <text x={pos.x + NODE_W} y={pos.y + NODE_H / 2 + 4}
                          textAnchor="middle" fontSize="10" fill="white"
                          fontWeight="700" style={{ pointerEvents: 'none', userSelect: 'none' }}>+</text>
                  </g>
                )}

                {/* Halo de drop-target */}
                {isDragTarget && (
                  <rect x={pos.x - 4} y={pos.y - 4} width={NODE_W + 8} height={NODE_H + 8} rx="13"
                        fill="none" stroke="#60A5FA" strokeWidth="2.5"
                        strokeDasharray="6 3" opacity="0.8" />
                )}
              </g>
            );
          })}
        </svg>

        {/* Leyenda */}
        <div className="absolute bottom-3 left-3 flex items-center gap-4 text-xs text-slate-400 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-700/60">
          <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-blue-400 inline-block" />DPO elige</span>
          <span className="flex items-center gap-1.5"><span style={{display:'inline-block',width:16,height:2,borderTop:'2px dashed #FBBF24'}} />Automática</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-700 border border-blue-400 inline-block" />
            Puerto · arrastra para conectar
          </span>
          <span>Click nodo o flecha para editar</span>
        </div>
      </div>

      {/* ── Panel lateral ─────────────────────────────────── */}
      {(panelEstado || panelFlecha) && (
        <div className="w-72 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col"
             style={{ maxHeight: 480, overflowY: 'hidden' }}>
          {panelEstado && (
            <PanelEstado
              estado={panelEstado}
              todos={activos}
              onEditar={(changes) => editarEstado(derechoKey, panelEstado.id, changes)}
              onEliminar={() => { eliminarEstado(derechoKey, panelEstado.id); setSelNodo(null); }}
              onAgregarTransicion={(haciaId) => {
                agregarTransicion(derechoKey, panelEstado.id,
                  crearTransicion({ hacia: haciaId, etiqueta: 'Nueva transición', color: 'blue' })
                );
              }}
              onCerrar={() => setSelNodo(null)}
            />
          )}
          {panelFlecha && (
            <PanelTransicion
              tr={panelFlecha.tr}
              estadoSrc={panelFlecha.src}
              estadoDst={panelFlecha.dst}
              todos={activos}
              onEditar={(changes) => editarTransicion(derechoKey, panelFlecha.src.id, panelFlecha.tr.id, changes)}
              onEliminar={() => { eliminarTransicion(derechoKey, panelFlecha.src.id, panelFlecha.tr.id); setSelFlecha(null); }}
              onAgregarCampo={(ov) => agregarCampoTransicion(derechoKey, panelFlecha.src.id, panelFlecha.tr.id, ov)}
              onEditarCampo={(cid, ch) => editarCampoTransicion(derechoKey, panelFlecha.src.id, panelFlecha.tr.id, cid, ch)}
              onEliminarCampo={(cid) => eliminarCampoTransicion(derechoKey, panelFlecha.src.id, panelFlecha.tr.id, cid)}
              onCerrar={() => setSelFlecha(null)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default FlowDiagramEditor;