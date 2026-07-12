// ============================================================
// backend/src/services/notificationService.js — v1.0
// Servicio de notificaciones multi-canal (GChat, Slack, Teams)
// MMPA-132
// ============================================================
'use strict';

const { db }         = require('./firebase');
const slackAdapter   = require('./adapters/slackAdapter');
const teamsAdapter   = require('./adapters/teamsAdapter');

// ── Detectar canal por URL del webhook ───────────────────
function detectarCanal(webhookUrl) {
  if (!webhookUrl) return null;
  if (webhookUrl.includes('chat.googleapis.com')) return 'gchat';
  if (webhookUrl.includes('hooks.slack.com'))     return 'slack';
  if (webhookUrl.includes('webhook.office.com') ||
      webhookUrl.includes('outlook.office.com'))  return 'teams';
  return 'gchat'; // fallback al formato actual
}

// ── Obtener webhook del derecho desde Firestore ─────────
// Copiado de googleChatService.js sin modificaciones
async function getWebhookUrl(tipo) {
  try {
    const snap = await db.collection('config').doc('flujos').get();
    if (snap.exists) {
      const tipoKey = (tipo || '').toUpperCase();
      const d = snap.data()?.derechos?.[tipoKey] || {};
      const webhook = d.google_chat_webhook || d.gchat_webhook ||
                      d.slack_webhook || d.webhook_url;
      if (webhook?.trim()) return webhook.trim();
    }
  } catch (e) {
    console.error('[notification] Error leyendo flujos config:', e.message);
  }
  return null;
}

// ── Enviar texto a webhook (GChat) ──────────────────────
// Copiado de googleChatService.js sin modificaciones
async function enviar(text, webhookUrl) {
  if (!webhookUrl) return false;
  try {
    const response = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text }),
    });
    if (response.ok) {
      console.log('[notification] Mensaje enviado OK');
      return true;
    }
    console.error('[notification] Error HTTP', response.status, await response.text());
    return false;
  } catch (e) {
    console.error('[notification] Error al enviar:', e.message);
    return false;
  }
}

// ── Enviar payload JSON arbitrario (Slack, Teams) ───────
async function _enviarJson(payload, webhookUrl, canal = 'webhook') {
  if (!webhookUrl) return false;
  try {
    const response = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    if (response.ok) {
      console.log(`[Notif] ${canal.toUpperCase()} OK`);
      return true;
    }
    console.error(`[Notif] ${canal} HTTP ${response.status}`, await response.text());
    return false;
  } catch (e) {
    console.error(`[Notif] ${canal} error:`, e.message);
    return false;
  }
}

// ── Helpers ─────────────────────────────────────────────
function emojiDerecho(tipo) {
  const mapa = {
    ACCESO:        '🔍',
    RECTIFICACION: '✏️',
    CANCELACION:   '🗑️',
    OPOSICION:     '🚫',
    PORTABILIDAD:  '📦',
  };
  return mapa[(tipo || '').toUpperCase()] || '📋';
}

function emojiEstado(estado) {
  const mapa = {
    PENDIENTE:  '🟡',
    VALIDADA:   '🔵',
    EN_PROCESO: '🟠',
    RESUELTA:   '✅',
    RECHAZADA:  '❌',
    CERRADA:    '🗂️',
  };
  return mapa[(estado || '').toUpperCase()] || '⚪';
}

function textoEstado(estado) {
  const mapa = {
    PENDIENTE:  'Pendiente',
    VALIDADA:   'Validada',
    EN_PROCESO: 'En proceso',
    RESUELTA:   'Resuelta',
    RECHAZADA:  'Rechazada',
    CERRADA:    'Cerrada',
  };
  return mapa[(estado || '').toUpperCase()] || (estado || '—');
}

async function getPortalUrl() {
  try {
    const snap = await db.collection('config').doc('sistema').get();
    return snap.exists ? (snap.data().portal_url || '') : '';
  } catch { return ''; }
}

// ── API pública ─────────────────────────────────────────

async function notificarNuevaSolicitud(solicitud) {
  const tipo    = (solicitud.tipo_derecho || solicitud.tipo || 'ACCESO').toUpperCase();
  const webhook = await getWebhookUrl(tipo);
  if (!webhook) return false;

  const canal     = detectarCanal(webhook);
  const portalUrl = await getPortalUrl();

  if (canal === 'slack') {
    return _enviarJson(slackAdapter.formatearNuevaSolicitud(solicitud, portalUrl), webhook, 'slack');
  }
  if (canal === 'teams') {
    return _enviarJson(teamsAdapter.formatearNuevaSolicitud(solicitud, portalUrl), webhook, 'teams');
  }

  // gchat (default)
  const emoji = emojiDerecho(tipo);
  const text =
    `${emoji} *Nueva solicitud ${tipo}*\n` +
    `🔢 Número: \`${solicitud.numero_solicitud || '—'}\`\n` +
    `👤 Titular: ${solicitud.nombre_completo || '—'}\n` +
    `📧 Email: ${solicitud.email || '—'}\n` +
    (portalUrl ? `🔗 ${portalUrl}/#/dpo` : '');

  return enviar(text, webhook);
}

async function notificarCambioEstado({
  numero,
  tipo,
  nombreTitular,
  estadoAnterior,
  estadoNuevo,
  asignadoA,
  asignadoEmail,
  fechaTerminoSLA,
  archivos,
}) {
  const tipoKey = (tipo || 'ACCESO').toUpperCase();
  const webhook = await getWebhookUrl(tipoKey);
  if (!webhook) return false;

  const canal     = detectarCanal(webhook);
  const portalUrl = await getPortalUrl();

  if (canal === 'slack') {
    return _enviarJson(slackAdapter.formatearCambioEstado(
      { numero, tipo: tipoKey, nombreTitular, estadoAnterior, estadoNuevo, asignadoA, asignadoEmail, fechaTerminoSLA },
      portalUrl
    ), webhook, 'slack');
  }
  if (canal === 'teams') {
    return _enviarJson(teamsAdapter.formatearCambioEstado(
      { numero, tipo: tipoKey, nombreTitular, estadoAnterior, estadoNuevo, asignadoA, asignadoEmail, fechaTerminoSLA },
      portalUrl
    ), webhook, 'teams');
  }

  // gchat (default)
  let text =
    `${emojiEstado(estadoNuevo)} *${tipoKey} — ${textoEstado(estadoNuevo)}*\n` +
    `🔢 Número: \`${numero || '—'}\`\n` +
    `👤 Titular: ${nombreTitular || '—'}\n` +
    `🔄 Transición: ${textoEstado(estadoAnterior)} → *${textoEstado(estadoNuevo)}*`;

  if (asignadoA) {
    text += `\n👷 Asignado a: *${asignadoA}*` + (asignadoEmail ? ` <${asignadoEmail}>` : '');
  }
  if (fechaTerminoSLA) {
    const f = typeof fechaTerminoSLA === 'string'
      ? fechaTerminoSLA.split('T')[0]
      : fechaTerminoSLA;
    text += `\n⏱️ SLA hasta: ${f}`;
  }
  if (archivos && archivos.length > 0) {
    text += `\n📎 *Documentación adjunta (${archivos.length}):*`;
    archivos.forEach(a => {
      text += `\n   📄 <${a.url}|${a.nombre}>`;
    });
  }
  if (portalUrl) text += `\n🔗 ${portalUrl}/#/dpo`;

  return enviar(text, webhook);
}

async function notificarAlertasSLA() {
  try {
    const snap        = await db.collection('solicitudes').get();
    const solicitudes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const hoy         = new Date();
    const limite      = new Date(hoy.getTime() + 3 * 24 * 60 * 60 * 1000);
    const portalUrl   = await getPortalUrl();

    const estadosActivos = ['PENDIENTE', 'VALIDADA', 'EN_PROCESO'];
    const urgentes = solicitudes.filter(s => {
      if (!estadosActivos.includes(s.estado)) return false;
      if (!s.fecha_limite) return false;
      const fl = new Date(s.fecha_limite.toDate ? s.fecha_limite.toDate() : s.fecha_limite);
      return fl <= limite && fl >= hoy;
    });

    if (urgentes.length === 0) return false;

    const porTipo = {};
    urgentes.forEach(s => {
      const t = (s.tipo_derecho || s.tipo || 'ACCESO').toUpperCase();
      if (!porTipo[t]) porTipo[t] = [];
      porTipo[t].push(s);
    });

    for (const [tipo, items] of Object.entries(porTipo)) {
      const webhook = await getWebhookUrl(tipo);
      if (!webhook) continue;

      const canal = detectarCanal(webhook);
      const itemsConDias = items.map(s => {
        const fl = new Date(s.fecha_limite.toDate ? s.fecha_limite.toDate() : s.fecha_limite);
        return { ...s, diasRestantes: Math.ceil((fl - hoy) / (1000 * 60 * 60 * 24)) };
      });

      if (canal === 'slack') {
        await _enviarJson(slackAdapter.formatearAlertaSLA(itemsConDias, portalUrl), webhook, 'slack');
        continue;
      }
      if (canal === 'teams') {
        await _enviarJson(teamsAdapter.formatearAlertaSLA(itemsConDias, portalUrl), webhook, 'teams');
        continue;
      }

      // gchat (default) — formato texto original
      const lista = itemsConDias.map(s =>
        `${s.diasRestantes <= 1 ? '🔴' : '🟡'} \`${s.numero_solicitud}\` — ${s.nombre_completo || '?'} — *${s.diasRestantes} día(s)*`
      ).join('\n');
      const text =
        `⚠️ *Alerta SLA ${tipo} — ${items.length} solicitud(es) por vencer*\n` +
        lista +
        (portalUrl ? `\n🔗 ${portalUrl}/#/dpo` : '');
      await enviar(text, webhook);
    }

    return true;
  } catch (e) {
    console.error('[notification] Error en notificarAlertasSLA:', e.message);
    return false;
  }
}

module.exports = {
  notificarNuevaSolicitud,
  notificarCambioEstado,
  notificarAlertasSLA,
};
