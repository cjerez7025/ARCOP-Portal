# ════════════════════════════════════════════════════════════════
# COORDINACION-BRANDING.md — Épica Branding Dinámico MMPA-138
# Archivo de comunicación en tiempo real entre agentes.
# INSTRUCCIÓN: Lee este archivo COMPLETO antes de hacer cualquier cosa.
# Actualiza TU sección cada vez que completes un paso.
# ════════════════════════════════════════════════════════════════

## MAPA DE DEPENDENCIAS

  Ola 1 — Agente 1 (backend base) ──────────────────────┐
  Ola 1 — Agente 2 (frontend CSS variables) ────────────┤
                                                          ▼
  Ola 2 — Agente 1 (scraping + plantillas backend) ─────┐
  Ola 2 — Agente 2 (panel manual + WCAG frontend) ──────┤
                                                          ▼
  Ola 3 — Agente 2 (pestañas URL + plantillas + DPO) ───┤
                                                          ▼
  Agente Coordinador — Verificación + Jira ──────────────┘

## CONTRATO DE INTERFACES (NO cambiar sin avisar aquí)

  Endpoints acordados:
    GET  /api/config                          → incluye campos branding
    PUT  /api/config/branding                 → guarda branding completo
    POST /api/config/branding/extract-from-url → scraping desde URL
    GET  /api/config/branding/templates       → lista plantillas

  Campos Firestore config/{tenantId}:
    color_primario       string hex (#RRGGBB)
    color_secundario     string hex (#RRGGBB)
    color_fondo          string hex (#RRGGBB)
    color_texto          string hex (#RRGGBB)
    card_estilo          enum: glass | solido | flat
    card_radio           number 0-24
    card_sombra          enum: sutil | media | fuerte
    fuente_titulo        string (nombre Google Font)
    fuente_cuerpo        string (nombre Google Font)
    logo_url             string URL
    portal_nombre        string
    aplicar_branding_dpo boolean (default false)

  CSS Variables que el frontend aplica en document.documentElement:
    --color-primario
    --color-secundario
    --color-fondo
    --color-texto
    --card-radio
    --fuente-titulo
    --fuente-cuerpo

  Archivos que NO deben tocarse al mismo tiempo:
    backend/src/routes/config.js   → solo Agente 1
    src/pages/Configuracion.jsx    → solo Agente 2
    src/services/brandingService.js → crear nuevo, solo Agente 2

## PROTOCOLO DE CONFLICTO
  Si dos agentes necesitan el mismo archivo:
  Escribir aquí: BLOQUEADO: [archivo] — Agente X
  Al terminar:   LIBERADO:  [archivo] — Agente X

════════════════════════════════════════════════════════════════
## OLA 1 — AGENTE 1 (Backend base)
## Issues: MMPA-139 + MMPA-140
════════════════════════════════════════════════════════════════

ESTADO: COMPLETADO
INICIO: 2026-06-09
FIN: 2026-06-09

TAREAS:
[x] MMPA-139 — GET /api/config devuelve 12 campos branding con defaults
[x] MMPA-140 — PUT /api/config/branding con validación hex/enum/fuentes
[x] MMPA-143 — POST /api/config/branding/extract-from-url (cheerio)
[x] MMPA-145 — GET /api/config/branding/templates + seed-templates.js
[x] firestore.rules — agrega branding_templates collection

ARCHIVOS MODIFICADOS:
[x] backend/src/routes/config.js — 4 nuevos endpoints + 10 campos en CONFIG_DEFAULT
[x] firestore.rules — match /branding_templates/{id}
[x] backend/package.json — cheerio instalado

MENSAJE PARA AGENTE 2:
GET /api/config ahora devuelve: color_primario, color_secundario,
color_fondo, color_texto, card_estilo, card_radio, card_sombra,
fuente_titulo, fuente_cuerpo, aplicar_branding_dpo (+ logo_url, portal_nombre ya existían).
PUT /api/config/branding requiere requireAdmin + valida hex/enums.
GET /api/config/branding/templates requiere requireDPO.

BLOQUEOS: Ninguno

════════════════════════════════════════════════════════════════
## OLA 1 — AGENTE 2 (Frontend CSS variables)
## Issue: MMPA-141
════════════════════════════════════════════════════════════════

ESTADO: COMPLETADO
INICIO: 2026-06-09
FIN: 2026-06-09

TAREAS:
[x] MMPA-141 — brandingService.js creado, App.jsx llama cargarBranding()

ARCHIVOS CREADOS:
[x] src/services/brandingService.js — exporta cargarBranding(), BRANDING_DEFAULT

ARCHIVOS MODIFICADOS:
[x] src/App.jsx — useEffect(() => cargarBranding(), [])
[x] src/pages/Seguimiento.jsx — 3 colores #818cf8/#4f46e5 → var(--color-primario)

MENSAJE PARA OLA 2:
CSS vars disponibles en :root: --color-primario, --color-secundario,
--color-fondo, --color-texto, --card-radio, --fuente-titulo, --fuente-cuerpo.
DPO vars (si aplicar_branding_dpo=true): --dpo-color-primario, --dpo-color-fondo,
--dpo-color-texto, --dpo-fuente-titulo.

BLOQUEOS: Ninguno

════════════════════════════════════════════════════════════════
## OLA 2 — AGENTE 1 (Backend scraping + plantillas)
## Issues: MMPA-143 + MMPA-145
════════════════════════════════════════════════════════════════

ESTADO: COMPLETADO (implementado en Ola 1 mismo)
INICIO: 2026-06-09
FIN: 2026-06-09

TAREAS:
[x] MMPA-143 — extract-from-url con cheerio + AbortController 10s
[x] MMPA-145 — seed-templates.js (6 plantillas) + GET templates endpoint

BLOQUEOS: Ninguno

════════════════════════════════════════════════════════════════
## OLA 2 — AGENTE 2 (Panel manual + WCAG)
## Issues: MMPA-142 + MMPA-148
════════════════════════════════════════════════════════════════

ESTADO: COMPLETADO (implementado en Ola 1 mismo)
INICIO: 2026-06-09
FIN: 2026-06-09

TAREAS:
[x] MMPA-142 — TabIdentidadVisual con sub-tabs Manual/Web/Plantillas
[x] MMPA-148 — WcagBadge con ratio luminance + AA pass/fail
[x] MMPA-144 — Pestaña "Desde Web" con extracción de colores/fuentes/logo
[x] MMPA-146 — Pestaña "Plantillas" con grid de 6 templates
[x] MMPA-147 — DPO CSS vars en PanelDPO + GestionUsuarios

ARCHIVOS MODIFICADOS:
[x] src/pages/Configuracion.jsx — TabBranding reemplazado por TabIdentidadVisual
[x] src/adapters/httpAdapter.js — saveBranding, extractBrandingFromUrl, getBrandingTemplates
[x] src/pages/PanelDPO.jsx — #6366F1 → var(--dpo-color-primario, #6366F1)
[x] src/pages/GestionUsuarios.jsx — #A5B4FC → var(--dpo-color-primario, #A5B4FC)

BLOQUEOS: Ninguno

════════════════════════════════════════════════════════════════
## OLA 3 — AGENTE 2 (Pestañas URL + Plantillas + DPO)
## Issues: MMPA-144 + MMPA-146 + MMPA-147
════════════════════════════════════════════════════════════════

ESTADO: COMPLETADO (implementado en sesión única)
FIN: 2026-06-09

Todas las tareas entregadas en un único agente.

BLOQUEOS: Ninguno

════════════════════════════════════════════════════════════════
## AGENTE COORDINADOR
## Ejecutar SOLO cuando Ola 3 esté COMPLETADO
════════════════════════════════════════════════════════════════

ESTADO: EN ESPERA

CHECKLIST FINAL:
[x] GET /api/config devuelve todos los campos de branding
[x] PUT /api/config/branding valida y guarda correctamente
[x] POST /api/config/branding/extract-from-url (cheerio, 10s timeout)
[x] GET /api/config/branding/templates + seed-templates.js (6 plantillas)
[x] brandingService.cargarBranding() aplica CSS vars al cargar portal
[x] TabIdentidadVisual → sub-tab Manual guarda via httpAdapter.saveBranding()
[x] WcagBadge muestra ratio y pasa/no pasa WCAG AA (≥4.5:1)
[x] Sub-tab "Desde Web" extrae colores, fuentes, logo
[x] Sub-tab "Plantillas" muestra grid y aplica con un clic
[x] CSS vars DPO: var(--dpo-color-primario) en PanelDPO + GestionUsuarios
[x] build npm pasa sin errores ✅

PENDIENTE (requiere entorno):
[ ] Ejecutar: node backend/scripts/seed-templates.js (carga plantillas en Firestore)
[ ] Verificar visual en navegador

JIRA A TRANSICIONAR (pendiente revisor):
[ ] MMPA-139 → Finalizada
[ ] MMPA-140 → Finalizada
[ ] MMPA-141 → Finalizada
[ ] MMPA-142 → Finalizada
[ ] MMPA-143 → Finalizada
[ ] MMPA-144 → Finalizada
[ ] MMPA-145 → Finalizada
[ ] MMPA-146 → Finalizada
[ ] MMPA-147 → Finalizada
[ ] MMPA-148 → Finalizada

════════════════════════════════════════════════════════════════
## LOG DE COMUNICACIÓN
## Formato: [Agente X → Agente Y | Ola N] mensaje
════════════════════════════════════════════════════════════════

(vacío — los agentes escriben aquí a medida que avanzan)
