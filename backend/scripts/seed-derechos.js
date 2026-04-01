'use strict';

// ============================================================
// scripts/seed-derechos.js
// MMPA-91 — Seed 5 derechos base en colección raíz "derechos/"
//
// Lee config/formularios y config/flujos (ya en Firestore)
// y crea derechos/ACCESO, derechos/RECTIFICACION, etc.
//
// Uso:
//   node scripts/seed-derechos.js             # dry-run
//   node scripts/seed-derechos.js --confirm   # escribe en Firestore
//   node scripts/seed-derechos.js --confirm --force  # sobreescribe
// ============================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { db }         = require('../src/services/firebase');
const { FieldValue } = require('firebase-admin/firestore');

const args    = process.argv.slice(2);
const DRY_RUN = !args.includes('--confirm');
const FORCE   = args.includes('--force');

// ── Colores ANSI ──────────────────────────────────────────
const C = {
  reset: '\x1b[0m', green: '\x1b[32m', yellow: '\x1b[33m',
  red: '\x1b[31m',  cyan: '\x1b[36m',  gray: '\x1b[90m', bold: '\x1b[1m',
};
const log = {
  ok:   (m) => console.log(C.green  + '  OK ' + C.reset + m),
  warn: (m) => console.log(C.yellow + '  WA ' + C.reset + m),
  err:  (m) => console.log(C.red    + '  ER ' + C.reset + m),
  info: (m) => console.log(C.cyan   + '  -> ' + C.reset + m),
  dim:  (m) => console.log(C.gray   + '     ' + m + C.reset),
  head: (m) => console.log('\n' + C.bold + m + C.reset),
};

// ── Metadata base de cada derecho ─────────────────────────
// Datos que NO vienen de Sheets — son propios del schema nuevo
const DERECHOS_META = {
  ACCESO: {
    nombre:      'Acceso',
    articulo:    'Art. 5° Ley 21.719',
    descripcion: 'Conoce qué datos personales tenemos sobre ti',
    icono:       'search',
    color:       '#3B82F6',
    orden:       1,
    protegido:   true,
    origen:      'ley',
  },
  RECTIFICACION: {
    nombre:      'Rectificación',
    articulo:    'Art. 6° Ley 21.719',
    descripcion: 'Corrige tus datos personales incorrectos o incompletos',
    icono:       'edit',
    color:       '#F59E0B',
    orden:       2,
    protegido:   true,
    origen:      'ley',
  },
  CANCELACION: {
    nombre:      'Cancelación',
    articulo:    'Art. 7° Ley 21.719',
    descripcion: 'Solicita la eliminación de tus datos de nuestros registros',
    icono:       'trash',
    color:       '#EF4444',
    orden:       3,
    protegido:   true,
    origen:      'ley',
  },
  OPOSICION: {
    nombre:      'Oposición',
    articulo:    'Art. 8° Ley 21.719',
    descripcion: 'Oponte al tratamiento de tus datos personales',
    icono:       'hand',
    color:       '#8B5CF6',
    orden:       4,
    protegido:   true,
    origen:      'ley',
  },
  PORTABILIDAD: {
    nombre:      'Portabilidad',
    articulo:    'Art. 9° Ley 21.719',
    descripcion: 'Recibe tus datos en formato estructurado y transferible',
    icono:       'export',
    color:       '#10B981',
    orden:       5,
    protegido:   true,
    origen:      'ley',
  },
};

// ── Leer config/formularios desde Firestore ───────────────
async function leerFormularios() {
  const snap = await db.collection('config').doc('formularios').get();
  if (!snap.exists) throw new Error('config/formularios no existe — ejecuta primero MMPA-103');
  return snap.data();
}

// ── Leer config/flujos desde Firestore ────────────────────
async function leerFlujos() {
  const snap = await db.collection('config').doc('flujos').get();
  if (!snap.exists) throw new Error('config/flujos no existe — ejecuta primero MMPA-103');
  return snap.data();
}

// ── Escribir en derechos/{id} ─────────────────────────────
async function escribir(id, datos) {
  if (DRY_RUN) {
    log.info('[DRY-RUN] derechos/' + id);
    const preview = JSON.stringify(datos, (k, v) => {
      if (k === 'creado_en' || k === 'actualizado_en') return '[serverTimestamp]';
      if (k === 'campos' || k === 'estados') return '[... ' + (Array.isArray(v) ? v.length : 0) + ' items]';
      return v;
    }, 2);
    log.dim(preview);
    return 'dry-run';
  }

  const ref   = db.collection('derechos').doc(id);
  const snap  = await ref.get();
  const existe = snap.exists;

  if (existe && !FORCE) {
    log.warn('derechos/' + id + ' ya existe — omitido (usa --force para sobreescribir)');
    return 'omitido';
  }

  await ref.set(datos, { merge: false });
  return existe ? 'sobreescrito' : 'creado';
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  console.log('\n' + C.bold + '╔══════════════════════════════════════════╗');
  console.log('║  seed-derechos.js  MMPA-91               ║');
  console.log('║  Seed 5 derechos base -> derechos/{id}   ║');
  console.log('╚══════════════════════════════════════════╝' + C.reset);

  if (DRY_RUN) {
    log.warn('DRY-RUN — no se escribe en Firestore. Agrega --confirm para confirmar.\n');
  } else {
    log.ok('CONFIRM — se escribira en Firestore');
    if (FORCE) log.warn('FORCE — sobreescribira documentos existentes');
  }

  // 1. Leer fuentes de datos
  log.head('Leyendo config/formularios y config/flujos...');
  const formularios = await leerFormularios();
  const flujos      = await leerFlujos();
  log.ok('config/formularios leido — derechos: ' + Object.keys(formularios.derechos || {}).join(', '));
  log.ok('config/flujos leido      — derechos: ' + Object.keys(flujos.derechos || {}).join(', '));

  // 2. Construir y escribir cada derecho
  log.head('Construyendo documentos derechos/{id}...');
  const resultados = {};

  for (const [id, meta] of Object.entries(DERECHOS_META)) {
    const camposFormulario = formularios.derechos?.[id]?.campos || [];
    const estadosFlujo     = flujos.derechos?.[id]?.estados    || [];
    const activoFlujo      = flujos.derechos?.[id]?.activo     ?? true;

    const doc = {
      // Datos base (meta)
      id,
      nombre:      meta.nombre,
      articulo:    meta.articulo,
      descripcion: meta.descripcion,
      icono:       meta.icono,
      color:       meta.color,
      orden:       meta.orden,
      protegido:   meta.protegido,
      origen:      meta.origen,

      // Estado operativo
      activo:      activoFlujo,
      sla_dias:    15,

      // Resumen de configuración (para referencia rápida en UI)
      total_campos:  camposFormulario.length,
      total_estados: estadosFlujo.length,

      // Control
      migrado_desde_sheets: true,
      creado_en:            FieldValue.serverTimestamp(),
      actualizado_en:       FieldValue.serverTimestamp(),
    };

    const res = await escribir(id, doc);
    resultados[id] = res;

    const icons  = { creado: 'OK', sobreescrito: 'UP', omitido: '--', 'dry-run': '~~' };
    const colors = { creado: C.green, sobreescrito: C.yellow, omitido: C.gray, 'dry-run': C.cyan };
    console.log('  ' + (colors[res] || '') + icons[res] + C.reset +
      ' derechos/' + id + ' -> ' + res +
      C.gray + ' (' + camposFormulario.length + ' campos, ' + estadosFlujo.length + ' estados)' + C.reset);
  }

  // 3. Resumen
  log.head('Resultado:');
  const creados     = Object.values(resultados).filter(r => r === 'creado').length;
  const omitidos    = Object.values(resultados).filter(r => r === 'omitido').length;
  const dryRuns     = Object.values(resultados).filter(r => r === 'dry-run').length;

  if (DRY_RUN) {
    log.info(dryRuns + ' documentos listos para crear en derechos/');
    console.log('\n' + C.yellow + C.bold + '  Ejecuta con --confirm para aplicar.' + C.reset + '\n');
  } else {
    log.ok(creados + ' derechos creados');
    if (omitidos > 0) log.warn(omitidos + ' omitidos (ya existian — usa --force para sobreescribir)');
    console.log('\n' + C.green + C.bold + '  Seed completado. Los 5 derechos base estan en Firestore.' + C.reset);
    console.log(C.gray + '  Siguiente: verificar en TabDerechos que aparecen en el panel izquierdo.' + C.reset + '\n');
  }
}

main().catch(err => {
  log.err('Error fatal: ' + err.message);
  console.error(err);
  process.exit(1);
});