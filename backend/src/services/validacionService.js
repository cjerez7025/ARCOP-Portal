// ============================================================
// backend/src/services/validacionService.js
// MMPA-116 — Consultar API empresa por RUT
// MMPA-117 — Fallback a tabla rut_contactos en Firebase
// MMPA-118 — Sincronización automática Firebase con respuesta API
// MMPA-120 — Anonimización de datos (backend, nunca expone datos completos)
//
// Flujo:
//   1. Consulta API empresa (timeout 3s)
//   2. Si falla → busca en rut_contactos Firebase
//   3. Si API respondió → sincroniza Firebase en background
//   4. Retorna datos ANONIMIZADOS al frontend
// ============================================================
'use strict';

const { db }         = require('../services/firebase');
const { FieldValue } = require('firebase-admin/firestore');

// ── Anonimizadores ────────────────────────────────────────

/**
 * ju***@empresa.cl
 */
function anonimizarEmail(email) {
  if (!email || !email.includes('@')) return null;
  const [local, dominio] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${dominio}`;
  return `${local.slice(0, 2)}***@${dominio}`;
}

/**
 * +56 9 **** **78
 */
function anonimizarTelefono(tel) {
  if (!tel) return null;
  const limpio = tel.replace(/[\s\-\(\)]/g, '');
  if (limpio.length < 4) return '****';
  return limpio.slice(0, -4).replace(/\d/g, '*') + limpio.slice(-2);
}

// ── Consulta API empresa ──────────────────────────────────

/**
 * Llama a la API interna de la empresa con el RUT.
 * El endpoint se configura en config/sistema (campo api_validacion_url).
 *
 * @returns {{ email, telefono } | null}
 */
async function consultarAPIEmpresa(rut, config) {
  const apiUrl    = config?.api_validacion_url;
  const apiKey    = config?.api_validacion_key;
  const timeout   = 3000; // 3 segundos (MMPA-116 criterio de aceptación)

  if (!apiUrl) {
    console.log('[validacionService] API empresa no configurada — saltando a fallback');
    return null;
  }

  try {
    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), timeout);

    const url = `${apiUrl}?rut=${encodeURIComponent(rut)}`;
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['X-API-Key'] = apiKey;

    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      console.log(`[validacionService] API empresa respondió ${res.status} para RUT ${_maskRut(rut)}`);
      return null;
    }

    const data = await res.json();

    // Normalizar respuesta — adaptar según contrato real de la API
    const email    = data.email    || data.correo     || data.mail       || null;
    const telefono = data.telefono || data.celular     || data.phone      || null;

    if (!email && !telefono) {
      console.log(`[validacionService] API empresa: RUT ${_maskRut(rut)} no encontrado`);
      return null;
    }

    console.log(`[validacionService] API empresa: RUT ${_maskRut(rut)} encontrado (fuente: api)`);
    return { email, telefono };

  } catch (e) {
    if (e.name === 'AbortError') {
      console.warn(`[validacionService] API empresa: timeout (>3s) para RUT ${_maskRut(rut)}`);
    } else {
      console.warn(`[validacionService] API empresa: error — ${e.message}`);
    }
    return null;
  }
}

// ── Consulta Firebase fallback ────────────────────────────

/**
 * Busca el RUT en la colección rut_contactos.
 * @returns {{ email, telefono } | null}
 */
async function consultarFirebaseFallback(rut) {
  try {
    const snap = await db.collection('rut_contactos').doc(rut).get();
    if (!snap.exists) {
      console.log(`[validacionService] Fallback Firebase: RUT ${_maskRut(rut)} no encontrado`);
      return null;
    }
    const data = snap.data();
    console.log(`[validacionService] Fallback Firebase: RUT ${_maskRut(rut)} encontrado`);
    return {
      email:    data.email    || null,
      telefono: data.telefono || null,
    };
  } catch (e) {
    console.error(`[validacionService] Error consultando Firebase: ${e.message}`);
    return null;
  }
}

// ── Sincronización Firebase en background ────────────────

/**
 * Actualiza rut_contactos con los datos frescos de la API.
 * Fire-and-forget — no bloquea la respuesta al titular.
 */
function sincronizarFirebaseBackground(rut, datosApi) {
  db.collection('rut_contactos').doc(rut).set({
    rut,
    email:          datosApi.email,
    telefono:       datosApi.telefono || null,
    fuente:         'api',
    sincronizado_en: FieldValue.serverTimestamp(),
    actualizado_en:  FieldValue.serverTimestamp(),
  }, { merge: true })
    .then(() => console.log(`[validacionService] Sync Firebase OK para ${_maskRut(rut)}`))
    .catch(e => console.error(`[validacionService] Sync Firebase FAIL: ${e.message}`));
  // No await — es background
}

// ── Función principal ─────────────────────────────────────

/**
 * Obtiene los datos de contacto ANONIMIZADOS para un RUT.
 * Nunca expone email/teléfono completos al frontend.
 *
 * @param {string} rut        - RUT normalizado (ej. '12.345.678-9')
 * @param {Object} config     - config/sistema de Firestore
 *
 * @returns {{
 *   encontrado:        boolean,
 *   fuente:            'api' | 'firebase' | null,
 *   email_anon:        string | null,
 *   telefono_anon:     string | null,
 *   canales_disponibles: ('email' | 'whatsapp')[],
 * }}
 */
async function obtenerContactoAnonimizado(rut, config) {
  let datos  = null;
  let fuente = null;

  // Paso 1: API empresa
  datos = await consultarAPIEmpresa(rut, config);
  if (datos) {
    fuente = 'api';
    // Paso 3: sincronizar Firebase en background (MMPA-118)
    sincronizarFirebaseBackground(rut, datos);
  }

  // Paso 2: fallback Firebase
  if (!datos) {
    datos = await consultarFirebaseFallback(rut);
    if (datos) fuente = 'firebase';
  }

  // Sin datos en ninguna fuente → derivación a canal asistido
  if (!datos) {
    console.log(`[validacionService] RUT ${_maskRut(rut)} no encontrado en ninguna fuente`);
    return {
      encontrado:          false,
      fuente:              null,
      email_anon:          null,
      telefono_anon:       null,
      canales_disponibles: [],
    };
  }

  // Anonimizar — NUNCA enviar datos completos al frontend
  const emailAnon    = anonimizarEmail(datos.email);
  const telefonoAnon = anonimizarTelefono(datos.telefono);

  // Canales disponibles según qué datos existen
  const canales = [];
  if (datos.email)    canales.push('email');
  if (datos.telefono) canales.push('whatsapp');

  return {
    encontrado:          true,
    fuente,
    email_anon:          emailAnon,
    telefono_anon:       telefonoAnon,
    canales_disponibles: canales,
  };
}

// ── Helper: enmascarar RUT para logs ─────────────────────
function _maskRut(rut) {
  if (!rut || rut.length < 4) return '****';
  return '****' + rut.slice(-4);
}

module.exports = {
  obtenerContactoAnonimizado,
  anonimizarEmail,       // exportado para tests
  anonimizarTelefono,    // exportado para tests
};