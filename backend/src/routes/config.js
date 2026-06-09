// ============================================================
// backend/src/routes/config.js — v1.1
// CAMBIO respecto a v1.0:
//   - Agrega POST /api/config/restore para restaurar defaults
// ============================================================
'use strict';

const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const { db, bucket } = require('../services/firebase');
const { requireAuth, requireDPO, requireAdmin } = require('../middleware/auth');
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
  color_primario:          '#2563eb',
  color_secundario:        '#1e40af',
  color_fondo:             '#f8fafc',
  color_texto:             '#1e293b',
  card_estilo:             'rounded',
  card_radio:              '12',
  card_sombra:             'soft',
  fuente_titulo:           'Inter',
  fuente_cuerpo:           'Inter',
  aplicar_branding_dpo:    false,
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
    const {
      empresa_nombre, empresa_rut, portal_nombre, portal_color, portal_color_secundario, logo_url,
      dias_respuesta, dpo_nombre, dpo_email, dpo_telefono,
      color_primario, color_secundario, color_fondo, color_texto,
      card_estilo, card_radio, card_sombra, fuente_titulo, fuente_cuerpo, aplicar_branding_dpo,
    } = data;
    res.json({ status: 'success', data: {
      empresa_nombre, empresa_rut, portal_nombre, portal_color, portal_color_secundario, logo_url,
      dias_respuesta, dpo_nombre, dpo_email, dpo_telefono,
      color_primario:   color_primario   ?? CONFIG_DEFAULT.color_primario,
      color_secundario: color_secundario ?? CONFIG_DEFAULT.color_secundario,
      color_fondo:      color_fondo      ?? CONFIG_DEFAULT.color_fondo,
      color_texto:      color_texto      ?? CONFIG_DEFAULT.color_texto,
      card_estilo:      card_estilo      ?? CONFIG_DEFAULT.card_estilo,
      card_radio:       card_radio       ?? CONFIG_DEFAULT.card_radio,
      card_sombra:      card_sombra      ?? CONFIG_DEFAULT.card_sombra,
      fuente_titulo:    fuente_titulo    ?? CONFIG_DEFAULT.fuente_titulo,
      fuente_cuerpo:    fuente_cuerpo    ?? CONFIG_DEFAULT.fuente_cuerpo,
      aplicar_branding_dpo: aplicar_branding_dpo ?? CONFIG_DEFAULT.aplicar_branding_dpo,
    } });  } catch (e) { next(e); }
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

// ─────────────────────────────────────────────────────────
// POST /api/config/probar-gchat — solo DPO
// Envía mensaje de prueba a un webhook de Google Chat
// ─────────────────────────────────────────────────────────
// POST /api/config/probar-gchat  (mantiene path por retrocompatibilidad)
router.post('/probar-gchat', requireAuth, requireDPO, async (req, res, next) => {
  try {
    const { webhook_url, derecho } = req.body;
    if (!webhook_url) {
      return res.status(400).json({ error: 'webhook_url requerido' });
    }

    function detectar(url) {
      if (url.includes('chat.googleapis.com')) return 'gchat';
      if (url.includes('hooks.slack.com'))     return 'slack';
      if (url.includes('webhook.office.com') ||
          url.includes('outlook.office.com')) return 'teams';
      return 'gchat';
    }

    const canal   = detectar(webhook_url);
    const NOMBRES = { gchat: 'Google Chat', slack: 'Slack', teams: 'Microsoft Teams' };
    const nombre  = NOMBRES[canal];

    let body;
    if (canal === 'slack') {
      body = JSON.stringify({
        blocks: [{
          type: 'section',
          text: { type: 'mrkdwn',
            text: `✅ *Webhook ARCOP conectado*\nEl canal *${derecho || 'este derecho'}* está correctamente configurado en *Slack*.` },
        }],
      });
    } else if (canal === 'teams') {
      body = JSON.stringify({
        type: 'message',
        attachments: [{
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard', version: '1.4',
            body: [{ type: 'TextBlock', wrap: true,
              text: `✅ Webhook ARCOP conectado — El canal ${derecho || 'este derecho'} está configurado en Microsoft Teams.` }],
          },
        }],
      });
    } else {
      body = JSON.stringify({
        text: `✅ *Webhook ARCOP conectado*\nEl canal *${derecho || 'este derecho'}* está correctamente configurado en Google Chat.`,
      });
    }

    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (response.ok) {
      return res.json({ status: 'success',
        data: { canal, nombre, mensaje: `Mensaje de prueba enviado a ${nombre}` } });
    }

    const errorText = await response.text();
    return res.status(502).json({
      error: `Error al enviar a ${nombre}: HTTP ${response.status}`,
      detail: errorText,
    });
  } catch (e) { next(e); }
});
 
// ─────────────────────────────────────────────────────────
// POST /api/config/logo — solo DPO
// Sube el logo del portal a Firebase Storage y retorna URL pública.
// ─────────────────────────────────────────────────────────
const _logoUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  },
});

router.post('/logo', requireAuth, requireDPO, _logoUpload.single('logo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });

    const ext      = path.extname(req.file.originalname) || '.png';
    const filePath = `config/logo${ext}`;
    const blob     = bucket.file(filePath);

    await blob.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
      resumable: false,
    });
    await blob.makePublic();

    const url = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    res.json({ status: 'success', data: { url } });
  } catch (e) {
    next(e);
  }
});

// ─────────────────────────────────────────────────────────
// PUT /api/config/branding — solo admin (MMPA-140)
// Guarda campos de identidad visual con validación estricta.
// ─────────────────────────────────────────────────────────
router.put('/branding', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const HEX_RE            = /^#[0-9a-fA-F]{6}$/;
    const VALID_CARD_ESTILO = ['rounded', 'sharp', 'pill'];
    const VALID_CARD_SOMBRA = ['none', 'soft', 'medium', 'strong'];
    const VALID_FUENTES     = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Raleway', 'DM Sans', 'Plus Jakarta Sans'];

    const errors = [];
    const b = req.body;
    if (b.color_primario   && !HEX_RE.test(b.color_primario))   errors.push('color_primario inválido');
    if (b.color_secundario && !HEX_RE.test(b.color_secundario)) errors.push('color_secundario inválido');
    if (b.color_fondo      && !HEX_RE.test(b.color_fondo))      errors.push('color_fondo inválido');
    if (b.color_texto      && !HEX_RE.test(b.color_texto))      errors.push('color_texto inválido');
    if (b.card_estilo && !VALID_CARD_ESTILO.includes(b.card_estilo)) errors.push('card_estilo inválido');
    if (b.card_sombra && !VALID_CARD_SOMBRA.includes(b.card_sombra)) errors.push('card_sombra inválido');
    if (b.fuente_titulo && !VALID_FUENTES.includes(b.fuente_titulo)) errors.push('fuente_titulo inválida');
    if (b.fuente_cuerpo && !VALID_FUENTES.includes(b.fuente_cuerpo)) errors.push('fuente_cuerpo inválida');
    if (errors.length) return res.status(400).json({ error: errors.join('; ') });

    const ALLOWED = ['color_primario','color_secundario','color_fondo','color_texto',
                     'card_estilo','card_radio','card_sombra','fuente_titulo','fuente_cuerpo',
                     'logo_url','portal_nombre','aplicar_branding_dpo'];
    const update = {};
    for (const f of ALLOWED) { if (b[f] !== undefined) update[f] = b[f]; }

    await db.collection('config').doc('sistema').set(
      { ...update, updatedAt: FieldValue.serverTimestamp() }, { merge: true }
    );
    await db.collection('audit_log').add({
      action:    'branding_update',
      uid:       req.user.uid,
      email:     req.user.email || null,
      payload:   update,
      timestamp: FieldValue.serverTimestamp(),
    });
    res.json({ status: 'success' });
  } catch (e) { next(e); }
});

// ─────────────────────────────────────────────────────────
// POST /api/config/branding/extract-from-url — admin (MMPA-143)
// Extrae colores, logo y fuentes de una URL pública.
// ─────────────────────────────────────────────────────────
router.post('/branding/extract-from-url', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'url requerida' });

    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 10000);
    let html;
    try {
      const r = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'ARCOP-Branding/1.0' } });
      clearTimeout(timeout);
      html = await r.text();
    } catch (e) {
      clearTimeout(timeout);
      if (e.name === 'AbortError') return res.status(504).json({ error: 'Timeout al conectar con la URL (10 s)' });
      return res.status(502).json({ error: 'No se pudo acceder a la URL: ' + e.message });
    }

    const { load } = require('cheerio');
    const $        = load(html);
    const colors   = [];

    // CSS custom properties and hex values in <style> tags
    $('style').each((_, el) => {
      const css     = $(el).text();
      const matches = css.match(/#[0-9a-fA-F]{6}\b/g) || [];
      colors.push(...matches);
    });

    // meta theme-color
    const themeColor = $('meta[name="theme-color"]').attr('content');
    if (themeColor && /^#[0-9a-fA-F]{6}$/i.test(themeColor)) colors.unshift(themeColor);

    // og:image → logo
    let logo_url = $('meta[property="og:image"]').attr('content') ||
                   $('img[class*="logo"], img[id*="logo"], img[alt*="ogo"]').first().attr('src') ||
                   null;
    if (logo_url && !logo_url.startsWith('http')) {
      try { logo_url = new URL(logo_url, url).href; } catch { logo_url = null; }
    }

    // Google Fonts
    const fonts = [];
    $('link[href*="fonts.googleapis.com"]').each((_, el) => {
      const m = ($(el).attr('href') || '').match(/family=([^:&]+)/);
      if (m) fonts.push(decodeURIComponent(m[1]).replace(/\+/g, ' '));
    });

    const uniqueColors = [...new Set(colors)].slice(0, 12);
    res.json({ status: 'success', data: {
      colors:   uniqueColors,
      logo_url,
      fonts:    fonts.slice(0, 5),
      sugerido: {
        color_primario:   uniqueColors[0] || null,
        color_secundario: uniqueColors[1] || null,
        fuente_titulo:    fonts[0]        || null,
      },
    }});
  } catch (e) { next(e); }
});

// ─────────────────────────────────────────────────────────
// GET /api/config/branding/templates — DPO (MMPA-145)
// Lista las plantillas de branding preconfiguradas.
// ─────────────────────────────────────────────────────────
router.get('/branding/templates', requireAuth, requireDPO, async (req, res, next) => {
  try {
    const snap      = await db.collection('branding_templates').orderBy('nombre').get();
    const templates = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ status: 'success', data: templates });
  } catch (e) { next(e); }
});

module.exports = router;
 




