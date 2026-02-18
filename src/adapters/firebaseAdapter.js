// ============================================================
// FIREBASE ADAPTER — STUB (Fase 3)
// Implementar cada función cuando se migre a Firebase.
// El contrato es idéntico al de sheetsAdapter.js
// ============================================================

// import { db, auth } from '../config/firebase'
// import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc } from 'firebase/firestore'

const NOT_IMPLEMENTED = (fn) => {
  throw new Error(`Firebase adapter: ${fn}() aún no implementado. Usa DATA_PROVIDER='sheets'.`);
};

const firebaseAdapter = {

  // ── Configuración del sistema ──────────────────────────
  getConfig:             async ()           => NOT_IMPLEMENTED('getConfig'),
  saveConfig:            async (data)       => NOT_IMPLEMENTED('saveConfig'),
  restoreConfig:         async ()           => NOT_IMPLEMENTED('restoreConfig'),

  // ── Configuración de formularios dinámicos ─────────────
  getFormularioConfig:   async ()           => NOT_IMPLEMENTED('getFormularioConfig'),
  saveFormularioConfig:  async (config)     => NOT_IMPLEMENTED('saveFormularioConfig'),

  // ── Solicitudes ────────────────────────────────────────
  createSolicitud:       async (sol)        => NOT_IMPLEMENTED('createSolicitud'),
  getSolicitudes:        async (filtros)    => NOT_IMPLEMENTED('getSolicitudes'),
  getSolicitudPorNumero: async (numero)     => NOT_IMPLEMENTED('getSolicitudPorNumero'),
  getSolicitudPorToken:  async (token)      => NOT_IMPLEMENTED('getSolicitudPorToken'),
  updateSolicitud:       async (id, data)   => NOT_IMPLEMENTED('updateSolicitud'),
  resolverSolicitud:     async (id, u, f)   => NOT_IMPLEMENTED('resolverSolicitud'),
  validarIdentidad:      async (token)      => NOT_IMPLEMENTED('validarIdentidad'),

  // ── Estadísticas ───────────────────────────────────────
  getEstadisticas:       async ()           => NOT_IMPLEMENTED('getEstadisticas'),

  // ── GUÍA DE IMPLEMENTACIÓN ────────────────────────────
  // Firestore collections sugeridas:
  //   /config/sistema          → getConfig / saveConfig
  //   /config/formularios      → getFormularioConfig / saveFormularioConfig
  //   /solicitudes/{id}        → createSolicitud / getSolicitudes / updateSolicitud
  //
  // Ejemplo getConfig:
  // getConfig: async () => {
  //   const snap = await getDoc(doc(db, 'config', 'sistema'));
  //   return { status: 'success', data: snap.data() };
  // },
};

export default firebaseAdapter;