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
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'aligndata-arcop.firebasestorage.app',
  });
}

const db   = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket(
  process.env.FIREBASE_STORAGE_BUCKET || 'aligndata-arcop.firebasestorage.app'
);

module.exports = { admin, db, auth, bucket };