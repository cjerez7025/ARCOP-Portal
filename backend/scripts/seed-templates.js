// backend/scripts/seed-templates.js — MMPA-145
// Ejecutar: node backend/scripts/seed-templates.js
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId:  process.env.FIREBASE_PROJECT_ID,
  });
}
const db = admin.firestore();

const TEMPLATES = [
  {
    nombre:           'Corporativo Azul',
    descripcion:      'Perfil profesional con tonos azules institucionales',
    color_primario:   '#2563eb',
    color_secundario: '#1e40af',
    color_fondo:      '#f8fafc',
    color_texto:      '#1e293b',
    card_estilo:      'rounded',
    card_radio:       '12',
    card_sombra:      'soft',
    fuente_titulo:    'Inter',
    fuente_cuerpo:    'Inter',
  },
  {
    nombre:           'Verde Naturaleza',
    descripcion:      'Inspira confianza con verdes frescos y tranquilos',
    color_primario:   '#16a34a',
    color_secundario: '#15803d',
    color_fondo:      '#f0fdf4',
    color_texto:      '#14532d',
    card_estilo:      'rounded',
    card_radio:       '16',
    card_sombra:      'soft',
    fuente_titulo:    'Poppins',
    fuente_cuerpo:    'Inter',
  },
  {
    nombre:           'Rojo Institucional',
    descripcion:      'Autoridad y formalidad con rojos corporativos',
    color_primario:   '#dc2626',
    color_secundario: '#b91c1c',
    color_fondo:      '#fff7f7',
    color_texto:      '#1e293b',
    card_estilo:      'sharp',
    card_radio:       '4',
    card_sombra:      'medium',
    fuente_titulo:    'Montserrat',
    fuente_cuerpo:    'Roboto',
  },
  {
    nombre:           'Morado Premium',
    descripcion:      'Elegancia y modernidad con violetas profundos',
    color_primario:   '#7c3aed',
    color_secundario: '#6d28d9',
    color_fondo:      '#faf5ff',
    color_texto:      '#1e1b4b',
    card_estilo:      'rounded',
    card_radio:       '20',
    card_sombra:      'strong',
    fuente_titulo:    'Plus Jakarta Sans',
    fuente_cuerpo:    'DM Sans',
  },
  {
    nombre:           'Gris Moderno',
    descripcion:      'Minimalismo sofisticado en escala de grises',
    color_primario:   '#374151',
    color_secundario: '#1f2937',
    color_fondo:      '#f9fafb',
    color_texto:      '#111827',
    card_estilo:      'sharp',
    card_radio:       '8',
    card_sombra:      'none',
    fuente_titulo:    'DM Sans',
    fuente_cuerpo:    'Inter',
  },
  {
    nombre:           'Naranja Vibrante',
    descripcion:      'Energía y dinamismo con naranjas llamativos',
    color_primario:   '#ea580c',
    color_secundario: '#c2410c',
    color_fondo:      '#fff7ed',
    color_texto:      '#431407',
    card_estilo:      'pill',
    card_radio:       '24',
    card_sombra:      'medium',
    fuente_titulo:    'Raleway',
    fuente_cuerpo:    'Open Sans',
  },
];

async function main() {
  const coll = db.collection('branding_templates');
  for (const tpl of TEMPLATES) {
    await coll.add({ ...tpl, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log('  ✅', tpl.nombre);
  }
  console.log('\n6 plantillas sembradas correctamente.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
