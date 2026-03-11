// ============================================================
// src/routes/health.js
// Cloud Run requiere un endpoint que responda 200 para saber
// que el container está vivo. También útil para monitoreo.
// ============================================================
'use strict';

const express = require('express');
const router  = express.Router();

router.get('/', (req, res) => {
  res.json({
    status:    'ok',
    service:   'arcop-backend',
    timestamp: new Date().toISOString(),
    version:   process.env.npm_package_version || '1.0.0',
  });
});

module.exports = router;