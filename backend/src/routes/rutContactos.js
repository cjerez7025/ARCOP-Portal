// ============================================================
// backend/src/routes/rutContactos.js
// MMPA-119 — Endpoint para carga masiva tabla rut_contactos
//
// POST /api/rut-contactos/importar
//   - Body: { registros: [{ rut, email, telefono? }], reemplazar?: boolean }
//   - reemplazar=true → borra toda la colección antes de insertar
//   - Auth: requireAuth (DPO o admin)
//   - Escribe en Firestore via Admin SDK (sin restricciones de rules)
// ============================================================
'use strict';

const express          = require('express');
const { db }           = require('../services/firebase');
const { FieldValue }   = require('firebase-admin/firestore');
const { requireAuth }  = require('../middleware/auth');

const router     = express.Router();
const BATCH_SIZE = 400; // Firestore max 500 ops/batch — margen de seguridad

// ── Helpers ───────────────────────────────────────────────
const ok  = (res, data)          => res.json({ status: 'success', data });
const err = (res, msg, code=400) => res.status(code).json({ status: 'error', error: msg });

// Elimina todos los documentos de rut_contactos en páginas de BATCH_SIZE
async function limpiarColeccion() {
  let eliminados = 0;
  while (true) {
    const snap = await db.collection('rut_contactos').limit(BATCH_SIZE).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    eliminados += snap.docs.length;
  }
  console.log(`[rutContactos] Colección limpiada: ${eliminados} documentos eliminados`);
  return eliminados;
}

// ── POST /api/rut-contactos/importar ─────────────────────
router.post('/importar', requireAuth, async (req, res, next) => {
  try {
    const { registros, reemplazar = false } = req.body;

    if (!Array.isArray(registros) || registros.length === 0) {
      return err(res, 'Se requiere un array "registros" con al menos un elemento.');
    }

    if (registros.length > 10_000) {
      return err(res, `Máximo 10.000 registros por carga. Se recibieron ${registros.length}.`);
    }

    // Si reemplazar=true, borrar toda la colección antes de insertar
    let eliminados = 0;
    if (reemplazar) {
      eliminados = await limpiarColeccion();
    }

    let escritos  = 0;
    let omitidos  = 0;
    const errores = [];

    // Procesar en batches
    for (let i = 0; i < registros.length; i += BATCH_SIZE) {
      const bloque = registros.slice(i, i + BATCH_SIZE);
      const batch  = db.batch();

      bloque.forEach((reg, idx) => {
        const lineaReal = i + idx + 1;

        // Validación mínima en backend (el frontend ya validó, esto es defensa en profundidad)
        if (!reg.rut || !reg.email) {
          errores.push({ linea: lineaReal, rut: reg.rut, error: 'RUT o email faltante' });
          omitidos++;
          return;
        }

        const ref = db.collection('rut_contactos').doc(reg.rut);
        batch.set(ref, {
          rut:            reg.rut,
          email:          reg.email.trim().toLowerCase(),
          telefono:       reg.telefono?.trim() || null,
          fuente:         'carga_manual',
          actualizado_en: FieldValue.serverTimestamp(),
        }, { merge: true });

        escritos++;
      });

      await batch.commit();
    }

    console.log(`[rutContactos] Importación completada: ${escritos} escritos, ${omitidos} omitidos${reemplazar ? `, ${eliminados} eliminados previos` : ''}`);

    return ok(res, {
      escritos,
      omitidos,
      eliminados,
      errores: errores.slice(0, 50),
      total:   registros.length,
    });

  } catch (e) {
    console.error('[rutContactos] Error en importación:', e.message);
    next(e);
  }
});

// ── GET /api/rut-contactos/estado ────────────────────────
// Verifica si la colección tiene registros (sin contar todos)
router.get('/estado', requireAuth, async (req, res, next) => {
  try {
    const snap = await db.collection('rut_contactos').limit(1).get();
    return ok(res, { tiene_registros: !snap.empty });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
