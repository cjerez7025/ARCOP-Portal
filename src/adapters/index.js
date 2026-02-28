// ============================================================
// src/adapters/index.js — v2 (reemplaza el actual)
// Exporta el adaptador activo según DATA_PROVIDER
// ============================================================

import { DATA_PROVIDER } from '../config/dataProvider';
import sheetsAdapter   from './sheetsAdapter';
import firebaseAdapter from './firebaseAdapter';

// postgresAdapter se agrega en 2027 cuando sea necesario
// import postgresAdapter from './postgresAdapter';

const ADAPTERS = {
  sheets:   sheetsAdapter,
  firebase: firebaseAdapter,
  // postgres: postgresAdapter,  ← descomentar en 2027
};

const adapter = ADAPTERS[DATA_PROVIDER];

if (!adapter) {
  throw new Error(
    `[DataBus] Proveedor desconocido: "${DATA_PROVIDER}". ` +
    `Valores válidos: sheets | firebase`
  );
}

console.log(`🔌 [DataBus] Adaptador activo: ${DATA_PROVIDER}`);

export default adapter;