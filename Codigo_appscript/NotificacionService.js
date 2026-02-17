// ============================================
// NOTIFICACIONSERVICE.GS - v2.2
// Layout con TABLE (compatible email clients)
// Sin emojis en círculos de progreso
// ============================================

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

  // Construye la barra de progreso con TABLE (compatible con todos los clientes email)
  _construirProgreso: function(nuevoEstado, colorActivo) {
    var pasos = [
      { estado: 'PENDIENTE',  etiqueta: 'Recibida',   num: '1' },
      { estado: 'VALIDADA',   etiqueta: 'Validada',   num: '2' },
      { estado: 'EN_PROCESO', etiqueta: 'En Proceso', num: '3' },
      { estado: 'RESUELTA',   etiqueta: 'Resuelta',   num: '4' }
    ];
    var orden    = ['PENDIENTE', 'VALIDADA', 'EN_PROCESO', 'RESUELTA'];
    var stepActual = orden.indexOf(nuevoEstado);
    var color    = colorActivo || '#4285F4';

    // Fila de círculos y líneas
    var celdas = '';
    for (var i = 0; i < pasos.length; i++) {
      var completado = i <= stepActual;
      var esActual   = i === stepActual;

      var bgCirculo  = completado ? color : '#d1d5db';
      var border     = esActual ? 'border:3px solid #1a56db;' : '';
      var tamano     = '38px';

      celdas += '<td align="center" style="padding:0 4px;width:70px;">';
      celdas +=   '<table cellpadding="0" cellspacing="0" border="0" align="center"><tr><td align="center" valign="middle" ';
      celdas +=     'style="width:' + tamano + ';height:' + tamano + ';border-radius:50%;background:' + bgCirculo + ';' + border + '">';
      celdas +=     '<span style="color:white;font-size:16px;font-weight:bold;font-family:Arial,sans-serif;">' + pasos[i].num + '</span>';
      celdas +=   '</td></tr></table>';

      var labelColor = esActual ? color : (completado ? '#374151' : '#9ca3af');
      var labelBold  = esActual ? 'font-weight:bold;' : '';
      celdas += '<p style="margin:6px 0 0;font-size:11px;color:' + labelColor + ';' + labelBold + 'font-family:Arial,sans-serif;text-align:center;">' + pasos[i].etiqueta + '</p>';
      if (esActual) {
        celdas += '<p style="margin:2px 0 0;font-size:10px;color:' + color + ';font-family:Arial,sans-serif;text-align:center;">&#9650; actual</p>';
      }
      celdas += '</td>';

      // Línea conectora entre pasos
      if (i < pasos.length - 1) {
        var lineaColor = (i < stepActual) ? color : '#d1d5db';
        celdas += '<td style="padding:0;padding-bottom:22px;"><hr style="border:0;border-top:3px solid ' + lineaColor + ';margin:0;width:100%;min-width:20px;"></td>';
      }
    }

    return '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">' +
             '<tr><td style="padding:20px;">' +
               '<p style="text-align:center;font-weight:bold;color:#374151;margin:0 0 16px;font-size:13px;font-family:Arial,sans-serif;">Progreso de tu solicitud</p>' +
               '<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>' +
                 celdas +
               '</tr></table>' +
             '</td></tr>' +
           '</table>';
  },

  construirEmailCambioEstado: function(numeroSolicitud, nuevoEstado, info, config) {
    var progresoHtml = this._construirProgreso(nuevoEstado, '#4285F4');

    var alertaHtml = info.importante
      ? '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;"><tr><td style="background:#fff3cd;border-left:4px solid #ffc107;padding:14px;border-radius:0 4px 4px 0;font-family:Arial,sans-serif;font-size:14px;color:#856404;"><strong>Importante:</strong> ' + info.importante + '</td></tr></table>'
      : '';

    return '<!DOCTYPE html>' +
      '<html><head><meta charset="UTF-8"></head>' +
      '<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center" style="padding:20px 10px;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="600" style="background:white;border-radius:8px;overflow:hidden;">' +

        // Header
        '<tr><td style="background:linear-gradient(135deg,#667eea,#764ba2);padding:30px;text-align:center;">' +
          '<h1 style="margin:0;color:white;font-size:24px;font-family:Arial,sans-serif;">' + info.titulo + '</h1>' +
          '<p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;font-family:Arial,sans-serif;">Portal ARCOP - Ley 21.719</p>' +
        '</td></tr>' +

        // Contenido
        '<tr><td style="padding:30px;">' +
          '<h2 style="color:#333;margin-top:0;font-size:18px;font-family:Arial,sans-serif;">Actualizacion de tu solicitud</h2>' +
          '<p style="color:#666;font-family:Arial,sans-serif;">' + info.mensaje + '</p>' +

          // Info box
          '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;">' +
            '<tr><td style="background:#e8f0fe;border-left:4px solid #4285F4;padding:16px;border-radius:0 4px 4px 0;font-family:Arial,sans-serif;font-size:14px;">' +
              '<strong>Detalles:</strong><br><br>' +
              'Numero: <strong>' + numeroSolicitud + '</strong><br>' +
              'Estado: <strong>' + this.obtenerEstadoTexto(nuevoEstado) + '</strong><br>' +
              'Fecha: <strong>' + new Date().toLocaleDateString('es-CL') + '</strong>' +
            '</td></tr>' +
          '</table>' +

          // Progreso
          progresoHtml +

          alertaHtml +

          // Botón ver solicitud
          '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;"><tr><td align="center">' +
            '<a href="' + config.portal_url + '/#/seguimiento/' + numeroSolicitud + '" ' +
               'style="display:inline-block;padding:12px 30px;background:#4285F4;color:white;text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;font-family:Arial,sans-serif;">' +
              'Ver estado de mi solicitud' +
            '</a>' +
          '</td></tr></table>' +

        '</td></tr>' +

        // Footer
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

  construirEmailDatosListos: function(nombre, numeroSolicitud, urlDescarga, formato, config) {
    // Progreso completo en verde
    var progresoHtml = this._construirProgreso('RESUELTA', '#34A853');

    return '<!DOCTYPE html>' +
      '<html><head><meta charset="UTF-8"></head>' +
      '<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center" style="padding:20px 10px;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="600" style="background:white;border-radius:8px;overflow:hidden;">' +

        // Header verde
        '<tr><td style="background:linear-gradient(135deg,#34A853,#0F9D58);padding:30px;text-align:center;">' +
          '<h1 style="margin:0;color:white;font-size:24px;font-family:Arial,sans-serif;">Sus datos estan listos</h1>' +
          '<p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;font-family:Arial,sans-serif;">Portal ARCOP - Ley 21.719</p>' +
        '</td></tr>' +

        // Contenido
        '<tr><td style="padding:30px;">' +
          '<h2 style="color:#333;margin-top:0;font-size:18px;font-family:Arial,sans-serif;">Hola ' + nombre + ',</h2>' +
          '<p style="color:#666;font-family:Arial,sans-serif;">Hemos completado el procesamiento de tu solicitud. Tus datos estan disponibles en formato <strong>' + formato + '</strong>.</p>' +

          // Botón descarga
          '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;"><tr><td align="center">' +
            '<a href="' + urlDescarga + '" style="display:inline-block;padding:14px 36px;background:#34A853;color:white;text-decoration:none;border-radius:6px;font-weight:bold;font-size:15px;font-family:Arial,sans-serif;">Descargar mis datos</a>' +
          '</td></tr></table>' +

          // Info
          '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;">' +
            '<tr><td style="background:#e8f0fe;border-left:4px solid #4285F4;padding:16px;border-radius:0 4px 4px 0;font-family:Arial,sans-serif;font-size:14px;">' +
              '<strong>Informacion:</strong><br><br>' +
              'Numero: <strong>' + numeroSolicitud + '</strong><br>' +
              'Formato: <strong>' + formato + '</strong><br>' +
              'Fecha: <strong>' + new Date().toLocaleDateString('es-CL') + '</strong>' +
            '</td></tr>' +
          '</table>' +

          // Progreso completo
          progresoHtml +

          // Aviso link
          '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;">' +
            '<tr><td style="background:#fff3cd;border-left:4px solid #ffc107;padding:14px;border-radius:0 4px 4px 0;font-family:Arial,sans-serif;font-size:14px;color:#856404;">' +
              '<strong>Importante:</strong> Este link estara disponible por <strong>7 dias</strong>.' +
            '</td></tr>' +
          '</table>' +
        '</td></tr>' +

        // Footer
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

  obtenerAsuntoPorEstado: function(estado) {
    var asuntos = {
      'PENDIENTE':  'Portal ARCOP - Solicitud recibida',
      'VALIDADA':   'Portal ARCOP - Identidad confirmada',
      'EN_PROCESO': 'Portal ARCOP - Solicitud en proceso',
      'RESUELTA':   'Portal ARCOP - Solicitud completada',
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
        titulo:     'Solicitud completada',
        mensaje:    'Tu solicitud ha sido completada. Revisa el email de entrega de datos para descargarlos.',
        importante: null
      },
      'CERRADA': {
        titulo:     'Solicitud cerrada',
        mensaje:    'Tu solicitud ha sido cerrada exitosamente.',
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