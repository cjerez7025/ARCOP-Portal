// ============================================================
// src/services/firebase.js
// Firebase Admin SDK — se autentica automáticamente en Cloud Run
// via Application Default Credentials (sin archivo JSON).
// En local: apunta a GOOGLE_APPLICATION_CREDENTIALS o emulador.
// ============================================================
'use strict';

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
    // En Cloud Run no se necesita credential explícita:
    // GCP infiere el Service Account del container automáticamente.
    // En local con emulador se usa FIREBASE_AUTH_EMULATOR_HOST etc.
  });
}

const db   = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };