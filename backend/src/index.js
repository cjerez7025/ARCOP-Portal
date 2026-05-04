// ============================================================
// src/index.js — Servidor Express para Cloud Run
// Puerto: process.env.PORT (Cloud Run lo inyecta, default 8080)
// ============================================================
'use strict';

require('dotenv').config();
const express   = require('express');
const helmet    = require('helmet');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');

const solicitudesRouter  = require('./routes/solicitudes');
const configRouter       = require('./routes/config');
const healthRouter       = require('./routes/health');
const estadisticasRouter = require('./routes/estadisticas');

const app  = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 8080;

const derechosRoutes = require('./routes/derechos');
const uploadRouter = require('./routes/upload');
// ── Seguridad ─────────────────────────────────────────────
app.use(helmet());
const validacionRouter   = require('./routes/validacion');
const rutContactosRouter = require('./routes/rutContactos');

app.use('/api/validacion',    validacionRouter);
app.use('/api/rut-contactos', rutContactosRouter);
// ── CORS ──────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origen no permitido — ${origin}`));
  },
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

// ── Rate limiting global ──────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Demasiadas solicitudes. Intenta en unos minutos.' },
}));

// ── Rutas ─────────────────────────────────────────────────
app.use('/api/health',        healthRouter);
app.use('/api/solicitudes',   solicitudesRouter);
app.use('/api/estadisticas',  estadisticasRouter);
app.use('/api/config',        configRouter);
app.use('/api/derechos', derechosRoutes);
app.use('/api/upload', uploadRouter);
// ── Error handler global ──────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 ARCOP Backend corriendo en puerto ${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Firebase proyecto: ${process.env.FIREBASE_PROJECT_ID || '(no configurado)'}`);
});

module.exports = app;