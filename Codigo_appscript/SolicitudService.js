// ============================================================
// SOLICITUDSERVICE.GS — v3.2
// Cambios respecto v3.1:
//   - crear(): eliminada llamada a SlackService.notificarNuevaSolicitud
//   - validarIdentidad(): eliminada llamada a SlackService.notificarCambioEstado
//   Las notificaciones Slack ahora ocurren SOLO al asignar responsable
//   (ver DPOHandlers.actualizarSolicitud)
// ============================================================

const SolicitudService = {

  // ──────────────────────────────────────────
  // CREAR SOLICITUD
  // ──────────────────────────────────────────
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

      // Slack: notificación eliminada — se notifica al asignar responsable

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

  // ──────────────────────────────────────────
  // VALIDAR IDENTIDAD
  // ──────────────────────────────────────────
  validarIdentidad: function(token) {
    try {
      Logger.log('VALIDANDO IDENTIDAD - Token: ' + token);

      const ss    = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(Config.SHEETS.SOLICITUDES);
      if (!sheet) return { status: 'error', message: 'Hoja SOLICITUDES no encontrada' };

      const data    = sheet.getDataRange().getValues();
      const headers = data[0];

      const tokenIdx     = Utils.buscarIndiceColumna(headers, 'token_validacion');
      const estadoIdx    = Utils.buscarIndiceColumna(headers, 'estado');
      const identidadIdx = Utils.buscarIndiceColumna(headers, 'identidad_validada');
      const emailIdx     = Utils.buscarIndiceColumna(headers, 'email');
      const numeroIdx    = Utils.buscarIndiceColumna(headers, 'numero_solicitud');
      const nombreIdx    = Utils.buscarIndiceColumna(headers, 'nombre_completo');

      if (tokenIdx === -1 || estadoIdx === -1) {
        return { status: 'error', message: 'Columnas requeridas no encontradas' };
      }

      for (var i = 1; i < data.length; i++) {
        if ((data[i][tokenIdx] || '').toString().trim() === (token || '').toString().trim()) {
          Logger.log('Solicitud encontrada en fila: ' + (i + 1));

          var estadoActual = data[i][estadoIdx];
          if (estadoActual !== Config.ESTADOS.PENDIENTE) {
            return { status: 'error', message: 'Solicitud ya fue validada (estado: ' + estadoActual + ')' };
          }

          sheet.getRange(i + 1, estadoIdx    + 1).setValue(Config.ESTADOS.VALIDADA);
          if (identidadIdx !== -1)
            sheet.getRange(i + 1, identidadIdx + 1).setValue('TRUE');

          var emailSol  = emailIdx  !== -1 ? data[i][emailIdx]  : '';
          var numeroSol = numeroIdx !== -1 ? data[i][numeroIdx] : '';
          var nombreSol = nombreIdx !== -1 ? data[i][nombreIdx] : '';

          // Email al titular
          if (emailSol && numeroSol) {
            try {
              NotificacionService.enviarCambioEstado(emailSol, numeroSol, Config.ESTADOS.VALIDADA);
              Logger.log('Email validación enviado a: ' + emailSol);
            } catch (emailError) { Logger.log('Error email validación: ' + emailError); }
          }

          // Slack: notificación eliminada — se notifica al asignar responsable

          return {
            status: 'success',
            message: 'Identidad validada exitosamente',
            data: {
              numero_solicitud: numeroSol,
              email:            emailSol,
              nuevo_estado:     Config.ESTADOS.VALIDADA,
            }
          };
        }
      }

      return { status: 'error', message: 'Token no encontrado o inválido' };

    } catch (error) {
      Logger.log('Error al validar identidad: ' + error);
      return { status: 'error', message: error.toString() };
    }
  },

  // ──────────────────────────────────────────
  // OBTENER POR TOKEN
  // ──────────────────────────────────────────
  obtenerPorToken: function(token) {
    try {
      var resultado = GoogleSheetsService.buscarPorToken(token);
      if (!resultado) return { status: 'error', message: 'Solicitud no encontrada' };
      return { status: 'success', data: resultado.datos };
    } catch (error) {
      return { status: 'error', message: error.toString() };
    }
  },

  // ──────────────────────────────────────────
  // OBTENER POR EMAIL
  // ──────────────────────────────────────────
  obtenerPorEmail: function(email) {
    try {
      var solicitudes = GoogleSheetsService.buscarPorEmail(email);
      return { status: 'success', data: solicitudes };
    } catch (error) {
      return { status: 'error', message: error.toString() };
    }
  },

  // ──────────────────────────────────────────
  // OBTENER POR NÚMERO
  // ──────────────────────────────────────────
  obtenerPorNumero: function(numero) {
    try {
      var solicitud = GoogleSheetsService.buscarPorNumero(numero);
      if (!solicitud) return { status: 'error', message: 'Solicitud no encontrada' };
      return { status: 'success', data: solicitud };
    } catch (error) {
      return { status: 'error', message: error.toString() };
    }
  },

};