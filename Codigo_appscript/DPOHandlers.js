// ============================================
// DPOHANDLERS.GS - v2.6
// Nombres de columnas ajustados a la hoja real:
// ID_SOLICITUD, NUMERO_SOLICITUD, ESTADO,
// EMAIL, NOMBRE_COMPLETO, URL_DESCARGA, etc.
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
  // HELPER: encontrar índice de columna
  // Prueba múltiples variantes del nombre
  // ──────────────────────────────────────────
  _getIdx: function(headers, nombres) {
    // nombres puede ser string o array de strings
    var lista = Array.isArray(nombres) ? nombres : [nombres];
    for (var n = 0; n < lista.length; n++) {
      var idx = Utils.buscarIndiceColumna(headers, lista[n]);
      if (idx !== -1) return idx;
    }
    return -1;
  },

  // ──────────────────────────────────────────
  // HELPER: buscar número de fila
  // Busca por ID_SOLICITUD, luego por NUMERO_SOLICITUD
  // ──────────────────────────────────────────
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

      // Índices con nombres reales de la hoja
      var estadoIndex = DPOHandlers._getIdx(headers, ['estado']);
      var emailIndex  = DPOHandlers._getIdx(headers, ['email']);
      var numeroIndex = DPOHandlers._getIdx(headers, ['numero_solicitud']);
      var notasIndex  = DPOHandlers._getIdx(headers, ['notas_dpo', 'notas']);  // puede no existir

      var fila = DPOHandlers._buscarFila(dataRange, headers, id);
      if (fila === -1) {
        return { status: 'error', message: 'Solicitud no encontrada: ' + id };
      }

      var emailActual    = emailIndex  !== -1 ? dataRange[fila - 1][emailIndex]  : '';
      var numeroSol      = numeroIndex !== -1 ? dataRange[fila - 1][numeroIndex] : '';
      var estadoAnterior = estadoIndex !== -1 ? dataRange[fila - 1][estadoIndex] : '';

      Logger.log('Email: ' + emailActual + ' | Estado anterior: "' + estadoAnterior + '"');

      // Actualizar ESTADO
      if (estado && estadoIndex !== -1) {
        sheet.getRange(fila, estadoIndex + 1).setValue(estado);
        Logger.log('ESTADO -> ' + estado);
      }

      // Actualizar NOTAS (solo si la columna existe)
      if (notas && notasIndex !== -1) {
        sheet.getRange(fila, notasIndex + 1).setValue(notas);
        Logger.log('NOTAS actualizadas');
      }

      // Actualizar ACTUALIZADO_EN
      var actualizadoIndex = DPOHandlers._getIdx(headers, ['actualizado_en']);
      if (actualizadoIndex !== -1) {
        sheet.getRange(fila, actualizadoIndex + 1).setValue(new Date().toISOString());
      }

      // Enviar email siempre que haya estado nuevo y email válido
      // (sin comparar con anterior para evitar problemas de sincronía)
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

      // Nombres reales de columnas en la hoja
      var estadoIndex  = DPOHandlers._getIdx(headers, ['estado']);
      var urlIndex     = DPOHandlers._getIdx(headers, ['url_descarga', 'url_datos']);  // nombre real: URL_DESCARGA
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

      // Actualizar ACTUALIZADO_EN
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
  }

};