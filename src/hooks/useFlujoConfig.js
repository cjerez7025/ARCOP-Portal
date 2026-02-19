// ============================================================
// useFlujoConfig v2 — hook con CRUD de transiciones enriquecidas
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  obtenerFlujoConfig, guardarFlujoConfig, restaurarFlujoDefault,
  crearEstadoCustom, crearTransicion, crearCampoRequerido,
} from '../services/flujoService';
import { toast } from 'react-toastify';

const useFlujoConfig = () => {
  const [config,    setConfig]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [dirty,     setDirty]     = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await obtenerFlujoConfig();
      if (r.status === 'success') { setConfig(r.data); setDirty(false); }
      else toast.error('Error al cargar configuración de flujos');
    } catch { toast.error('Error inesperado'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    if (!config) return;
    setGuardando(true);
    try {
      const r = await guardarFlujoConfig(config);
      if (r.status === 'success') { toast.success('✅ Flujos guardados'); setDirty(false); }
      else toast.error('Error al guardar: ' + (r.message || ''));
    } catch { toast.error('Error al guardar'); }
    finally { setGuardando(false); }
  };

  // ── Mutación inmutable ────────────────────────────────────
  const update = (fn) => {
    setConfig(prev => { const next = JSON.parse(JSON.stringify(prev)); fn(next); return next; });
    setDirty(true);
  };

  const getEstado = (c, dk, eid) => c.derechos[dk]?.estados.find(e => e.id === eid);

  // ── Estados ───────────────────────────────────────────────
  const toggleEstado = (dk, eid) =>
    update(c => { const e = getEstado(c, dk, eid); if (e && !e.protegido) e.activo = !e.activo; });

  const editarEstado = (dk, eid, changes) =>
    update(c => {
      const e = getEstado(c, dk, eid);
      if (!e) return;
      const permitidos = e.protegido
        ? ['descripcion', 'envia_email', 'requiere_confirmacion', 'articulo', 'pos_x', 'pos_y']
        : Object.keys(changes);
      permitidos.forEach(k => { if (k in changes) e[k] = changes[k]; });
    });

  const toggleProtegidoPorLey = (dk, eid) =>
    update(c => {
      const e = getEstado(c, dk, eid);
      if (!e || e.origen === 'ley') return;
      e.protegido = !e.protegido;
      e.origen = e.protegido ? 'ley_futura' : 'custom';
    });

  const moverEstado = (dk, eid, dir) =>
    update(c => {
      const estados = c.derechos[dk].estados;
      const idx  = estados.findIndex(e => e.id === eid);
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= estados.length || estados[swap].protegido) return;
      [estados[idx], estados[swap]] = [estados[swap], estados[idx]];
      estados.forEach((e, i) => { e.orden = i + 1; });
    });

  const agregarEstado = (dk, override = {}) =>
    update(c => {
      const estados = c.derechos[dk].estados;
      c.derechos[dk].estados.push(
        crearEstadoCustom({ orden: estados.length + 1, ...override })
      );
    });

  const eliminarEstado = (dk, eid) =>
    update(c => {
      const e = getEstado(c, dk, eid);
      if (!e || e.protegido || e.origen === 'ley') return;
      c.derechos[dk].estados = c.derechos[dk].estados.filter(s => s.id !== eid);
      // Limpiar transiciones que apuntaban a este estado
      c.derechos[dk].estados.forEach(s => {
        s.transiciones = (s.transiciones || []).filter(t => t.hacia !== eid);
      });
    });

  const restaurarDerecho = (dk) =>
    update(c => { c.derechos[dk] = restaurarFlujoDefault(dk); });

  // Actualizar posición de nodo en el diagrama
  const moverNodo = (dk, eid, x, y) =>
    update(c => {
      const e = getEstado(c, dk, eid);
      if (e) { e.pos_x = Math.round(x); e.pos_y = Math.round(y); }
    });

  // ── Transiciones ──────────────────────────────────────────
  const agregarTransicion = (dk, eid, override = {}) =>
    update(c => {
      const e = getEstado(c, dk, eid);
      if (!e) return;
      if (!e.transiciones) e.transiciones = [];
      e.transiciones.push(crearTransicion(override));
    });

  const editarTransicion = (dk, eid, tid, changes) =>
    update(c => {
      const e = getEstado(c, dk, eid);
      if (!e) return;
      const t = (e.transiciones || []).find(t => t.id === tid);
      if (t) Object.assign(t, changes);
    });

  const eliminarTransicion = (dk, eid, tid) =>
    update(c => {
      const e = getEstado(c, dk, eid);
      if (!e) return;
      e.transiciones = (e.transiciones || []).filter(t => t.id !== tid);
    });

  const reordenarTransicion = (dk, eid, tid, dir) =>
    update(c => {
      const e = getEstado(c, dk, eid);
      if (!e?.transiciones) return;
      const idx  = e.transiciones.findIndex(t => t.id === tid);
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= e.transiciones.length) return;
      [e.transiciones[idx], e.transiciones[swap]] = [e.transiciones[swap], e.transiciones[idx]];
    });

  // ── Campos requeridos de una transición ──────────────────
  const agregarCampoTransicion = (dk, eid, tid, override = {}) =>
    update(c => {
      const e = getEstado(c, dk, eid);
      const t = (e?.transiciones || []).find(t => t.id === tid);
      if (!t) return;
      if (!t.campos_requeridos) t.campos_requeridos = [];
      t.campos_requeridos.push(crearCampoRequerido(override));
    });

  const editarCampoTransicion = (dk, eid, tid, cid, changes) =>
    update(c => {
      const e = getEstado(c, dk, eid);
      const t = (e?.transiciones || []).find(t => t.id === tid);
      if (!t) return;
      const campo = (t.campos_requeridos || []).find(f => f.id === cid);
      if (campo) Object.assign(campo, changes);
    });

  const eliminarCampoTransicion = (dk, eid, tid, cid) =>
    update(c => {
      const e = getEstado(c, dk, eid);
      const t = (e?.transiciones || []).find(t => t.id === tid);
      if (!t) return;
      t.campos_requeridos = (t.campos_requeridos || []).filter(f => f.id !== cid);
    });

  // ── Selectores ────────────────────────────────────────────
  const getEstadosOrdenados = (dk) => {
    if (!config?.derechos?.[dk]) return [];
    return [...config.derechos[dk].estados].sort((a, b) => a.orden - b.orden);
  };

  // Devuelve las transiciones válidas desde un estado dado
  const getTransicionesDesde = (dk, eid) => {
    const e = config?.derechos?.[dk]?.estados.find(s => s.id === eid);
    return (e?.transiciones || []).filter(t => t.hacia); // solo las que tienen destino definido
  };

  return {
    config, loading, guardando, dirty,
    guardar, recargar: cargar,
    // estados
    toggleEstado, editarEstado, toggleProtegidoPorLey,
    moverEstado, agregarEstado, eliminarEstado, restaurarDerecho, moverNodo,
    // transiciones
    agregarTransicion, editarTransicion, eliminarTransicion, reordenarTransicion,
    // campos de transición
    agregarCampoTransicion, editarCampoTransicion, eliminarCampoTransicion,
    // selectores
    getEstadosOrdenados, getTransicionesDesde,
  };
};

export default useFlujoConfig;