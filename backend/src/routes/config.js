// ============================================================
// backend/src/routes/config.js — v1.1
// CAMBIO respecto a v1.0:
//   - Agrega POST /api/config/restore para restaurar defaults
// ============================================================
'use strict';

const express = require('express');
const { db }  = require('../services/firebase');
const { requireAuth, requireDPO } = require('../middleware/auth');
const { FieldValue } = require('firebase-admin/firestore');

const router = express.Router();

// ── Config por defecto ────────────────────────────────────
const CONFIG_DEFAULT = {
  empresa_nombre:          'Mi Empresa',
  empresa_rut:             '12.345.678-9',
  empresa_razon_social:    'Mi Empresa SpA',
  empresa_direccion:       'Dirección de la empresa',
  empresa_telefono:        '+56 2 2345 6789',
  empresa_email:           'contacto@empresa.cl',
  empresa_web:             'https://empresa.cl',
  dpo_nombre:              'Delegado de Protección de Datos',
  dpo_cargo:               'Delegado de Protección de Datos',
  dpo_email:               'dpo@empresa.cl',
  dpo_telefono:            '+56 9 8765 4321',
  dpo_horario:             'Lunes a Viernes, 9:00 - 18:00',
  portal_nombre:           'Portal ARCOP',
  portal_url:              '',
  portal_color:            '#2563eb',
  portal_color_secundario: '#1e40af',
  logo_url:                '',
  dias_respuesta:          '15',
  dias_alerta:             '3',
  dias_validacion:         '5',
  notif_activas:           'SI',
  email_cc:                '',
  timezone:                'America/Santiago',
  version:                 '1.0.0',
};

// ─────────────────────────────────────────────────────────
// GET /api/config — público
// Solo expone campos básicos que el formulario ciudadano necesita.
// ─────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const snap = await db.collection('config').doc('sistema').get();
    const data = snap.exists ? snap.data() : CONFIG_DEFAULT;
    const { empresa_nombre, empresa_rut, portal_nombre, portal_color, logo_url, dias_respuesta, dpo_email, dpo_telefono } = data;
    res.json({ status: 'success', data: { empresa_nombre, empresa_rut, portal_nombre, portal_color, logo_url, dias_respuesta, dpo_email, dpo_telefono } });  } catch (e) { next(e); }
});

// ─────────────────────────────────────────────────────────
// GET /api/config/full — solo DPO
// Devuelve TODOS los campos para el panel de Configuración.
// ─────────────────────────────────────────────────────────
router.get('/full', requireAuth, requireDPO, async (req, res, next) => {
  try {
    const snap = await db.collection('config').doc('sistema').get();
    const data = snap.exists ? { ...CONFIG_DEFAULT, ...snap.data() } : CONFIG_DEFAULT;
    res.json({ status: 'success', data });
  } catch (e) { next(e); }
});

// ─────────────────────────────────────────────────────────
// POST /api/config — solo DPO
// Guarda configuración (merge).
// ─────────────────────────────────────────────────────────
router.post('/', requireAuth, requireDPO, async (req, res, next) => {
  try {
    await db.collection('config').doc('sistema').set(
      { ...req.body, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    res.json({ status: 'success' });
  } catch (e) { next(e); }
});

// ─────────────────────────────────────────────────────────
// POST /api/config/restore — solo DPO  ← NUEVO v1.1
// Restaura configuración a valores por defecto.
// ─────────────────────────────────────────────────────────
router.post('/restore', requireAuth, requireDPO, async (req, res, next) => {
  try {
    await db.collection('config').doc('sistema').set({
      ...CONFIG_DEFAULT,
      updatedAt:  FieldValue.serverTimestamp(),
      restoredAt: FieldValue.serverTimestamp(),
    });
    res.json({ status: 'success', data: CONFIG_DEFAULT });
  } catch (e) { next(e); }
});

// ─────────────────────────────────────────────────────────
// GET /api/config/formularios — público
// ─────────────────────────────────────────────────────────
router.get('/formularios', async (req, res, next) => {
  try {
    const snap = await db.collection('config').doc('formularios').get();
    res.json({ status: 'success', data: snap.exists ? snap.data() : null });
  } catch (e) { next(e); }
});

// POST /api/config/formularios — solo DPO
router.post('/formularios', requireAuth, requireDPO, async (req, res, next) => {
  try {
    await db.collection('config').doc('formularios').set(
      { ...req.body, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    res.json({ status: 'success' });
  } catch (e) { next(e); }
});

// ─────────────────────────────────────────────────────────
// GET /api/config/flujos — público
// ─────────────────────────────────────────────────────────
router.get('/flujos', async (req, res, next) => {
  try {
    const snap = await db.collection('config').doc('flujos').get();
    res.json({ status: 'success', data: snap.exists ? snap.data() : null });
  } catch (e) { next(e); }
});

// POST /api/config/flujos — solo DPO
router.post('/flujos', requireAuth, requireDPO, async (req, res, next) => {
  try {
    await db.collection('config').doc('flujos').set(
      { ...req.body, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    res.json({ status: 'success' });
  } catch (e) { next(e); }
});

module.exports = router;