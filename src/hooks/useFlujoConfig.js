// ============================================================
// useFlujoConfig — Hook
// Estado y mutaciones del configurador de flujos por derecho.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  obtenerFlujoConfig,
  guardarFlujoConfig,
  restaurarFlujoDefault,
  crearEstadoCustom,
  crearCampoTransicion,
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

  // Activar / desactivar estado
  const toggleEstado = (derechoKey, estadoId) => {
    update(c => {
      const e = getEstado(c, derechoKey, estadoId);
      if (e && !e.protegido) e.activo = !e.activo;
    });
  };

  // Editar propiedades básicas de un estado
  const editarEstado = (derechoKey, estadoId, changes) => {
    update(c => {
      const e = getEstado(c, derechoKey, estadoId);
      if (!e) return;
      // Si el estado es protegido, solo se puede editar descripcion y si envia_email / requiere_confirmacion
      if (e.protegido) {
        const permitidos = ['descripcion', 'envia_email', 'requiere_confirmacion', 'transiciones_posibles'];
        Object.keys(changes).forEach(k => {
          if (permitidos.includes(k)) e[k] = changes[k];
        });
      } else {
        Object.assign(e, changes);
      }
    });
  };

  // Marcar / desmarcar un custom como protegido por ley
  const toggleProtegidoPorLey = (derechoKey, estadoId) => {
    update(c => {
      const e = getEstado(c, derechoKey, estadoId);
      if (!e || e.origen === 'ley') return; // los nativos no se tocan
      e.protegido = !e.protegido;
      if (e.protegido) e.origen = 'ley_futura'; // distinguir de los originales
      else              e.origen = 'custom';
    });
  };

  // Mover estado arriba / abajo (solo no-protegidos)
  const moverEstado = (derechoKey, estadoId, dir) => {
    update(c => {
      const estados = c.derechos[derechoKey].estados;
      const idx  = estados.findIndex(e => e.id === estadoId);
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= estados.length) return;
      // No pasar por encima de un protegido
      if (estados[swap].protegido) return;
      [estados[idx], estados[swap]] = [estados[swap], estados[idx]];
      estados.forEach((e, i) => { e.orden = i + 1; });
    });
  };

  // Agregar estado custom
  const agregarEstado = (derechoKey, override = {}) => {
    update(c => {
      const estados = c.derechos[derechoKey].estados;
      const nuevo = crearEstadoCustom({ orden: estados.length + 1, ...override });
      estados.push(nuevo);
    });
  };

  // Eliminar estado custom
  const eliminarEstado = (derechoKey, estadoId) => {
    update(c => {
      const e = c.derechos[derechoKey].estados.find(s => s.id === estadoId);
      if (!e || e.protegido || e.origen === 'ley') return;
      c.derechos[derechoKey].estados = c.derechos[derechoKey].estados.filter(s => s.id !== estadoId);
      // Limpiar referencias en transiciones_posibles de otros estados
      c.derechos[derechoKey].estados.forEach(s => {
        s.transiciones_posibles = s.transiciones_posibles.filter(t => t !== estadoId);
      });
    });
  };

  // Restaurar derecho a defaults legales
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
      e.campos_transicion.push(crearCampoTransicion(override));
    });
  };

  const editarCampoTransicion = (derechoKey, estadoId, campoId, changes) => {
    update(c => {
      const e = getEstado(c, derechoKey, estadoId);
      if (!e) return;
      const campo = e.campos_transicion.find(f => f.id === campoId);
      if (campo) Object.assign(campo, changes);
    });
  };

  const eliminarCampoTransicion = (derechoKey, estadoId, campoId) => {
    update(c => {
      const e = getEstado(c, derechoKey, estadoId);
      if (!e) return;
      e.campos_transicion = e.campos_transicion.filter(f => f.id !== campoId);
    });
  };

  // ── Toggle transición posible ─────────────────────────────
  const toggleTransicion = (derechoKey, estadoId, targetId) => {
    update(c => {
      const e = getEstado(c, derechoKey, estadoId);
      if (!e) return;
      const idx = e.transiciones_posibles.indexOf(targetId);
      if (idx === -1) e.transiciones_posibles.push(targetId);
      else            e.transiciones_posibles.splice(idx, 1);
    });
  };

  // ── Selector: flujo activo ordenado ──────────────────────
  const getEstadosOrdenados = (derechoKey) => {
    if (!config?.derechos?.[derechoKey]) return [];
    return [...config.derechos[derechoKey].estados].sort((a, b) => a.orden - b.orden);
  };

  return {
    config, loading, guardando, dirty,
    guardar, recargar: cargar,
    toggleEstado, editarEstado, toggleProtegidoPorLey,
    moverEstado, agregarEstado, eliminarEstado, restaurarDerecho,
    agregarCampoTransicion, editarCampoTransicion, eliminarCampoTransicion,
    toggleTransicion,
    getEstadosOrdenados,
  };
};

export default useFlujoConfig;