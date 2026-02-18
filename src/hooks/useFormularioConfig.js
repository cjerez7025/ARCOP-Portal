// ============================================================
// useFormularioConfig — Hook
// Carga y expone la configuración dinámica de formularios.
// Usado tanto por el Configurador (DPO) como por el Formulario público.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  obtenerFormularioConfig,
  guardarFormularioConfig,
  restaurarDerechoADefault,
  crearCampoCustom,
  CAMPOS_IDENTIDAD,
} from '../services/formularioService';
import { toast } from 'react-toastify';

const useFormularioConfig = () => {
  const [config, setConfig]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [dirty, setDirty]         = useState(false);

  // ── Cargar ───────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const result = await obtenerFormularioConfig();
      if (result.status === 'success') {
        setConfig(result.data);
        setDirty(false);
      } else {
        toast.error('Error al cargar configuración de formularios');
      }
    } catch (err) {
      toast.error('Error inesperado al cargar configuración');
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
      const result = await guardarFormularioConfig(config);
      if (result.status === 'success') {
        toast.success('✅ Configuración de formularios guardada');
        setDirty(false);
      } else {
        toast.error('Error al guardar: ' + (result.message || ''));
      }
    } catch (err) {
      toast.error('Error al guardar configuración');
    } finally {
      setGuardando(false);
    }
  };

  // ── Mutaciones ───────────────────────────────────────────

  const updateConfig = (fn) => {
    setConfig(prev => {
      const next = JSON.parse(JSON.stringify(prev)); // deep clone
      fn(next);
      return next;
    });
    setDirty(true);
  };

  // Activar/desactivar un derecho completo
  const toggleDerecho = (derechoKey) => {
    updateConfig(c => {
      c.derechos[derechoKey].activo = !c.derechos[derechoKey].activo;
    });
  };

  // Activar/desactivar un campo
  const toggleCampo = (derechoKey, campoId) => {
    updateConfig(c => {
      const campo = c.derechos[derechoKey].campos.find(f => f.id === campoId);
      if (campo && !campo.protegido) campo.activo = !campo.activo;
    });
  };

  // Marcar obligatorio / opcional
  const toggleObligatorio = (derechoKey, campoId) => {
    updateConfig(c => {
      const campo = c.derechos[derechoKey].campos.find(f => f.id === campoId);
      if (campo && !campo.protegido) campo.obligatorio = !campo.obligatorio;
    });
  };

  // Editar label o texto de ayuda
  const editarCampo = (derechoKey, campoId, changes) => {
    updateConfig(c => {
      const campo = c.derechos[derechoKey].campos.find(f => f.id === campoId);
      if (campo && campo.editable) Object.assign(campo, changes);
    });
  };

  // Mover campo arriba/abajo
  const moverCampo = (derechoKey, campoId, direccion) => {
    updateConfig(c => {
      const campos = c.derechos[derechoKey].campos;
      const idx = campos.findIndex(f => f.id === campoId);
      const swap = direccion === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= campos.length) return;
      [campos[idx], campos[swap]] = [campos[swap], campos[idx]];
      // Actualizar orden
      campos.forEach((f, i) => { f.orden = i + 1; });
    });
  };

  // Agregar campo custom
  const agregarCampo = (derechoKey, override = {}) => {
    updateConfig(c => {
      const nuevo = crearCampoCustom(derechoKey, override);
      c.derechos[derechoKey].campos.push(nuevo);
    });
  };

  // Eliminar campo custom (solo origen: 'custom')
  const eliminarCampo = (derechoKey, campoId) => {
    updateConfig(c => {
      const campo = c.derechos[derechoKey].campos.find(f => f.id === campoId);
      if (!campo || campo.origen !== 'custom') return;
      c.derechos[derechoKey].campos = c.derechos[derechoKey].campos.filter(f => f.id !== campoId);
    });
  };

  // Restaurar derecho a defaults legales
  const restaurarDerecho = (derechoKey) => {
    updateConfig(c => {
      c.derechos[derechoKey] = restaurarDerechoADefault(derechoKey);
    });
  };

  // ── Selector: campos activos para el formulario público ──
  const getCamposParaFormulario = (derechoKey) => {
    if (!config?.derechos?.[derechoKey]) return [];
    const specificos = config.derechos[derechoKey].campos
      .filter(c => c.activo)
      .sort((a, b) => a.orden - b.orden);
    return { identidad: CAMPOS_IDENTIDAD, especificos: specificos };
  };

  return {
    config,
    loading,
    guardando,
    dirty,
    // acciones
    guardar,
    recargar:         cargar,
    toggleDerecho,
    toggleCampo,
    toggleObligatorio,
    editarCampo,
    moverCampo,
    agregarCampo,
    eliminarCampo,
    restaurarDerecho,
    // selector
    getCamposParaFormulario,
  };
};

export default useFormularioConfig;