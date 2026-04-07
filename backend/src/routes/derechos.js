'use strict';

// ============================================================
// src/routes/derechos.js
// MMPA-104 — Endpoints para gestión de derechos ARCOP
// ============================================================

const express        = require('express');
const { db }         = require('../services/firebase');
const { FieldValue } = require('firebase-admin/firestore');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const SLA_MAX = 15;

const ok  = (res, data)          => res.json({ status: 'success', data });
const err = (res, msg, code=400) => res.status(code).json({ status: 'error', error: msg });

// GET /api/derechos — derechos activos (público)
router.get('/', async (req, res) => {
  try {
    const snap = await db.collection('derechos')
      .orderBy('orden', 'asc')
      .get();
    const data = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(d => d.activo === true);
    return ok(res, data);
  } catch (e) {
    console.error('[derechos] GET /:', e.message);
    return err(res, 'Error al obtener derechos', 500);
  }
});

// GET /api/derechos/todos — todos los derechos (DPO)
router.get('/todos', requireAuth, async (req, res) => {
  try {
    const snap = await db.collection('derechos')
      .orderBy('orden', 'asc')
      .get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return ok(res, data);
  } catch (e) {
    console.error('[derechos] GET /todos:', e.message);
    return err(res, 'Error al obtener derechos', 500);
  }
});

// POST /api/derechos — crear derecho
router.post('/', requireAuth, async (req, res) => {
  try {
    const { id, nombre, articulo, descripcion, icono, color, orden, sla_dias, protegido, origen } = req.body;

    if (!id || !nombre) return err(res, 'id y nombre son obligatorios');

    const idNormalizado = id.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
    if (!idNormalizado) return err(res, 'ID inválido');

    if (sla_dias && sla_dias > SLA_MAX)
      return err(res, 'El SLA no puede superar ' + SLA_MAX + ' días hábiles (Art. 11 Ley 21.719)');

    const existente = await db.collection('derechos').doc(idNormalizado).get();
    if (existente.exists) return err(res, 'Ya existe un derecho con ID ' + idNormalizado);

    const doc = {
      id:             idNormalizado,
      nombre:         nombre.trim(),
      articulo:       articulo?.trim()    || '',
      descripcion:    descripcion?.trim() || '',
      icono:          icono               || 'doc',
      color:          color               || '#6B7280',
      orden:          parseInt(orden)     || 99,
      sla_dias:       parseInt(sla_dias)  || SLA_MAX,
      activo:         false,
      protegido:      protegido === true,
      origen:         origen              || 'custom',
      creado_en:      FieldValue.serverTimestamp(),
      actualizado_en: FieldValue.serverTimestamp(),
    };

    await db.collection('derechos').doc(idNormalizado).set(doc);
    return ok(res, { ...doc, id: idNormalizado });
  } catch (e) {
    console.error('[derechos] POST /:', e.message);
    return err(res, 'Error al crear derecho', 500);
  }
});

// PUT /api/derechos/:id — editar derecho
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const cambios = { ...req.body };

    if (cambios.sla_dias && cambios.sla_dias > SLA_MAX)
      return err(res, 'El SLA no puede superar ' + SLA_MAX + ' días hábiles (Art. 11 Ley 21.719)');

    delete cambios.id;
    delete cambios.creado_en;
    delete cambios.origen;

    const snap = await db.collection('derechos').doc(id).get();
    if (!snap.exists) return err(res, 'Derecho no encontrado', 404);

    if (cambios.nombre)      cambios.nombre      = cambios.nombre.trim();
    if (cambios.descripcion) cambios.descripcion = cambios.descripcion.trim();
    if (cambios.articulo)    cambios.articulo    = cambios.articulo.trim();
    if (cambios.sla_dias)    cambios.sla_dias    = parseInt(cambios.sla_dias);
    if (cambios.orden)       cambios.orden       = parseInt(cambios.orden);

    cambios.actualizado_en = FieldValue.serverTimestamp();

    await db.collection('derechos').doc(id).update(cambios);
    return ok(res, { id, ...cambios });
  } catch (e) {
    console.error('[derechos] PUT /:id:', e.message);
    return err(res, 'Error al actualizar derecho', 500);
  }
});

// PUT /api/derechos/:id/toggle — activar/desactivar
router.put('/:id/toggle', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const snap = await db.collection('derechos').doc(id).get();
    if (!snap.exists) return err(res, 'Derecho no encontrado', 404);

    const nuevoEstado = !snap.data().activo;
    await db.collection('derechos').doc(id).update({
      activo:         nuevoEstado,
      actualizado_en: FieldValue.serverTimestamp(),
    });

    return ok(res, { id, activo: nuevoEstado });
  } catch (e) {
    console.error('[derechos] PUT /:id/toggle:', e.message);
    return err(res, 'Error al cambiar estado', 500);
  }
});

module.exports = router;