// ============================================================
// src/routes/solicitudes.js — v1.1
// CAMBIOS respecto a v1.0:
//   - _getConfig() sin caché: siempre lee Firestore (config puede
//     cambiar desde el panel DPO en cualquier momento)
//   - enviarCambioEstado y enviarDatosListos envían CC al DPO
//     usando config.email_cc de Firestore
// ============================================================
'use strict';

const express       = require('express');
const crypto        = require('crypto');
const { db }        = require('../services/firebase');
const emailService  = require('../services/emailService');
const { requireAuth, requireDPO } = require('../middleware/auth');
const {
  FieldValue,
  Timestamp,
} = require('firebase-admin/firestore');

const router = express.Router();

// ── Helper: obtener config del sistema (sin caché) ────────
// Se lee Firestore en cada llamada para que los cambios del
// panel DPO se reflejen de inmediato en los emails.
async function _getConfig() {
  const snap = await db.collection('config').doc('sistema').get();
  return snap.exists ? snap.data() : {};
}

// ── Helper: enviar CC al DPO (fire-and-forget) ────────────
function _ccDpo(solicitud, asunto, html, config) {
  const dpoEmail = (config && config.dpo_email) || process.env.DPO_EMAIL || '';
  const ccEmail  = (config && config.email_cc)  || '';
  const destinos = [...new Set([dpoEmail, ccEmail].filter(Boolean))];
  console.log('[_ccDpo] destinos:', destinos);
  if (!destinos.length) return;

  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM   = `${process.env.RESEND_FROM_NAME || 'Portal ARCOP'} <${process.env.RESEND_FROM || 'onboarding@resend.dev'}>`;

  resend.emails.send({
    from:    FROM,
    to:      destinos,
    subject: asunto,
    html,
  }).catch(e => console.error('[solicitudes] Fallo CC DPO:', e.message));
}

// ── Helper: generar número correlativo ARC-YYYY-NNNNN ─────
async function _generarNumero() {
  const year = new Date().getFullYear();
  const ref  = db.collection('config').doc(`counter_${year}`);
  const next = await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const n    = (snap.exists ? snap.data().ultimo : 0) + 1;
    tx.set(ref, { ultimo: n, year }, { merge: true });
    return n;
  });
  return `ARC-${year}-${String(next).padStart(5, '0')}`;
}

// ── Helper: calcular fecha límite (15 días hábiles CL) ────
const FERIADOS_CL_2026 = new Set([
  '2026-01-01','2026-04-03','2026-04-04','2026-05-01',
  '2026-05-21','2026-06-29','2026-07-16','2026-08-15',
  '2026-09-18','2026-09-19','2026-10-12','2026-10-31',
  '2026-11-01','2026-12-08','2026-12-25',
]);

function _calcularFechaLimite(diasHabiles = 15) {
  const fecha = new Date();
  let   count = 0;
  while (count < diasHabiles) {
    fecha.setDate(fecha.getDate() + 1);
    const dow = fecha.getDay();
    const key = fecha.toISOString().split('T')[0];
    if (dow !== 0 && dow !== 6 && !FERIADOS_CL_2026.has(key)) count++;
  }
  return fecha.toISOString();
}

// ─────────────────────────────────────────────────────────
// POST /api/solicitudes
// ─────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const data = req.body;

    const requeridos = ['nombre_completo', 'rut', 'email', 'tipo_derecho'];
    const faltantes  = requeridos.filter(k => !data[k]);
    if (faltantes.length) {
      return res.status(400).json({ error: `Campos requeridos: ${faltantes.join(', ')}` });
    }

    const numero = await _generarNumero();
    const token  = data.token_validacion || crypto.randomBytes(32).toString('hex');

    const solicitud = {
      nombre_completo:    data.nombre_completo,
      rut:                data.rut,
      email:              data.email.toLowerCase(),
      telefono:           data.telefono || null,
      tipo_derecho:       data.tipo_derecho,
      numero_solicitud:   numero,
      token_validacion:   token,
      estado:             'PENDIENTE',
      fecha_solicitud:    FieldValue.serverTimestamp(),
      fecha_limite:       _calcularFechaLimite(15),
      updatedAt:          FieldValue.serverTimestamp(),
      identidad_validada: false,
      descargas:          0,
      ip_origen:          req.ip,
      alcance_acceso:     data.alcance_acceso    || null,
      formato_preferido:  data.formato_preferido || 'PDF',
      datos_rectificar:   data.datos_rectificar  || null,
      descripcion:        data.descripcion       || null,
      frontend_url:       data.frontend_url      || process.env.FRONTEND_URL || '',
    };

    const ref = await db.collection('solicitudes').add(solicitud);

    await db.collection('tokens').doc(token).set({
      solicitudId:  ref.id,
      numero,
      tipo_derecho: solicitud.tipo_derecho,
      createdAt:    FieldValue.serverTimestamp(),
      expiresAt:    new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      usado:        false,
    });

    await db.collection('solicitudes').doc(ref.id)
      .collection('historial').add({
        estado_anterior: null,
        estado_nuevo:    'PENDIENTE',
        comentario:      'Solicitud creada por titular',
        actor:           'SISTEMA',
        timestamp:       FieldValue.serverTimestamp(),
      });

    // Email recepción al titular + notif DPO (ya incluida en enviarRecepcion)
    const config = await _getConfig();
    emailService.enviarRecepcion({ ...solicitud, id: ref.id }, config)
      .catch(e => console.error('[solicitudes] Fallo email recepcion:', e.message));

    res.status(201).json({
      status:           'success',
      numero_solicitud: numero,
      id:               ref.id,
    });
  } catch (e) {
    next(e);
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/solicitudes/validar/:token
// ─────────────────────────────────────────────────────────
router.post('/validar/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const tokenSnap = await db.collection('tokens').doc(token).get();
    if (!tokenSnap.exists) return res.status(404).json({ error: 'Token no encontrado' });

    const tokenData = tokenSnap.data();
    if (tokenData.usado) return res.status(409).json({ error: 'Token ya fue utilizado' });
    if (tokenData.expiresAt && new Date(tokenData.expiresAt) < new Date()) {
      return res.status(410).json({ error: 'Token expirado. Solicita uno nuevo.' });
    }

    const { solicitudId } = tokenData;
    const solRef          = db.collection('solicitudes').doc(solicitudId);
    const solSnap         = await solRef.get();
    if (!solSnap.exists) return res.status(404).json({ error: 'Solicitud no encontrada' });

    const solicitud = { id: solicitudId, ...solSnap.data() };

    const batch = db.batch();
    batch.update(db.collection('tokens').doc(token), {
      usado:   true,
      usadoAt: FieldValue.serverTimestamp(),
    });
    batch.update(solRef, {
      identidad_validada: true,
      fecha_validacion:   FieldValue.serverTimestamp(),
      estado:             'VALIDADA',
      updatedAt:          FieldValue.serverTimestamp(),
    });
    await batch.commit();

    await solRef.collection('historial').add({
      estado_anterior: 'PENDIENTE',
      estado_nuevo:    'VALIDADA',
      comentario:      'Identidad validada por titular via link de correo',
      actor:           'TITULAR',
      timestamp:       FieldValue.serverTimestamp(),
    });

    const config = await _getConfig();
    emailService.enviarCambioEstado(solicitud, 'VALIDADA', config)
      .catch(e => console.error('[solicitudes] Fallo email VALIDADA:', e.message));

    res.json({
      status:   'success',
      mensaje:  'Identidad validada correctamente',
      solicitud: { id: solicitudId, numero: solicitud.numero_solicitud, estado: 'VALIDADA' },
    });
  } catch (e) {
    next(e);
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/solicitudes/numero/:numero  (público)
// ─────────────────────────────────────────────────────────
router.get('/numero/:numero', async (req, res, next) => {
  try {
    const snap = await db.collection('solicitudes')
      .where('numero_solicitud', '==', req.params.numero)
      .limit(1)
      .get();

    if (snap.empty) return res.status(404).json({ error: 'Solicitud no encontrada' });

    const doc  = snap.docs[0];
    const data = doc.data();

    res.json({
      status: 'success',
      data: {
        id:                 doc.id,
        numero_solicitud:   data.numero_solicitud,
        tipo_derecho:       data.tipo_derecho,
        estado:             data.estado,
        fecha_solicitud:    data.fecha_solicitud?.toDate?.()?.toISOString() || data.fecha_solicitud,
        fecha_limite:       data.fecha_limite,
        identidad_validada: data.identidad_validada,
        url_datos:          data.url_datos       || null,
        formato_entrega:    data.formato_entrega || null,
      },
    });
  } catch (e) {
    next(e);
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/solicitudes  (DPO)
// ─────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res, next) => {
  try {
    let q = db.collection('solicitudes');
    const { estado, tipo_derecho, desde, hasta, limite } = req.query;

    if (estado       && estado       !== 'TODOS') q = q.where('estado',       '==', estado);
    if (tipo_derecho && tipo_derecho !== 'TODOS') q = q.where('tipo_derecho', '==', tipo_derecho);
    if (desde) q = q.where('fecha_solicitud', '>=', Timestamp.fromDate(new Date(desde)));
    if (hasta) q = q.where('fecha_solicitud', '<=', Timestamp.fromDate(new Date(hasta)));

    q = q.orderBy('fecha_solicitud', 'desc');
    if (limite) q = q.limit(parseInt(limite, 10));

    const snap = await q.get();
    const data = snap.docs.map(d => {
      const item = d.data();
      return {
        id: d.id,
        ...item,
        fecha_solicitud: item.fecha_solicitud?.toDate?.()?.toISOString() || item.fecha_solicitud,
        updatedAt:       item.updatedAt?.toDate?.()?.toISOString()       || item.updatedAt,
      };
    });

    res.json({ status: 'success', data });
  } catch (e) {
    next(e);
  }
});

// ─────────────────────────────────────────────────────────
// PUT /api/solicitudes/:id/estado  (DPO)
// Cambia estado + email al titular + CC al DPO
// ─────────────────────────────────────────────────────────
router.put('/:id/estado', requireAuth, async (req, res, next) => {
  try {
    const { id }                  = req.params;
    const { estado, comentario }  = req.body;

    if (!estado) return res.status(400).json({ error: 'Campo estado requerido' });

    const ref  = db.collection('solicitudes').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Solicitud no encontrada' });

    const prev = snap.data();

    await ref.update({
      estado,
      comentario_interno: comentario || '',
      updatedAt:          FieldValue.serverTimestamp(),
    });

    await ref.collection('historial').add({
      estado_anterior: prev.estado,
      estado_nuevo:    estado,
      comentario:      comentario || '',
      actor:           req.user.email || req.user.uid,
      timestamp:       FieldValue.serverTimestamp(),
    });

    if (estado !== 'RESUELTA') {
      const config = await _getConfig();

      // Email al titular
      emailService.enviarCambioEstado({ ...prev, id }, estado, config)
        .catch(e => console.error('[solicitudes] Fallo email estado titular:', e.message));

      // CC al DPO — notificación interna del cambio de estado
      _ccDpo(
        prev,
        `[DPO] ${prev.numero_solicitud} cambio a ${estado}`,
        `<p style="font-family:Arial,sans-serif;font-size:14px;color:#111827;">
          La solicitud <strong>${prev.numero_solicitud}</strong> de <strong>${prev.nombre_completo}</strong>
          cambio de estado <strong>${prev.estado}</strong> &rarr; <strong>${estado}</strong>.
          ${comentario ? `<br>Comentario: ${comentario}` : ''}
        </p>`,
        config
      );
    }

    res.json({ status: 'success', id, estado });
  } catch (e) {
    next(e);
  }
});

// ─────────────────────────────────────────────────────────
// PUT /api/solicitudes/:id/resolver  (DPO)
// Marca RESUELTA + email especial al titular + CC al DPO
// ─────────────────────────────────────────────────────────
router.put('/:id/resolver', requireAuth, async (req, res, next) => {
  try {
    const { id }                         = req.params;
    const { url_datos, formato_entrega } = req.body;

    if (!url_datos) return res.status(400).json({ error: 'Campo url_datos requerido' });

    const ref  = db.collection('solicitudes').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Solicitud no encontrada' });

    const prev = snap.data();

    await ref.update({
      estado:           'RESUELTA',
      url_datos,
      formato_entrega:  formato_entrega || 'PDF',
      fecha_resolucion: FieldValue.serverTimestamp(),
      updatedAt:        FieldValue.serverTimestamp(),
    });

    await ref.collection('historial').add({
      estado_anterior: prev.estado,
      estado_nuevo:    'RESUELTA',
      comentario:      `Datos preparados en formato ${formato_entrega || 'PDF'}`,
      actor:           req.user.email || req.user.uid,
      timestamp:       FieldValue.serverTimestamp(),
    });

    const config = await _getConfig();

    // Email al titular con link de descarga
    emailService.enviarDatosListos({ ...prev, id }, url_datos, formato_entrega || 'PDF', config)
      .catch(e => console.error('[solicitudes] Fallo email datos listos:', e.message));

    // CC al DPO
    _ccDpo(
      prev,
      `[DPO] ${prev.numero_solicitud} RESUELTA — datos entregados`,
      `<p style="font-family:Arial,sans-serif;font-size:14px;color:#111827;">
        La solicitud <strong>${prev.numero_solicitud}</strong> de <strong>${prev.nombre_completo}</strong>
        fue marcada como RESUELTA.<br>
        Formato: <strong>${formato_entrega || 'PDF'}</strong><br>
        URL datos: <a href="${url_datos}" style="color:#2563EB;">${url_datos}</a>
      </p>`,
      config
    );

    res.json({ status: 'success', id, estado: 'RESUELTA' });
  } catch (e) {
    next(e);
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/solicitudes/:id/descarga  (público — titular)
// ─────────────────────────────────────────────────────────
router.post('/:id/descarga', async (req, res, next) => {
  try {
    const { id } = req.params;
    const ref    = db.collection('solicitudes').doc(id);
    const snap   = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Solicitud no encontrada' });

    const prev = snap.data();
    if (!['RESUELTA'].includes(prev.estado)) {
      return res.status(409).json({ error: `Estado actual '${prev.estado}' no permite confirmar descarga` });
    }

    await ref.update({
      estado:                 'DESCARGA_CONFIRMADA',
      descarga_confirmada_en: new Date().toISOString(),
      descargas:              (prev.descargas || 0) + 1,
      updatedAt:              FieldValue.serverTimestamp(),
    });

    await db.collection('solicitudes').doc(id).collection('historial').add({
      estado_anterior: 'RESUELTA',
      estado_nuevo:    'DESCARGA_CONFIRMADA',
      comentario:      'Titular confirmo descarga de datos',
      actor:           'TITULAR',
      timestamp:       FieldValue.serverTimestamp(),
    });

    res.json({ status: 'success', id, estado: 'DESCARGA_CONFIRMADA' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;