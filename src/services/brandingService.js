// src/services/brandingService.js — MMPA-141
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const BRANDING_DEFAULT = {
  color_primario:       '#2563eb',
  color_secundario:     '#1e40af',
  color_fondo:          '#f8fafc',
  color_texto:          '#1e293b',
  card_radio:           '12',
  fuente_titulo:        'Inter',
  fuente_cuerpo:        'Inter',
  aplicar_branding_dpo: false,
};

function applyVars(b) {
  const root = document.documentElement;
  root.style.setProperty('--color-primario',   b.color_primario   || BRANDING_DEFAULT.color_primario);
  root.style.setProperty('--color-secundario', b.color_secundario || BRANDING_DEFAULT.color_secundario);
  root.style.setProperty('--color-fondo',      b.color_fondo      || BRANDING_DEFAULT.color_fondo);
  root.style.setProperty('--color-texto',      b.color_texto      || BRANDING_DEFAULT.color_texto);
  root.style.setProperty('--card-radio',       (b.card_radio || '12') + 'px');
  root.style.setProperty('--fuente-titulo',    `'${b.fuente_titulo || 'Inter'}', system-ui, sans-serif`);
  root.style.setProperty('--fuente-cuerpo',    `'${b.fuente_cuerpo || 'Inter'}', system-ui, sans-serif`);

  if (b.aplicar_branding_dpo) {
    root.style.setProperty('--dpo-color-primario', b.dpo_color_primario || b.color_primario || BRANDING_DEFAULT.color_primario);
    root.style.setProperty('--dpo-color-fondo',    b.dpo_color_fondo    || b.color_fondo    || BRANDING_DEFAULT.color_fondo);
    root.style.setProperty('--dpo-color-texto',    b.dpo_color_texto    || b.color_texto    || BRANDING_DEFAULT.color_texto);
    root.style.setProperty('--dpo-fuente-titulo',  `'${b.dpo_fuente_titulo || b.fuente_titulo || 'Inter'}', system-ui, sans-serif`);
  }
}

export async function cargarBranding() {
  try {
    const res  = await fetch(`${API_URL}/api/config`);
    if (!res.ok) { applyVars(BRANDING_DEFAULT); return; }
    const json = await res.json();
    applyVars({ ...BRANDING_DEFAULT, ...(json.data || {}) });
  } catch {
    applyVars(BRANDING_DEFAULT);
  }
}
