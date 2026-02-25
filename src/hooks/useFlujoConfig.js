// ============================================================
// useFlujoConfig — Hook v4
// Agrega editarSlackWebhook(derechoKey, url)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  obtenerFlujoConfig,
  guardarFlujoConfig,
  restaurarFlujoDefault,
  crearEstadoCustom,
  crearCampoTransicion,
  crearActor,
} from '../services/flujoService';
import { toast } from 'react-toastify';

const useFlujoConfig = () => {
  const [config, setConfig]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [dirty, setDirty]         = useState(false);

  // ── Cargar ───────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const result = await obtenerFlujoConfig();
      if (result.status === 'success') {
        setConfig(result.data);
        setDirty(false);
      } else {
        toast.error('Error al cargar configuración de flujos');
      }
    } catch {
      toast.error('Error inesperado al cargar flujos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Guardar ──────────────────────────────────────────────
  const guardar = async () => {
    if (!config) return;
    setGuardando(true);
    try {
      const result = await guardarFlujoConfig(config);
      if (result.status === 'success') {
        toast.success('✅ Configuración de flujos guardada');
        setDirty(false);
      } else {
        toast.error('Error al guardar: ' + (result.message || ''));
      }
    } catch {
      toast.error('Error al guardar flujos');
    } finally {
      setGuardando(false);
    }
  };

  // ── Mutaciones ───────────────────────────────────────────
  const update = (fn) => {
    setConfig(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      fn(next);
      return next;
    });
    setDirty(true);
  };

  const getEstado = (cfg, derechoKey, estadoId) =>
    cfg.derechos[derechoKey].estados.find(e => e.id === estadoId);

  // ── Estados ───────────────────────────────────────────────

  const toggleEstado = (derechoKey, estadoId) => {
    update(c => {
      const e = getEstado(c, derechoKey, estadoId);
      if (!e || e.protegido) return;
      e.activo = !e.activo;
    });
  };

  const editarEstado = (derechoKey, estadoId, changes) => {
    update(c => {
      const e = getEstado(c, derechoKey, estadoId);
      if (!e) return;
      Object.assign(e, changes);
    });
  };

  const toggleProtegidoPorLey = (derechoKey, estadoId) => {
    update(c => {
      const e = getEstado(c, derechoKey, estadoId);
      if (!e) return;
      e.origen = e.origen === 'ley' ? 'ley_futura' : 'custom';
    });
  };

  const moverEstado = (derechoKey, estadoId, dir) => {
    update(c => {
      const estados = c.derechos[derechoKey].estados;
      const idx  = estados.findIndex(e => e.id === estadoId);
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= estados.length) return;
      if (estados[swap].protegido) return;
      [estados[idx], estados[swap]] = [estados[swap], estados[idx]];
      estados.forEach((e, i) => { e.orden = i + 1; });
    });
  };

  const moverNodo = (derechoKey, estadoId, x, y) => {
    update(c => {
      const e = getEstado(c, derechoKey, estadoId);
      if (!e) return;
      e.pos_x = Math.round(x);
      e.pos_y = Math.round(y);
    });
  };

  const agregarEstado = (derechoKey, override = {}) => {
    update(c => {
      const estados = c.derechos[derechoKey].estados;
      const nuevo = crearEstadoCustom({ orden: estados.length + 1, ...override });
      estados.push(nuevo);
    });
  };

  const eliminarEstado = (derechoKey, estadoId) => {
    update(c => {
      const e = c.derechos[derechoKey].estados.find(s => s.id === estadoId);
      if (!e || e.protegido || e.origen === 'ley') return;
      c.derechos[derechoKey].estados = c.derechos[derechoKey].estados.filter(s => s.id !== estadoId);
      c.derechos[derechoKey].estados.forEach(s => {
        s.transiciones_posibles = (s.transiciones_posibles || []).filter(t => t !== estadoId);
      });
    });
  };

  const restaurarDerecho = (derechoKey) => {
    update(c => {
      c.derechos[derechoKey] = restaurarFlujoDefault(derechoKey);
    });
  };

  // ── Campos de transición ──────────────────────────────────

  const agregarCampoTransicion = (derechoKey, estadoId, override = {}) => {
    update(c => {
      const e = getEstado(c, derechoKey, estadoId);
      if (!e) return;
      e.campos_transicion = e.campos_transicion || [];
      e.campos_transicion.push(crearCampoTransicion(override));
    });
  };

  const editarCampoTransicion = (derechoKey, estadoId, campoId, changes) => {
    update(c => {
      const e = getEstado(c, derechoKey, estadoId);
      if (!e) return;
      const campo = (e.campos_transicion || []).find(f => f.id === campoId);
      if (campo) Object.assign(campo, changes);
    });
  };

  const eliminarCampoTransicion = (derechoKey, estadoId, campoId) => {
    update(c => {
      const e = getEstado(c, derechoKey, estadoId);
      if (!e) return;
      e.campos_transicion = (e.campos_transicion || []).filter(f => f.id !== campoId);
    });
  };

  // ── Transiciones ──────────────────────────────────────────

  const toggleTransicion = (derechoKey, estadoId, targetId) => {
    update(c => {
      const e = getEstado(c, derechoKey, estadoId);
      if (!e) return;
      if (!e.transiciones_posibles) e.transiciones_posibles = [];
      const idx = e.transiciones_posibles.indexOf(targetId);
      if (idx === -1) e.transiciones_posibles.push(targetId);
      else            e.transiciones_posibles.splice(idx, 1);
    });
  };

  const agregarTransicion = (derechoKey, estadoId, transicion) => {
    update(c => {
      const e = getEstado(c, derechoKey, estadoId);
      if (!e) return;
      if (!e.transiciones) e.transiciones = [];
      e.transiciones.push(transicion);
    });
  };

  const editarTransicion = (derechoKey, estadoId, transicionId, changes) => {
    update(c => {
      const e = getEstado(c, derechoKey, estadoId);
      if (!e) return;
      const tr = (e.transiciones || []).find(t => t.id === transicionId);
      if (tr) Object.assign(tr, changes);
    });
  };

  const eliminarTransicion = (derechoKey, estadoId, transicionId) => {
    update(c => {
      const e = getEstado(c, derechoKey, estadoId);
      if (!e) return;
      e.transiciones = (e.transiciones || []).filter(t => t.id !== transicionId);
    });
  };

  // ── SLA ───────────────────────────────────────────────────

  const editarSLA = (derechoKey, estadoId, { sla_dias, sla_alerta_dias }) => {
    update(c => {
      const e = getEstado(c, derechoKey, estadoId);
      if (!e) return;
      if (sla_dias        !== undefined) e.sla_dias        = Math.max(0, parseInt(sla_dias)        || 0);
      if (sla_alerta_dias !== undefined) e.sla_alerta_dias = Math.max(0, parseInt(sla_alerta_dias) || 0);
    });
  };

  // ── Actores responsables ──────────────────────────────────

  const agregarActor = (derechoKey, estadoId) => {
    update(c => {
      const e = getEstado(c, derechoKey, estadoId);
      if (!e) return;
      if (!e.actores) e.actores = [];
      e.actores.push(crearActor());
    });
  };

  const editarActor = (derechoKey, estadoId, actorId, changes) => {
    update(c => {
      const e = getEstado(c, derechoKey, estadoId);
      if (!e) return;
      if (!e.actores) e.actores = [];
      const actor = e.actores.find(a => a.id === actorId);
      if (actor) Object.assign(actor, changes);
    });
  };

  const eliminarActor = (derechoKey, estadoId, actorId) => {
    update(c => {
      const e = getEstado(c, derechoKey, estadoId);
      if (!e) return;
      e.actores = (e.actores || []).filter(a => a.id !== actorId);
    });
  };

  // ── Slack Webhook por derecho ← NUEVO ────────────────────

  const editarSlackWebhook = (derechoKey, url) => {
    update(c => {
      if (!c.derechos[derechoKey]) return;
      c.derechos[derechoKey].slack_webhook = url.trim();
    });
  };

  // ── Selector ──────────────────────────────────────────────

  const getEstadosOrdenados = (derechoKey) => {
    if (!config?.derechos?.[derechoKey]) return [];
    return [...config.derechos[derechoKey].estados].sort((a, b) => a.orden - b.orden);
  };

  return {
    config, loading, guardando, dirty,
    guardar, recargar: cargar,
    // Estados
    toggleEstado, editarEstado, toggleProtegidoPorLey,
    moverEstado, agregarEstado, eliminarEstado, restaurarDerecho,
    // Posición en diagrama
    moverNodo,
    // Transiciones del grafo
    agregarTransicion, editarTransicion, eliminarTransicion,
    // Campos transición
    agregarCampoTransicion, editarCampoTransicion, eliminarCampoTransicion,
    // Transiciones posibles (lista)
    toggleTransicion,
    // SLA
    editarSLA,
    // Actores
    agregarActor, editarActor, eliminarActor,
    // Slack ← NUEVO
    editarSlackWebhook,
    // Selector
    getEstadosOrdenados,
  };
};

export default useFlujoConfig;