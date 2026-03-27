// ============================================================
// src/routes/estadisticas.js
// Métricas para el Dashboard DPO
// ============================================================
'use strict';

const express = require('express');
const { db }  = require('../services/firebase');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const snap = await db.collection('solicitudes').get();
    const docs = snap.docs.map(d => d.data());

    const total      = docs.length;
    const porEstado  = {};
    const porDerecho = {};
    let   vencidas   = 0;
    const ahora      = new Date();

    docs.forEach(d => {
      porEstado[d.estado]        = (porEstado[d.estado]        || 0) + 1;
      porDerecho[d.tipo_derecho] = (porDerecho[d.tipo_derecho] || 0) + 1;
      if (d.fecha_limite && new Date(d.fecha_limite) < ahora &&
          !['RESUELTA','CERRADA','DESCARGA_CONFIRMADA'].includes(d.estado)) {
        vencidas++;
      }
    });

    res.json({
      status: 'success',
      data: {
        total,
        pendientes:  porEstado['PENDIENTE']  || 0,
        validadas:   porEstado['VALIDADA']   || 0,
        en_proceso:  porEstado['EN_PROCESO'] || 0,
        resueltas:   porEstado['RESUELTA']   || 0,
        cerradas:    porEstado['CERRADA']    || 0,
        vencidas,
        por_derecho: porDerecho,
        por_estado:  porEstado,
      },
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;