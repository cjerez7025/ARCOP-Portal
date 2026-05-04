'use strict';
// ============================================================
// backend/src/services/feriadosService.js
// Obtiene feriados legales de Chile desde API boostr.cl
// Cache en Firestore config/feriados/{año}  — TTL: 30 días
// Fallback: set hardcodeado del año en curso
// ============================================================

const { db } = require('./firebase');

const BOOSTR_URL = año => `https://api.boostr.cl/holidays/${año}.json`;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

// Fallback hardcodeado — solo se usa si la API y Firestore fallan
const FALLBACK = {
  2026: [
    '2026-01-01','2026-04-03','2026-04-04','2026-05-01',
    '2026-05-21','2026-06-29','2026-07-16','2026-08-15',
    '2026-09-18','2026-09-19','2026-10-12','2026-10-31',
    '2026-11-01','2026-12-08','2026-12-25',
  ],
};

// Cache en memoria por proceso (evita múltiples lecturas Firestore en la misma instancia)
const _memoriaCache = {};

/**
 * Obtiene el Set de fechas feriadas (YYYY-MM-DD) para un año.
 * Orden de resolución: memoria → Firestore → API → fallback
 */
async function getFeriadosSet(año) {
  // 1. Memoria
  if (_memoriaCache[año] && _memoriaCache[año].expira > Date.now()) {
    return _memoriaCache[año].set;
  }

  // 2. Firestore cache
  try {
    const snap = await db.collection('config').doc('feriados').collection('años').doc(String(año)).get();
    if (snap.exists) {
      const data = snap.data();
      const expira = data.cachedAt?.toMillis?.() + CACHE_TTL_MS || 0;
      if (expira > Date.now() && Array.isArray(data.fechas)) {
        const set = new Set(data.fechas);
        _memoriaCache[año] = { set, expira };
        console.log(`[feriadosService] Cache Firestore hit — ${año} (${set.size} feriados)`);
        return set;
      }
    }
  } catch (e) {
    console.warn('[feriadosService] Error leyendo cache Firestore:', e.message);
  }

  // 3. API boostr.cl
  try {
    const res  = await fetch(BOOSTR_URL(año), { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const json = await res.json();
      // Estructura: { data: [ { date: 'YYYY-MM-DD', ... }, ... ] }
      const fechas = (json.data || [])
        .map(f => (f.date || '').slice(0, 10))
        .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));

      if (fechas.length > 0) {
        const set = new Set(fechas);
        // Guardar en Firestore
        await db.collection('config').doc('feriados').collection('años').doc(String(año)).set({
          fechas,
          año,
          cachedAt:  require('firebase-admin/firestore').FieldValue.serverTimestamp(),
          fuente:    'boostr.cl',
        });
        _memoriaCache[año] = { set, expira: Date.now() + CACHE_TTL_MS };
        console.log(`[feriadosService] API boostr.cl — ${año} (${set.size} feriados) — guardado en cache`);
        return set;
      }
    }
  } catch (e) {
    console.warn('[feriadosService] Error consultando API boostr.cl:', e.message);
  }

  // 4. Fallback hardcodeado
  const fechasFallback = FALLBACK[año] || FALLBACK[Object.keys(FALLBACK).sort().at(-1)];
  console.warn(`[feriadosService] Usando fallback hardcodeado para ${año}`);
  return new Set(fechasFallback);
}

/**
 * Calcula fecha límite sumando N días corridos (Art. 11 Ley 21.719).
 * diasCorridos = 30 por defecto (plazo legal). Prorrogable otros 30.
 *
 * @param {number} diasCorridos
 * @param {Date}   desde        - fecha de inicio (default: ahora)
 * @returns {Promise<string>}   - ISO string de la fecha límite
 */
async function calcularFechaLimite(diasCorridos = 30, desde = new Date()) {
  const fecha = new Date(desde);
  fecha.setDate(fecha.getDate() + diasCorridos);
  return fecha.toISOString();
}

/**
 * Calcula fecha límite sumando N días HÁBILES (excluye fines de semana y feriados CL).
 * Usado para el plazo de bloqueo temporal: 2 días hábiles (Art. 11 inc. 4°).
 *
 * @param {number} diasHabiles
 * @param {Date}   desde
 * @returns {Promise<string>}
 */
async function calcularFechaLimiteHabil(diasHabiles = 2, desde = new Date()) {
  const fecha   = new Date(desde);
  let   count   = 0;
  // Precarga feriados para los años que podrían cruzarse
  const año1    = fecha.getFullYear();
  const año2    = año1 + 1;
  const [f1, f2] = await Promise.all([getFeriadosSet(año1), getFeriadosSet(año2)]);
  const feriados = new Set([...f1, ...f2]);

  while (count < diasHabiles) {
    fecha.setDate(fecha.getDate() + 1);
    const dow = fecha.getDay();
    const key = fecha.toISOString().split('T')[0];
    if (dow !== 0 && dow !== 6 && !feriados.has(key)) count++;
  }
  return fecha.toISOString();
}

/**
 * Renueva el cache de feriados para el año en curso y el siguiente.
 * Llamar desde un cron job anual o al iniciar el servidor.
 */
async function precalentarCache() {
  const año = new Date().getFullYear();
  await Promise.allSettled([getFeriadosSet(año), getFeriadosSet(año + 1)]);
  console.log(`[feriadosService] Cache precalentado para ${año} y ${año + 1}`);
}

module.exports = { calcularFechaLimite, calcularFechaLimiteHabil, getFeriadosSet, precalentarCache };