// ============================================================
// backend/src/routes/usuarios.js — MMPA-65 / MMPA-108
// Gestión de usuarios internos vía Firebase Auth Admin SDK.
// Todos los endpoints requieren requireAuth + requireAdmin.
// ============================================================
'use strict';

const express        = require('express');
const { db, auth }   = require('../services/firebase');
const { FieldValue } = require('firebase-admin/firestore');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// requireAuth se aplica en index.js a nivel de router
// requireAdmin se aplica en cada endpoint individualmente

const ROLES_VALIDOS = [
  'admin',
  'dpo',
  'legal_reviewer',
  'arco_operator',
  'auditor_viewer',
];

async function _auditLog({ accion, entidadId, actor, rol_anterior, rol_nuevo, detalles }) {
  try {
    await db.collection('auditLog').add({
      accion,
      entidadTipo:  'usuario',
      entidadId,
      actor,
      rol_anterior: rol_anterior || null,
      rol_nuevo:    rol_nuevo    || null,
      timestamp:    FieldValue.serverTimestamp(),
      detalles:     detalles || {},
    });
  } catch (e) {
    console.warn('[usuarios] auditLog falló:', e.message);
  }
}

// ═════════════════════════════════════════════════════════
// GET /api/usuarios
// Lista todos los usuarios internos desde Firebase Auth.
// ═════════════════════════════════════════════════════════
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const listResult = await auth.listUsers(1000);
    const usuarios   = listResult.users.map(u => ({
      uid:          u.uid,
      email:        u.email || '',
      nombre:       u.displayName || '',
      rol:          u.customClaims?.role || null,
      activo:       !u.disabled,
      ultimoAcceso: u.metadata.lastSignInTime || null,
    }));
    res.json({ status: 'success', data: usuarios });
  } catch (e) { next(e); }
});

// ═════════════════════════════════════════════════════════
// POST /api/usuarios
// Crea usuario interno, asigna rol y envía link de invitación.
// Body: { email, nombre, rol }
// ═════════════════════════════════════════════════════════
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { email, nombre, rol } = req.body;

    if (!email || !nombre || !rol) {
      return res.status(400).json({ error: 'email, nombre y rol son obligatorios' });
    }
    if (!ROLES_VALIDOS.includes(rol)) {
      return res.status(400).json({
        error: `Rol inválido. Opciones: ${ROLES_VALIDOS.join(', ')}`,
      });
    }

    let user;
    try {
      user = await auth.createUser({ email, displayName: nombre });
    } catch (e) {
      if (e.code === 'auth/email-already-exists') {
        return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
      }
      throw e;
    }

    await auth.setCustomUserClaims(user.uid, { role: rol });

    // Link de invitación (sign-in con email link)
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const link = await auth.generateSignInWithEmailLink(email, {
        url:            frontendUrl,
        handleCodeInApp: true,
      });
      console.log(`[usuarios] Invitación ${email} → ${link}`);
    } catch (linkErr) {
      console.warn('[usuarios] Link de invitación no generado:', linkErr.message);
    }

    await _auditLog({
      accion:       'CREAR_USUARIO',
      entidadId:    user.uid,
      actor:        req.user.uid,
      rol_anterior: null,
      rol_nuevo:    rol,
      detalles:     { email, nombre },
    });

    res.status(201).json({
      status: 'success',
      data:   { uid: user.uid, email, nombre, rol, activo: true },
    });
  } catch (e) { next(e); }
});

// ═════════════════════════════════════════════════════════
// PUT /api/usuarios/:uid/rol
// Cambia el rol de un usuario existente.
// Body: { rol }
// ═════════════════════════════════════════════════════════
router.put('/:uid/rol', requireAdmin, async (req, res, next) => {
  try {
    const { uid } = req.params;
    const { rol } = req.body;

    if (!rol) {
      return res.status(400).json({ error: 'rol es obligatorio' });
    }
    if (!ROLES_VALIDOS.includes(rol)) {
      return res.status(400).json({
        error: `Rol inválido. Opciones: ${ROLES_VALIDOS.join(', ')}`,
      });
    }

    let user;
    try {
      user = await auth.getUser(uid);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      throw e;
    }

    const rolAnterior = user.customClaims?.role || null;
    await auth.setCustomUserClaims(uid, { role: rol });

    await _auditLog({
      accion:       'CAMBIAR_ROL',
      entidadId:    uid,
      actor:        req.user.uid,
      rol_anterior: rolAnterior,
      rol_nuevo:    rol,
      detalles:     { email: user.email || '', nombre: user.displayName || '' },
    });

    res.json({ status: 'success', data: { uid, rol } });
  } catch (e) { next(e); }
});

// ═════════════════════════════════════════════════════════
// PUT /api/usuarios/:uid/estado
// Activa o desactiva un usuario.
// Body: { activo: boolean }
// Protección: no se puede dejar el sistema sin admins activos.
// ═════════════════════════════════════════════════════════
router.put('/:uid/estado', requireAdmin, async (req, res, next) => {
  try {
    const { uid }    = req.params;
    const { activo } = req.body;

    if (activo === undefined || activo === null) {
      return res.status(400).json({ error: 'activo (boolean) es obligatorio' });
    }

    let user;
    try {
      user = await auth.getUser(uid);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      throw e;
    }

    if (!activo) {
      // Verificar que quede al menos 1 admin activo
      const listResult   = await auth.listUsers(1000);
      const adminsActivos = listResult.users.filter(u =>
        u.customClaims?.role === 'admin' && !u.disabled && u.uid !== uid
      );
      if (adminsActivos.length === 0) {
        return res.status(409).json({
          error: 'No es posible desactivar al único administrador activo del sistema.',
        });
      }

      await auth.revokeRefreshTokens(uid);
      await auth.updateUser(uid, { disabled: true });
    } else {
      await auth.updateUser(uid, { disabled: false });
    }

    await _auditLog({
      accion:       activo ? 'ACTIVAR_USUARIO' : 'DESACTIVAR_USUARIO',
      entidadId:    uid,
      actor:        req.user.uid,
      rol_anterior: user.customClaims?.role || null,
      rol_nuevo:    user.customClaims?.role || null,
      detalles:     { email: user.email || '', nombre: user.displayName || '' },
    });

    res.json({ status: 'success', data: { uid, activo: Boolean(activo) } });
  } catch (e) { next(e); }
});

module.exports = router;
