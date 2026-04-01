// ============================================================
// src/hooks/useDerechosConfig.js  v1.1
// MMPA-104 — Fix ruta Firestore: colección raíz "derechos/{id}"
// Firestore requiere segmentos pares → "derechos/ACCESO" (2 seg)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { db } from '../config/firebase';
import {
  collection, doc, setDoc, updateDoc,
  onSnapshot, serverTimestamp, query, orderBy,
} from 'firebase/firestore';
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
  '#3B82F6','#F59E0B','#EF4444',
  '#8B5CF6','#10B981','#EC4899',
  '#F97316','#06B6D4',
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

  // ── Listener en tiempo real sobre colección raíz "derechos" ──
  // Ruta: derechos/{ACCESO}, derechos/{RECTIFICACION}, etc.
  // Segmentos: 2 (par) ✓
  useEffect(() => {
    const q = query(
      collection(db, 'derechos'),
      orderBy('orden', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setDerechos(data);
        setLoading(false);
      },
      (err) => {
        console.error('[useDerechosConfig] Error listener:', err.message);
        // Si la colección no existe aún, simplemente mostrar vacío
        setDerechos([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ── Crear nuevo derecho ────────────────────────────────────
  const crearDerecho = async (id, datos) => {
    if (!id || !datos.nombre) {
      toast.error('ID y nombre son obligatorios');
      return false;
    }

    const idNormalizado = id.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');

    if (derechos.find(d => d.id === idNormalizado)) {
      toast.error('Ya existe un derecho con ID ' + idNormalizado);
      return false;
    }

    if ((datos.sla_dias || 15) > 15) {
      toast.error('El SLA no puede superar 15 días hábiles (Art. 11 Ley 21.719)');
      return false;
    }

    setGuardando(true);
    try {
      // Ruta: derechos/ACCESO → 2 segmentos ✓
      await setDoc(doc(db, 'derechos', idNormalizado), {
        ...datos,
        id:             idNormalizado,
        activo:         false,
        creado_en:      serverTimestamp(),
        actualizado_en: serverTimestamp(),
      });
      toast.success('Derecho ' + datos.nombre + ' creado');
      return idNormalizado;
    } catch (e) {
      console.error('[useDerechosConfig] Error creando:', e);
      toast.error('Error al crear derecho: ' + e.message);
      return false;
    } finally {
      setGuardando(false);
    }
  };

  // ── Editar derecho existente ───────────────────────────────
  const editarDerecho = async (id, cambios) => {
    if (cambios.sla_dias && cambios.sla_dias > 15) {
      toast.error('El SLA no puede superar 15 días hábiles (Art. 11 Ley 21.719)');
      return false;
    }

    setGuardando(true);
    try {
      await updateDoc(doc(db, 'derechos', id), {
        ...cambios,
        actualizado_en: serverTimestamp(),
      });
      toast.success('Derecho actualizado');
      return true;
    } catch (e) {
      console.error('[useDerechosConfig] Error editando:', e);
      toast.error('Error al guardar: ' + e.message);
      return false;
    } finally {
      setGuardando(false);
    }
  };

  // ── Toggle activo/inactivo ─────────────────────────────────
  const toggleActivo = async (id) => {
    const derecho = derechos.find(d => d.id === id);
    if (!derecho) return;
    return editarDerecho(id, { activo: !derecho.activo });
  };

  // ── Reordenar (swap de orden entre dos derechos) ──────────
  const reordenar = async (idA, idB) => {
    const a = derechos.find(d => d.id === idA);
    const b = derechos.find(d => d.id === idB);
    if (!a || !b) return;

    setGuardando(true);
    try {
      await Promise.all([
        updateDoc(doc(db, 'derechos', idA), { orden: b.orden, actualizado_en: serverTimestamp() }),
        updateDoc(doc(db, 'derechos', idB), { orden: a.orden, actualizado_en: serverTimestamp() }),
      ]);
    } catch (e) {
      toast.error('Error al reordenar');
    } finally {
      setGuardando(false);
    }
  };

  return {
    derechos,
    loading,
    guardando,
    crearDerecho,
    editarDerecho,
    toggleActivo,
    reordenar,
    ICONOS_DISPONIBLES,
    buildDerechoVacio,
  };
};

export default useDerechosConfig;