// ============================================================
// src/routes/config.js — Endpoints de configuración del sistema
// ============================================================
'use strict';

const express = require('express');
const { db }  = require('../services/firebase');
const { requireAuth, requireDPO } = require('../middleware/auth');
const { FieldValue } = require('firebase-admin/firestore');

const router = express.Router();

// GET /api/config — público (el formulario ciudadano lo necesita)
router.get('/', async (req, res, next) => {
  try {
    const snap = await db.collection('config').doc('sistema').get();
    const data = snap.exists ? snap.data() : {};
    // Solo exponer campos no sensibles al público
    const { empresa_nombre, portal_nombre, portal_color, logo_url, dias_respuesta } = data;
    res.json({ status: 'success', data: { empresa_nombre, portal_nombre, portal_color, logo_url, dias_respuesta } });
  } catch (e) { next(e); }
});

// GET /api/config/full — solo DPO
router.get('/full', requireAuth, requireDPO, async (req, res, next) => {
  try {
    const snap = await db.collection('config').doc('sistema').get();
    res.json({ status: 'success', data: snap.exists ? snap.data() : {} });
  } catch (e) { next(e); }
});

// POST /api/config — solo DPO
router.post('/', requireAuth, requireDPO, async (req, res, next) => {
  try {
    await db.collection('config').doc('sistema').set({ ...req.body, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    res.json({ status: 'success' });
  } catch (e) { next(e); }
});

// GET /api/config/formularios — público
router.get('/formularios', async (req, res, next) => {
  try {
    const snap = await db.collection('config').doc('formularios').get();
    res.json({ status: 'success', data: snap.exists ? snap.data() : null });
  } catch (e) { next(e); }
});

// POST /api/config/formularios — solo DPO
router.post('/formularios', requireAuth, requireDPO, async (req, res, next) => {
  try {
    await db.collection('config').doc('formularios').set({ ...req.body, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    res.json({ status: 'success' });
  } catch (e) { next(e); }
});

// GET /api/config/flujos — público
router.get('/flujos', async (req, res, next) => {
  try {
    const snap = await db.collection('config').doc('flujos').get();
    res.json({ status: 'success', data: snap.exists ? snap.data() : null });
  } catch (e) { next(e); }
});

// POST /api/config/flujos — solo DPO
router.post('/flujos', requireAuth, requireDPO, async (req, res, next) => {
  try {
    await db.collection('config').doc('flujos').set({ ...req.body, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    res.json({ status: 'success' });
  } catch (e) { next(e); }
});

module.exports = router;