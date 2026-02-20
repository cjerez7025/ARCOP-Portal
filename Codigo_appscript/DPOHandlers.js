// ============================================
// DPOHANDLERS.GS - v2.7
// Agrega confirmarDescarga() para registrar
// el evento de descarga del titular
// ============================================

const DPOHandlers = {

  // ──────────────────────────────────────────
  // OBTENER TODAS LAS SOLICITUDES CON FILTROS
  // ──────────────────────────────────────────
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

  // ──────────────────────────────────────────
  // OBTENER ESTADÍSTICAS
  // ──────────────────────────────────────────
  obtenerEstadisticas: function(e) {
    try {
      var solicitudes = GoogleSheetsService.obtenerTodas();

      var stats = {
        total:      solicitudes.length,
        pendientes: 0,
        validadas:  0,
        en_proceso: 0,
        resueltas:  0,
        cerradas:   0,
        por_vencer: 0
      };

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
          if (est !== Config.ESTADOS.RESUELTA && est !== Config.ESTADOS.CERRADA && fl < tresDias) {
            stats.por_vencer++;
          }
        }
      });

      Logger.log('Estadisticas: ' + JSON.stringify(stats));
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
      Logger.log('');
      Logger.log('=== ACTUALIZANDO SOLICITUD ===');
      Logger.log('Data: ' + JSON.stringify(data));

      var id     = ((data.id     || '') + '').trim() || ((data.updates && data.updates.id)     || '');
      var estado = ((data.estado || '') + '').trim() || ((data.updates && data.updates.estado) || '');
      var notas  = ((data.notas_dpo || '') + '').trim();

      Logger.log('ID: "' + id + '" | Estado: "' + estado + '"');

      if (!id) {
        Logger.log('ERROR: id vacio');
        return { status: 'error', message: 'ID de solicitud requerido' };
      }

      var ss    = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(Config.SHEETS.SOLICITUDES);
      if (!sheet) return { status: 'error', message: 'Hoja SOLICITUDES no encontrada' };

      var dataRange = sheet.getDataRange().getValues();
      var headers   = dataRange[0];

      var estadoIndex = DPOHandlers._getIdx(headers, ['estado']);
      var emailIndex  = DPOHandlers._getIdx(headers, ['email']);
      var numeroIndex = DPOHandlers._getIdx(headers, ['numero_solicitud']);
      var notasIndex  = DPOHandlers._getIdx(headers, ['notas_dpo', 'notas']);

      var fila = DPOHandlers._buscarFila(dataRange, headers, id);
      if (fila === -1) {
        return { status: 'error', message: 'Solicitud no encontrada: ' + id };
      }

      var emailActual    = emailIndex  !== -1 ? dataRange[fila - 1][emailIndex]  : '';
      var numeroSol      = numeroIndex !== -1 ? dataRange[fila - 1][numeroIndex] : '';
      var estadoAnterior = estadoIndex !== -1 ? dataRange[fila - 1][estadoIndex] : '';

      Logger.log('Email: ' + emailActual + ' | Estado anterior: "' + estadoAnterior + '"');

      if (estado && estadoIndex !== -1) {
        sheet.getRange(fila, estadoIndex + 1).setValue(estado);
        Logger.log('ESTADO -> ' + estado);
      }

      if (notas && notasIndex !== -1) {
        sheet.getRange(fila, notasIndex + 1).setValue(notas);
        Logger.log('NOTAS actualizadas');
      }

      var actualizadoIndex = DPOHandlers._getIdx(headers, ['actualizado_en']);
      if (actualizadoIndex !== -1) {
        sheet.getRange(fila, actualizadoIndex + 1).setValue(new Date().toISOString());
      }

      var emailEnviado = false;
      if (estado && emailActual) {
        Logger.log('Enviando email - estado: ' + estado + ' | destinatario: ' + emailActual);
        try {
          NotificacionService.enviarCambioEstado(emailActual, numeroSol, estado);
          emailEnviado = true;
          Logger.log('Email enviado OK');
        } catch (err) {
          Logger.log('Error al enviar email: ' + err);
        }
      } else {
        Logger.log('Sin email: estado=' + estado + ' | emailVacio=' + (!emailActual));
      }

      Logger.log('=== COMPLETADO ===');
      return { status: 'success', message: 'Solicitud actualizada', emailEnviado: emailEnviado };

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
      Logger.log('');
      Logger.log('=== MARCANDO COMO RESUELTA ===');
      Logger.log('Data: ' + JSON.stringify(data));

      var id              = ((data.id             || '') + '').trim();
      var url_datos       = ((data.url_datos       || '') + '').trim();
      var formato_entrega = ((data.formato_entrega || 'PDF') + '').trim();

      if (!id || !url_datos) {
        Logger.log('ERROR: faltan id o url_datos');
        return { status: 'error', message: 'ID y URL de datos requeridos' };
      }

      var ss    = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(Config.SHEETS.SOLICITUDES);
      if (!sheet) return { status: 'error', message: 'Hoja SOLICITUDES no encontrada' };

      var dataRange = sheet.getDataRange().getValues();
      var headers   = dataRange[0];

      var estadoIndex  = DPOHandlers._getIdx(headers, ['estado']);
      var urlIndex     = DPOHandlers._getIdx(headers, ['url_descarga', 'url_datos']);
      var formatoIndex = DPOHandlers._getIdx(headers, ['formato_entrega', 'formato_preferido']);
      var emailIndex   = DPOHandlers._getIdx(headers, ['email']);
      var nombreIndex  = DPOHandlers._getIdx(headers, ['nombre_completo']);
      var numeroIndex  = DPOHandlers._getIdx(headers, ['numero_solicitud']);

      var fila = DPOHandlers._buscarFila(dataRange, headers, id);
      if (fila === -1) {
        return { status: 'error', message: 'Solicitud no encontrada: ' + id };
      }

      var email  = emailIndex  !== -1 ? dataRange[fila - 1][emailIndex]  : '';
      var nombre = nombreIndex !== -1 ? dataRange[fila - 1][nombreIndex] : '';
      var numero = numeroIndex !== -1 ? dataRange[fila - 1][numeroIndex] : '';

      Logger.log('Email: ' + email + ' | Nombre: ' + nombre + ' | Número: ' + numero);

      if (estadoIndex  !== -1) sheet.getRange(fila, estadoIndex  + 1).setValue(Config.ESTADOS.RESUELTA);
      if (urlIndex     !== -1) sheet.getRange(fila, urlIndex     + 1).setValue(url_datos);
      if (formatoIndex !== -1) sheet.getRange(fila, formatoIndex + 1).setValue(formato_entrega);

      var actualizadoIndex = DPOHandlers._getIdx(headers, ['actualizado_en']);
      if (actualizadoIndex !== -1) {
        sheet.getRange(fila, actualizadoIndex + 1).setValue(new Date().toISOString());
      }

      Logger.log('Sheet actualizado');

      try {
        NotificacionService.enviarDatosListos(email, nombre, numero, url_datos, formato_entrega);
        Logger.log('Email con datos enviado');
      } catch (err) {
        Logger.log('Error email: ' + err);
      }

      Logger.log('=== RESUELTA COMPLETADA ===');
      return { status: 'success', message: 'Solicitud resuelta y datos enviados' };

    } catch (error) {
      Logger.log('ERROR en marcarResuelta: ' + error);
      return { status: 'error', message: error.toString() };
    }
  },

  // ──────────────────────────────────────────
  // CONFIRMAR DESCARGA DEL TITULAR
  // Llamado automáticamente cuando el titular
  // hace clic en "Descargar" en Seguimiento.jsx.
  // El estado siguiente se determina leyendo el
  // flujo configurado por el DPO — sin hardcodear.
  // ──────────────────────────────────────────
  confirmarDescarga: function(data) {
    try {
      Logger.log('');
      Logger.log('=== CONFIRMANDO DESCARGA ===');
      Logger.log('Data: ' + JSON.stringify(data));

      var id                     = ((data.id || '') + '').trim();
      var descarga_confirmada_en = data.descarga_confirmada_en || new Date().toISOString();

      if (!id) {
        return { status: 'error', message: 'ID requerido' };
      }

      var ss    = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(Config.SHEETS.SOLICITUDES);
      if (!sheet) return { status: 'error', message: 'Hoja SOLICITUDES no encontrada' };

      var dataRange = sheet.getDataRange().getValues();
      var headers   = dataRange[0];

      var fila = DPOHandlers._buscarFila(dataRange, headers, id);
      if (fila === -1) {
        return { status: 'error', message: 'Solicitud no encontrada: ' + id };
      }

      var estadoIndex    = DPOHandlers._getIdx(headers, ['estado']);
      var tipoIndex      = DPOHandlers._getIdx(headers, ['tipo']);
      var actualizadoIdx = DPOHandlers._getIdx(headers, ['actualizado_en']);
      var descargaIdx    = DPOHandlers._getIdx(headers, ['descarga_confirmada_en']);
      var emailIndex     = DPOHandlers._getIdx(headers, ['email']);
      var numeroIndex    = DPOHandlers._getIdx(headers, ['numero_solicitud']);

      // Leer estado y tipo directamente desde la fila de la solicitud
      var estadoActual = estadoIndex !== -1 ? (dataRange[fila - 1][estadoIndex] + '').trim() : '';
      var tipoSolicitud = tipoIndex  !== -1 ? (dataRange[fila - 1][tipoIndex]   + '').trim() : '';

      Logger.log('Estado actual: ' + estadoActual + ' | Tipo: ' + tipoSolicitud);

      // ── Determinar el siguiente estado desde el flujo configurado ──
      // Lee la configuración guardada en Sheets (no asume nada)
      var siguienteEstado = null;
      try {
        var configResult = ConfiguracionService.obtener();
        var flujoRaw     = configResult.data && configResult.data.flujo_config;
        if (flujoRaw) {
          var flujo      = JSON.parse(flujoRaw);
          var estados    = flujo.derechos && flujo.derechos[tipoSolicitud] && flujo.derechos[tipoSolicitud].estados;
          if (estados) {
            var estadoConfig = null;
            for (var i = 0; i < estados.length; i++) {
              if (estados[i].id === estadoActual) { estadoConfig = estados[i]; break; }
            }
            if (estadoConfig && estadoConfig.transiciones_posibles && estadoConfig.transiciones_posibles.length > 0) {
              siguienteEstado = estadoConfig.transiciones_posibles[0];
              Logger.log('Siguiente estado desde flujo configurado: ' + siguienteEstado);
            }
          }
        }
      } catch (flujoErr) {
        Logger.log('No se pudo leer flujo_config: ' + flujoErr);
      }

      if (!siguienteEstado) {
        Logger.log('No se encontró siguiente estado en el flujo — se mantiene estado actual');
        return { status: 'error', message: 'No hay transición definida desde el estado "' + estadoActual + '" en el flujo de ' + tipoSolicitud };
      }

      // ── Actualizar estado al siguiente según el flujo ──────────────
      if (estadoIndex !== -1) {
        sheet.getRange(fila, estadoIndex + 1).setValue(siguienteEstado);
        Logger.log('ESTADO: ' + estadoActual + ' -> ' + siguienteEstado);
      }

      // Registrar timestamp de descarga
      if (descargaIdx !== -1) {
        sheet.getRange(fila, descargaIdx + 1).setValue(descarga_confirmada_en);
        Logger.log('DESCARGA_CONFIRMADA_EN: ' + descarga_confirmada_en);
      } else {
        Logger.log('Columna DESCARGA_CONFIRMADA_EN no existe aún — ejecuta agregarColumnaDescarga()');
      }

      // Actualizar ACTUALIZADO_EN
      if (actualizadoIdx !== -1) {
        sheet.getRange(fila, actualizadoIdx + 1).setValue(new Date().toISOString());
      }

      var email  = emailIndex  !== -1 ? dataRange[fila - 1][emailIndex]  : '';
      var numero = numeroIndex !== -1 ? dataRange[fila - 1][numeroIndex] : '';

      Logger.log('Descarga confirmada: ' + numero + ' | ' + email);
      Logger.log('=== DESCARGA CONFIRMADA OK ===');

      return {
        status:          'success',
        message:         'Descarga registrada correctamente',
        numero:          numero,
        estado_anterior: estadoActual,
        estado_nuevo:    siguienteEstado,
        timestamp:       descarga_confirmada_en
      };

    } catch (error) {
      Logger.log('ERROR en confirmarDescarga: ' + error);
      return { status: 'error', message: error.toString() };
    }
  },

  // ──────────────────────────────────────────
  // HELPERS INTERNOS
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

    Logger.log('_buscarFila: "' + valor + '" | idIndex:' + idIndex + ' | numeroIndex:' + numeroIndex);

    // 1) Por ID_SOLICITUD
    if (idIndex !== -1) {
      for (var i = 1; i < dataRange.length; i++) {
        if ((dataRange[i][idIndex] || '').toString().trim() === valor) {
          Logger.log('Encontrado por id_solicitud en fila: ' + (i + 1));
          return i + 1;
        }
      }
      Logger.log('No encontrado por id_solicitud, probando numero_solicitud...');
    }

    // 2) Por NUMERO_SOLICITUD
    if (numeroIndex !== -1) {
      for (var j = 1; j < dataRange.length; j++) {
        if ((dataRange[j][numeroIndex] || '').toString().trim() === valor) {
          Logger.log('Encontrado por numero_solicitud en fila: ' + (j + 1));
          return j + 1;
        }
      }
    }

    Logger.log('Fila no encontrada para: "' + valor + '"');
    return -1;
  },

};