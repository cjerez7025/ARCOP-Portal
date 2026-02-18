// ============================================================
// ADAPTERS/INDEX.JS
// Exporta el adaptador activo según DATA_PROVIDER
// ============================================================

import { DATA_PROVIDER } from '../config/dataProvider';
import sheetsAdapter   from './sheetsAdapter';
import firebaseAdapter from './firebaseAdapter';

const adapter = DATA_PROVIDER === 'firebase' ? firebaseAdapter : sheetsAdapter;

export default adapter;