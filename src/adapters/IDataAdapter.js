// ============================================================
// src/adapters/IDataAdapter.js
// INTERFAZ ESTÁNDAR — Contrato que TODOS los adaptadores
// deben implementar. Si un método no existe → error claro.
//
// REGLA DE ORO: Los componentes React NUNCA importan
// sheetsAdapter ni firebaseAdapter directamente.
// Solo hablan con este contrato a través del DataService.
//
// Para cambiar de Firebase a PostgreSQL en 2027:
//   1. Crear postgresAdapter.js implementando esta interfaz
//   2. Cambiar DATA_PROVIDER='postgres' en .env
//   3. Listo. Cero cambios en componentes.
// ============================================================

export class IDataAdapter {

  // ── Nombre del adaptador (para logs) ─────────────────────
  get nombre() {
    throw new Error(`[IDataAdapter] Implementa 'nombre' en ${this.constructor.name}`);
  }

  // ── Respuesta estándar ────────────────────────────────────
  // TODOS los métodos retornan esta forma:
  // { status: 'success' | 'error', data: any, message?: string }
  // Los componentes solo chequean result.status — nunca
  // hacen parse de estructuras internas distintas.

  _ok(data)        { return { status: 'success', data }; }
  _err(msg, error) {
    console.error(`[${this.nombre}]`, msg, error);
    return { status: 'error', data: null, message: msg };
  }

  // =========================================================
  // BLOQUE 1 — CONFIGURACIÓN DEL SISTEMA
  // =========================================================

  /** Obtiene configuración general del tenant */
  async getConfig() {
    throw new Error(`[${this.constructor.name}] No implementa getConfig()`);
  }

  /** Guarda configuración general */
  async saveConfig(data) {
    throw new Error(`[${this.constructor.name}] No implementa saveConfig()`);
  }

  /** Restaura configuración a valores por defecto */
  async restoreConfig() {
    throw new Error(`[${this.constructor.name}] No implementa restoreConfig()`);
  }

  // =========================================================
  // BLOQUE 2 — FORMULARIOS DINÁMICOS
  // =========================================================

  /** Obtiene configuración de campos por derecho */
  async getFormularioConfig() {
    throw new Error(`[${this.constructor.name}] No implementa getFormularioConfig()`);
  }

  /** Guarda configuración de formularios */
  async saveFormularioConfig(config) {
    throw new Error(`[${this.constructor.name}] No implementa saveFormularioConfig()`);
  }

  // =========================================================
  // BLOQUE 3 — FLUJOS DE ESTADO
  // =========================================================

  /** Obtiene configuración de flujos por derecho ARCO */
  async getFlujoConfig() {
    throw new Error(`[${this.constructor.name}] No implementa getFlujoConfig()`);
  }

  /** Guarda configuración de flujos */
  async saveFlujoConfig(config) {
    throw new Error(`[${this.constructor.name}] No implementa saveFlujoConfig()`);
  }

  // =========================================================
  // BLOQUE 4 — SOLICITUDES ARCO
  // =========================================================

  /**
   * Crea una nueva solicitud ARCO
   * @param {Object} solicitud - datos del titular + tipo + canal
   * @returns {{ status, data: Solicitud }}
   */
  async createSolicitud(solicitud) {
    throw new Error(`[${this.constructor.name}] No implementa createSolicitud()`);
  }

  /**
   * Obtiene lista de solicitudes con filtros opcionales
   * @param {Object} filtros - { estado, busqueda, tipo, soloVencidas }
   * @returns {{ status, data: Solicitud[] }}
   */
  async getSolicitudes(filtros = {}) {
    throw new Error(`[${this.constructor.name}] No implementa getSolicitudes()`);
  }

  /**
   * Obtiene solicitud por número público (ej: "ACC-2026-0001")
   * @param {string} numero
   * @returns {{ status, data: Solicitud }}
   */
  async getSolicitudPorNumero(numero) {
    throw new Error(`[${this.constructor.name}] No implementa getSolicitudPorNumero()`);
  }

  /**
   * Obtiene solicitud por token de validación de identidad
   * @param {string} token
   * @returns {{ status, data: Solicitud }}
   */
  async getSolicitudPorToken(token) {
    throw new Error(`[${this.constructor.name}] No implementa getSolicitudPorToken()`);
  }

  /**
   * Actualiza campos de una solicitud (estado, asignado, notas, etc.)
   * @param {string} id - ID interno de la solicitud
   * @param {Object} changes - campos a actualizar
   * @returns {{ status, data: Solicitud }}
   */
  async updateSolicitud(id, changes) {
    throw new Error(`[${this.constructor.name}] No implementa updateSolicitud()`);
  }

  /**
   * Marca solicitud como resuelta y adjunta URL de descarga
   * @param {string} id
   * @param {string} urlDatos - URL firmada del archivo de datos
   * @param {string} formatoEntrega - 'JSON' | 'PDF' | 'CSV' | 'XLS'
   * @returns {{ status, data: Solicitud }}
   */
  async resolverSolicitud(id, urlDatos, formatoEntrega) {
    throw new Error(`[${this.constructor.name}] No implementa resolverSolicitud()`);
  }

  /**
   * Confirma que el titular descargó su información
   * Cambia estado a DESCARGA_CONFIRMADA
   * @param {string} id
   * @returns {{ status, data: Solicitud }}
   */
  async confirmarDescarga(id) {
    throw new Error(`[${this.constructor.name}] No implementa confirmarDescarga()`);
  }

  /**
   * Valida identidad del titular por token
   * @param {string} token
   * @returns {{ status, data: { validado: boolean, solicitudId: string } }}
   */
  async validarIdentidad(token) {
    throw new Error(`[${this.constructor.name}] No implementa validarIdentidad()`);
  }

  // =========================================================
  // BLOQUE 5 — ESTADÍSTICAS Y DASHBOARD
  // =========================================================

  /**
   * Obtiene métricas para el panel DPO
   * @returns {{ status, data: Metricas }}
   */
  async getEstadisticas() {
    throw new Error(`[${this.constructor.name}] No implementa getEstadisticas()`);
  }

  // =========================================================
  // BLOQUE 6 — AUDITORÍA (nuevo — cumplimiento Ley 21.719)
  // =========================================================

  /**
   * Registra evento de auditoría inmutable
   * @param {Object} evento - { accion, entidadTipo, entidadId, userId, detalles }
   * @returns {{ status, data: EventoAuditoria }}
   */
  async registrarAuditoria(evento) {
    // Opcional en Sheets — requerido en Firebase y PostgreSQL
    console.warn(`[${this.constructor.name}] registrarAuditoria() no implementado`);
    return this._ok(null);
  }

  /**
   * Obtiene log de auditoría filtrado
   * @param {Object} filtros - { desde, hasta, accion, userId }
   * @returns {{ status, data: EventoAuditoria[] }}
   */
  async getAuditoria(filtros = {}) {
    console.warn(`[${this.constructor.name}] getAuditoria() no implementado`);
    return this._ok([]);
  }
}