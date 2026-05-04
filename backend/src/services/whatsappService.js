// ============================================================
// backend/src/services/whatsappService.js
// MMPA-121 — Servicio WhatsApp (stub configurable)
//
// Stub: registra en logs y simula envío exitoso.
// Para activar en producción: implementar el proveedor elegido
// (Twilio, Meta Cloud API, etc.) leyendo config/sistema.
//
// Configuración esperada en Firestore config/sistema:
//   whatsapp_proveedor:  'twilio' | 'meta' | null
//   whatsapp_api_key:    string (desde Secret Manager en prod)
//   whatsapp_numero:     string (número del tenant, ej. '+56912345678')
// ============================================================
'use strict';

/**
 * Envía el link de validación por WhatsApp al titular.
 *
 * @param {string} telefono  - Número destino (ej. '+56912345678')
 * @param {string} linkValidacion - URL completa del link de validación
 * @param {Object} config    - config/sistema de Firestore
 * @returns {{ ok: boolean, canal: 'whatsapp', proveedor: string }}
 */
async function enviarLinkWhatsApp(telefono, linkValidacion, config = {}) {
  const proveedor = config.whatsapp_proveedor || null;

  // ── STUB (sin proveedor configurado) ──────────────────────
  if (!proveedor) {
    console.log(`[whatsappService] STUB — envío simulado a ${_maskTel(telefono)}`);
    console.log(`[whatsappService] Link: ${linkValidacion}`);
    // En desarrollo retorna éxito sin enviar nada real
    return { ok: true, canal: 'whatsapp', proveedor: 'stub' };
  }

  // ── TWILIO ────────────────────────────────────────────────
  if (proveedor === 'twilio') {
    return _enviarTwilio(telefono, linkValidacion, config);
  }

  // ── META CLOUD API ────────────────────────────────────────
  if (proveedor === 'meta') {
    return _enviarMeta(telefono, linkValidacion, config);
  }

  throw new Error(`Proveedor WhatsApp no reconocido: ${proveedor}`);
}

// ── Implementación Twilio (activar cuando se contrate) ────
async function _enviarTwilio(telefono, link, config) {
  // Descomentar cuando se instale 'twilio':
  // const twilio = require('twilio');
  // const client = twilio(config.whatsapp_api_key, config.whatsapp_api_secret);
  // await client.messages.create({
  //   from: `whatsapp:${config.whatsapp_numero}`,
  //   to:   `whatsapp:${telefono}`,
  //   body: `Tu link de validación ARCOP: ${link} (válido 30 min)`,
  // });
  console.warn('[whatsappService] Twilio no implementado — usar stub');
  return { ok: true, canal: 'whatsapp', proveedor: 'twilio-stub' };
}

// ── Implementación Meta Cloud API (activar cuando se contrate) ──
async function _enviarMeta(telefono, link, config) {
  // Descomentar cuando se configure Meta:
  // const res = await fetch(`https://graph.facebook.com/v18.0/${config.whatsapp_phone_id}/messages`, {
  //   method: 'POST',
  //   headers: { 'Authorization': `Bearer ${config.whatsapp_api_key}`, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     messaging_product: 'whatsapp',
  //     to: telefono,
  //     type: 'text',
  //     text: { body: `Tu link de validación ARCOP: ${link} (válido 30 min)` },
  //   }),
  // });
  // if (!res.ok) throw new Error('Error Meta API: ' + res.status);
  console.warn('[whatsappService] Meta no implementado — usar stub');
  return { ok: true, canal: 'whatsapp', proveedor: 'meta-stub' };
}

// ── Helper: enmascarar teléfono para logs ─────────────────
function _maskTel(tel) {
  if (!tel || tel.length < 4) return '****';
  return tel.slice(0, -4).replace(/\d/g, '*') + tel.slice(-4);
}

module.exports = { enviarLinkWhatsApp };