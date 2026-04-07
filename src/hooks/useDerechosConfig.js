// ============================================================
// src/hooks/useDerechosConfig.js — v2.0
// MMPA-104 — Hook para gestión de derechos ARCOP
// v2.0: usa httpAdapter en vez de Firestore SDK directamente
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import adapter from '../adapters';
import { toast } from 'react-toastify';

export const ICONOS_DISPONIBLES = [
  { id: 'search',  emoji: '🔍', label: 'Buscar'     },
  { id: 'edit',    emoji: '✏️',  label: 'Editar'     },
  { id: 'trash',   emoji: '🗑️', label: 'Eliminar'   },
  { id: 'hand',    emoji: '✋',  label: 'Alto'       },
  { id: 'export',  emoji: '📤', label: 'Exportar'   },
  { id: 'lock',    emoji: '🔒', label: 'Privacidad' },
  { id: 'doc',     emoji: '📄', label: 'Documento'  },
  { id: 'shield',  emoji: '🛡️', label: 'Escudo'     },
  { id: 'eye',     emoji: '👁️', label: 'Ver'        },
  { id: 'bell',    emoji: '🔔', label: 'Alerta'     },
];

const COLORES_DEFAULT = [
  '#3B82F6', '#F59E0B', '#EF4444',
  '#8B5CF6', '#10B981', '#EC4899',
  '#F97316', '#06B6D4',
];

export const buildDerechoVacio = (orden = 99) => ({
  nombre:      '',
  articulo:    '',
  descripcion: '',
  icono:       'doc',
  color:       COLORES_DEFAULT[Math.floor(Math.random() * COLORES_DEFAULT.length)],
  orden,
  activo:      false,
  sla_dias:    15,
  protegido:   false,
  origen:      'custom',
});

const useDerechosConfig = () => {
  const [derechos,  setDerechos]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [guardando, setGuardando] = useState(false);

  // ── Cargar todos los derechos (DPO) ──────────────────────
  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adapter.getTodosDerechos();
      if (result.status === 'success') {
        setDerechos(result.data || []);
      } else {
        toast.error('Error al cargar derechos');
      }
    } catch (e) {
      console.error('[useDerechosConfig]', e.message);
      toast.error('Error al cargar derechos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Crear nuevo derecho ────────────────────────────────────
  const crearDerecho = async (id, datos) => {
    if (!id || !datos.nombre) {
      toast.error('ID y nombre son obligatorios');
      return false;
    }

    setGuardando(true);
    try {
      const result = await adapter.crearDerecho(id, datos);
      if (result.status === 'success') {
        toast.success('Derecho ' + datos.nombre + ' creado');
        await cargar();
        return result.data?.id || id.toUpperCase();
      } else {
        toast.error(result.message || 'Error al crear derecho');
        return false;
      }
    } catch (e) {
      toast.error('Error al crear derecho');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  // ── Editar derecho existente ───────────────────────────────
  const editarDerecho = async (id, cambios) => {
    setGuardando(true);
    try {
      const result = await adapter.editarDerecho(id, cambios);
      if (result.status === 'success') {
        toast.success('Derecho actualizado');
        await cargar();
        return true;
      } else {
        toast.error(result.message || 'Error al guardar');
        return false;
      }
    } catch (e) {
      toast.error('Error al guardar cambios');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  // ── Toggle activo/inactivo ─────────────────────────────────
  const toggleActivo = async (id) => {
    setGuardando(true);
    try {
      const result = await adapter.toggleDerecho(id);
      if (result.status === 'success') {
        await cargar();
        return true;
      } else {
        toast.error(result.message || 'Error al cambiar estado');
        return false;
      }
    } catch (e) {
      toast.error('Error al cambiar estado');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  return {
    derechos,
    loading,
    guardando,
    cargar,
    crearDerecho,
    editarDerecho,
    toggleActivo,
    ICONOS_DISPONIBLES,
    buildDerechoVacio,
  };
};

export default useDerechosConfig;