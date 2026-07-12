// ============================================================
// src/middleware/auth.js
// Verifica JWT de Firebase Auth en cada request del DPO.
// El ciudadano NO necesita token — solo los endpoints /dpo/*
// ============================================================
'use strict';

const { auth } = require('../services/firebase');

/**
 * Middleware que exige token Firebase válido.
 * Uso: router.get('/ruta', requireAuth, handler)
 */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticacion requerido' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = decoded; // uid, email, custom claims
    next();
  } catch (e) {
    console.warn('[auth] Token inválido:', e.code);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

/**
 * Middleware que exige que el usuario tenga rol 'dpo' o 'admin'.
 * Uso: router.put('/ruta', requireAuth, requireDPO, handler)
 * Requiere haber seteado custom claims: { role: 'dpo' }
 */
function requireDPO(req, res, next) {
  const role = req.user?.role;
  if (!['dpo', 'admin'].includes(role)) {
    return res.status(403).json({ error: 'Acceso restringido al equipo DPO' });
  }
  next();
}

function requireInterno(req, res, next) {
  const role = req.user?.role;
  if (!['dpo', 'admin', 'legal', 'operador', 'auditor'].includes(role)) {
    return res.status(403).json({ error: 'Acceso restringido a usuarios internos' });
  }
  next();
}

function requireLegal(req, res, next) {
  const role = req.user?.role;
  if (!['legal', 'dpo', 'admin'].includes(role)) {
    return res.status(403).json({ error: 'Acceso restringido al equipo legal' });
  }
  next();
}

function requireOperador(req, res, next) {
  const role = req.user?.role;
  if (!['operador', 'dpo', 'admin'].includes(role)) {
    return res.status(403).json({ error: 'Acceso restringido a operadores' });
  }
  next();
}

function requireAuditor(req, res, next) {
  const role = req.user?.role;
  if (!['auditor', 'dpo', 'admin', 'legal', 'operador'].includes(role)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Se requiere rol administrador' });
  }
  next();
}

module.exports = {
  requireAuth,
  requireDPO,
  requireInterno,
  requireLegal,
  requireOperador,
  requireAuditor,
  requireAdmin,
};