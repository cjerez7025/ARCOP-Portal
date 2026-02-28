// ============================================================
// src/config/dataProvider.js — v2 (reemplaza el actual)
// CAMBIAR AQUÍ PARA MIGRAR DE BACKEND
//
// 'sheets'   → Google Apps Script (activo hoy)
// 'firebase' → Firebase Firestore Santiago (cuando migres en Q2)
// ============================================================

export const DATA_PROVIDER = 'sheets';

// ── INSTRUCCIONES DE MIGRACIÓN A FIREBASE ─────────────────
//
// Cuando estés listo para migrar:
//
// 1. Crea proyecto en Firebase Console
//    → Firestore Database → región: southamerica-west1 (Santiago)
//    → Authentication → habilitar Email/Password
//
// 2. Agrega las variables en tu .env.local:
//    REACT_APP_FIREBASE_API_KEY=...
//    REACT_APP_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
//    REACT_APP_FIREBASE_PROJECT_ID=tu-proyecto
//    REACT_APP_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
//    REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
//    REACT_APP_FIREBASE_APP_ID=...
//
// 3. Inicializa en src/index.js o App.jsx:
//    import { initFirebase } from './adapters/firebaseAdapter';
//    await initFirebase({
//      apiKey:     process.env.REACT_APP_FIREBASE_API_KEY,
//      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
//      projectId:  process.env.REACT_APP_FIREBASE_PROJECT_ID,
//      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
//      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
//      appId:      process.env.REACT_APP_FIREBASE_APP_ID,
//    });
//
// 4. Cambia la línea de arriba a:
//    export const DATA_PROVIDER = 'firebase';
//
// 5. Listo. Sin cambios en componentes React.
// ──────────────────────────────────────────────────────────