'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const https          = require('https');
const { db }         = require('../src/services/firebase');
const { FieldValue } = require('firebase-admin/firestore');

const args    = process.argv.slice(2);
const DRY_RUN = !args.includes('--confirm');
const FORCE   = args.includes('--force');

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
  || '1JOokyzl-Rwucw_olKbU48tPIIVpEk83SOIMSpvVA9Zs';
const SHEET_NAME     = 'Configuracion';
const API_KEY        = process.env.GOOGLE_SHEETS_API_KEY;

const C = {
  reset: '\x1b[0m', green: '\x1b[32m', yellow: '\x1b[33m',
  red: '\x1b[31m',  cyan: '\x1b[36m',  gray: '\x1b[90m', bold: '\x1b[1m',
};
const log = {
  ok:   (m) => console.log(`${C.green}  OK${C.reset} ${m}`),
  warn: (m) => console.log(`${C.yellow}  WA${C.reset} ${m}`),
  err:  (m) => console.log(`${C.red}  ER${C.reset} ${m}`),
  info: (m) => console.log(`${C.cyan}  ->${ C.reset} ${m}`),
  dim:  (m) => console.log(`${C.gray}     ${m}${C.reset}`),
  head: (m) => console.log(`\n${C.bold}${m}${C.reset}`),
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        if (res.statusCode !== 200) reject(new Error('HTTP ' + res.statusCode + ': ' + raw.substring(0, 300)));
        else resolve(JSON.parse(raw));
      });
    }).on('error', reject);
  });
}

async function leerSheets() {
  log.head('Leyendo Google Sheets...');
  log.info('Spreadsheet: ' + SPREADSHEET_ID);
  log.info('Hoja: ' + SHEET_NAME);

  if (!API_KEY) {
    throw new Error(
      'Falta GOOGLE_SHEETS_API_KEY en .env\n' +
      '  1. Habilita Sheets API: https://console.cloud.google.com/apis/library/sheets.googleapis.com\n' +
      '  2. Crea API Key: https://console.cloud.google.com/apis/credentials\n' +
      '  3. Agrega GOOGLE_SHEETS_API_KEY=AIza... al .env\n' +
      '  4. Comparte la hoja: Compartir > Cualquiera con el enlace > Lector'
    );
  }

  const range = encodeURIComponent(SHEET_NAME + '!A:B');
  const url   = 'https://sheets.googleapis.com/v4/spreadsheets/' + SPREADSHEET_ID + '/values/' + range + '?key=' + API_KEY;
  const res   = await fetchJson(url);
  const rows  = res.values || [];
  log.ok(rows.length + ' filas leidas');

  const data = {};
  for (const row of rows) {
    const campo = row[0] && row[0].trim();
    const valor = (row[1] && row[1].trim()) || '';
    if (campo && campo !== 'CAMPO') data[campo] = valor;
  }
  return data;
}

function parseJSON(str, campo) {
  if (!str) return null;
  try { return JSON.parse(str); }
  catch (e) {
    log.warn(campo + ' tiene JSON invalido, se omite');
    return null;
  }
}

function buildSistema(data) {
  return {
    empresa_nombre:           data.empresa_nombre           || '',
    empresa_rut:              data.empresa_rut              || '',
    empresa_razon_social:     data.empresa_razon_social     || '',
    empresa_direccion:        data.empresa_direccion        || '',
    empresa_telefono:         data.empresa_telefono         || '',
    empresa_email:            data.empresa_email            || '',
    empresa_web:              data.empresa_web              || '',
    dpo_nombre:               data.dpo_nombre               || '',
    dpo_email:                data.dpo_email                || '',
    dpo_telefono:             data.dpo_telefono             || '',
    dpo_horario:              data.dpo_horario              || '',
    portal_nombre:            data.portal_nombre            || 'Portal ARCOP',
    portal_url:               data.portal_url               || '',
    portal_color:             data.portal_color             || '#3B82F6',
    portal_color_secundario:  data.portal_color_secundario  || '',
    logo_url:                 data.logo_url                 || '',
    dias_respuesta:           parseInt(data.dias_respuesta)  || 15,
    dias_alerta:              parseInt(data.dias_alerta)     || 3,
    dias_validacion:          parseInt(data.dias_validacion) || 5,
    notif_activas:            data.notif_activas === 'SI',
    email_cc:                 data.email_cc                  || '',
    timezone:                 data.timezone                  || 'America/Santiago',
    onboarding_completado:    false,
    migrado_desde_sheets:     true,
    migrado_en:               FieldValue.serverTimestamp(),
    version:                  data.version                   || '1.0.0',
  };
}

function buildFormularios(data) {
  const parsed = parseJSON(data.campos_formulario, 'campos_formulario');
  if (!parsed) return null;
  return Object.assign({}, parsed, { migrado_desde_sheets: true, migrado_en: FieldValue.serverTimestamp() });
}

function buildFlujos(data) {
  const parsed = parseJSON(data.flujo_config, 'flujo_config');
  if (!parsed) return null;
  if (parsed.derechos) {
    for (const key of Object.keys(parsed.derechos)) {
      const d = parsed.derechos[key];
      if (d.slack_webhook) {
        if (d.slack_webhook.includes('hooks.slack.com')) {
          log.warn('Webhook ' + key + ': Slack detectado, se elimina. Configurar Google Chat en MMPA-63.');
          d.google_chat_webhook = null;
        } else {
          d.google_chat_webhook = d.slack_webhook;
        }
        delete d.slack_webhook;
      }
    }
  }
  return Object.assign({}, parsed, { migrado_desde_sheets: true, migrado_en: FieldValue.serverTimestamp() });
}

async function escribir(col, docId, datos, label) {
  if (DRY_RUN) {
    log.info('[DRY-RUN] config/' + docId + ' -- ' + label);
    const preview = JSON.stringify(datos, function(k, v) { return k === 'migrado_en' ? '[serverTimestamp]' : v; }, 2);
    log.dim(preview.substring(0, 500) + (preview.length > 500 ? '\n     ...' : ''));
    return 'dry-run';
  }
  const snap   = await db.collection(col).doc(docId).get();
  const existe = snap.exists;
  if (existe && !FORCE) {
    log.warn('config/' + docId + ' ya existe -- omitido (usa --force para sobreescribir)');
    return 'omitido';
  }
  await db.collection(col).doc(docId).set(datos, { merge: false });
  return existe ? 'sobreescrito' : 'creado';
}

async function main() {
  console.log('\n' + C.bold + '╔═══════════════════════════════════════════╗');
  console.log('║  migrate-config.js  MMPA-103              ║');
  console.log('║  Google Sheets -> Firestore (config only) ║');
  console.log('╚═══════════════════════════════════════════╝' + C.reset);

  if (DRY_RUN) {
    log.warn('DRY-RUN -- no se escribe en Firestore. Agrega --confirm para confirmar.\n');
  } else {
    log.ok('CONFIRM -- se escribira en Firestore');
    if (FORCE) log.warn('FORCE -- sobreescribira documentos existentes');
  }

  const data = await leerSheets();

  log.head('Validando...');
  const faltantes = ['empresa_nombre', 'dpo_email'].filter(function(c) { return !data[c]; });
  if (faltantes.length) { log.err('Faltan campos requeridos: ' + faltantes.join(', ')); process.exit(1); }
  log.ok('Validacion OK');

  log.head('Construyendo documentos...');
  const sistema     = buildSistema(data);
  const formularios = buildFormularios(data);
  const flujos      = buildFlujos(data);

  log.head('Resumen:');
  log.info('config/sistema     -> ' + Object.keys(sistema).length + ' campos');
  log.dim(sistema.empresa_nombre + ' | DPO: ' + sistema.dpo_nombre + ' <' + sistema.dpo_email + '>');
  log.dim('Color: ' + sistema.portal_color + ' | Plazos: ' + sistema.dias_respuesta + 'd / ' + sistema.dias_validacion + 'd / ' + sistema.dias_alerta + 'd');
  if (formularios) log.info('config/formularios -> ' + Object.keys(formularios.derechos || {}).join(', '));
  else             log.warn('config/formularios -> OMITIDO');
  if (flujos)      log.info('config/flujos      -> ' + Object.keys(flujos.derechos || {}).join(', '));
  else             log.warn('config/flujos      -> OMITIDO');

  log.head('Escribiendo en Firestore...');
  const r = {};
  r.sistema = await escribir('config', 'sistema', sistema, 'org + DPO + plazos');
  if (formularios) r.formularios = await escribir('config', 'formularios', formularios, 'campos formulario');
  if (flujos)      r.flujos      = await escribir('config', 'flujos',      flujos,      'estados y flujos');

  log.head('Resultado final:');
  const icons  = { creado: 'OK', sobreescrito: 'UP', omitido: '--', 'dry-run': '~~' };
  const colors = { creado: C.green, sobreescrito: C.yellow, omitido: C.gray, 'dry-run': C.cyan };
  for (const doc of Object.keys(r)) {
    const res = r[doc];
    console.log('  ' + (colors[res]||'') + (icons[res]||'??') + C.reset + ' config/' + doc + ' -> ' + res);
  }

  if (DRY_RUN) {
    console.log('\n' + C.yellow + C.bold + '  Ejecuta con --confirm para aplicar los cambios.' + C.reset + '\n');
  } else {
    console.log('\n' + C.green + C.bold + '  Migracion completada. Siguiente: MMPA-91 seed derechos.' + C.reset + '\n');
  }
}

main().catch(function(err) {
  log.err('Error fatal: ' + err.message);
  if (err.message.includes('400') || err.message.includes('API_KEY')) {
    log.warn('Verifica que GOOGLE_SHEETS_API_KEY sea valida y la Sheets API este habilitada');
    log.warn('-> https://console.cloud.google.com/apis/library/sheets.googleapis.com');
  }
  if (err.message.includes('403')) {
    log.warn('La hoja no es publica. Comparte como: Cualquiera con el enlace > Lector');
  }
  process.exit(1);
});