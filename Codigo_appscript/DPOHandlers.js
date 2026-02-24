// ============================================================
// DPOHANDLERS.GS — v3.0
// CORRECCIÓN: actualizarSolicitud ahora guarda TODOS los campos:
//   - asignado_a, asignado_email, asignado_en
//   - fecha_entrada_estado, fecha_termino_sla
//   - campos de transición específicos (sistemas_afectados, etc.)
//   - notas_dpo
// Si una columna no existe aún en la hoja, la crea automáticamente.
// ============================================================

const DPOHandlers = {

  // ──────────────────────────────────────────
  // OBTENER TODAS LAS SOLICITUDES CON FILTROS
  // ──────────────────────────────────────────
  obtenerTodasSolicitudes: function(e) {
    try {
      var estado   = e.parameter.estado   || '';
      var busqueda = e.parameter.busqueda || '';

      var solicitudes = GoogleSheetsService.obtenerTodas();

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
  // ACTUALIZAR SOLICITUD — v3.0 CORREGIDO
  // Guarda estado, notas, asignación, SLA y
  // cualquier campo de transición adicional.
  // ──────────────────────────────────────────
  actualizarSolicitud: function(data) {
    try {
      Logger.log('');
      Logger.log('=== ACTUALIZANDO SOLICITUD v3 ===');
      Logger.log('Data recibida: ' + JSON.stringify(data));

      var id     = ((data.id     || '') + '').trim() || ((data.updates && data.updates.id) || '');
      var estado = ((data.estado || '') + '').trim();
      var notas  = ((data.notas_dpo || '') + '').trim();

      // Campos de asignación y SLA
      var asignado_a           = ((data.asignado_a           || '') + '').trim();
      var asignado_email       = ((data.asignado_email       || '') + '').trim();
      var asignado_en          = ((data.asignado_en          || '') + '').trim();
      var fecha_entrada_estado = ((data.fecha_entrada_estado || '') + '').trim();
      var fecha_termino_sla    = ((data.fecha_termino_sla    || '') + '').trim();

      Logger.log('ID: "' + id + '" | Estado: "' + estado + '" | Asignado: "' + asignado_a + '"');
      Logger.log('url_datos: "' + ((data.url_datos || '') + '').trim() + '" | formato_entrega: "' + ((data.formato_entrega || '') + '').trim() + '"');
      Logger.log('Data keys: ' + Object.keys(data).join(', '));

      if (!id) {
        Logger.log('ERROR: id vacío');
        return { status: 'error', message: 'ID de solicitud requerido' };
      }

      var ss    = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(Config.SHEETS.SOLICITUDES);
      if (!sheet) return { status: 'error', message: 'Hoja SOLICITUDES no encontrada' };

      var dataRange = sheet.getDataRange().getValues();
      var headers   = dataRange[0];

      // Índices de columnas existentes
      var estadoIndex          = DPOHandlers._getIdx(headers, ['estado']);
      var emailIndex           = DPOHandlers._getIdx(headers, ['email']);
      var numeroIndex          = DPOHandlers._getIdx(headers, ['numero_solicitud']);
      var notasIndex           = DPOHandlers._getIdx(headers, ['notas_dpo', 'notas']);
      var actualizadoIndex     = DPOHandlers._getIdx(headers, ['actualizado_en']);

      // Índices de columnas de asignación (pueden no existir — se crean)
      var asignadoAIdx         = DPOHandlers._getOCrearColumna(sheet, headers, 'asignado_a');
      var asignadoEmailIdx     = DPOHandlers._getOCrearColumna(sheet, headers, 'asignado_email');
      var asignadoEnIdx        = DPOHandlers._getOCrearColumna(sheet, headers, 'asignado_en');
      var fechaEntradaIdx      = DPOHandlers._getOCrearColumna(sheet, headers, 'fecha_entrada_estado');
      var fechaTerminoSLAIdx   = DPOHandlers._getOCrearColumna(sheet, headers, 'fecha_termino_sla');
      var ultimaActualizacionIdx = DPOHandlers._getOCrearColumna(sheet, headers, 'fecha_ultima_actualizacion');

      // Re-leer headers si se agregaron columnas nuevas
      dataRange = sheet.getDataRange().getValues();
      headers   = dataRange[0];

      // Encontrar la fila
      var fila = DPOHandlers._buscarFila(dataRange, headers, id);
      if (fila === -1) {
        return { status: 'error', message: 'Solicitud no encontrada: ' + id };
      }

      var emailActual    = emailIndex  !== -1 ? dataRange[fila - 1][emailIndex]  : '';
      var numeroSol      = numeroIndex !== -1 ? dataRange[fila - 1][numeroIndex] : '';
      var estadoAnterior = estadoIndex !== -1 ? dataRange[fila - 1][estadoIndex] : '';

      Logger.log('Email: ' + emailActual + ' | Estado anterior: "' + estadoAnterior + '"');

      var ahora = new Date().toISOString();

      // ── Escribir campos core ───────────────────────────
      if (estado && estadoIndex !== -1) {
        sheet.getRange(fila, estadoIndex + 1).setValue(estado);
        Logger.log('ESTADO -> ' + estado);
      }

      if (notas && notasIndex !== -1) {
        sheet.getRange(fila, notasIndex + 1).setValue(notas);
        Logger.log('NOTAS actualizadas');
      }

      if (actualizadoIndex !== -1) {
        sheet.getRange(fila, actualizadoIndex + 1).setValue(ahora);
      }

      // ── Escribir asignación ────────────────────────────
      if (asignado_a && asignadoAIdx !== -1) {
        sheet.getRange(fila, asignadoAIdx + 1).setValue(asignado_a);
        Logger.log('ASIGNADO_A -> ' + asignado_a);
      }

      if (asignado_email && asignadoEmailIdx !== -1) {
        sheet.getRange(fila, asignadoEmailIdx + 1).setValue(asignado_email);
        Logger.log('ASIGNADO_EMAIL -> ' + asignado_email);
      }

      if (asignadoEnIdx !== -1) {
        sheet.getRange(fila, asignadoEnIdx + 1).setValue(asignado_en || ahora);
        Logger.log('ASIGNADO_EN -> ' + (asignado_en || ahora));
      }

      // ── Escribir SLA ───────────────────────────────────
      if (fechaEntradaIdx !== -1) {
        sheet.getRange(fila, fechaEntradaIdx + 1).setValue(fecha_entrada_estado || ahora);
        Logger.log('FECHA_ENTRADA_ESTADO -> ' + (fecha_entrada_estado || ahora));
      }

      if (fecha_termino_sla && fechaTerminoSLAIdx !== -1) {
        sheet.getRange(fila, fechaTerminoSLAIdx + 1).setValue(fecha_termino_sla);
        Logger.log('FECHA_TERMINO_SLA -> ' + fecha_termino_sla);
      }

      if (ultimaActualizacionIdx !== -1) {
        sheet.getRange(fila, ultimaActualizacionIdx + 1).setValue(ahora);
      }

      // ── Escribir campos de transición específicos ──────
      // Cualquier campo extra que no sea de los conocidos
      // se guarda si existe una columna con ese nombre
      var camposConocidos = [
        'id', 'estado', 'notas_dpo', 'notas',
        'asignado_a', 'asignado_email', 'asignado_en',
        'fecha_entrada_estado', 'fecha_termino_sla',
      ];

      Object.keys(data).forEach(function(key) {
        if (camposConocidos.indexOf(key) !== -1) return;
        var valor = ((data[key] || '') + '').trim();
        if (!valor) return;

        // Buscar columna con ese nombre o crearla
        var colIdx = DPOHandlers._getOCrearColumna(sheet, sheet.getDataRange().getValues()[0], key);
        if (colIdx !== -1) {
          sheet.getRange(fila, colIdx + 1).setValue(valor);
          Logger.log('CAMPO_TRANSICION ' + key + ' -> ' + valor);
        }
      });

      // ── Notificación al titular ────────────────────────
      // Si el estado es RESUELTA y llegan url_datos + formato_entrega,
      // usar enviarDatosListos (email con botón de descarga).
      // Para cualquier otro estado, usar enviarCambioEstado genérico.
      var url_datos       = ((data.url_datos       || '') + '').trim();
      var formato_entrega = ((data.formato_entrega || 'PDF') + '').trim();

      // Guardar url_datos y formato_entrega en Sheets cuando estado es RESUELTA
      // Usa _getIdx con múltiples nombres posibles (igual que marcarResuelta)
      // para encontrar la columna existente sin crear duplicados.
      if (estado.toUpperCase() === 'RESUELTA' && url_datos) {
        var headersActuales = sheet.getDataRange().getValues()[0];
        var urlColIdx     = DPOHandlers._getIdx(headersActuales, ['url_datos', 'url_descarga']);
        var formatoColIdx = DPOHandlers._getIdx(headersActuales, ['formato_entrega', 'formato_preferido']);
        // Si no existe la columna, crearla
        if (urlColIdx === -1)     urlColIdx     = DPOHandlers._getOCrearColumna(sheet, headersActuales, 'url_datos');
        if (formatoColIdx === -1) formatoColIdx = DPOHandlers._getOCrearColumna(sheet, sheet.getDataRange().getValues()[0], 'formato_entrega');
        if (urlColIdx     !== -1) sheet.getRange(fila, urlColIdx     + 1).setValue(url_datos);
        if (formatoColIdx !== -1) sheet.getRange(fila, formatoColIdx + 1).setValue(formato_entrega);
        Logger.log('URL_DATOS -> ' + url_datos + ' | FORMATO_ENTREGA -> ' + formato_entrega);
      }

      // Leer nombre del titular para el email personalizado
      var headersParaNombre = sheet.getDataRange().getValues()[0];
      var nombreIndex = DPOHandlers._getIdx(headersParaNombre, ['nombre_completo']);
      var nombreTitular = nombreIndex !== -1
        ? (sheet.getDataRange().getValues()[fila - 1][nombreIndex] + '').trim()
        : '';

      var emailEnviado = false;
      if (estado && emailActual) {
        try {
          var esResuelta = estado.toUpperCase() === 'RESUELTA';
          if (esResuelta && url_datos) {
            // Email especial con botón de descarga
            NotificacionService.enviarDatosListos(emailActual, nombreTitular || 'Titular', numeroSol, url_datos, formato_entrega);
            Logger.log('Email DATOS LISTOS (con link descarga) enviado a: ' + emailActual);
          } else {
            NotificacionService.enviarCambioEstado(emailActual, numeroSol, estado);
            Logger.log('Email cambio estado enviado OK');
          }
          emailEnviado = true;
        } catch (err) {
          Logger.log('Error al enviar email al titular: ' + err);
        }
      }

      // ── Notificación al responsable asignado ───────────
      var emailResponsableEnviado = false;
      if (asignado_email && asignado_email !== emailActual && estado) {
        try {
          DPOHandlers._notificarResponsable(asignado_email, asignado_a, numeroSol, estado, fecha_termino_sla);
          emailResponsableEnviado = true;
          Logger.log('Email al responsable enviado OK: ' + asignado_email);
        } catch (err) {
          Logger.log('Error al enviar email al responsable: ' + err);
        }
      }

      // ── Notificación Slack ────────────────────────────────
      // Leer tipo y nombre del titular para el mensaje
      var tipoIdx   = DPOHandlers._getIdx(sheet.getDataRange().getValues()[0], ['tipo']);
      var nombreIdx = DPOHandlers._getIdx(sheet.getDataRange().getValues()[0], ['nombre_completo']);
      var tipoSlack   = tipoIdx   !== -1 ? (sheet.getDataRange().getValues()[fila - 1][tipoIdx]   + '') : 'ACCESO';
      var nombreSlack = nombreIdx !== -1 ? (sheet.getDataRange().getValues()[fila - 1][nombreIdx] + '') : '';
      try {
        SlackService.notificarCambioEstado({
          numero:          numeroSol,
          tipo:            tipoSlack || 'ACCESO',
          nombreTitular:   nombreSlack,
          estadoAnterior:  estadoAnterior,
          estadoNuevo:     estado,
          asignadoA:       asignado_a,
          fechaTerminoSLA: fecha_termino_sla,
        });
      } catch (slackErr) {
        Logger.log('[Slack] Error (no bloquea): ' + slackErr);
      }

      Logger.log('=== ACTUALIZACIÓN COMPLETADA ===');
      return {
        status:                   'success',
        message:                  'Solicitud actualizada',
        emailEnviado:             emailEnviado,
        emailResponsableEnviado:  emailResponsableEnviado,
      };

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
      var actualizadoIndex = DPOHandlers._getIdx(headers, ['actualizado_en']);

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
      if (actualizadoIndex !== -1) sheet.getRange(fila, actualizadoIndex + 1).setValue(new Date().toISOString());

      var ultimaActualizacionIdx = DPOHandlers._getOCrearColumna(sheet, sheet.getDataRange().getValues()[0], 'fecha_ultima_actualizacion');
      if (ultimaActualizacionIdx !== -1) {
        sheet.getRange(fila, ultimaActualizacionIdx + 1).setValue(new Date().toISOString());
      }

      Logger.log('Sheet actualizado');

      try {
        NotificacionService.enviarDatosListos(email, nombre, numero, url_datos, formato_entrega);
        Logger.log('Email con datos enviado');
      } catch (err) {
        Logger.log('Error email: ' + err);
      }

      // ── Notificación Slack ────────────────────────────────
      try {
        SlackService.notificarResuelta({
          numero:        numero,
          tipo:          'ACCESO',
          nombreTitular: nombre,
          formato:       formato_entrega,
        });
      } catch (slackErr) {
        Logger.log('[Slack] Error (no bloquea): ' + slackErr);
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
  // ──────────────────────────────────────────
  confirmarDescarga: function(data) {
    try {
      Logger.log('');
      Logger.log('=== CONFIRMANDO DESCARGA ===');

      var id                     = ((data.id || '') + '').trim();
      var descarga_confirmada_en = data.descarga_confirmada_en || new Date().toISOString();

      if (!id) return { status: 'error', message: 'ID requerido' };

      var ss    = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(Config.SHEETS.SOLICITUDES);
      if (!sheet) return { status: 'error', message: 'Hoja SOLICITUDES no encontrada' };

      var dataRange = sheet.getDataRange().getValues();
      var headers   = dataRange[0];

      var fila = DPOHandlers._buscarFila(dataRange, headers, id);
      if (fila === -1) return { status: 'error', message: 'Solicitud no encontrada: ' + id };

      var estadoIndex   = DPOHandlers._getIdx(headers, ['estado']);
      var tipoIndex     = DPOHandlers._getIdx(headers, ['tipo']);
      var actualizadoIdx = DPOHandlers._getIdx(headers, ['actualizado_en']);
      var descargaIdx   = DPOHandlers._getOCrearColumna(sheet, headers, 'descarga_confirmada_en');
      var emailIndex    = DPOHandlers._getIdx(headers, ['email']);
      var numeroIndex   = DPOHandlers._getIdx(headers, ['numero_solicitud']);

      // Re-leer si se creó columna nueva
      dataRange = sheet.getDataRange().getValues();
      headers   = dataRange[0];
      fila      = DPOHandlers._buscarFila(dataRange, headers, id);

      var estadoActual  = estadoIndex !== -1 ? (dataRange[fila - 1][estadoIndex] + '').trim() : '';
      var tipoSolicitud = tipoIndex   !== -1 ? (dataRange[fila - 1][tipoIndex]  + '').trim() : 'ACCESO';

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
              if (estados[i].id === estadoActual) {
                var trans = estados[i].transiciones_posibles;
                if (trans && trans.length > 0) { siguienteEstado = trans[0]; }
                break;
              }
            }
          }
        }
      } catch (flujoErr) {
        Logger.log('No se pudo leer flujo_config: ' + flujoErr);
      }

      if (!siguienteEstado) {
        return { status: 'error', message: 'No hay transición definida desde "' + estadoActual + '"' };
      }

      if (estadoIndex !== -1) sheet.getRange(fila, estadoIndex + 1).setValue(siguienteEstado);
      if (descargaIdx !== -1) sheet.getRange(fila, descargaIdx + 1).setValue(descarga_confirmada_en);
      if (actualizadoIdx !== -1) sheet.getRange(fila, actualizadoIdx + 1).setValue(new Date().toISOString());

      var email  = emailIndex  !== -1 ? dataRange[fila - 1][emailIndex]  : '';
      var numero = numeroIndex !== -1 ? dataRange[fila - 1][numeroIndex] : '';

      Logger.log('Descarga confirmada: ' + numero + ' -> ' + siguienteEstado);

      // ── Notificación Slack ────────────────────────────────
      try {
        SlackService.notificarDescargaConfirmada({
          numero:        numero,
          nombreTitular: '',
          timestamp:     descarga_confirmada_en,
        });
      } catch (slackErr) {
        Logger.log('[Slack] Error (no bloquea): ' + slackErr);
      }

      Logger.log('=== DESCARGA CONFIRMADA OK ===');

      return {
        status:          'success',
        message:         'Descarga registrada correctamente',
        numero:          numero,
        estado_anterior: estadoActual,
        estado_nuevo:    siguienteEstado,
        timestamp:       descarga_confirmada_en,
      };

    } catch (error) {
      Logger.log('ERROR en confirmarDescarga: ' + error);
      return { status: 'error', message: error.toString() };
    }
  },

  // ──────────────────────────────────────────
  // HELPERS INTERNOS
  // ──────────────────────────────────────────

  // Busca índice de columna (primera coincidencia de la lista)
  _getIdx: function(headers, nombres) {
    var lista = Array.isArray(nombres) ? nombres : [nombres];
    for (var n = 0; n < lista.length; n++) {
      var idx = Utils.buscarIndiceColumna(headers, lista[n]);
      if (idx !== -1) return idx;
    }
    return -1;
  },

  // Devuelve índice de columna existente, o la crea al final si no existe
  // IMPORTANTE: después de llamar esto, re-leer dataRange si vas a escribir
  _getOCrearColumna: function(sheet, headers, nombre) {
    var idx = Utils.buscarIndiceColumna(headers, nombre);
    if (idx !== -1) return idx;

    // La columna no existe: agregarla al final del header
    var nuevaCol = headers.length + 1;
    sheet.getRange(1, nuevaCol).setValue(nombre);
    Logger.log('Columna creada: ' + nombre + ' en col ' + nuevaCol);
    return nuevaCol - 1; // índice 0-based
  },

  // Busca la fila por ID o número de solicitud
  _buscarFila: function(dataRange, headers, valorBuscado) {
    var idIndex     = DPOHandlers._getIdx(headers, ['id_solicitud', 'id']);
    var numeroIndex = DPOHandlers._getIdx(headers, ['numero_solicitud']);
    var valor       = valorBuscado.toString().trim();

    Logger.log('_buscarFila: "' + valor + '" | idIndex:' + idIndex + ' | numeroIndex:' + numeroIndex);

    if (idIndex !== -1) {
      for (var i = 1; i < dataRange.length; i++) {
        if ((dataRange[i][idIndex] || '').toString().trim() === valor) {
          Logger.log('Encontrado por id en fila: ' + (i + 1));
          return i + 1;
        }
      }
    }

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

  // Notifica por email al responsable asignado internamente
  _notificarResponsable: function(emailResponsable, nombreResponsable, numeroSolicitud, estado, fechaTermino) {
    try {
      var config = EmailService.obtenerConfigParaEmail();
      var asunto = 'Portal ARCOP — Se te asignó la solicitud #' + numeroSolicitud;

      var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>' +
        '<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">' +
        '<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center" style="padding:20px 10px;">' +
        '<table cellpadding="0" cellspacing="0" border="0" width="560" style="background:white;border-radius:8px;overflow:hidden;">' +

        '<tr><td style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:28px;text-align:center;">' +
        '<h1 style="margin:0;color:white;font-size:20px;font-family:Arial,sans-serif;">Nueva tarea asignada</h1>' +
        '<p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Portal ARCOP — Ley 21.719</p>' +
        '</td></tr>' +

        '<tr><td style="padding:28px;">' +
        '<p style="color:#333;font-size:15px;margin-top:0;">Hola <strong>' + (nombreResponsable || 'Responsable') + '</strong>,</p>' +
        '<p style="color:#555;font-size:14px;">Se te ha asignado la gestión de la siguiente solicitud:</p>' +

        '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;">' +
        '<tr><td style="background:#f0f4ff;border-left:4px solid #3b82f6;padding:16px;border-radius:0 6px 6px 0;">' +
        '<p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#333;">' +
        'N° Solicitud: <strong>' + numeroSolicitud + '</strong><br>' +
        'Estado actual: <strong>' + estado + '</strong><br>' +
        (fechaTermino ? 'Plazo SLA: <strong>' + new Date(fechaTermino).toLocaleDateString('es-CL') + '</strong>' : '') +
        '</p></td></tr></table>' +

        '<p style="color:#555;font-size:13px;">Accede al Panel DPO para gestionar esta solicitud y registrar las acciones correspondientes.</p>' +
        '</td></tr>' +

        '<tr><td style="background:#f5f5f5;padding:20px;text-align:center;font-family:Arial,sans-serif;font-size:12px;color:#888;">' +
        '<strong>' + config.nombre + '</strong><br>' +
        'RUT: ' + config.rut + ' | ' + config.email + '<br><br>' +
        '<span style="color:#aaa;font-size:11px;">Email automático generado por Portal ARCOP</span>' +
        '</td></tr>' +

        '</table></td></tr></table></body></html>';

      GmailApp.sendEmail(emailResponsable, asunto, 'Nueva tarea asignada — ' + numeroSolicitud, {
        htmlBody: html,
        name: config.nombre,
      });

      Logger.log('Email a responsable enviado: ' + emailResponsable);
    } catch (err) {
      Logger.log('Error al notificar responsable: ' + err);
      throw err;
    }
  },

};