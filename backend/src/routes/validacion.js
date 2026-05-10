// ============================================================
// backend/src/routes/validacion.js
// MMPA-116/117/118 — Consulta contacto (API + fallback + sync)
// MMPA-121         — Envío de link por canal elegido
// MMPA-122         — Derivación a canal asistido
//
// Rutas:
//   POST /api/validacion/contacto    → obtiene datos anonimizados
//   POST /api/validacion/enviar-link → envía link por canal elegido
//   POST /api/validacion/derivar     → registra derivación a canal asistido
// ============================================================
'use strict';

const express       = require('express');
const { db }        = require('../services/firebase');
const { FieldValue } = require('firebase-admin/firestore');
const emailService  = require('../services/emailService');
const { enviarLinkWhatsApp }        = require('../services/whatsappService');
const { obtenerContactoAnonimizado } = require('../services/validacionService');

const router = express.Router();

const ok  = (res, data)          => res.json({ status: 'success', data });
const err = (res, msg, code=400) => res.status(code).json({ status: 'error', error: msg });

// ── Helper: obtener config/sistema ───────────────────────
async function _getConfig() {
  const snap = await db.collection('config').doc('sistema').get();
  return snap.exists ? snap.data() : {};
}

// ── Helper: obtener solicitud ─────────────────────────────
async function _getSolicitud(solicitudId) {
  const snap = await db.collection('solicitudes').doc(solicitudId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

// ═════════════════════════════════════════════════════════
// GET /api/validacion/contacto-por-rut?rut=12.345.678-5
// Usado por PasoValidacionContacto al rellenar el formulario
// Retorna datos anonimizados sin exponer info real
// Público (sin auth) — el titular aún no tiene sesión
// ═════════════════════════════════════════════════════════
router.get('/contacto-por-rut', async (req, res, next) => {
  try {
    const { rut } = req.query;
    if (!rut) return err(res, 'Parámetro "rut" es requerido');

    const config   = await _getConfig();
    const contacto = await obtenerContactoAnonimizado(rut, config);

    if (!contacto.encontrado) {
      return err(res, 'No se encontraron datos de contacto para el RUT indicado', 404);
    }

    return ok(res, {
      email_anon:    contacto.email_anon,
      telefono_anon: contacto.telefono_anon,
      fuente:        contacto.fuente,
    });

  } catch (e) {
    console.error('[validacion] /contacto-por-rut error:', e.message);
    next(e);
  }
});

// ═════════════════════════════════════════════════════════
// POST /api/validacion/contacto
// Recibe: { solicitudId }
// Retorna: datos anonimizados + canales disponibles
// Público — el titular llega aquí desde el link de email
// ═════════════════════════════════════════════════════════
router.post('/contacto', async (req, res, next) => {
  try {
    const { solicitudId } = req.body;
    if (!solicitudId) return err(res, 'solicitudId es requerido');

    const solicitud = await _getSolicitud(solicitudId);
    if (!solicitud) return err(res, 'Solicitud no encontrada', 404);

    // Solo solicitudes en estado PENDIENTE pueden entrar aquí
    if (solicitud.estado !== 'PENDIENTE') {
      return err(res, `La solicitud está en estado ${solicitud.estado} — no puede validar identidad`, 409);
    }

    const rut    = solicitud.rut;
    if (!rut) return err(res, 'La solicitud no tiene RUT registrado');

    const config  = await _getConfig();
    const contacto = await obtenerContactoAnonimizado(rut, config);

    return ok(res, {
      solicitud_id:        solicitudId,
      numero_solicitud:    solicitud.numero_solicitud,
      encontrado:          contacto.encontrado,
      fuente:              contacto.fuente,
      email_anon:          contacto.email_anon,
      telefono_anon:       contacto.telefono_anon,
      canales_disponibles: contacto.canales_disponibles,
      canal_validacion:    solicitud.canal_validacion || null,
    });

  } catch (e) {
    console.error('[validacion] /contacto error:', e.message);
    next(e);
  }
});

// ═════════════════════════════════════════════════════════
// POST /api/validacion/enviar-link
// Recibe: { solicitudId, canal: 'email' | 'whatsapp' }
// Envía el link de validación por el canal elegido
// Público — el titular elige su canal
// ═════════════════════════════════════════════════════════
router.post('/enviar-link', async (req, res, next) => {
  try {
    const { solicitudId, canal } = req.body;

    if (!solicitudId) return err(res, 'solicitudId es requerido');
    if (!['email', 'whatsapp'].includes(canal)) return err(res, 'canal debe ser "email" o "whatsapp"');

    const solicitud = await _getSolicitud(solicitudId);
    if (!solicitud) return err(res, 'Solicitud no encontrada', 404);
    if (solicitud.estado !== 'PENDIENTE') return err(res, 'La solicitud no está en estado PENDIENTE', 409);

    const rut    = solicitud.rut;
    const config = await _getConfig();

    // Obtener token de validación existente o generar uno nuevo
    const tokenSnap = await db.collection('tokens')
      .where('solicitudId', '==', solicitudId)
      .where('usado', '==', false)
      .limit(1)
      .get();

    let token;
    if (!tokenSnap.empty) {
      token = tokenSnap.docs[0].id;
    } else {
      // Generar nuevo token
      const crypto = require('crypto');
      token = crypto.randomBytes(32).toString('hex');
      await db.collection('tokens').doc(token).set({
        solicitudId,
        rut,
        usado:      false,
        creadoAt:   FieldValue.serverTimestamp(),
        expiraAt:   new Date(Date.now() + 30 * 60 * 1000), // 30 min
      });
    }

    const portalUrl      = config.portal_url || process.env.FRONTEND_URL || 'http://localhost:3000';
    const linkValidacion = `${portalUrl}/validar/${token}`;

    let enviado = false;

    // ── Envío por EMAIL ───────────────────────────────────
    if (canal === 'email') {
      await emailService.enviarValidacionIdentidad(solicitud, token, config);
      enviado = true;
      console.log(`[validacion] Link enviado por email a solicitud ${solicitudId}`);
    }

    // ── Envío por WHATSAPP ────────────────────────────────
    if (canal === 'whatsapp') {
      // Recuperar teléfono desde rut_contactos (nunca se expone al frontend)
      const contactoSnap = await db.collection('rut_contactos').doc(rut).get();
      const telefono = contactoSnap.exists ? contactoSnap.data().telefono : null;

      if (!telefono) return err(res, 'No se encontró teléfono para enviar por WhatsApp');

      const resultado = await enviarLinkWhatsApp(telefono, linkValidacion, config);
      enviado = resultado.ok;
      console.log(`[validacion] Link enviado por WhatsApp (${resultado.proveedor}) a solicitud ${solicitudId}`);
    }

    if (!enviado) return err(res, 'No se pudo enviar el link de validación', 500);

    // Registrar canal elegido en la solicitud
    await db.collection('solicitudes').doc(solicitudId).update({
      canal_validacion: canal,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return ok(res, {
      enviado:     true,
      canal,
      mensaje:     canal === 'email'
        ? 'Link de validación enviado al correo registrado'
        : 'Link de validación enviado por WhatsApp',
    });

  } catch (e) {
    console.error('[validacion] /enviar-link error:', e.message);
    next(e);
  }
});

// ═════════════════════════════════════════════════════════
// POST /api/validacion/derivar
// Recibe: { solicitudId }
// Registra que la solicitud requiere validación asistida
// Notifica al DPO — MMPA-122
// ═════════════════════════════════════════════════════════
router.post('/derivar', async (req, res, next) => {
  try {
    const { solicitudId } = req.body;
    if (!solicitudId) return err(res, 'solicitudId es requerido');

    const solicitud = await _getSolicitud(solicitudId);
    if (!solicitud) return err(res, 'Solicitud no encontrada', 404);

    const config = await _getConfig();

    // Marcar solicitud como requiere validación asistida
    await db.collection('solicitudes').doc(solicitudId).update({
      requiere_validacion_asistida: true,
      fecha_derivacion_asistida:    FieldValue.serverTimestamp(),
      updatedAt:                    FieldValue.serverTimestamp(),
    });

    // Historial
    await db.collection('solicitudes').doc(solicitudId)
      .collection('historial').add({
        estado_anterior: solicitud.estado,
        estado_nuevo:    solicitud.estado, // no cambia estado — solo marca el flag
        comentario:      'Titular no reconoció sus datos — requiere validación asistida',
        actor:           'TITULAR',
        timestamp:       FieldValue.serverTimestamp(),
      });

    // Notificar al DPO por email (fire-and-forget)
    _notificarDPODerivacion(solicitud, config);

    console.log(`[validacion] Solicitud ${solicitudId} derivada a canal asistido`);

    return ok(res, {
      derivado:         true,
      numero_solicitud: solicitud.numero_solicitud,
      dpo_email:        config.dpo_email    || null,
      dpo_telefono:     config.dpo_telefono || null,
      dpo_horario:      config.dpo_horario  || null,
    });

  } catch (e) {
    console.error('[validacion] /derivar error:', e.message);
    next(e);
  }
});

// ── Notificación DPO por derivación ──────────────────────
function _notificarDPODerivacion(solicitud, config) {
  const dpoEmail = config.dpo_email || process.env.DPO_EMAIL;
  if (!dpoEmail) return;

  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM   = `${process.env.RESEND_FROM_NAME || 'Portal ARCOP'} <${process.env.RESEND_FROM || 'admin@aligndata.cl'}>`;

  const html = `
    <h2>⚠️ Solicitud requiere validación asistida</h2>
    <p>El titular de la solicitud <strong>${solicitud.numero_solicitud}</strong> 
    no reconoció sus datos de contacto y requiere atención manual.</p>
    <table>
      <tr><td><strong>N° Solicitud:</strong></td><td>${solicitud.numero_solicitud}</td></tr>
      <tr><td><strong>Derecho:</strong></td><td>${solicitud.tipo_derecho}</td></tr>
      <tr><td><strong>RUT:</strong></td><td>${solicitud.rut}</td></tr>
      <tr><td><strong>Nombre:</strong></td><td>${solicitud.nombre_completo || '—'}</td></tr>
    </table>
    <p>Por favor contacte al titular para validar su identidad de forma asistida 
    y luego actualice el estado de la solicitud en el panel DPO.</p>
  `;

  resend.emails.send({
    from:    FROM,
    to:      dpoEmail,
    subject: `⚠️ Validación asistida requerida — ${solicitud.numero_solicitud}`,
    html,
  }).catch(e => console.error('[validacion] Fallo notificación DPO derivación:', e.message));
}

module.exports = router;