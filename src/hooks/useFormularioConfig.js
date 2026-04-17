// ============================================================
// useFormularioConfig — Hook
// Carga y expone la configuración dinámica de formularios.
// FIX: agregarCampo inicializa estructura si no existe (derechos custom)
// FIX: editarCampo inyecta props de file al cambiar tipo a 'file'
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

// Props por defecto cuando un campo cambia a tipo 'file'
const FILE_DEFAULTS = {
  accept:      '.pdf,.jpg,.jpeg,.png,.doc,.docx',
  maxSizeMB:   5,
  maxFiles:    3,
  placeholder: 'Arrastra archivos aquí o haz clic para seleccionar',
};

// Props que se limpian cuando un campo deja de ser tipo 'file'
const FILE_KEYS = ['accept', 'maxSizeMB', 'maxFiles'];

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
      const next = JSON.parse(JSON.stringify(prev));
      fn(next);
      return next;
    });
    setDirty(true);
  };

  // Helper: asegurar que existe la entrada del derecho
  const _ensureDerecho = (c, derechoKey) => {
    if (!c.derechos) c.derechos = {};
    if (!c.derechos[derechoKey]) {
      c.derechos[derechoKey] = { activo: true, campos: [] };
    }
    if (!c.derechos[derechoKey].campos) {
      c.derechos[derechoKey].campos = [];
    }
  };

  // Activar/desactivar un derecho completo
  const toggleDerecho = (derechoKey) => {
    updateConfig(c => {
      _ensureDerecho(c, derechoKey);
      c.derechos[derechoKey].activo = !c.derechos[derechoKey].activo;
    });
  };

  // Activar/desactivar un campo
  const toggleCampo = (derechoKey, campoId) => {
    updateConfig(c => {
      _ensureDerecho(c, derechoKey);
      const campo = c.derechos[derechoKey].campos.find(f => f.id === campoId);
      if (campo && !campo.protegido) campo.activo = !campo.activo;
    });
  };

  // Marcar obligatorio / opcional
  const toggleObligatorio = (derechoKey, campoId) => {
    updateConfig(c => {
      _ensureDerecho(c, derechoKey);
      const campo = c.derechos[derechoKey].campos.find(f => f.id === campoId);
      if (campo && !campo.protegido) campo.obligatorio = !campo.obligatorio;
    });
  };

  // Editar label, tipo, ayuda, placeholder, etc.
  const editarCampo = (derechoKey, campoId, changes) => {
    updateConfig(c => {
      _ensureDerecho(c, derechoKey);
      const campo = c.derechos[derechoKey].campos.find(f => f.id === campoId);
      if (!campo || !campo.editable) return;

      const tipoAnterior = campo.tipo;
      Object.assign(campo, changes);

      // Si el tipo cambió a 'file', inyectar props por defecto
      if (changes.tipo === 'file' && tipoAnterior !== 'file') {
        Object.keys(FILE_DEFAULTS).forEach(k => {
          if (campo[k] === undefined || campo[k] === null || campo[k] === '') {
            campo[k] = FILE_DEFAULTS[k];
          }
        });
      }

      // Si el tipo cambió DESDE 'file' a otro, limpiar props de file
      if (tipoAnterior === 'file' && changes.tipo && changes.tipo !== 'file') {
        FILE_KEYS.forEach(k => { delete campo[k]; });
      }
    });
  };

  // Mover campo arriba/abajo
  const moverCampo = (derechoKey, campoId, direccion) => {
    updateConfig(c => {
      _ensureDerecho(c, derechoKey);
      const campos = c.derechos[derechoKey].campos;
      const idx  = campos.findIndex(f => f.id === campoId);
      const swap = direccion === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= campos.length) return;
      [campos[idx], campos[swap]] = [campos[swap], campos[idx]];
      campos.forEach((f, i) => { f.orden = i + 1; });
    });
  };

  // Agregar campo custom — FIX: inicializa estructura si no existe
  const agregarCampo = (derechoKey, override = {}) => {
    updateConfig(c => {
      _ensureDerecho(c, derechoKey);
      const nuevo = crearCampoCustom(derechoKey, override);

      // Si el campo nuevo es tipo file, inyectar defaults
      if (nuevo.tipo === 'file') {
        Object.keys(FILE_DEFAULTS).forEach(k => {
          if (nuevo[k] === undefined) nuevo[k] = FILE_DEFAULTS[k];
        });
      }

      c.derechos[derechoKey].campos.push(nuevo);
    });
  };

  // Eliminar campo custom (solo origen: 'custom')
  const eliminarCampo = (derechoKey, campoId) => {
    updateConfig(c => {
      _ensureDerecho(c, derechoKey);
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
    if (!config?.derechos?.[derechoKey]) return { identidad: CAMPOS_IDENTIDAD, especificos: [] };
    const especificos = (config.derechos[derechoKey].campos || [])
      .filter(c => c.activo)
      .sort((a, b) => a.orden - b.orden);
    return { identidad: CAMPOS_IDENTIDAD, especificos };
  };

  return {
    config,
    loading,
    guardando,
    dirty,
    // acciones
    guardar,
    recargar:         cargar,
    updateConfig,
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