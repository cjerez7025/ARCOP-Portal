// ============================================================
// src/adapters/firebaseAdapter.js — v1.1
// Implementación COMPLETA del contrato IDataAdapter
// usando Firebase Firestore (región southamerica-west1)
//
// ESTRUCTURA DE COLECCIONES FIRESTORE:
//   /config/sistema              → configuración del tenant
//   /config/formularios          → campos dinámicos por derecho
//   /config/flujos               → estados y transiciones por derecho
//   /solicitudes/{id}            → solicitudes ARCOP
//   /solicitudes/{id}/historial  → log inmutable de estados
//   /auditoria/{id}              → log inmutable de auditoría
//   /tokens/{token}              → lookup token → solicitudId
// ============================================================

// ── Todos los imports al inicio (requerido por ESLint) ────
import {
  doc, getDoc, setDoc, addDoc, updateDoc,
  collection, getDocs, query, where, orderBy, limit,
  serverTimestamp, Timestamp, runTransaction, writeBatch,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { CAMPOS_DEFAULT_POR_DERECHO, CAMPOS_IDENTIDAD } from '../services/formularioService';

// ── Config default local ──────────────────────────────────
// Mirror de CONFIG_DEFAULT en configuracionService (no exportado)
const CONFIG_DEFAULT = {
  empresa_nombre:           'Mi Empresa',
  empresa_rut:              '12.345.678-9',
  empresa_razon_social:     'Mi Empresa SpA',
  empresa_direccion:        'Dirección de la empresa',
  empresa_telefono:         '+56 2 2345 6789',
  empresa_email:            'contacto@empresa.cl',
  empresa_web:              'https://empresa.cl',
  dpo_nombre:               'Delegado de Protección de Datos',
  dpo_email:                'dpo@empresa.cl',
  dpo_telefono:             '+56 9 8765 4321',
  dpo_horario:              'Lunes a Viernes, 9:00 - 18:00',
  portal_nombre:            'Portal ARCOP',
  portal_url:               '',
  portal_color:             '#2563eb',
  portal_color_secundario:  '#1e40af',
  logo_url:                 '',
  dias_respuesta:           '15',
  dias_alerta:              '3',
  dias_validacion:          '5',
  notif_activas:            'SI',
  email_cc:                 '',
  timezone:                 'America/Santiago',
  version:                  '1.0.0',
};

// ── Helpers internos ──────────────────────────────────────

const _ok  = (data)       => ({ status: 'success', data });
const _err = (msg, error) => {
  console.error('[FirebaseAdapter]', msg, error);
  return { status: 'error', data: null, message: msg };
};

/** Convierte Timestamps de Firestore a strings ISO */
const _toPlain = (docData) => {
  if (!docData) return docData;
  const result = { ...docData };
  for (const [key, val] of Object.entries(result)) {
    if (val instanceof Timestamp) {
      result[key] = val.toDate().toISOString();
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = _toPlain(val);
    }
  }
  return result;
};

/** Genera número de solicitud correlativo: ARC-YYYY-NNNNN */
const _generarNumeroSolicitud = async () => {
  const year = new Date().getFullYear();
  const counterRef = doc(db, 'config', `counter_${year}`);
  const newN = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const next = (snap.exists() ? snap.data().ultimo : 0) + 1;
    tx.set(counterRef, { ultimo: next, year }, { merge: true });
    return next;
  });
  return `ARC-${year}-${String(newN).padStart(5, '0')}`;
};

/** Genera token UUID v4 */
const _generateToken = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });

// ─────────────────────────────────────────────────────────
// IMPLEMENTACIÓN DEL ADAPTER
// ─────────────────────────────────────────────────────────

const firebaseAdapter = {

  nombre: 'firebase',

  // =========================================================
  // BLOQUE 1 — CONFIGURACIÓN DEL SISTEMA
  // =========================================================

  getConfig: async () => {
    try {
      const snap = await getDoc(doc(db, 'config', 'sistema'));
      if (!snap.exists()) return _ok(CONFIG_DEFAULT);
      return _ok(_toPlain(snap.data()));
    } catch (e) {
      return _err('Error al obtener configuración', e);
    }
  },

  saveConfig: async (data) => {
    try {
      await setDoc(doc(db, 'config', 'sistema'), {
        ...data,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return _ok(data);
    } catch (e) {
      return _err('Error al guardar configuración', e);
    }
  },

  restoreConfig: async () => {
    try {
      await setDoc(doc(db, 'config', 'sistema'), {
        ...CONFIG_DEFAULT,
        updatedAt:   serverTimestamp(),
        restoredAt:  serverTimestamp(),
      });
      return _ok(CONFIG_DEFAULT);
    } catch (e) {
      return _err('Error al restaurar configuración', e);
    }
  },

  // =========================================================
  // BLOQUE 2 — FORMULARIOS DINÁMICOS
  // =========================================================

  getFormularioConfig: async () => {
    try {
      const snap = await getDoc(doc(db, 'config', 'formularios'));
      if (!snap.exists()) {
        const derechos = ['ACCESO', 'RECTIFICACION', 'CANCELACION', 'OPOSICION', 'PORTABILIDAD'];
        const config = {
          derechos: Object.fromEntries(
            derechos.map(d => [d, {
              camposIdentidad: CAMPOS_IDENTIDAD,
              campos: CAMPOS_DEFAULT_POR_DERECHO[d] || [],
              activo: true,
            }])
          ),
        };
        return _ok(config);
      }
      return _ok(_toPlain(snap.data()));
    } catch (e) {
      return _err('Error al obtener configuración de formularios', e);
    }
  },

  saveFormularioConfig: async (config) => {
    try {
      await setDoc(doc(db, 'config', 'formularios'), {
        ...config,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return _ok(config);
    } catch (e) {
      return _err('Error al guardar configuración de formularios', e);
    }
  },

  // =========================================================
  // BLOQUE 3 — FLUJOS POR DERECHO
  // =========================================================

  getFlujoConfig: async () => {
    try {
      const snap = await getDoc(doc(db, 'config', 'flujos'));
      if (!snap.exists()) return _ok(null); // flujoService aplica buildConfigDefault()
      return _ok(_toPlain(snap.data()));
    } catch (e) {
      return _err('Error al obtener configuración de flujos', e);
    }
  },

  saveFlujoConfig: async (config) => {
    try {
      await setDoc(doc(db, 'config', 'flujos'), {
        ...config,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return _ok(config);
    } catch (e) {
      return _err('Error al guardar configuración de flujos', e);
    }
  },

  // =========================================================
  // BLOQUE 4 — SOLICITUDES ARCOP
  // =========================================================

  createSolicitud: async (solicitudData) => {
    try {
      const numero   = await _generarNumeroSolicitud();
      const tokenId  = solicitudData.token_validacion || _generateToken();

      const solicitud = {
        ...solicitudData,
        numero_solicitud:   numero,
        token_validacion:   tokenId,
        estado:             solicitudData.estado || 'RECIBIDA',
        fecha_solicitud:    serverTimestamp(),
        updatedAt:          serverTimestamp(),
        identidad_validada: false,
        descargas:          0,
      };

      const ref = await addDoc(collection(db, 'solicitudes'), solicitud);

      // Lookup token → solicitudId
      await setDoc(doc(db, 'tokens', tokenId), {
        solicitudId: ref.id,
        numero,
        tipo:      solicitudData.tipo_derecho,
        createdAt: serverTimestamp(),
        usado:     false,
      });

      // Primer evento de historial
      await addDoc(collection(db, 'solicitudes', ref.id, 'historial'), {
        estado_anterior: null,
        estado_nuevo:    'RECIBIDA',
        comentario:      'Solicitud creada por titular',
        actor:           'SISTEMA',
        timestamp:       serverTimestamp(),
      });

      return _ok({ id: ref.id, numero_solicitud: numero, token_validacion: tokenId });
    } catch (e) {
      return _err('Error al crear solicitud', e);
    }
  },

  getSolicitudes: async (filtros = {}) => {
    try {
      const constraints = [];

      if (filtros.estado && filtros.estado !== 'TODOS') {
        constraints.push(where('estado', '==', filtros.estado));
      }
      if (filtros.tipo_derecho && filtros.tipo_derecho !== 'TODOS') {
        constraints.push(where('tipo_derecho', '==', filtros.tipo_derecho));
      }
      if (filtros.desde) {
        constraints.push(where('fecha_solicitud', '>=', Timestamp.fromDate(new Date(filtros.desde))));
      }
      if (filtros.hasta) {
        constraints.push(where('fecha_solicitud', '<=', Timestamp.fromDate(new Date(filtros.hasta))));
      }

      constraints.push(orderBy('fecha_solicitud', 'desc'));

      if (filtros.limite) constraints.push(limit(filtros.limite));

      const snap = await getDocs(query(collection(db, 'solicitudes'), ...constraints));
      const solicitudes = snap.docs.map(d => ({ id: d.id, ..._toPlain(d.data()) }));
      return _ok(solicitudes);
    } catch (e) {
      if (e.code === 'failed-precondition') {
        console.error('[FirebaseAdapter] ⚠️ Falta índice compuesto:', e.message);
        return _err('Se requiere crear un índice en Firestore. Revisa la consola.', e);
      }
      return _err('Error al obtener solicitudes', e);
    }
  },

  getSolicitudPorNumero: async (numero) => {
    try {
      const snap = await getDocs(query(
        collection(db, 'solicitudes'),
        where('numero_solicitud', '==', numero),
        limit(1)
      ));
      if (snap.empty) return _ok(null);
      const d = snap.docs[0];
      return _ok({ id: d.id, ..._toPlain(d.data()) });
    } catch (e) {
      return _err('Error al buscar solicitud por número', e);
    }
  },

  getSolicitudPorToken: async (token) => {
    try {
      const tokenSnap = await getDoc(doc(db, 'tokens', token));
      if (!tokenSnap.exists()) return _ok(null);
      const { solicitudId } = tokenSnap.data();
      const solSnap = await getDoc(doc(db, 'solicitudes', solicitudId));
      if (!solSnap.exists()) return _ok(null);
      return _ok({ id: solSnap.id, ..._toPlain(solSnap.data()) });
    } catch (e) {
      return _err('Error al buscar solicitud por token', e);
    }
  },

  updateSolicitud: async (id, changes) => {
    try {
      const ref      = doc(db, 'solicitudes', id);
      const prevSnap = await getDoc(ref);
      const prev     = prevSnap.exists() ? prevSnap.data() : {};

      await updateDoc(ref, { ...changes, updatedAt: serverTimestamp() });

      if (changes.estado && changes.estado !== prev.estado) {
        await addDoc(collection(db, 'solicitudes', id, 'historial'), {
          estado_anterior: prev.estado || null,
          estado_nuevo:    changes.estado,
          comentario:      changes.comentario_interno || '',
          actor:           changes._actor || 'DPO',
          timestamp:       serverTimestamp(),
        });
      }

      const updated = await getDoc(ref);
      return _ok({ id, ..._toPlain(updated.data()) });
    } catch (e) {
      return _err('Error al actualizar solicitud', e);
    }
  },

  resolverSolicitud: async (id, urlDatos, formatoEntrega) => {
    try {
      const ref  = doc(db, 'solicitudes', id);
      const prev = (await getDoc(ref)).data();

      await updateDoc(ref, {
        estado:           'DATOS_DISPONIBLES',
        url_datos:        urlDatos,
        formato_entrega:  formatoEntrega || 'JSON',
        fecha_resolucion: serverTimestamp(),
        updatedAt:        serverTimestamp(),
      });

      await addDoc(collection(db, 'solicitudes', id, 'historial'), {
        estado_anterior: prev?.estado || null,
        estado_nuevo:    'DATOS_DISPONIBLES',
        comentario:      `Datos preparados en formato ${formatoEntrega || 'JSON'}`,
        actor:           'DPO',
        timestamp:       serverTimestamp(),
      });

      return _ok({ id, estado: 'DATOS_DISPONIBLES', url_datos: urlDatos });
    } catch (e) {
      return _err('Error al resolver solicitud', e);
    }
  },

  confirmarDescarga: async (id) => {
    try {
      const ref  = doc(db, 'solicitudes', id);
      const prev = (await getDoc(ref)).data();

      await updateDoc(ref, {
        estado:          'DESCARGA_CONFIRMADA',
        fecha_descarga:  serverTimestamp(),
        descargas:       (prev?.descargas || 0) + 1,
        updatedAt:       serverTimestamp(),
      });

      await addDoc(collection(db, 'solicitudes', id, 'historial'), {
        estado_anterior: prev?.estado || null,
        estado_nuevo:    'DESCARGA_CONFIRMADA',
        comentario:      'Titular confirmó descarga de datos',
        actor:           'TITULAR',
        timestamp:       serverTimestamp(),
      });

      return _ok({ id, estado: 'DESCARGA_CONFIRMADA' });
    } catch (e) {
      return _err('Error al confirmar descarga', e);
    }
  },

  validarIdentidad: async (token) => {
    try {
      const tokenRef  = doc(db, 'tokens', token);
      const tokenSnap = await getDoc(tokenRef);
      if (!tokenSnap.exists()) return _ok({ validado: false, solicitudId: null });

      const { solicitudId } = tokenSnap.data();
      const batch = writeBatch(db);
      batch.update(tokenRef, { usado: true, usadoAt: serverTimestamp() });
      batch.update(doc(db, 'solicitudes', solicitudId), {
        identidad_validada: true,
        fecha_validacion:   serverTimestamp(),
        estado:             'EN_PROCESO',
        updatedAt:          serverTimestamp(),
      });
      await batch.commit();

      await addDoc(collection(db, 'solicitudes', solicitudId, 'historial'), {
        estado_anterior: 'RECIBIDA',
        estado_nuevo:    'EN_PROCESO',
        comentario:      'Identidad validada por titular vía link de correo',
        actor:           'TITULAR',
        timestamp:       serverTimestamp(),
      });

      return _ok({ validado: true, solicitudId });
    } catch (e) {
      return _err('Error al validar identidad', e);
    }
  },

  // =========================================================
  // BLOQUE 5 — ESTADÍSTICAS Y DASHBOARD
  // =========================================================

  getEstadisticas: async () => {
    try {
      const colRef = collection(db, 'solicitudes');

      const ESTADOS  = ['RECIBIDA', 'EN_PROCESO', 'REQUIERE_INFO', 'DATOS_DISPONIBLES', 'DESCARGA_CONFIRMADA', 'CERRADA', 'RECHAZADA'];
      const DERECHOS = ['ACCESO', 'RECTIFICACION', 'CANCELACION', 'OPOSICION', 'PORTABILIDAD'];

      const [totalSnap, ...estadoSnaps] = await Promise.all([
        getCountFromServer(colRef),
        ...ESTADOS.map(e => getCountFromServer(query(colRef, where('estado', '==', e)))),
      ]);

      const derechoSnaps = await Promise.all(
        DERECHOS.map(d => getCountFromServer(query(colRef, where('tipo_derecho', '==', d))))
      );

      const porEstado  = Object.fromEntries(ESTADOS.map((e, i)  => [e, estadoSnaps[i].data().count]));
      const porDerecho = Object.fromEntries(DERECHOS.map((d, i) => [d, derechoSnaps[i].data().count]));

      const hace30 = new Date();
      hace30.setDate(hace30.getDate() - 30);
      const recientesSnap = await getDocs(
        query(colRef, where('fecha_solicitud', '>=', Timestamp.fromDate(hace30)), orderBy('fecha_solicitud', 'desc'))
      );

      const tendencia = {};
      recientesSnap.docs.forEach(d => {
        const ts = d.data().fecha_solicitud;
        if (ts) {
          const fecha = ts.toDate().toISOString().split('T')[0];
          tendencia[fecha] = (tendencia[fecha] || 0) + 1;
        }
      });

      return _ok({ total: totalSnap.data().count, porEstado, porDerecho, tendencia });
    } catch (e) {
      return _err('Error al obtener estadísticas', e);
    }
  },

  // =========================================================
  // BLOQUE 6 — AUDITORÍA (Art. 14 y 48, Ley 21.719)
  // =========================================================

  registrarAuditoria: async (evento) => {
    try {
      const ref = await addDoc(collection(db, 'auditoria'), {
        ...evento,
        timestamp: serverTimestamp(),
      });
      return _ok({ id: ref.id });
    } catch (e) {
      return _err('Error al registrar evento de auditoría', e);
    }
  },

  getAuditoria: async (filtros = {}) => {
    try {
      const constraints = [orderBy('timestamp', 'desc')];
      if (filtros.desde)   constraints.unshift(where('timestamp', '>=', Timestamp.fromDate(new Date(filtros.desde))));
      if (filtros.hasta)   constraints.unshift(where('timestamp', '<=', Timestamp.fromDate(new Date(filtros.hasta))));
      if (filtros.accion)  constraints.unshift(where('accion',   '==', filtros.accion));
      if (filtros.userId)  constraints.unshift(where('userId',   '==', filtros.userId));
      if (filtros.limite)  constraints.push(limit(filtros.limite));

      const snap   = await getDocs(query(collection(db, 'auditoria'), ...constraints));
      const eventos = snap.docs.map(d => ({ id: d.id, ..._toPlain(d.data()) }));
      return _ok(eventos);
    } catch (e) {
      return _err('Error al obtener auditoría', e);
    }
  },

  // =========================================================
  // BLOQUE 7 — HISTORIAL DE SOLICITUD
  // =========================================================

  getHistorialSolicitud: async (solicitudId) => {
    try {
      const snap = await getDocs(
        query(collection(db, 'solicitudes', solicitudId, 'historial'), orderBy('timestamp', 'asc'))
      );
      return _ok(snap.docs.map(d => ({ id: d.id, ..._toPlain(d.data()) })));
    } catch (e) {
      return _err('Error al obtener historial de solicitud', e);
    }
  },
};

export default firebaseAdapter;