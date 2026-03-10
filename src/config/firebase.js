// ============================================================
// src/config/firebase.js
// Inicialización del SDK Firebase para ARCOP
//
// REGIÓN: southamerica-west1 (Santiago, Chile)
// Cumplimiento Art. 27 Ley 21.719 — datos en territorio nacional
//
// Variables de entorno requeridas en .env.local:
//   REACT_APP_FIREBASE_API_KEY
//   REACT_APP_FIREBASE_AUTH_DOMAIN
//   REACT_APP_FIREBASE_PROJECT_ID
//   REACT_APP_FIREBASE_STORAGE_BUCKET
//   REACT_APP_FIREBASE_MESSAGING_SENDER_ID
//   REACT_APP_FIREBASE_APP_ID
// ============================================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import {
  getAuth,
  connectAuthEmulator,
} from 'firebase/auth';

// ── Configuración desde variables de entorno ──────────────
const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

// ── Validación temprana de configuración ──────────────────
const REQUIRED_KEYS = [
  'apiKey', 'authDomain', 'projectId',
  'storageBucket', 'messagingSenderId', 'appId',
];

const missingKeys = REQUIRED_KEYS.filter(k => !firebaseConfig[k]);
if (missingKeys.length > 0) {
  console.error(
    `[Firebase] ❌ Faltan variables de entorno: ${missingKeys.map(k =>
      `REACT_APP_FIREBASE_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}`
    ).join(', ')}`
  );
}

// ── Singleton: evitar re-inicialización en hot-reload ─────
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

// ── Servicios ─────────────────────────────────────────────
export const db   = getFirestore(app);
export const auth = getAuth(app);

// ── Emuladores para desarrollo local ─────────────────────
// Para usar: REACT_APP_USE_EMULATOR=true npm start
if (process.env.REACT_APP_USE_EMULATOR === 'true') {
  console.log('🔧 [Firebase] Usando emuladores locales');
  connectFirestoreEmulator(db,   'localhost', 8080);
  connectAuthEmulator(auth,      'http://localhost:9099');
}

// ── Persistencia offline (opcional, útil para DPOs) ──────
if (process.env.NODE_ENV === 'production') {
  enableIndexedDbPersistence(db).catch(err => {
    if (err.code === 'failed-precondition') {
      // Múltiples tabs abiertas — solo funciona en una
      console.warn('[Firebase] Persistencia offline no disponible (múltiples tabs)');
    } else if (err.code === 'unimplemented') {
      console.warn('[Firebase] Persistencia offline no soportada en este navegador');
    }
  });
}

export default app;