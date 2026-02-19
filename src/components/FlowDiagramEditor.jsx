// ============================================================
// FLOW DIAGRAM EDITOR v2 — @xyflow/react + dagre
//
// Usa @xyflow/react para todo el manejo de canvas:
//   - Drag de nodos, zoom, pan → nativo de la librería
//   - Drag-to-connect entre handles → nativo
//   - Flechas bezier suaves que no se cruzan
//   - MiniMap + Controls integrados
//   - Auto-layout con dagre (botón "Ordenar")
//
// Nodos y aristas son custom para mostrar la info ARCOP.
// Panel lateral aparece al seleccionar nodo o arista.
// ============================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow, ReactFlowProvider,
  Background, BackgroundVariant,
  Controls, MiniMap,
  Panel,
  addEdge,
  useNodesState, useEdgesState,
  Handle, Position,
  BaseEdge, EdgeLabelRenderer, getBezierPath,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import {
  X, Trash2, Plus, Zap, Hand,
  Mail, CheckSquare, LayoutGrid,
} from 'lucide-react';
import {
  COLOR_CLASSES, COLORES_TRANSICION, COLORES_ESTADO,
  TIPOS_CAMPO, crearTransicion, crearCampoRequerido,
} from '../services/flujoService';

const getC = (color) => COLOR_CLASSES[color] || COLOR_CLASSES.gray;

// ── Dagre auto-layout ─────────────────────────────────────
const NODE_W = 160;
const NODE_H = 64;

const applyDagreLayout = (nodes, edges, direction = 'LR') => {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 100 });
  nodes.forEach(n => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach(e => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map(n => {
    const { x, y } = g.node(n.id);
    return { ...n, position: { x: x - NODE_W / 2, y: y - NODE_H / 2 } };
  });
};

// ── Conversor flujoConfig → nodos/aristas xyflow ─────────
const configToFlow = (estados) => {
  const nodes = estados
    .filter(e => e.activo)
    .map(e => ({
      id:       e.id,
      type:     'estadoNode',
      position: { x: e.pos_x ?? 0, y: e.pos_y ?? 0 },
      data:     { estado: e },
    }));

  const edges = [];
  estados.filter(e => e.activo).forEach(src => {
    (src.transiciones || []).forEach(tr => {
      if (!tr.hacia) return;
      edges.push({
        id:     tr.id,
        source: src.id,
        target: tr.hacia,
        type:   'transicionEdge',
        data:   { tr, srcId: src.id },
        markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18,
                     color: getC(tr.color)?.stroke || '#6B7280' },
        style: {
          stroke:          getC(tr.color)?.stroke || '#6B7280',
          strokeWidth:     2,
          strokeDasharray: tr.condicion === 'automatica' ? '6 3' : undefined,
        },
        animated: tr.condicion === 'automatica',
      });
    });
  });

  return { nodes, edges };
};

// ── Nodo custom ───────────────────────────────────────────
const EstadoNode = ({ data, selected }) => {
  const { estado } = data;
  const c    = getC(estado.color);
  const esLey = estado.origen === 'ley' || estado.origen === 'ley_futura';

  return (
    <div
      className={`rounded-xl border-2 transition-all select-none overflow-hidden shadow-lg`}
      style={{
        width: NODE_W,
        minHeight: NODE_H,
        background: c.fill,
        borderColor: selected ? '#1E293B' : c.stroke,
        boxShadow: selected
          ? `0 0 0 3px ${c.stroke}55, 0 4px 20px rgba(0,0,0,0.3)`
          : '0 4px 12px rgba(0,0,0,0.15)',
      }}>

      {/* Barra de color top */}
      <div className="h-1.5 w-full" style={{ background: c.stroke }} />

      <div className="px-3 py-2.5 relative">
        {/* Badge Ley */}
        {esLey && (
          <span
            className="absolute top-1.5 right-2 text-white text-xs font-bold px-1.5 py-0.5 rounded"
            style={{ background: c.stroke, fontSize: 9 }}>L</span>
        )}

        {/* Nombre */}
        <p className={`font-bold text-sm leading-tight ${c.text}`}
           style={{ color: '#1E293B', maxWidth: 120 }}>
          {estado.nombre}
        </p>

        {/* Info */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-xs text-gray-500">
            {(estado.transiciones || []).length} salida{(estado.transiciones || []).length !== 1 ? 's' : ''}
          </span>
          {estado.es_final && (
            <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">FINAL</span>
          )}
          {estado.envia_email && (
            <Mail className="w-3 h-3 text-blue-500" title="Envía email" />
          )}
          {estado.requiere_confirmacion && (
            <CheckSquare className="w-3 h-3 text-purple-500" title="Requiere confirmación" />
          )}
        </div>
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Left}
        style={{ background: c.stroke, width: 10, height: 10, border: '2px solid white' }} />
      <Handle type="source" position={Position.Right}
        style={{ background: c.stroke, width: 10, height: 10, border: '2px solid white' }} />
      <Handle type="target" position={Position.Top} id="top"
        style={{ background: c.stroke, width: 8, height: 8, border: '2px solid white', opacity: 0.6 }} />
      <Handle type="source" position={Position.Bottom} id="bottom"
        style={{ background: c.stroke, width: 8, height: 8, border: '2px solid white', opacity: 0.6 }} />
    </div>
  );
};

// ── Arista custom con etiqueta clickeable ─────────────────
const TransicionEdge = ({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data, selected, markerEnd, style,
}) => {
  const { tr } = data;
  const c = getC(tr.color);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const labelW = Math.min(96, (tr.etiqueta?.length || 0) * 7 + 20);
  const esAuto = tr.condicion === 'automatica';

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          filter: selected ? `drop-shadow(0 0 4px ${c.stroke})` : undefined,
        }} />

      {/* Halo de selección */}
      {selected && (
        <BaseEdge id={`${id}-halo`} path={edgePath}
          style={{ stroke: c.stroke, strokeWidth: 10, opacity: 0.18, fill: 'none' }} />
      )}

      {/* Etiqueta */}
      <EdgeLabelRenderer>
        <div
          style={{
            position:  'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            zIndex: 10,
          }}
          className="nodrag nopan">
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all select-none"
            style={{
              background:   selected ? c.stroke : 'rgba(15,23,42,0.88)',
              color:        selected ? 'white' : c.stroke,
              border:       `1.5px solid ${selected ? 'transparent' : c.stroke + '80'}`,
              boxShadow:    selected ? `0 0 8px ${c.stroke}60` : '0 2px 6px rgba(0,0,0,0.3)',
              whiteSpace:   'nowrap',
              maxWidth:     100,
            }}>
            {esAuto && <Zap className="w-3 h-3 flex-shrink-0" />}
            <span className="truncate" style={{ maxWidth: 80 }}>
              {tr.etiqueta || '—'}
            </span>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// ── Panel lateral — estado ────────────────────────────────
const PanelEstado = ({ estado, todos, onEditar, onEliminar, onAgregarTransicion, onCerrar }) => {
  const c = getC(estado.color);
  const esLey = estado.origen === 'ley' || estado.origen === 'ley_futura';
  const otros = todos.filter(e => e.id !== estado.id && e.activo);

  return (
    <div className="flex flex-col h-full text-sm">
      <div className="px-4 py-3 flex items-center justify-between flex-shrink-0 border-b border-gray-100"
           style={{ background: c.fill, borderLeft: `4px solid ${c.stroke}` }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">{estado.nombre}</span>
            {esLey && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 rounded font-semibold">Ley</span>}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{estado.articulo || 'Estado personalizado'}</p>
        </div>
        <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 p-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Descripción</label>
          <textarea value={estado.descripcion || ''} rows={2} resize="none"
            onChange={e => onEditar({ descripcion: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        {!esLey && (
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORES_ESTADO.map(col => (
                <button key={col.value} onClick={() => onEditar({ color: col.value })}
                  title={col.label}
                  className="w-5 h-5 rounded-full border-2 transition-all"
                  style={{
                    background:  COLOR_CLASSES[col.value]?.stroke,
                    borderColor: estado.color === col.value ? '#1E293B' : 'transparent',
                    transform:   estado.color === col.value ? 'scale(1.35)' : 'scale(1)',
                  }} />
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Comportamiento</label>
          <div className="space-y-2">
            {[
              { key: 'requiere_confirmacion', label: 'Requiere confirmación' },
              { key: 'envia_email',           label: 'Envía email al titular' },
              { key: 'es_final',              label: 'Estado final (sin salidas)' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!estado[key]}
                  onChange={e => onEditar({ [key]: e.target.checked })}
                  className="w-3.5 h-3.5 text-blue-600 rounded" />
                <span className="text-xs text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Agregar transición hacia
          </label>
          <div className="flex flex-wrap gap-1.5">
            {otros.map(dest => {
              const dc = getC(dest.color);
              const yaExiste = (estado.transiciones || []).some(t => t.hacia === dest.id);
              return (
                <button key={dest.id} disabled={yaExiste}
                  onClick={() => !yaExiste && onAgregarTransicion(dest.id)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium border transition-all ${
                    yaExiste
                      ? 'opacity-35 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400'
                      : `${dc.bg} ${dc.text} ${dc.border} hover:shadow-sm`
                  }`}>
                  {yaExiste ? '✓' : '+'} {dest.nombre}
                </button>
              );
            })}
          </div>
        </div>

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

// ── Panel lateral — transición ────────────────────────────
const PanelTransicion = ({ tr, estadoSrc, estadoDst, todos,
                           onEditar, onEliminar, onCerrar,
                           onAgregarCampo, onEditarCampo, onEliminarCampo }) => {
  const c = getC(tr.color);

  return (
    <div className="flex flex-col h-full text-sm">
      <div className="px-4 py-3 flex items-center justify-between flex-shrink-0 border-b border-gray-100 bg-gray-50">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.stroke }} />
            <span className="font-bold text-gray-900">{tr.etiqueta || '(sin etiqueta)'}</span>
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
        <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 p-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Etiqueta *</label>
          <input value={tr.etiqueta || ''} onChange={e => onEditar({ etiqueta: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Aprobada, Denegar..." />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Descripción / ayuda</label>
          <input value={tr.descripcion || ''} onChange={e => onEditar({ descripcion: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="Texto de ayuda para el DPO" />
        </div>

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

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Color de la flecha</label>
          <div className="flex flex-wrap gap-2">
            {COLORES_TRANSICION.map(col => (
              <button key={col.value} onClick={() => onEditar({ color: col.value })} title={col.label}
                className="w-5 h-5 rounded-full border-2 transition-all"
                style={{
                  background:  COLOR_CLASSES[col.value]?.stroke || '#6B7280',
                  borderColor: tr.color === col.value ? '#1E293B' : 'transparent',
                  transform:   tr.color === col.value ? 'scale(1.35)' : 'scale(1)',
                }} />
            ))}
          </div>
        </div>

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

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Campos que completa el DPO al tomar esta transición
          </label>
          <div className="space-y-2 mb-2">
            {(tr.campos_requeridos || []).map(campo => (
              <div key={campo.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <input value={campo.label}
                  onChange={e => onEditarCampo(campo.id, { label: e.target.value })}
                  className="flex-1 text-xs bg-transparent border-none focus:outline-none font-medium text-gray-800 min-w-0" />
                <select value={campo.tipo} onChange={e => onEditarCampo(campo.id, { tipo: e.target.value })}
                  className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white flex-shrink-0">
                  {TIPOS_CAMPO.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}
                </select>
                <button onClick={() => onEditarCampo(campo.id, { obligatorio: !campo.obligatorio })}
                  title={campo.obligatorio ? 'Obligatorio' : 'Opcional'}
                  className={`text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0 ${campo.obligatorio ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                  {campo.obligatorio ? '*' : 'opt'}
                </button>
                <button onClick={() => onEliminarCampo(campo.id)}
                  className="text-gray-300 hover:text-red-500 flex-shrink-0"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {TIPOS_CAMPO.map(tc => (
              <button key={tc.value}
                onClick={() => onAgregarCampo({ tipo: tc.value, label: tc.label.split('/')[0].trim() })}
                className="py-1.5 text-xs border border-dashed border-gray-300 text-gray-400 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-all px-1 truncate">
                + {tc.value}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => { if (window.confirm(`¿Eliminar "${tr.etiqueta}"?`)) onEliminar(); }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 text-xs">
          <Trash2 className="w-3.5 h-3.5" /> Eliminar transición
        </button>
      </div>
    </div>
  );
};

// ── Tipos custom para ReactFlow ───────────────────────────
const nodeTypes = { estadoNode: EstadoNode };
const edgeTypes = { transicionEdge: TransicionEdge };

// ── Editor interno (dentro del ReactFlowProvider) ─────────
const DiagramaInterno = ({ estados, hook, derechoKey }) => {
  const {
    editarEstado, eliminarEstado,
    agregarTransicion, editarTransicion, eliminarTransicion,
    agregarCampoTransicion, editarCampoTransicion, eliminarCampoTransicion,
    moverNodo,
  } = hook;

  const activos = estados.filter(e => e.activo);

  // Inicializar con layout dagre si los nodos no tienen posición guardada
  const initialFlow = useMemo(() => {
    const { nodes, edges } = configToFlow(activos);
    const sinPos = nodes.filter(n => !activos.find(e => e.id === n.id)?.pos_x);
    if (sinPos.length > 0) return { nodes: applyDagreLayout(nodes, edges), edges };
    return { nodes, edges };
  }, []); // Solo al montar

  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow.edges);

  // Sincronizar cuando cambia el config externo (ediciones desde panel)
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = configToFlow(activos);
    setNodes(prev => newNodes.map(n => {
      const old = prev.find(p => p.id === n.id);
      return old ? { ...n, position: old.position } : n;
    }));
    setEdges(newEdges);
  }, [estados]);

  // Selección
  const [selNode, setSelNode] = useState(null);
  const [selEdge, setSelEdge] = useState(null);

  // Drag → guardar posición en config
  const onNodeDragStop = useCallback((_, node) => {
    moverNodo(derechoKey, node.id, node.position.x, node.position.y);
  }, [moverNodo, derechoKey]);

  // Drag-to-connect → crear transición
  const onConnect = useCallback((params) => {
    const src = activos.find(e => e.id === params.source);
    if (!src) return;
    const yaExiste = (src.transiciones || []).some(t => t.hacia === params.target);
    if (yaExiste) return;
    agregarTransicion(derechoKey, params.source,
      crearTransicion({ hacia: params.target, etiqueta: 'Nueva transición', color: 'blue' })
    );
  }, [activos, agregarTransicion, derechoKey]);

  // Click en nodo
  const onNodeClick = useCallback((_, node) => {
    setSelEdge(null);
    setSelNode(node.id);
  }, []);

  // Click en arista
  const onEdgeClick = useCallback((_, edge) => {
    setSelNode(null);
    setSelEdge({ estadoId: edge.data.srcId, trId: edge.id });
  }, []);

  // Click en canvas → deseleccionar
  const onPaneClick = useCallback(() => {
    setSelNode(null);
    setSelEdge(null);
  }, []);

  // Auto-layout
  const handleLayout = useCallback(() => {
    const laid = applyDagreLayout(nodes, edges);
    setNodes(laid);
    laid.forEach(n => moverNodo(derechoKey, n.id, n.position.x, n.position.y));
  }, [nodes, edges, setNodes, moverNodo, derechoKey]);

  // Panel data
  const estadoSel = selNode ? activos.find(e => e.id === selNode) : null;
  const flechaSel = selEdge ? (() => {
    const src = activos.find(e => e.id === selEdge.estadoId);
    const tr  = src?.transiciones?.find(t => t.id === selEdge.trId);
    const dst = tr ? activos.find(e => e.id === tr.hacia) : null;
    return src && tr ? { src, tr, dst } : null;
  })() : null;

  // Resaltar nodo/arista seleccionada
  const nodesWithSel = nodes.map(n => ({ ...n, selected: n.id === selNode }));
  const edgesWithSel = edges.map(e => ({ ...e, selected: e.id === selEdge?.trId }));

  return (
    <div className="flex rounded-2xl overflow-hidden border border-slate-700"
         style={{ height: 520 }}>

      {/* Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodesWithSel}
          edges={edgesWithSel}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          onNodeDragStop={onNodeDragStop}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          deleteKeyCode={null}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: 'transicionEdge' }}
          connectionLineStyle={{ stroke: '#60A5FA', strokeWidth: 2, strokeDasharray: '6 3' }}>

          <Background variant={BackgroundVariant.Dots}
            color="rgba(148,163,184,0.18)" gap={24} size={1.5}
            style={{ background: '#0F172A' }} />

          <Controls
            style={{ background: '#1E293B', border: '1px solid #334155' }}
            className="[&>button]:!bg-slate-800 [&>button]:!border-slate-600 [&>button]:!text-slate-300 [&>button:hover]:!bg-slate-700" />

          <MiniMap
            nodeColor={n => getC(activos.find(e => e.id === n.id)?.color)?.stroke || '#6B7280'}
            maskColor="rgba(15,23,42,0.7)"
            style={{ background: '#1E293B', border: '1px solid #334155' }} />

          {/* Botón auto-layout */}
          <Panel position="top-left">
            <button onClick={handleLayout}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700 text-xs font-medium transition-all shadow-lg">
              <LayoutGrid className="w-3.5 h-3.5" /> Ordenar automáticamente
            </button>
          </Panel>

          {/* Leyenda */}
          <Panel position="bottom-left">
            <div className="flex items-center gap-4 text-xs text-slate-400 bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-700/60">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-blue-400 inline-block" /> DPO elige
              </span>
              <span className="flex items-center gap-1.5">
                <span style={{ display:'inline-block', width:16, height:2, borderTop:'2px dashed #FBBF24' }} /> Automática
              </span>
              <span>Arrastra handle para conectar</span>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Panel lateral */}
      {(estadoSel || flechaSel) && (
        <div className="w-72 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col"
             style={{ maxHeight: 520, overflowY: 'hidden' }}>
          {estadoSel && (
            <PanelEstado
              estado={estadoSel}
              todos={activos}
              onEditar={ch => editarEstado(derechoKey, estadoSel.id, ch)}
              onEliminar={() => { eliminarEstado(derechoKey, estadoSel.id); setSelNode(null); }}
              onAgregarTransicion={haciaId =>
                agregarTransicion(derechoKey, estadoSel.id,
                  crearTransicion({ hacia: haciaId, etiqueta: 'Nueva transición', color: 'blue' })
                )}
              onCerrar={() => setSelNode(null)}
            />
          )}
          {flechaSel && (
            <PanelTransicion
              tr={flechaSel.tr}
              estadoSrc={flechaSel.src}
              estadoDst={flechaSel.dst}
              todos={activos}
              onEditar={ch => editarTransicion(derechoKey, flechaSel.src.id, flechaSel.tr.id, ch)}
              onEliminar={() => { eliminarTransicion(derechoKey, flechaSel.src.id, flechaSel.tr.id); setSelEdge(null); }}
              onAgregarCampo={ov => agregarCampoTransicion(derechoKey, flechaSel.src.id, flechaSel.tr.id, ov)}
              onEditarCampo={(cid, ch) => editarCampoTransicion(derechoKey, flechaSel.src.id, flechaSel.tr.id, cid, ch)}
              onEliminarCampo={cid => eliminarCampoTransicion(derechoKey, flechaSel.src.id, flechaSel.tr.id, cid)}
              onCerrar={() => setSelEdge(null)}
            />
          )}
        </div>
      )}
    </div>
  );
};

// ── Export con provider ───────────────────────────────────
const FlowDiagramEditor = (props) => (
  <ReactFlowProvider>
    <DiagramaInterno {...props} />
  </ReactFlowProvider>
);

export default FlowDiagramEditor;