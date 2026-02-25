// ============================================================
// DPOHANDLERS.GS — v3.1 + Slack
// ============================================================

const DPOHandlers = {

  obtenerTodasSolicitudes: function(e) {
    try {
      const estado   = e.parameter.estado   || '';
      const busqueda = e.parameter.busqueda || '';
      let solicitudes = GoogleSheetsService.obtenerTodas();
      if (estado) {
        solicitudes = solicitudes.filter(function(s) { return s.estado === estado; });
      }
      if (busqueda) {
        var txt = busqueda.toLowerCase();
        solicitudes = solicitudes.filter(function(s) {
          return (s.nombre_completo  && s.nombre_completo.toLowerCase().includes(txt))  ||
                 (s.rut              && s.rut.toLowerCase().includes(txt))              ||
                 (s.email            && s.email.toLowerCase().includes(txt))            ||
                 (s.numero_solicitud && s.numero_solicitud.toLowerCase().includes(txt));
        });
      }
      Logger.log('Solicitudes obtenidas: ' + solicitudes.length);
      return { status: 'success', data: solicitudes };
    } catch (error) {
      Logger.log('Error en obtenerTodasSolicitudes: ' + error);
      return { status: 'error', message: error.toString() };
    }
  },

  obtenerEstadisticas: function(e) {
    try {
      var solicitudes = GoogleSheetsService.obtenerTodas();
      var stats = { total: solicitudes.length, pendientes: 0, validadas: 0, en_proceso: 0, resueltas: 0, cerradas: 0, por_vencer: 0 };
      var hoy      = new Date();
      var tresDias = new Date(hoy.getTime() + 3 * 24 * 60 * 60 * 1000);
      solicitudes.forEach(function(s) {
        var est = s.estado;
        if      (est === Config.ESTADOS.PENDIENTE)  stats.pendientes++;
        else if (est === Config.ESTADOS.VALIDADA)   stats.validadas++;
        else if (est === Config.ESTADOS.EN_PROCESO) stats.en_proceso++;
        else if (est === Config.ESTADOS.RESUELTA)   stats.resueltas++;
        else if (est === Config.ESTADOS.CERRADA)    stats.cerradas++;
        if (s.fecha_limite) {
          var fl = new Date(s.fecha_limite);
          if (est !== Config.ESTADOS.RESUELTA && est !== Config.ESTADOS.CERRADA && fl < tresDias) stats.por_vencer++;
        }
      });
      return { status: 'success', data: stats };
    } catch (error) {
      Logger.log('Error en obtenerEstadisticas: ' + error);
      return { status: 'error', message: error.toString() };
    }
  },

  // ──────────────────────────────────────────
  // ACTUALIZAR SOLICITUD
  // ──────────────────────────────────────────
  actualizarSolicitud: function(data) {
    try {
      Logger.log('=== ACTUALIZANDO SOLICITUD ===');
      Logger.log('Data: ' + JSON.stringify(data));

      var id             = ((data.id             || '') + '').trim();
      var estado         = ((data.estado         || '') + '').trim();
      var notas          = ((data.notas_dpo      || '') + '').trim();
      var asignadoA      = ((data.asignado_a     || '') + '').trim();
      var asignadoEmail  = ((data.asignado_email || '') + '').trim();
      var asignadoEn     = ((data.asignado_en    || '') + '').trim();
      var fechaEntrada   = ((data.fecha_entrada_estado || '') + '').trim();
      var fechaTermino   = ((data.fecha_termino_sla    || '') + '').trim();

      if (!id) return { status: 'error', message: 'ID de solicitud requerido' };

      var ss    = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(Config.SHEETS.SOLICITUDES);
      if (!sheet) return { status: 'error', message: 'Hoja SOLICITUDES no encontrada' };

      var dataRange = sheet.getDataRange().getValues();
      var headers   = dataRange[0];

      var estadoIdx      = DPOHandlers._getIdx(headers, ['estado']);
      var emailIdx       = DPOHandlers._getIdx(headers, ['email']);
      var nombreIdx      = DPOHandlers._getIdx(headers, ['nombre_completo']);
      var numeroIdx      = DPOHandlers._getIdx(headers, ['numero_solicitud']);
      var tipoIdx        = DPOHandlers._getIdx(headers, ['tipo']);
      var notasIdx       = DPOHandlers._getIdx(headers, ['notas_dpo', 'notas']);
      var asignadoAIdx   = DPOHandlers._getIdx(headers, ['asignado_a']);
      var asignadoEmIdx  = DPOHandlers._getIdx(headers, ['asignado_email']);
      var asignadoEnIdx  = DPOHandlers._getIdx(headers, ['asignado_en']);
      var fechaEntIdx    = DPOHandlers._getIdx(headers, ['fecha_entrada_estado']);
      var fechaTermIdx   = DPOHandlers._getIdx(headers, ['fecha_termino_sla']);
      var actualizadoIdx = DPOHandlers._getIdx(headers, ['actualizado_en']);

      var fila = DPOHandlers._buscarFila(dataRange, headers, id);
      if (fila === -1) return { status: 'error', message: 'Solicitud no encontrada: ' + id };

      var emailTitular   = emailIdx  !== -1 ? dataRange[fila-1][emailIdx]  : '';
      var nombreTitular  = nombreIdx !== -1 ? dataRange[fila-1][nombreIdx] : '';
      var numeroSol      = numeroIdx !== -1 ? dataRange[fila-1][numeroIdx] : '';
      var tipoSolicitud  = tipoIdx   !== -1 ? dataRange[fila-1][tipoIdx]   : 'ACCESO';
      var estadoAnterior = estadoIdx !== -1 ? dataRange[fila-1][estadoIdx] : '';

      var now = new Date().toISOString();

      if (estado        && estadoIdx      !== -1) sheet.getRange(fila, estadoIdx      + 1).setValue(estado);
      if (notas         && notasIdx       !== -1) sheet.getRange(fila, notasIdx       + 1).setValue(notas);
      if (asignadoA     && asignadoAIdx   !== -1) sheet.getRange(fila, asignadoAIdx   + 1).setValue(asignadoA);
      if (asignadoEmail && asignadoEmIdx  !== -1) sheet.getRange(fila, asignadoEmIdx  + 1).setValue(asignadoEmail);
      if (asignadoEn    && asignadoEnIdx  !== -1) sheet.getRange(fila, asignadoEnIdx  + 1).setValue(asignadoEn || now);
      if (fechaEntrada  && fechaEntIdx    !== -1) sheet.getRange(fila, fechaEntIdx    + 1).setValue(fechaEntrada || now);
      if (fechaTermino  && fechaTermIdx   !== -1) sheet.getRange(fila, fechaTermIdx   + 1).setValue(fechaTermino);
      if (actualizadoIdx !== -1) sheet.getRange(fila, actualizadoIdx + 1).setValue(now);

      // ── Email titular ──────────────────────────────────────
      var emailTitularEnviado = false;
      if (estado && emailTitular) {
        try {
          NotificacionService.enviarCambioEstado(emailTitular, numeroSol, estado);
          emailTitularEnviado = true;
          Logger.log('Email titular OK');
        } catch (err) { Logger.log('Error email titular: ' + err); }
      }

      // ── Email responsable asignado ─────────────────────────
      var emailResponsableEnviado = false;
      if (asignadoA && asignadoEmail) {
        try {
          NotificacionService.enviarAsignacionResponsable({
            emailResponsable:  asignadoEmail,
            nombreResponsable: asignadoA,
            numeroSolicitud:   numeroSol,
            tipoSolicitud:     tipoSolicitud,
            estadoAsignado:    estado,
            nombreTitular:     nombreTitular,
            fechaInicio:       asignadoEn || now,
            fechaTermino:      fechaTermino,
          });
          emailResponsableEnviado = true;
          Logger.log('Email responsable OK');
        } catch (err) { Logger.log('Error email responsable: ' + err); }
      }

      // ── Notificación Slack ─────────────────────────────────
      try {
        SlackService.notificarCambioEstado({
          numero:          numeroSol,
          tipo:            tipoSolicitud || 'ACCESO',
          nombreTitular:   nombreTitular,
          estadoAnterior:  estadoAnterior,
          estadoNuevo:     estado,
          asignadoA:       asignadoA,
          fechaTerminoSLA: fechaTermino,
        });
      } catch (slackErr) { Logger.log('[Slack] Error: ' + slackErr); }

      Logger.log('=== ACTUALIZACIÓN COMPLETADA ===');
      return { status: 'success', message: 'Solicitud actualizada', emailTitularEnviado: emailTitularEnviado, emailResponsableEnviado: emailResponsableEnviado };

    } catch (error) {
      Logger.log('ERROR en actualizarSolicitud: ' + error);
      return { status: 'error', message: error.toString() };
    }
  },

  // ──────────────────────────────────────────
  // MARCAR COMO RESUELTA
  // ──────────────────────────────────────────
  marcarResuelta: function(data) {
    try {
      Logger.log('=== MARCANDO COMO RESUELTA ===');

      var id             = ((data.id             || '') + '').trim();
      var url_datos      = ((data.url_datos      || '') + '').trim();
      var formato        = ((data.formato_entrega || 'PDF') + '').trim();

      if (!id || !url_datos) return { status: 'error', message: 'ID y URL de datos requeridos' };

      var ss    = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(Config.SHEETS.SOLICITUDES);
      if (!sheet) return { status: 'error', message: 'Hoja SOLICITUDES no encontrada' };

      var dataRange = sheet.getDataRange().getValues();
      var headers   = dataRange[0];

      var estadoIdx      = DPOHandlers._getIdx(headers, ['estado']);
      var urlIdx         = DPOHandlers._getIdx(headers, ['url_descarga', 'url_datos']);
      var formatoIdx     = DPOHandlers._getIdx(headers, ['formato_entrega', 'formato_preferido']);
      var emailIdx       = DPOHandlers._getIdx(headers, ['email']);
      var nombreIdx      = DPOHandlers._getIdx(headers, ['nombre_completo']);
      var numeroIdx      = DPOHandlers._getIdx(headers, ['numero_solicitud']);
      var actualizadoIdx = DPOHandlers._getIdx(headers, ['actualizado_en']);

      var fila = DPOHandlers._buscarFila(dataRange, headers, id);
      if (fila === -1) return { status: 'error', message: 'Solicitud no encontrada: ' + id };

      var email  = emailIdx  !== -1 ? dataRange[fila-1][emailIdx]  : '';
      var nombre = nombreIdx !== -1 ? dataRange[fila-1][nombreIdx] : '';
      var numero = numeroIdx !== -1 ? dataRange[fila-1][numeroIdx] : '';

      if (estadoIdx      !== -1) sheet.getRange(fila, estadoIdx      + 1).setValue(Config.ESTADOS.RESUELTA);
      if (urlIdx         !== -1) sheet.getRange(fila, urlIdx         + 1).setValue(url_datos);
      if (formatoIdx     !== -1) sheet.getRange(fila, formatoIdx     + 1).setValue(formato);
      if (actualizadoIdx !== -1) sheet.getRange(fila, actualizadoIdx + 1).setValue(new Date().toISOString());

      // ── Email titular con botón descarga ───────────────────
      try {
        NotificacionService.enviarDatosListos(email, nombre, numero, url_datos, formato);
        Logger.log('Email datos listos enviado');
      } catch (err) { Logger.log('Error email: ' + err); }

      // ── Notificación Slack ─────────────────────────────────
      try {
        SlackService.notificarResuelta({ numero: numero, tipo: 'ACCESO', nombreTitular: nombre, formato: formato });
      } catch (slackErr) { Logger.log('[Slack] Error: ' + slackErr); }

      Logger.log('=== RESUELTA COMPLETADA ===');
      return { status: 'success', message: 'Solicitud resuelta y datos enviados' };

    } catch (error) {
      Logger.log('ERROR en marcarResuelta: ' + error);
      return { status: 'error', message: error.toString() };
    }
  },

  // ──────────────────────────────────────────
  // CONFIRMAR DESCARGA
  // ──────────────────────────────────────────
  confirmarDescarga: function(data) {
    try {
      Logger.log('=== CONFIRMANDO DESCARGA ===');

      var id                    = ((data.id || '') + '').trim();
      var descarga_confirmada_en = data.descarga_confirmada_en || new Date().toISOString();

      if (!id) return { status: 'error', message: 'ID requerido' };

      var ss    = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(Config.SHEETS.SOLICITUDES);
      if (!sheet) return { status: 'error', message: 'Hoja SOLICITUDES no encontrada' };

      var dataRange = sheet.getDataRange().getValues();
      var headers   = dataRange[0];
      var fila      = DPOHandlers._buscarFila(dataRange, headers, id);
      if (fila === -1) return { status: 'error', message: 'Solicitud no encontrada: ' + id };

      var estadoIdx    = DPOHandlers._getIdx(headers, ['estado']);
      var tipoIdx      = DPOHandlers._getIdx(headers, ['tipo']);
      var actualizadoIdx = DPOHandlers._getIdx(headers, ['actualizado_en']);
      var descargaIdx  = DPOHandlers._getIdx(headers, ['descarga_confirmada_en']);
      var emailIdx     = DPOHandlers._getIdx(headers, ['email']);
      var numeroIdx    = DPOHandlers._getIdx(headers, ['numero_solicitud']);

      var estadoActual  = estadoIdx !== -1 ? (dataRange[fila-1][estadoIdx] + '').trim() : '';
      var tipoSolicitud = tipoIdx   !== -1 ? (dataRange[fila-1][tipoIdx]   + '').trim() : '';
      var email         = emailIdx  !== -1 ? dataRange[fila-1][emailIdx]  : '';
      var numero        = numeroIdx !== -1 ? dataRange[fila-1][numeroIdx] : '';

      // Determinar siguiente estado desde flujo configurado
      var siguienteEstado = null;
      try {
        var configResult = ConfiguracionService.obtener();
        var flujoRaw     = configResult.data && configResult.data.flujo_config;
        if (flujoRaw) {
          var flujo   = JSON.parse(flujoRaw);
          var estados = flujo.derechos && flujo.derechos[tipoSolicitud] && flujo.derechos[tipoSolicitud].estados;
          if (estados) {
            for (var i = 0; i < estados.length; i++) {
              if (estados[i].id === estadoActual && estados[i].transiciones_posibles && estados[i].transiciones_posibles.length > 0) {
                siguienteEstado = estados[i].transiciones_posibles[0];
                break;
              }
            }
          }
        }
      } catch (flujoErr) { Logger.log('No se pudo leer flujo_config: ' + flujoErr); }

      if (!siguienteEstado) return { status: 'error', message: 'No hay transición definida desde "' + estadoActual + '"' };

      if (estadoIdx      !== -1) sheet.getRange(fila, estadoIdx      + 1).setValue(siguienteEstado);
      if (descargaIdx    !== -1) sheet.getRange(fila, descargaIdx    + 1).setValue(descarga_confirmada_en);
      if (actualizadoIdx !== -1) sheet.getRange(fila, actualizadoIdx + 1).setValue(new Date().toISOString());

      // ── Notificación Slack ─────────────────────────────────
      try {
        SlackService.notificarDescargaConfirmada({ numero: numero, nombreTitular: '', timestamp: descarga_confirmada_en });
      } catch (slackErr) { Logger.log('[Slack] Error: ' + slackErr); }

      Logger.log('=== DESCARGA CONFIRMADA OK ===');
      return { status: 'success', message: 'Descarga registrada', numero: numero, estado_anterior: estadoActual, estado_nuevo: siguienteEstado, timestamp: descarga_confirmada_en };

    } catch (error) {
      Logger.log('ERROR en confirmarDescarga: ' + error);
      return { status: 'error', message: error.toString() };
    }
  },

  // ──────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────
  _getIdx: function(headers, nombres) {
    var lista = Array.isArray(nombres) ? nombres : [nombres];
    for (var n = 0; n < lista.length; n++) {
      var idx = Utils.buscarIndiceColumna(headers, lista[n]);
      if (idx !== -1) return idx;
    }
    return -1;
  },

  _buscarFila: function(dataRange, headers, valorBuscado) {
    var idIndex     = DPOHandlers._getIdx(headers, ['id_solicitud', 'id']);
    var numeroIndex = DPOHandlers._getIdx(headers, ['numero_solicitud']);
    var valor       = valorBuscado.toString().trim();

    if (idIndex !== -1) {
      for (var i = 1; i < dataRange.length; i++) {
        if ((dataRange[i][idIndex] || '').toString().trim() === valor) return i + 1;
      }
    }
    if (numeroIndex !== -1) {
      for (var j = 1; j < dataRange.length; j++) {
        if ((dataRange[j][numeroIndex] || '').toString().trim() === valor) return j + 1;
      }
    }
    return -1;
  },

};