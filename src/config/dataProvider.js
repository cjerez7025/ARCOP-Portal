// ============================================================
// src/config/dataProvider.js — v4
// FIX: 'http' agregado a la lista válida de setProvider
// ============================================================

const fromStorage = typeof window !== 'undefined'
  ? window.localStorage?.getItem('ARCOP_PROVIDER')
  : null;

const fromEnv = process.env.REACT_APP_DATA_PROVIDER;

const DEFAULT_PROVIDER = 'http';

export const DATA_PROVIDER = fromStorage || fromEnv || DEFAULT_PROVIDER;

export const VALID_PROVIDERS = ['sheets', 'firebase', 'http'];

if (typeof window !== 'undefined') {
  window.ARCOP = window.ARCOP || {};

  window.ARCOP.setProvider = (provider) => {
    if (!VALID_PROVIDERS.includes(provider)) {
      console.error(`[ARCOP] Provider inválido: "${provider}". Usa: ${VALID_PROVIDERS.join(' | ')}`);
      return;
    }
    window.localStorage.setItem('ARCOP_PROVIDER', provider);
    console.log(`[ARCOP] ✅ Provider cambiado a "${provider}" → recargando...`);
    window.location.reload();
  };

  window.ARCOP.getProvider  = () => DATA_PROVIDER;

  window.ARCOP.clearProvider = () => {
    window.localStorage.removeItem('ARCOP_PROVIDER');
    console.log('[ARCOP] Provider reseteado al default → recargando...');
    window.location.reload();
  };
}

console.log(
  `🔌 [DataBus] Provider activo: ${DATA_PROVIDER}` +
  (fromStorage ? ' (localStorage)' : fromEnv ? ' (env var)' : ' (default)')
);