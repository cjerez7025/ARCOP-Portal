// ============================================
// SOLICITUDSERVICE.GS - VERSION CORREGIDA
// Correccion: validarIdentidad actualiza
// ESTADO y IDENTIDAD_VALIDADA correctamente
// ============================================

const SolicitudService = {

  crear: function(solicitud) {
    try {
      Logger.log('Creando nueva solicitud...');
      const validacion = ValidacionService.validarSolicitud(solicitud);
      if (!validacion.valida) {
        return { status: 'error', message: validacion.mensaje };
      }
      GoogleSheetsService.guardarSolicitud(solicitud);
      EmailService.enviarConfirmacion(solicitud);
      Logger.log('Solicitud creada: ' + solicitud.numero_solicitud);
      return {
        status: 'success',
        data: {
          numero_solicitud: solicitud.numero_solicitud,
          token_validacion: solicitud.token_validacion
        }
      };
    } catch (error) {
      Logger.log('Error al crear solicitud: ' + error);
      return { status: 'error', message: error.toString() };
    }
  },

validarIdentidad: function(token) {
  try {
    Logger.log('VALIDANDO IDENTIDAD - Token: ' + token);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(Config.SHEETS.SOLICITUDES);

    if (!sheet) {
      return { status: 'error', message: 'Hoja SOLICITUDES no encontrada' };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    Logger.log('Columnas disponibles: ' + headers.join(' | '));

    const tokenIndex     = Utils.buscarIndiceColumna(headers, 'token_validacion');
    const estadoIndex    = Utils.buscarIndiceColumna(headers, 'estado');
    const identidadIndex = Utils.buscarIndiceColumna(headers, 'identidad_validada');
    const emailIndex     = Utils.buscarIndiceColumna(headers, 'email');
    const numeroIndex    = Utils.buscarIndiceColumna(headers, 'numero_solicitud');

    Logger.log('tokenIndex=' + tokenIndex + ' estadoIndex=' + estadoIndex + ' identidadIndex=' + identidadIndex);

    if (tokenIndex === -1 || estadoIndex === -1) {
      return { status: 'error', message: 'Columnas requeridas no encontradas en la hoja' };
    }

    for (var i = 1; i < data.length; i++) {
      var filaToken    = (data[i][tokenIndex] || '').toString().trim();
      var tokenBuscado = (token || '').toString().trim();

      if (filaToken === tokenBuscado) {
        Logger.log('Solicitud encontrada en fila: ' + (i + 1));

        var estadoActual = data[i][estadoIndex];
        Logger.log('Estado actual: ' + estadoActual);

        if (estadoActual !== Config.ESTADOS.PENDIENTE) {
          return { status: 'error', message: 'Solicitud ya fue validada (estado: ' + estadoActual + ')' };
        }

        // Actualizar ESTADO
        sheet.getRange(i + 1, estadoIndex + 1).setValue(Config.ESTADOS.VALIDADA);
        Logger.log('ESTADO actualizado a VALIDADA');

        // Actualizar IDENTIDAD_VALIDADA
        if (identidadIndex !== -1) {
          sheet.getRange(i + 1, identidadIndex + 1).setValue('TRUE');
          Logger.log('IDENTIDAD_VALIDADA actualizada a TRUE');
        } else {
          Logger.log('ADVERTENCIA: Columna IDENTIDAD_VALIDADA no encontrada');
        }

        var emailSolicitante = emailIndex !== -1 ? data[i][emailIndex] : '';
        var numeroSolicitud  = numeroIndex !== -1 ? data[i][numeroIndex] : '';

        Logger.log('Validacion completada - Email: ' + emailSolicitante);

        // ✅ NUEVO: Enviar email de notificación del cambio de estado a VALIDADA
        if (emailSolicitante && numeroSolicitud) {
          try {
            NotificacionService.enviarCambioEstado(emailSolicitante, numeroSolicitud, Config.ESTADOS.VALIDADA);
            Logger.log('Email de validación enviado a: ' + emailSolicitante);
          } catch (emailError) {
            Logger.log('Error al enviar email de validación: ' + emailError);
            // No bloqueamos el flujo si el email falla
          }
        }

        return {
          status: 'success',
          message: 'Identidad validada exitosamente',
          data: {
            numero_solicitud: numeroSolicitud,
            email: emailSolicitante,
            nuevo_estado: Config.ESTADOS.VALIDADA
          }
        };
      }
    }

    Logger.log('Token no encontrado en ninguna fila');
    return { status: 'error', message: 'Token de validacion no encontrado o invalido' };

  } catch (error) {
    Logger.log('Error al validar identidad: ' + error);
    return { status: 'error', message: error.toString() };
  }
},

  obtenerPorToken: function(token) {
    try {
      var resultado = GoogleSheetsService.buscarPorToken(token);
      if (!resultado) return { status: 'error', message: 'Solicitud no encontrada' };
      return { status: 'success', data: resultado.datos };
    } catch (error) {
      Logger.log('Error: ' + error);
      return { status: 'error', message: error.toString() };
    }
  },

  obtenerPorEmail: function(email) {
    try {
      var solicitudes = GoogleSheetsService.buscarPorEmail(email);
      return { status: 'success', data: solicitudes };
    } catch (error) {
      Logger.log('Error: ' + error);
      return { status: 'error', message: error.toString() };
    }
  },

  obtenerPorNumero: function(numero) {
    try {
      var solicitud = GoogleSheetsService.buscarPorNumero(numero);
      if (!solicitud) return { status: 'error', message: 'Solicitud no encontrada' };
      return { status: 'success', data: solicitud };
    } catch (error) {
      Logger.log('Error: ' + error);
      return { status: 'error', message: error.toString() };
    }
  }
};