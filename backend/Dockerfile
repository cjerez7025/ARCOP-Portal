# ============================================================
# Dockerfile — ARCOP Backend para Cloud Run
# Node.js 20 LTS · Alpine para imagen mínima
# ============================================================

# ── Etapa 1: instalar dependencias ───────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ── Etapa 2: imagen final ─────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Usuario no-root (seguridad)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./

RUN chown -R appuser:appgroup /app
USER appuser

# Cloud Run inyecta PORT automáticamente
ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "src/index.js"]