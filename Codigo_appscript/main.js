// ============================================
// MAIN.GS - PUNTO DE ENTRADA
// Portal ARCOP v2.4
// ============================================

function doPost(e) {
  try {
    const action = e.parameter.action;
    const data = e.postData ? JSON.parse(e.postData.contents) : {};

    Logger.log('POST recibido - Action: ' + action);

    if (action === 'createSolicitud') {
      return jsonResponse(SolicitudService.crear(data.solicitud));
    }

    if (action === 'validarIdentidad') {
      return jsonResponse(SolicitudService.validarIdentidad(data.token));
    }

    if (action === 'actualizarSolicitud') {
      return jsonResponse(DPOHandlers.actualizarSolicitud(data));
    }

    if (action === 'marcarResuelta') {
      return jsonResponse(DPOHandlers.marcarResuelta(data));
    }

    if (action === 'guardarConfiguracion') {
      return jsonResponse(ConfiguracionService.guardar(data));
    }

    if (action === 'restaurarConfiguracion') {
      return jsonResponse(ConfiguracionService.restaurarDefault());
    }

    return jsonResponse({ status: 'error', message: 'Acción POST no válida: ' + action });

  } catch (error) {
    Logger.log('Error en doPost: ' + error);
    return jsonResponse({ status: 'error', message: error.toString() });
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;

    Logger.log('GET recibido - Action: ' + action);

    // ── Solicitudes públicas ──────────────────────────────
    if (action === 'getSolicitud') {
      return jsonResponse(SolicitudService.obtenerPorToken(e.parameter.token));
    }

    if (action === 'getSolicitudesPorEmail') {
      return jsonResponse(SolicitudService.obtenerPorEmail(e.parameter.email));
    }

    // ✅ Acción usada por Seguimiento.jsx
    if (action === 'obtenerSeguimiento') {
      return jsonResponse(SolicitudService.obtenerPorNumero(e.parameter.numero));
    }

    // Alias alternativo (por compatibilidad)
    if (action === 'getSolicitudPorNumero') {
      return jsonResponse(SolicitudService.obtenerPorNumero(e.parameter.numero));
    }

    // ── Panel DPO ─────────────────────────────────────────
    if (action === 'getTodasSolicitudes') {
      return jsonResponse(DPOHandlers.obtenerTodasSolicitudes(e));
    }

    if (action === 'getEstadisticas') {
      return jsonResponse(DPOHandlers.obtenerEstadisticas(e));
    }

    // ── Configuración ─────────────────────────────────────
    if (action === 'getConfiguracion') {
      return jsonResponse(ConfiguracionService.obtener());
    }

    if (action === 'exportarConfiguracion') {
      return jsonResponse(ConfiguracionService.exportar());
    }

    // Acción no encontrada
    return jsonResponse({ status: 'error', message: 'Acción GET no válida: ' + action });

  } catch (error) {
    Logger.log('Error en doGet: ' + error);
    return jsonResponse({ status: 'error', message: error.toString() });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}