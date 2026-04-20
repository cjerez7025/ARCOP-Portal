// ============================================================
// FLOW DIAGRAM EDITOR v3 — Nodos vibrantes sobre canvas dark
// Paleta de colores rich por estado para máximo impacto visual
// ============================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow, ReactFlowProvider,
  Background, BackgroundVariant,
  Controls, MiniMap,
  Panel,
  useNodesState, useEdgesState,
  Handle, Position,
  BaseEdge, EdgeLabelRenderer, getBezierPath,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import {
  X, Trash2, Zap, Hand,
  Mail, CheckSquare, LayoutGrid,
} from 'lucide-react';
import {
  COLOR_CLASSES, COLORES_TRANSICION, COLORES_ESTADO,
  TIPOS_CAMPO, crearTransicion, crearCampoRequerido,
} from '../services/flujoService';

// ── Paleta de colores para el diagrama (rich/vibrant) ─────
// Independiente de Tailwind — colores hex para usar en style={}
const NODE_COLORS = {
  yellow:  { bg: 'linear-gradient(135deg, #854D0E 0%, #A16207 100%)', border: '#EAB308', glow: '#EAB30860', text: '#FEF08A', sub: '#FDE047BB' },
  blue:    { bg: 'linear-gradient(135deg, #1E3A5F 0%, #1D4ED8 100%)', border: '#3B82F6', glow: '#3B82F660', text: '#BFDBFE', sub: '#93C5FDBB' },
  purple:  { bg: 'linear-gradient(135deg, #3B0764 0%, #7C3AED 100%)', border: '#A855F7', glow: '#A855F760', text: '#E9D5FF', sub: '#D8B4FEBB' },
  green:   { bg: 'linear-gradient(135deg, #14532D 0%, #15803D 100%)', border: '#22C55E', glow: '#22C55E60', text: '#BBF7D0', sub: '#86EFACBB' },
  gray:    { bg: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)', border: '#64748B', glow: '#64748B60', text: '#CBD5E1', sub: '#94A3B8BB' },
  red:     { bg: 'linear-gradient(135deg, #7F1D1D 0%, #B91C1C 100%)', border: '#EF4444', glow: '#EF444460', text: '#FECACA', sub: '#FCA5A5BB' },
  orange:  { bg: 'linear-gradient(135deg, #7C2D12 0%, #C2410C 100%)', border: '#F97316', glow: '#F9731660', text: '#FED7AA', sub: '#FDBA74BB' },
  teal:    { bg: 'linear-gradient(135deg, #134E4A 0%, #0D9488 100%)', border: '#14B8A6', glow: '#14B8A660', text: '#99F6E4', sub: '#5EEAD4BB' },
  indigo:  { bg: 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)', border: '#6366F1', glow: '#6366F160', text: '#C7D2FE', sub: '#A5B4FCBB' },
  pink:    { bg: 'linear-gradient(135deg, #500724 0%, #BE185D 100%)', border: '#EC4899', glow: '#EC489960', text: '#FBCFE8', sub: '#F9A8D4BB' },
};
const getNC = (color) => NODE_COLORS[color] || NODE_COLORS.gray;

// Colores de flechas (hex directo)
const EDGE_COLORS = {
  blue:   '#3B82F6', green:  '#22C55E', red:    '#EF4444',
  orange: '#F97316', purple: '#A855F7', gray:   '#94A3B8',
  teal:   '#14B8A6', yellow: '#EAB308', indigo: '#6366F1', pink: '#EC4899',
};
const getEC = (color) => EDGE_COLORS[color] || EDGE_COLORS.gray;

const getC = (color) => COLOR_CLASSES[color] || COLOR_CLASSES.gray;

// ── Dagre auto-layout ─────────────────────────────────────
const NODE_W = 172;
const NODE_H = 72;

const applyDagreLayout = (nodes, edges, direction = 'LR') => {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 70, ranksep: 110 });
  nodes.forEach(n => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach(e => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map(n => {
    const { x, y } = g.node(n.id);
    return { ...n, position: { x: x - NODE_W / 2, y: y - NODE_H / 2 } };
  });
};

// ── Conversor config → xyflow ─────────────────────────────
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
      const edgeColor = getEC(tr.color);
      edges.push({
        id:     tr.id,
        source: src.id,
        target: tr.hacia,
        type:   'transicionEdge',
        data:   { tr, srcId: src.id },
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: edgeColor },
        style: {
          stroke:          edgeColor,
          strokeWidth:     2.5,
          strokeDasharray: tr.condicion === 'automatica' ? '6 3' : undefined,
        },
        animated: tr.condicion === 'automatica',
      });
    });
  });

  return { nodes, edges };
};

// ── Nodo custom con color vibrante ────────────────────────
const EstadoNode = ({ data, selected }) => {
  const { estado } = data;
  const nc    = getNC(estado.color);
  const esLey = estado.origen === 'ley' || estado.origen === 'ley_futura';
  const nSalidas = (estado.transiciones || []).length;

  return (
    <div
      className="rounded-2xl select-none overflow-hidden transition-all"
      style={{
        width:      NODE_W,
        minHeight:  NODE_H,
        background: nc.bg,
        border:     `2px solid ${selected ? '#fff' : nc.border}`,
        boxShadow:  selected
          ? `0 0 0 3px ${nc.border}, 0 0 24px ${nc.glow}, 0 8px 32px rgba(0,0,0,0.5)`
          : `0 0 12px ${nc.glow}, 0 4px 16px rgba(0,0,0,0.4)`,
      }}>

      {/* Barra brillante superior */}
      <div
        style={{
          height:     3,
          background: `linear-gradient(90deg, transparent, ${nc.border}, transparent)`,
        }} />

      <div className="px-3 py-2.5 relative">

        {/* Badge Ley */}
        {esLey && (
          <span
            className="absolute top-1.5 right-2 text-xs font-bold px-1.5 py-0.5 rounded-md"
            style={{ background: nc.border + '33', color: nc.border, border: `1px solid ${nc.border}66`, fontSize: 9 }}>
            LEY
          </span>
        )}

        {/* Nombre */}
        <p
          className="font-bold text-sm leading-tight"
          style={{ color: nc.text, maxWidth: 130, textShadow: `0 1px 4px rgba(0,0,0,0.4)` }}>
          {estado.nombre}
        </p>

        {/* Info secundaria */}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs font-medium" style={{ color: nc.sub }}>
            {nSalidas} salida{nSalidas !== 1 ? 's' : ''}
          </span>
          {estado.es_final && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: nc.border + '25', color: nc.text, border: `1px solid ${nc.border}50` }}>
              FINAL
            </span>
          )}
          {estado.envia_email && (
            <Mail className="w-3 h-3 flex-shrink-0" style={{ color: nc.sub }} />
          )}
          {estado.requiere_confirmacion && (
            <CheckSquare className="w-3 h-3 flex-shrink-0" style={{ color: nc.sub }} />
          )}
        </div>
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Left}
        style={{ background: nc.border, width: 11, height: 11, border: '2.5px solid #0F172A', boxShadow: `0 0 6px ${nc.glow}` }} />
      <Handle type="source" position={Position.Right}
        style={{ background: nc.border, width: 11, height: 11, border: '2.5px solid #0F172A', boxShadow: `0 0 6px ${nc.glow}` }} />
      <Handle type="target" position={Position.Top} id="top"
        style={{ background: nc.border, width: 8, height: 8, border: '2px solid #0F172A', opacity: 0.8 }} />
      <Handle type="source" position={Position.Bottom} id="bottom"
        style={{ background: nc.border, width: 8, height: 8, border: '2px solid #0F172A', opacity: 0.8 }} />
    </div>
  );
};

// ── Arista custom con etiqueta ────────────────────────────
const TransicionEdge = ({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data, selected, markerEnd, style,
}) => {
  const { tr } = data;
  const edgeColor = getEC(tr.color);
  const esAuto    = tr.condicion === 'automatica';

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      {/* Halo glow cuando está seleccionada */}
      {selected && (
        <BaseEdge id={`${id}-halo`} path={edgePath}
          style={{ stroke: edgeColor, strokeWidth: 10, opacity: 0.2, fill: 'none' }} />
      )}

      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: selected ? 3.5 : 2.5,
          filter:      selected ? `drop-shadow(0 0 5px ${edgeColor})` : `drop-shadow(0 0 2px ${edgeColor}80)`,
        }} />

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
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold cursor-pointer select-none transition-all"
            style={{
              background:  selected ? edgeColor : `rgba(10,14,23,0.92)`,
              color:       selected ? '#fff' : edgeColor,
              border:      `1.5px solid ${edgeColor}`,
              boxShadow:   `0 2px 8px rgba(0,0,0,0.4), 0 0 6px ${edgeColor}40`,
              whiteSpace:  'nowrap',
              maxWidth:    110,
            }}>
            {esAuto && <Zap className="w-3 h-3 flex-shrink-0" />}
            <span className="truncate" style={{ maxWidth: 85 }}>
              {tr.etiqueta || '—'}
            </span>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// ── Panel lateral — estado ────────────────────────────────
const PanelEstado = ({ estado, todos, onEditar, onEliminar, onAgregarTransicion, onCerrar,
                       onAgregarCampoEstado, onEditarCampoEstado, onEliminarCampoEstado }) => {

  const nc    = getNC(estado.color);
  const esLey = estado.origen === 'ley' || estado.origen === 'ley_futura';
  const otros = todos.filter(e => e.id !== estado.id && e.activo);

  return (
    <div className="flex flex-col h-full text-sm">
      {/* Header coloreado */}
      <div
        className="px-4 py-3 flex items-center justify-between flex-shrink-0"
        style={{
          background:  nc.bg,
          borderBottom: `2px solid ${nc.border}`,
          borderLeft:   `4px solid ${nc.border}`,
        }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm" style={{ color: nc.text }}>{estado.nombre}</span>
            {esLey && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={{ background: nc.border + '30', color: nc.border, border: `1px solid ${nc.border}50` }}>
                Ley
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: nc.sub }}>{estado.articulo || 'Estado personalizado'}</p>
        </div>
        <button onClick={onCerrar}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          style={{ color: nc.sub }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Descripción</label>
          <textarea value={estado.descripcion || ''} rows={2}
            onChange={e => onEditar({ descripcion: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-xs text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
        </div>

        {!esLey && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Color del nodo</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(NODE_COLORS).map(([key, val]) => (
                <button key={key} onClick={() => onEditar({ color: key })}
                  title={key}
                  className="w-6 h-6 rounded-full border-2 transition-all"
                  style={{
                    background:  val.border,
                    borderColor: estado.color === key ? '#fff' : 'transparent',
                    transform:   estado.color === key ? 'scale(1.3)' : 'scale(1)',
                    boxShadow:   estado.color === key ? `0 0 8px ${val.border}` : 'none',
                  }} />
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input type="checkbox" checked={!!estado.envia_email}
              onChange={e => onEditar({ envia_email: e.target.checked })}
              className="w-4 h-4 text-blue-500 rounded bg-slate-700 border-slate-500" />
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs">Email</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input type="checkbox" checked={!!estado.requiere_confirmacion}
              onChange={e => onEditar({ requiere_confirmacion: e.target.checked })}
              className="w-4 h-4 text-purple-500 rounded bg-slate-700 border-slate-500" />
            <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs">Confirmación</span>
          </label>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Agregar transición hacia
          </label>
          <div className="flex flex-wrap gap-1.5">
            {otros.map(dest => {
              const nc2     = getNC(dest.color);
              const yaExiste = (estado.transiciones || []).some(t => t.hacia === dest.id);
              return (
                <button key={dest.id}
                  disabled={yaExiste}
                  onClick={() => !yaExiste && onAgregarTransicion(dest.id)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
                  style={{
                    background:  yaExiste ? 'rgba(255,255,255,0.05)' : nc2.bg,
                    color:       yaExiste ? '#475569' : nc2.text,
                    border:      `1.5px solid ${yaExiste ? '#334155' : nc2.border}`,
                    opacity:     yaExiste ? 0.5 : 1,
                    cursor:      yaExiste ? 'not-allowed' : 'pointer',
                  }}>
                  {yaExiste ? '✓' : '+'} {dest.nombre}
                </button>
              );
            })}
          </div>
        </div>

{/* Campos al entrar a este estado */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Campos al entrar a este estado
            </label>
            <button
              onClick={() => onAgregarCampoEstado({ tipo: 'text', label: '', obligatorio: false })}
              className="text-xs px-2 py-1 rounded-lg transition-all"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.3)' }}>
              + Agregar
            </button>
          </div>
          {(estado.campos_transicion || []).length === 0 ? (
            <p className="text-xs italic" style={{ color: '#475569' }}>Sin campos adicionales</p>
          ) : (
            <div className="space-y-1.5">
              {estado.campos_transicion.map(campo => (
                <div key={campo.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #334155' }}>
                  <input value={campo.label || ''} placeholder="Etiqueta..."
                    onChange={e => onEditarCampoEstado(campo.id, { label: e.target.value })}
                    className="flex-1 bg-transparent text-xs focus:outline-none"
                    style={{ color: '#E2E8F0', minWidth: 0 }} />
                  <select value={campo.tipo || 'text'}
                    onChange={e => onEditarCampoEstado(campo.id, { tipo: e.target.value })}
                    className="text-xs rounded px-1 py-0.5 focus:outline-none"
                    style={{ background: '#1E293B', color: '#94A3B8', border: '1px solid #334155' }}>
                    {['text','textarea','url','select','date','checkbox','file'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => onEditarCampoEstado(campo.id, { obligatorio: !campo.obligatorio })}
                    className="text-xs px-1 py-0.5 rounded font-bold flex-shrink-0"
                    style={campo.obligatorio
                      ? { background: 'rgba(239,68,68,0.15)', color: '#FCA5A5' }
                      : { background: 'rgba(255,255,255,0.05)', color: '#64748B' }}>
                    {campo.obligatorio ? '*' : 'opt'}
                  </button>
                  <button onClick={() => onEliminarCampoEstado(campo.id)}
                    style={{ color: '#475569' }}
                    onMouseOver={e => e.currentTarget.style.color = '#FCA5A5'}
                    onMouseOut={e => e.currentTarget.style.color = '#475569'}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {!esLey && estado.origen === 'custom' && (
          <button
            onClick={() => { if (window.confirm(`¿Eliminar "${estado.nombre}"?`)) onEliminar(); }}            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ background: 'rgba(239,68,68,0.12)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.3)' }}>
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
  const edgeColor = getEC(tr.color);

  return (
    <div className="flex flex-col h-full text-sm">
      <div className="px-4 py-3 flex items-center justify-between flex-shrink-0 bg-slate-800 border-b-2"
           style={{ borderBottomColor: edgeColor }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: edgeColor, boxShadow: `0 0 6px ${edgeColor}` }} />
            <span className="font-bold text-slate-100">{tr.etiqueta || '(sin etiqueta)'}</span>
            {tr.condicion === 'automatica' && (
              <span className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1"
                style={{ background: 'rgba(234,179,8,0.15)', color: '#FDE047', border: '1px solid rgba(234,179,8,0.3)' }}>
                <Zap className="w-3 h-3" /> auto
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {estadoSrc?.nombre} → {estadoDst?.nombre || tr.hacia}
          </p>
        </div>
        <button onClick={onCerrar} className="text-slate-400 hover:text-slate-200 p-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Etiqueta *</label>
          <input value={tr.etiqueta || ''} onChange={e => onEditar({ etiqueta: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-100 focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Aprobar, Denegar..." />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Descripción</label>
          <input value={tr.descripcion || ''} onChange={e => onEditar({ descripcion: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-100 focus:ring-2 focus:ring-blue-500"
            placeholder="Texto de ayuda para el DPO" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Estado destino</label>
          <select value={tr.hacia || ''} onChange={e => onEditar({ hacia: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-100 focus:ring-2 focus:ring-blue-500">
            <option value="">Seleccionar...</option>
            {todos.filter(e => e.id !== estadoSrc?.id).map(e => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Color de la flecha</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(EDGE_COLORS).map(([key, hex]) => (
              <button key={key} onClick={() => onEditar({ color: key })} title={key}
                className="w-6 h-6 rounded-full border-2 transition-all"
                style={{
                  background:  hex,
                  borderColor: tr.color === key ? '#fff' : 'transparent',
                  transform:   tr.color === key ? 'scale(1.35)' : 'scale(1)',
                  boxShadow:   tr.color === key ? `0 0 8px ${hex}` : 'none',
                }} />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Tipo</label>
          <div className="flex gap-2">
            <button onClick={() => onEditar({ condicion: 'dpo_elige' })}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
              style={tr.condicion !== 'automatica'
                ? { background: '#1D4ED8', color: '#BFDBFE', border: '1px solid #3B82F6' }
                : { background: 'transparent', color: '#64748B', border: '1px solid #334155' }}>
              <Hand className="w-3.5 h-3.5" /> DPO elige
            </button>
            <button onClick={() => onEditar({ condicion: 'automatica' })}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
              style={tr.condicion === 'automatica'
                ? { background: '#854D0E', color: '#FEF08A', border: '1px solid #EAB308' }
                : { background: 'transparent', color: '#64748B', border: '1px solid #334155' }}>
              <Zap className="w-3.5 h-3.5" /> Automática
            </button>
          </div>
        </div>

        {/* Campos requeridos */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Campos requeridos al transicionar
          </label>
          <div className="space-y-1.5 mb-2">
            {(tr.campos_requeridos || []).map(campo => (
              <div key={campo.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #334155' }}>
                <span className="flex-1 text-xs text-slate-200">{campo.label}</span>
                <span className="text-xs px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#94A3B8' }}>{campo.tipo}</span>
                <button
                  title={campo.obligatorio ? 'Obligatorio' : 'Opcional'}
                  onClick={() => onEditarCampo(campo.id, { obligatorio: !campo.obligatorio })}
                  className="text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0"
                  style={campo.obligatorio
                    ? { background: 'rgba(239,68,68,0.15)', color: '#FCA5A5' }
                    : { background: 'rgba(255,255,255,0.05)', color: '#64748B' }}>
                  {campo.obligatorio ? '*' : 'opt'}
                </button>
                <button onClick={() => onEliminarCampo(campo.id)}
                  className="flex-shrink-0" style={{ color: '#475569' }}
                  onMouseOver={e => e.currentTarget.style.color = '#FCA5A5'}
                  onMouseOut={e => e.currentTarget.style.color = '#475569'}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {TIPOS_CAMPO.map(tc => (
              <button key={tc.value}
                onClick={() => onAgregarCampo({ tipo: tc.value, label: tc.label.split('/')[0].trim() })}
                className="py-1.5 text-xs rounded-lg transition-all"
                style={{ border: '1px dashed #334155', color: '#64748B', background: 'transparent' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.color = '#60A5FA'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#64748B'; }}>
                + {tc.value}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => { if (window.confirm(`¿Eliminar "${tr.etiqueta}"?`)) onEliminar(); }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
          style={{ background: 'rgba(239,68,68,0.12)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.3)' }}>
          <Trash2 className="w-3.5 h-3.5" /> Eliminar transición
        </button>
      </div>
    </div>
  );
};

// ── Tipos custom ──────────────────────────────────────────
const nodeTypes = { estadoNode: EstadoNode };
const edgeTypes = { transicionEdge: TransicionEdge };

// ── Editor interno ────────────────────────────────────────
const DiagramaInterno = ({ estados, hook, derechoKey }) => {
  const {
    editarEstado, eliminarEstado,
    agregarTransicion, editarTransicion, eliminarTransicion,
    agregarCampoTransicion, editarCampoTransicion, eliminarCampoTransicion,
    moverNodo,
  } = hook;

  const activos = estados.filter(e => e.activo);

  const initialFlow = useMemo(() => {
    const { nodes, edges } = configToFlow(activos);
    const sinPos = nodes.filter(n => !activos.find(e => e.id === n.id)?.pos_x);
    if (sinPos.length > 0) return { nodes: applyDagreLayout(nodes, edges), edges };
    return { nodes, edges };
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow.edges);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = configToFlow(activos);
    setNodes(prev => newNodes.map(n => {
      const old = prev.find(p => p.id === n.id);
      return old ? { ...n, position: old.position } : n;
    }));
    setEdges(newEdges);
  }, [estados]);

  const [selNode, setSelNode] = useState(null);
  const [selEdge, setSelEdge] = useState(null);

  const onNodeDragStop = useCallback((_, node) => {
    moverNodo(derechoKey, node.id, node.position.x, node.position.y);
  }, [moverNodo, derechoKey]);

  const onConnect = useCallback((params) => {
    const src = activos.find(e => e.id === params.source);
    if (!src) return;
    const yaExiste = (src.transiciones || []).some(t => t.hacia === params.target);
    if (yaExiste) return;
    agregarTransicion(derechoKey, params.source,
      crearTransicion({ hacia: params.target, etiqueta: 'Nueva transición', color: 'blue' })
    );
  }, [activos, agregarTransicion, derechoKey]);

  const onNodeClick  = useCallback((_, node) => { setSelEdge(null); setSelNode(node.id); }, []);
  const onEdgeClick  = useCallback((_, edge) => { setSelNode(null); setSelEdge({ estadoId: edge.data.srcId, trId: edge.id }); }, []);
  const onPaneClick  = useCallback(() => { setSelNode(null); setSelEdge(null); }, []);

  const handleLayout = useCallback(() => {
    const laid = applyDagreLayout(nodes, edges);
    setNodes(laid);
    laid.forEach(n => moverNodo(derechoKey, n.id, n.position.x, n.position.y));
  }, [nodes, edges, setNodes, moverNodo, derechoKey]);

  const estadoSel = selNode ? activos.find(e => e.id === selNode) : null;
  const flechaSel = selEdge ? (() => {
    const src = activos.find(e => e.id === selEdge.estadoId);
    const tr  = src?.transiciones?.find(t => t.id === selEdge.trId);
    const dst = tr ? activos.find(e => e.id === tr.hacia) : null;
    return src && tr ? { src, tr, dst } : null;
  })() : null;

  const nodesWithSel = nodes.map(n => ({ ...n, selected: n.id === selNode }));
  const edgesWithSel = edges.map(e => ({ ...e, selected: e.id === selEdge?.trId }));

  return (
    <div className="flex rounded-2xl overflow-hidden border border-slate-700"
         style={{ height: 540 }}>

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
          fitViewOptions={{ padding: 0.25 }}
          deleteKeyCode={null}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: 'transicionEdge' }}
          connectionLineStyle={{ stroke: '#60A5FA', strokeWidth: 2.5, strokeDasharray: '6 3' }}>

          <Background
            variant={BackgroundVariant.Dots}
            color="rgba(148,163,184,0.12)"
            gap={28}
            size={1.5}
            style={{ background: 'linear-gradient(135deg, #0A0F1E 0%, #0F172A 50%, #0D1B2A 100%)' }}
          />

          <Controls
            style={{ background: '#1E293B', border: '1px solid #334155' }}
            className="[&>button]:!bg-slate-800 [&>button]:!border-slate-600 [&>button]:!text-slate-300 [&>button:hover]:!bg-slate-700" />

          <MiniMap
            nodeColor={n => {
              const estado = activos.find(e => e.id === n.id);
              return getNC(estado?.color)?.border || '#64748B';
            }}
            maskColor="rgba(10,14,23,0.75)"
            style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12 }} />

          {/* Botón ordenar */}
          <Panel position="top-left">
            <button onClick={handleLayout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background:  'rgba(30,41,59,0.95)',
                border:      '1px solid #334155',
                color:       '#94A3B8',
                backdropFilter: 'blur(8px)',
                boxShadow:   '0 4px 12px rgba(0,0,0,0.3)',
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#60A5FA'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#334155'}>
              <LayoutGrid className="w-3.5 h-3.5" style={{ color: '#60A5FA' }} />
              Ordenar automáticamente
            </button>
          </Panel>

          {/* Leyenda */}
          <Panel position="bottom-left">
            <div className="flex items-center gap-4 text-xs px-3 py-2 rounded-xl"
              style={{ background: 'rgba(10,14,23,0.9)', border: '1px solid #1E293B', color: '#64748B', backdropFilter: 'blur(8px)' }}>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-0.5 inline-block rounded" style={{ background: '#3B82F6' }} />
                DPO elige
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-5 inline-block" style={{ borderTop: '2px dashed #EAB308', display: 'inline-block' }} />
                Automática
              </span>
              <span style={{ color: '#475569' }}>Arrastra handle para conectar</span>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Panel lateral */}
      {(estadoSel || flechaSel) && (
        <div className="w-72 flex-shrink-0 flex flex-col border-l border-slate-700"
             style={{ maxHeight: 540, overflowY: 'hidden', background: '#0F172A' }}>
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
              onAgregarCampoEstado={ov => agregarCampoTransicion(derechoKey, estadoSel.id, ov)}
              onEditarCampoEstado={(cid, ch) => editarCampoTransicion(derechoKey, estadoSel.id, cid, ch)}
              onEliminarCampoEstado={cid => eliminarCampoTransicion(derechoKey, estadoSel.id, cid)}
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