// ============================================================
// backend/src/routes/brechas.js — MMPA-96
// Registro y gestión de brechas de datos (Art. 14 bis Ley 21.719)
// El responsable debe notificar a la APDP dentro de 72 horas.
// ============================================================
'use strict';

const express        = require('express');
const { db }         = require('../services/firebase');
const { FieldValue } = require('firebase-admin/firestore');
const { requireAuth, requireDPO } = require('../middleware/auth');
const emailService   = require('../services/emailService');

const router = express.Router();

const ok  = (res, data)           => res.json({ status: 'success', data });
const err = (res, msg, code = 400) => res.status(code).json({ status: 'error', error: msg });

// ─────────────────────────────────────────────────────────
// POST /api/brechas — registrar nueva brecha
// ─────────────────────────────────────────────────────────
router.post('/', requireAuth, requireDPO, async (req, res, next) => {
  try {
    const {
      descripcion,
      fecha_deteccion,
      datos_afectados,
      titulares_afectados,
      origen,
      medidas_adoptadas,
      notificar_titulares,
    } = req.body;

    if (!descripcion || !fecha_deteccion || !datos_afectados || !origen) {
      return err(res, 'descripcion, fecha_deteccion, datos_afectados y origen son obligatorios');
    }

    const ORIGENES_VALIDOS = ['acceso_no_autorizado', 'perdida', 'modificacion', 'otro'];
    if (!ORIGENES_VALIDOS.includes(origen)) {
      return err(res, 'origen invalido. Use: ' + ORIGENES_VALIDOS.join(', '));
    }

    const ahora      = new Date();
    const deteccion  = new Date(fecha_deteccion);
    const horasDesde = Math.round((ahora - deteccion) / 3_600_000);
    const enPlazo    = horasDesde <= 72;

    const brecha = {
      descripcion,
      fecha_deteccion:       deteccion.toISOString(),
      datos_afectados,
      titulares_afectados:   titulares_afectados || 0,
      origen,
      medidas_adoptadas:     medidas_adoptadas || '',
      notificar_titulares:   notificar_titulares || false,
      horas_desde_deteccion: horasDesde,
      en_plazo_72h:          enPlazo,
      estado:                'REGISTRADA',
      registrado_por:        req.user.email,
      createdAt:             FieldValue.serverTimestamp(),
    };

    const ref = await db.collection('brechas').add(brecha);

    try {
      await emailService.notificarBrechaDPO({
        id:         ref.id,
        descripcion,
        horasDesde,
        enPlazo,
        panelUrl:   process.env.PANEL_URL || '',
      });
    } catch (e) {
      console.warn('[brechas] Email DPO fallo:', e.message);
    }

    return ok(res, {
      id:             ref.id,
      en_plazo:       enPlazo,
      horas_restantes: Math.max(0, 72 - horasDesde),
      mensaje: enPlazo
        ? `Brecha registrada. Quedan ${72 - horasDesde}h para notificar a la APDP.`
        : `Han pasado ${horasDesde}h. El plazo de 72h para notificar a la APDP ha vencido.`,
    });
  } catch (e) { next(e); }
});

// ─────────────────────────────────────────────────────────
// GET /api/brechas — listar brechas (solo DPO)
// ─────────────────────────────────────────────────────────
router.get('/', requireAuth, requireDPO, async (req, res, next) => {
  try {
    const snap = await db.collection('brechas')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const brechas = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString?.() || null,
    }));

    return ok(res, brechas);
  } catch (e) { next(e); }
});

// ─────────────────────────────────────────────────────────
// PUT /api/brechas/:id/estado — actualizar estado
// ─────────────────────────────────────────────────────────
router.put('/:id/estado', requireAuth, requireDPO, async (req, res, next) => {
  try {
    const { estado, nota } = req.body;
    const ESTADOS_VALIDOS  = ['REGISTRADA', 'NOTIFICADA_APDP', 'CERRADA'];

    if (!ESTADOS_VALIDOS.includes(estado)) {
      return err(res, 'Estado invalido. Use: ' + ESTADOS_VALIDOS.join(', '));
    }

    const ref  = db.collection('brechas').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return err(res, 'Brecha no encontrada', 404);

    await ref.update({
      estado,
      nota_cierre:     nota || '',
      actualizado_en:  FieldValue.serverTimestamp(),
      actualizado_por: req.user.email,
    });

    return ok(res, { estado });
  } catch (e) { next(e); }
});

module.exports = router;
