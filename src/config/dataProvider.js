// ============================================================
// src/config/dataProvider.js — v3
// Feature flag para alternar entre backends SIN redesplegar
//
// OPCIÓN A — Variable de entorno (recomendada para CI/CD):
//   REACT_APP_DATA_PROVIDER=firebase  npm start
//
// OPCIÓN B — localStorage (para pruebas en vivo):
//   localStorage.setItem('ARCOP_PROVIDER', 'firebase')
//   + recarga la página
//
// OPCIÓN C — Valor por defecto hardcodeado aquí abajo
// ============================================================

// ── Prioridad de resolución ───────────────────────────────
// 1. localStorage (overrides todo — útil para QA en prod)
// 2. Variable de entorno (CI/CD, staging)
// 3. Default hardcodeado abajo

const fromStorage = typeof window !== 'undefined'
  ? window.localStorage?.getItem('ARCOP_PROVIDER')
  : null;

const fromEnv = process.env.REACT_APP_DATA_PROVIDER;

// ← Cambiar aquí el default cuando migres completamente a Firebase
const DEFAULT_PROVIDER = 'sheets';

export const DATA_PROVIDER = fromStorage || fromEnv || DEFAULT_PROVIDER;

// ── Helper para cambiar provider desde DevTools / UI ─────
// Uso: window.ARCOP.setProvider('firebase') → recarga sola
if (typeof window !== 'undefined') {
  window.ARCOP = window.ARCOP || {};
  window.ARCOP.setProvider = (provider) => {
    const valid = ['sheets', 'firebase'];
    if (!valid.includes(provider)) {
      console.error(`[ARCOP] Provider inválido: "${provider}". Usa: ${valid.join(' | ')}`);
      return;
    }
    window.localStorage.setItem('ARCOP_PROVIDER', provider);
    console.log(`[ARCOP] ✅ Provider cambiado a "${provider}" → recargando...`);
    window.location.reload();
  };
  window.ARCOP.getProvider = () => DATA_PROVIDER;
  window.ARCOP.clearProvider = () => {
    window.localStorage.removeItem('ARCOP_PROVIDER');
    console.log('[ARCOP] Provider reseteado al default → recargando...');
    window.location.reload();
  };
}

console.log(`🔌 [DataBus] Provider activo: ${DATA_PROVIDER}${fromStorage ? ' (localStorage override)' : fromEnv ? ' (env var)' : ' (default)'}`);

// ── Tipos válidos (para validación en adapters/index.js) ──
export const VALID_PROVIDERS = ['sheets', 'firebase'];