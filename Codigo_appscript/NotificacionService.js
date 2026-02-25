// ============================================================
// NOTIFICACIONSERVICE.GS — v2.4
// Cambio respecto v2.3:
//   - construirEmailDatosListos: el botón principal ya no va
//     directo a urlDescarga (Drive), sino al seguimiento del
//     portal (/#/seguimiento/SOL-XXXX) donde el titular
//     descarga Y registra la confirmación en un solo paso.
//     Se mantiene el link de Drive como secundario "acceso directo".
// ============================================================

const NotificacionService = {

  enviarCambioEstado: function(email, numeroSolicitud, nuevoEstado) {
    try {
      Logger.log('Enviando email cambio de estado a: ' + email);
      var config = EmailService.obtenerConfigParaEmail();
      var info   = this.obtenerMensajePorEstado(nuevoEstado);
      var html   = this.construirEmailCambioEstado(numeroSolicitud, nuevoEstado, info, config);

      GmailApp.sendEmail(
        email,
        this.obtenerAsuntoPorEstado(nuevoEstado) + ' #' + numeroSolicitud,
        'Estado actualizado - ' + numeroSolicitud,
        { htmlBody: html, name: config.nombre }
      );
      Logger.log('Email enviado OK');
    } catch (error) {
      Logger.log('Error al enviar notificacion: ' + error);
      throw error;
    }
  },

  // ── v2.4: recibe urlDescarga solo como referencia secundaria ──
  enviarDatosListos: function(email, nombre, numeroSolicitud, urlDescarga, formato) {
    try {
      Logger.log('Enviando email datos listos a: ' + email);
      var config = EmailService.obtenerConfigParaEmail();
      var html   = this.construirEmailDatosListos(nombre, numeroSolicitud, urlDescarga, formato, config);

      GmailApp.sendEmail(
        email,
        'Portal ARCOP - Sus datos personales estan listos #' + numeroSolicitud,
        'Sus datos estan disponibles - ' + numeroSolicitud,
        { htmlBody: html, name: config.nombre }
      );
      Logger.log('Email datos listos enviado OK');
    } catch (error) {
      Logger.log('Error al enviar email de datos: ' + error);
      throw error;
    }
  },

  // ──────────────────────────────────────────────────────────
  // EMAIL INTERNO AL RESPONSABLE ASIGNADO
  // ──────────────────────────────────────────────────────────
  enviarAsignacionResponsable: function(datos) {
    try {
      Logger.log('Enviando email asignación responsable a: ' + datos.emailResponsable);
      var config = EmailService.obtenerConfigParaEmail();
      var html   = this.construirEmailAsignacionResponsable(datos, config);

      GmailApp.sendEmail(
        datos.emailResponsable,
        'Portal ARCOP - Nueva solicitud asignada #' + datos.numeroSolicitud,
        'Solicitud asignada - ' + datos.numeroSolicitud,
        { htmlBody: html, name: config.nombre }
      );
      Logger.log('Email asignación responsable enviado OK');
    } catch (error) {
      Logger.log('Error al enviar email asignación: ' + error);
      throw error;
    }
  },

  // ──────────────────────────────────────────────────────────
  // CONSTRUCTORES HTML
  // ──────────────────────────────────────────────────────────

  construirEmailCambioEstado: function(numeroSolicitud, nuevoEstado, info, config) {
    var progresoHtml = this._construirProgreso(nuevoEstado, '#4285F4');
    var seguimientoUrl = (config.portal_url || 'https://arcop-portal.vercel.app') +
                         '/#/seguimiento/' + numeroSolicitud;

    return '<!DOCTYPE html>' +
      '<html><head><meta charset="UTF-8"></head>' +
      '<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center" style="padding:20px 10px;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="600" style="background:white;border-radius:8px;overflow:hidden;">' +

        '<tr><td style="background:linear-gradient(135deg,#4285F4,#1a73e8);padding:30px;text-align:center;">' +
          '<h1 style="margin:0;color:white;font-size:24px;font-family:Arial,sans-serif;">' + info.titulo + '</h1>' +
          '<p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;font-family:Arial,sans-serif;">Portal ARCOP - Ley 21.719</p>' +
        '</td></tr>' +

        '<tr><td style="padding:30px;">' +
          '<p style="color:#666;font-family:Arial,sans-serif;">' + info.mensaje + '</p>' +

          (info.importante ? '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;"><tr><td style="background:#fff3cd;border-left:4px solid #ffc107;padding:14px;border-radius:0 4px 4px 0;font-family:Arial,sans-serif;font-size:14px;color:#856404;"><strong>Importante:</strong> ' + info.importante + '</td></tr></table>' : '') +

          '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;"><tr><td align="center">' +
            '<a href="' + seguimientoUrl + '" style="display:inline-block;padding:14px 36px;background:#4285F4;color:white;text-decoration:none;border-radius:6px;font-weight:bold;font-size:15px;font-family:Arial,sans-serif;">Ver estado de mi solicitud</a>' +
          '</td></tr></table>' +

          '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;">' +
            '<tr><td style="background:#e8f0fe;border-left:4px solid #4285F4;padding:16px;border-radius:0 4px 4px 0;font-family:Arial,sans-serif;font-size:14px;">' +
              '<strong>Numero de solicitud:</strong> ' + numeroSolicitud +
            '</td></tr>' +
          '</table>' +

          progresoHtml +

        '</td></tr>' +

        '<tr><td style="background:#f5f5f5;padding:24px;text-align:center;font-family:Arial,sans-serif;font-size:13px;color:#666;">' +
          '<strong>' + config.nombre + '</strong><br>' +
          'RUT: ' + config.rut + '<br>' +
          config.email + ' | ' + config.telefono + '<br><br>' +
          '<span style="color:#999;font-size:11px;">Email automatico generado por Portal ARCOP</span>' +
        '</td></tr>' +

      '</table>' +
      '</td></tr></table>' +
      '</body></html>';
  },

  // ── v2.4: botón principal → seguimiento portal (descarga + confirma) ──
  // El link directo a Drive queda como acceso secundario de respaldo.
  construirEmailDatosListos: function(nombre, numeroSolicitud, urlDescarga, formato, config) {
    var progresoHtml    = this._construirProgreso('RESUELTA', '#34A853');
    var seguimientoUrl  = (config.portal_url || 'https://arcop-portal.vercel.app') +
                          '/#/seguimiento/' + numeroSolicitud;

    return '<!DOCTYPE html>' +
      '<html><head><meta charset="UTF-8"></head>' +
      '<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center" style="padding:20px 10px;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="600" style="background:white;border-radius:8px;overflow:hidden;">' +

        '<tr><td style="background:linear-gradient(135deg,#34A853,#0F9D58);padding:30px;text-align:center;">' +
          '<h1 style="margin:0;color:white;font-size:24px;font-family:Arial,sans-serif;">Sus datos estan listos</h1>' +
          '<p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;font-family:Arial,sans-serif;">Portal ARCOP - Ley 21.719</p>' +
        '</td></tr>' +

        '<tr><td style="padding:30px;">' +
          '<h2 style="color:#333;margin-top:0;font-size:18px;font-family:Arial,sans-serif;">Hola ' + nombre + ',</h2>' +
          '<p style="color:#666;font-family:Arial,sans-serif;">Hemos completado el procesamiento de tu solicitud. ' +
          'Tus datos estan disponibles en formato <strong>' + formato + '</strong>.</p>' +

          // ── Botón principal → portal de seguimiento ──
          '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;"><tr><td align="center">' +
            '<a href="' + seguimientoUrl + '" style="display:inline-block;padding:14px 36px;background:#34A853;color:white;text-decoration:none;border-radius:6px;font-weight:bold;font-size:15px;font-family:Arial,sans-serif;">Descargar mis datos en el Portal</a>' +
          '</td></tr></table>' +

          '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;">' +
            '<tr><td style="background:#e8f0fe;border-left:4px solid #4285F4;padding:16px;border-radius:0 4px 4px 0;font-family:Arial,sans-serif;font-size:14px;">' +
              '<strong>Informacion:</strong><br><br>' +
              'Numero: <strong>' + numeroSolicitud + '</strong><br>' +
              'Formato: <strong>' + formato + '</strong><br>' +
              'Fecha: <strong>' + new Date().toLocaleDateString('es-CL') + '</strong>' +
            '</td></tr>' +
          '</table>' +

          progresoHtml +

          '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;">' +
            '<tr><td style="background:#fff3cd;border-left:4px solid #ffc107;padding:14px;border-radius:0 4px 4px 0;font-family:Arial,sans-serif;font-size:14px;color:#856404;">' +
              '<strong>Importante:</strong> Al descargar desde el portal, confirmaremos la entrega de tus datos ' +
              'como exige la Ley 21.719. Esto cierra formalmente tu solicitud.<br><br>' +
              // ── Link secundario de respaldo directo a Drive ──
              'Si tienes problemas con el portal, puedes acceder directamente: ' +
              '<a href="' + urlDescarga + '" style="color:#856404;">enlace directo</a> ' +
              '(este acceso no registra la confirmacion de entrega).' +
            '</td></tr>' +
          '</table>' +

        '</td></tr>' +

        '<tr><td style="background:#f5f5f5;padding:24px;text-align:center;font-family:Arial,sans-serif;font-size:13px;color:#666;">' +
          '<strong>' + config.nombre + '</strong><br>' +
          'RUT: ' + config.rut + '<br>' +
          config.email + ' | ' + config.telefono + '<br><br>' +
          '<span style="color:#999;font-size:11px;">Email automatico generado por Portal ARCOP</span>' +
        '</td></tr>' +

      '</table>' +
      '</td></tr></table>' +
      '</body></html>';
  },

  construirEmailAsignacionResponsable: function(datos, config) {
    var portalUrl = (config.portal_url || 'https://arcop-portal.vercel.app') + '/#/dpo';

    return '<!DOCTYPE html>' +
      '<html><head><meta charset="UTF-8"></head>' +
      '<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center" style="padding:20px 10px;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="600" style="background:white;border-radius:8px;overflow:hidden;">' +

        '<tr><td style="background:linear-gradient(135deg,#7C3AED,#5B21B6);padding:30px;text-align:center;">' +
          '<h1 style="margin:0;color:white;font-size:24px;font-family:Arial,sans-serif;">Nueva solicitud asignada</h1>' +
          '<p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;font-family:Arial,sans-serif;">Portal ARCOP - Ley 21.719</p>' +
        '</td></tr>' +

        '<tr><td style="padding:30px;">' +
          '<h2 style="color:#333;margin-top:0;font-size:18px;font-family:Arial,sans-serif;">Hola ' + datos.nombreResponsable + ',</h2>' +
          '<p style="color:#666;font-family:Arial,sans-serif;">Se te ha asignado una solicitud de tipo <strong>' + datos.tipoSolicitud + '</strong> para gestionar.</p>' +

          '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;">' +
            '<tr><td style="background:#f5f0ff;border-left:4px solid #7C3AED;padding:16px;border-radius:0 4px 4px 0;font-family:Arial,sans-serif;font-size:14px;">' +
              '<strong>Detalles de la tarea:</strong><br><br>' +
              'Solicitud: <strong>' + datos.numeroSolicitud + '</strong><br>' +
              'Titular: <strong>' + datos.nombreTitular + '</strong><br>' +
              'Estado: <strong>' + datos.estadoAsignado + '</strong><br>' +
              'Inicio: <strong>' + new Date(datos.fechaInicio).toLocaleDateString('es-CL') + '</strong><br>' +
              (datos.fechaTermino ? 'Plazo máximo: <strong style="color:#DC2626;">' + new Date(datos.fechaTermino).toLocaleDateString('es-CL') + '</strong>' : '') +
            '</td></tr>' +
          '</table>' +

          '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;"><tr><td align="center">' +
            '<a href="' + portalUrl + '" style="display:inline-block;padding:14px 36px;background:#7C3AED;color:white;text-decoration:none;border-radius:6px;font-weight:bold;font-size:15px;font-family:Arial,sans-serif;">Ver en Panel DPO</a>' +
          '</td></tr></table>' +

        '</td></tr>' +

        '<tr><td style="background:#f5f5f5;padding:24px;text-align:center;font-family:Arial,sans-serif;font-size:13px;color:#666;">' +
          '<strong>' + config.nombre + '</strong><br>' +
          config.email + ' | ' + config.telefono + '<br><br>' +
          '<span style="color:#999;font-size:11px;">Email automatico generado por Portal ARCOP</span>' +
        '</td></tr>' +

      '</table>' +
      '</td></tr></table>' +
      '</body></html>';
  },

  // ──────────────────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────────────────

  _construirProgreso: function(estadoActual, colorActivo) {
    var estados = [
      { id: 'PENDIENTE',  label: 'Recibida' },
      { id: 'VALIDADA',   label: 'Validada' },
      { id: 'EN_PROCESO', label: 'En proceso' },
      { id: 'RESUELTA',   label: 'Resuelta' },
      { id: 'CERRADA',    label: 'Cerrada' },
    ];
    var orden = ['PENDIENTE', 'VALIDADA', 'EN_PROCESO', 'RESUELTA', 'CERRADA'];
    var idxActual = orden.indexOf(estadoActual);

    var items = estados.map(function(e, i) {
      var activo   = i <= idxActual;
      var color    = activo ? colorActivo : '#d1d5db';
      var textColor = activo ? '#fff' : '#9ca3af';
      return '<td align="center" style="padding:0 4px;">' +
        '<div style="width:28px;height:28px;border-radius:50%;background:' + color + ';display:inline-flex;align-items:center;justify-content:center;">' +
        '<span style="color:' + textColor + ';font-size:11px;font-weight:bold;">' + (i + 1) + '</span>' +
        '</div>' +
        '<p style="margin:4px 0 0;font-size:10px;color:' + (activo ? '#374151' : '#9ca3af') + ';font-family:Arial,sans-serif;">' + e.label + '</p>' +
        '</td>';
    }).join('<td style="padding-bottom:14px;"><div style="height:2px;width:20px;background:#e5e7eb;margin-top:14px;"></div></td>');

    return '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;"><tr><td>' +
      '<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>' + items + '</tr></table>' +
      '</td></tr></table>';
  },

  obtenerAsuntoPorEstado: function(estado) {
    var asuntos = {
      'PENDIENTE':  'Portal ARCOP - Solicitud recibida',
      'VALIDADA':   'Portal ARCOP - Identidad confirmada',
      'EN_PROCESO': 'Portal ARCOP - Solicitud en proceso',
      'RESUELTA':   'Portal ARCOP - Sus datos estan listos',
      'CERRADA':    'Portal ARCOP - Solicitud cerrada'
    };
    return asuntos[estado] || 'Portal ARCOP - Actualizacion';
  },

  obtenerMensajePorEstado: function(estado) {
    var mensajes = {
      'PENDIENTE': {
        titulo:     'Solicitud recibida',
        mensaje:    'Hemos recibido tu solicitud correctamente. Nuestro equipo la revisara a la brevedad.',
        importante: 'Debes validar tu identidad para que podamos procesar tu solicitud.'
      },
      'VALIDADA': {
        titulo:     'Identidad confirmada',
        mensaje:    'Tu identidad ha sido confirmada exitosamente. Comenzaremos a procesar tu solicitud.',
        importante: 'Te notificaremos cuando tus datos esten listos. Plazo maximo: 15 dias habiles.'
      },
      'EN_PROCESO': {
        titulo:     'Solicitud en proceso',
        mensaje:    'Estamos recopilando y preparando tus datos personales conforme a la Ley 21.719.',
        importante: 'Recibiras un email con el enlace de descarga cuando este listo.'
      },
      'RESUELTA': {
        titulo:     'Sus datos estan listos',
        mensaje:    'Tu solicitud ha sido completada. Accede al portal para descargar tus datos y registrar la entrega.',
        importante: null
      },
      'CERRADA': {
        titulo:     'Solicitud cerrada',
        mensaje:    'Tu solicitud ha sido cerrada exitosamente. La entrega de datos ha sido registrada.',
        importante: null
      }
    };
    return mensajes[estado] || { titulo: 'Actualizacion', mensaje: 'Tu solicitud ha sido actualizada.', importante: null };
  },

  obtenerEstadoTexto: function(estado) {
    var textos = {
      'PENDIENTE':  'Pendiente de validacion',
      'VALIDADA':   'Identidad validada',
      'EN_PROCESO': 'En proceso',
      'RESUELTA':   'Resuelta',
      'CERRADA':    'Cerrada'
    };
    return textos[estado] || estado;
  }

};