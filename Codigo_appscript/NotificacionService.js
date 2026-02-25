// ============================================
// NOTIFICACIONSERVICE.GS - v2.3
// Agrega enviarAsignacionResponsable()
// Email interno al actor asignado con
// características de la tarea y plazo SLA
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

  // ──────────────────────────────────────────────────────────
  // EMAIL INTERNO AL RESPONSABLE ASIGNADO
  // Incluye: qué debe hacer, plazo inicio y término
  // ──────────────────────────────────────────────────────────
  enviarAsignacionResponsable: function(datos) {
    // datos = {
    //   emailResponsable, nombreResponsable,
    //   numeroSolicitud, tipoSolicitud, estadoAsignado,
    //   nombreTitular, fechaInicio, fechaTermino
    // }
    try {
      Logger.log('Enviando email asignacion a responsable: ' + datos.emailResponsable);
      var config = EmailService.obtenerConfigParaEmail();
      var html   = this.construirEmailAsignacion(datos, config);

      GmailApp.sendEmail(
        datos.emailResponsable,
        'ARCOP - Tarea asignada: ' + datos.numeroSolicitud + ' [' + (datos.tipoSolicitud || 'ACCESO') + ']',
        'Tarea asignada - ' + datos.numeroSolicitud,
        { htmlBody: html, name: config.nombre }
      );
      Logger.log('Email responsable enviado OK');
    } catch (error) {
      Logger.log('Error al enviar email responsable: ' + error);
      throw error;
    }
  },

  construirEmailAsignacion: function(datos, config) {
    var tipo          = datos.tipoSolicitud  || 'ACCESO';
    var estado        = datos.estadoAsignado || 'EN_PROCESO';
    var nombre        = datos.nombreResponsable || 'Responsable';
    var numeroSol     = datos.numeroSolicitud   || '';
    var nombreTitular = datos.nombreTitular     || 'Titular';

    // Formatear fechas
    var fechaInicio  = datos.fechaInicio  ? new Date(datos.fechaInicio).toLocaleDateString('es-CL',  { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleDateString('es-CL');
    var fechaTermino = datos.fechaTermino ? new Date(datos.fechaTermino).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : null;

    // Descripción de la tarea según tipo de derecho
    var tareas = {
      'ACCESO':        'Recopilar todos los datos personales del titular que la empresa posee, organizarlos en el formato solicitado (PDF, CSV, JSON, etc.) y prepararlos para su entrega a traves del Portal ARCOP.',
      'RECTIFICACION': 'Identificar y corregir los datos incorrectos o desactualizados del titular en todos los sistemas de la empresa. Notificar a terceros si los datos fueron cedidos previamente.',
      'CANCELACION':   'Bloquear temporalmente el tratamiento de los datos del titular y proceder a su eliminacion definitiva de todos los sistemas de la empresa donde se encuentren almacenados.',
      'OPOSICION':     'Identificar el tratamiento especifico al que el titular se opone y proceder a detenerlo. Bloquear ese tratamiento en todos los sistemas afectados.',
      'PORTABILIDAD':  'Exportar los datos del titular en un formato estructurado, interoperable y de uso comun (JSON, CSV o XML) para ser transferidos al destino indicado por el titular.',
    };
    var descripcionTarea = tareas[tipo] || 'Procesar la solicitud del titular conforme a la Ley 21.719.';

    // Color segun tipo
    var colores = {
      'ACCESO':        '#4285F4',
      'RECTIFICACION': '#F4B400',
      'CANCELACION':   '#EA4335',
      'OPOSICION':     '#FF6D00',
      'PORTABILIDAD':  '#34A853',
    };
    var color = colores[tipo] || '#4285F4';

    return '<!DOCTYPE html>' +
      '<html><head><meta charset="UTF-8"></head>' +
      '<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center" style="padding:20px 10px;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="600" style="background:white;border-radius:8px;overflow:hidden;">' +

        // ── Header ──────────────────────────────────────────
        '<tr><td style="background:' + color + ';padding:28px 30px;">' +
          '<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>' +
            '<td>' +
              '<p style="margin:0 0 4px;color:rgba(255,255,255,0.8);font-size:12px;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:1px;">Tarea asignada — Portal ARCOP</p>' +
              '<h1 style="margin:0;color:white;font-size:22px;font-family:Arial,sans-serif;">Derecho de ' + tipo.charAt(0) + tipo.slice(1).toLowerCase() + '</h1>' +
            '</td>' +
            '<td align="right" valign="top">' +
              '<span style="background:rgba(255,255,255,0.2);color:white;font-size:13px;font-weight:bold;padding:6px 14px;border-radius:20px;font-family:Arial,sans-serif;">' + numeroSol + '</span>' +
            '</td>' +
          '</tr></table>' +
        '</td></tr>' +

        // ── Saludo ───────────────────────────────────────────
        '<tr><td style="padding:28px 30px 0;">' +
          '<p style="margin:0;font-size:16px;color:#111827;font-family:Arial,sans-serif;">Hola <strong>' + nombre + '</strong>,</p>' +
          '<p style="margin:10px 0 0;font-size:14px;color:#4B5563;font-family:Arial,sans-serif;">Se te ha asignado la siguiente tarea en el Portal ARCOP.</p>' +
        '</td></tr>' +

        // ── Datos del titular ─────────────────────────────────
        '<tr><td style="padding:20px 30px 0;">' +
          '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;">' +
            '<tr><td style="padding:16px 20px;border-bottom:1px solid #E5E7EB;">' +
              '<p style="margin:0;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;font-family:Arial,sans-serif;">Datos de la solicitud</p>' +
            '</td></tr>' +
            '<tr><td style="padding:16px 20px;">' +
              '<table cellpadding="0" cellspacing="0" border="0" width="100%">' +
                '<tr>' +
                  '<td style="padding:4px 0;font-size:13px;color:#6B7280;font-family:Arial,sans-serif;width:140px;">Numero solicitud</td>' +
                  '<td style="padding:4px 0;font-size:13px;color:#111827;font-weight:bold;font-family:Arial,sans-serif;">' + numeroSol + '</td>' +
                '</tr>' +
                '<tr>' +
                  '<td style="padding:4px 0;font-size:13px;color:#6B7280;font-family:Arial,sans-serif;">Tipo de derecho</td>' +
                  '<td style="padding:4px 0;font-size:13px;color:#111827;font-weight:bold;font-family:Arial,sans-serif;">' + tipo + '</td>' +
                '</tr>' +
                '<tr>' +
                  '<td style="padding:4px 0;font-size:13px;color:#6B7280;font-family:Arial,sans-serif;">Titular</td>' +
                  '<td style="padding:4px 0;font-size:13px;color:#111827;font-weight:bold;font-family:Arial,sans-serif;">' + nombreTitular + '</td>' +
                '</tr>' +
                '<tr>' +
                  '<td style="padding:4px 0;font-size:13px;color:#6B7280;font-family:Arial,sans-serif;">Estado asignado</td>' +
                  '<td style="padding:4px 0;font-size:13px;font-family:Arial,sans-serif;"><span style="background:' + color + '22;color:' + color + ';font-weight:bold;padding:2px 10px;border-radius:12px;">' + estado.replace(/_/g, ' ') + '</span></td>' +
                '</tr>' +
              '</table>' +
            '</td></tr>' +
          '</table>' +
        '</td></tr>' +

        // ── Descripción tarea ─────────────────────────────────
        '<tr><td style="padding:20px 30px 0;">' +
          '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#EEF2FF;border-left:4px solid ' + color + ';border-radius:0 8px 8px 0;">' +
            '<tr><td style="padding:16px 20px;">' +
              '<p style="margin:0 0 8px;font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;font-family:Arial,sans-serif;">Que debes hacer</p>' +
              '<p style="margin:0;font-size:14px;color:#1E3A8A;font-family:Arial,sans-serif;line-height:1.6;">' + descripcionTarea + '</p>' +
            '</td></tr>' +
          '</table>' +
        '</td></tr>' +

        // ── Plazos ───────────────────────────────────────────
        '<tr><td style="padding:20px 30px 0;">' +
          '<table cellpadding="0" cellspacing="0" border="0" width="100%">' +
            '<tr>' +
              // Inicio
              '<td style="width:48%;background:#F0FDF4;border:1px solid #86EFAC;border-radius:8px;padding:16px 18px;" valign="top">' +
                '<p style="margin:0 0 4px;font-size:11px;color:#166534;text-transform:uppercase;letter-spacing:0.5px;font-family:Arial,sans-serif;">Fecha de inicio</p>' +
                '<p style="margin:0;font-size:13px;color:#14532D;font-weight:bold;font-family:Arial,sans-serif;">' + fechaInicio + '</p>' +
              '</td>' +
              '<td style="width:4%;"></td>' +
              // Término
              '<td style="width:48%;background:' + (fechaTermino ? '#FFF7ED' : '#F9FAFB') + ';border:1px solid ' + (fechaTermino ? '#FED7AA' : '#E5E7EB') + ';border-radius:8px;padding:16px 18px;" valign="top">' +
                '<p style="margin:0 0 4px;font-size:11px;color:' + (fechaTermino ? '#9A3412' : '#6B7280') + ';text-transform:uppercase;letter-spacing:0.5px;font-family:Arial,sans-serif;">Plazo limite (SLA)</p>' +
                '<p style="margin:0;font-size:13px;color:' + (fechaTermino ? '#7C2D12' : '#9CA3AF') + ';font-weight:bold;font-family:Arial,sans-serif;">' + (fechaTermino || 'Sin plazo definido') + '</p>' +
              '</td>' +
            '</tr>' +
          '</table>' +
        '</td></tr>' +

        // ── Aviso legal ───────────────────────────────────────
        '<tr><td style="padding:20px 30px 0;">' +
          '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FEF9C3;border-left:4px solid #EAB308;border-radius:0 8px 8px 0;">' +
            '<tr><td style="padding:14px 18px;">' +
              '<p style="margin:0;font-size:13px;color:#713F12;font-family:Arial,sans-serif;">' +
                '<strong>Aviso legal:</strong> El plazo maximo establecido por la Ley 21.719 es de <strong>15 dias habiles</strong> desde la validacion de identidad. ' +
                'El incumplimiento puede derivar en sanciones ante la APDP.' +
              '</p>' +
            '</td></tr>' +
          '</table>' +
        '</td></tr>' +

        // ── Footer ───────────────────────────────────────────
        '<tr><td style="background:#F5F5F5;padding:24px 30px;text-align:center;margin-top:28px;">' +
          '<p style="margin:0;font-size:13px;color:#666;font-family:Arial,sans-serif;">' +
            '<strong>' + config.nombre + '</strong><br>' +
            'RUT: ' + config.rut + ' | ' + config.email + ' | ' + config.telefono +
          '</p>' +
          '<p style="margin:8px 0 0;font-size:11px;color:#999;font-family:Arial,sans-serif;">Email automatico generado por Portal ARCOP - Ley 21.719</p>' +
        '</td></tr>' +

      '</table>' +
      '</td></tr></table>' +
      '</body></html>';
  },

  // ── Barra de progreso ─────────────────────────────────────
  _construirProgreso: function(nuevoEstado, colorActivo) {
    var pasos = [
      { estado: 'PENDIENTE',  etiqueta: 'Recibida',   num: '1' },
      { estado: 'VALIDADA',   etiqueta: 'Validada',   num: '2' },
      { estado: 'EN_PROCESO', etiqueta: 'En Proceso', num: '3' },
      { estado: 'RESUELTA',   etiqueta: 'Resuelta',   num: '4' }
    ];
    var orden      = ['PENDIENTE', 'VALIDADA', 'EN_PROCESO', 'RESUELTA'];
    var stepActual = orden.indexOf(nuevoEstado);
    var color      = colorActivo || '#4285F4';

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

      if (i < pasos.length - 1) {
        var lineaColor = (i < stepActual) ? color : '#d1d5db';
        celdas += '<td style="padding:0;padding-bottom:22px;"><hr style="border:0;border-top:3px solid ' + lineaColor + ';margin:0;width:100%;min-width:20px;"></td>';
      }
    }

    return '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">' +
             '<tr><td style="padding:20px;">' +
               '<p style="text-align:center;font-weight:bold;color:#374151;margin:0 0 16px;font-size:13px;font-family:Arial,sans-serif;">Progreso de tu solicitud</p>' +
               '<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>' + celdas + '</tr></table>' +
             '</td></tr>' +
           '</table>';
  },

  construirEmailCambioEstado: function(numeroSolicitud, nuevoEstado, info, config) {
    var progresoHtml = this._construirProgreso(nuevoEstado, '#4285F4');

    var alertaHtml = info.importante
      ? '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;">' +
          '<tr><td style="background:#fff3cd;border-left:4px solid #ffc107;padding:14px;border-radius:0 4px 4px 0;font-family:Arial,sans-serif;font-size:14px;color:#856404;">' +
            '<strong>Importante:</strong> ' + info.importante +
          '</td></tr>' +
        '</table>'
      : '';

    return '<!DOCTYPE html>' +
      '<html><head><meta charset="UTF-8"></head>' +
      '<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center" style="padding:20px 10px;">' +
      '<table cellpadding="0" cellspacing="0" border="0" width="600" style="background:white;border-radius:8px;overflow:hidden;">' +

        '<tr><td style="background:linear-gradient(135deg,#4285F4,#1a56db);padding:30px;text-align:center;">' +
          '<h1 style="margin:0;color:white;font-size:24px;font-family:Arial,sans-serif;">' + info.titulo + '</h1>' +
          '<p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;font-family:Arial,sans-serif;">Portal ARCOP - Ley 21.719</p>' +
        '</td></tr>' +

        '<tr><td style="padding:30px;">' +
          '<p style="color:#333;font-family:Arial,sans-serif;">' + info.mensaje + '</p>' +

          '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;">' +
            '<tr><td style="background:#e8f0fe;border-left:4px solid #4285F4;padding:16px;border-radius:0 4px 4px 0;font-family:Arial,sans-serif;font-size:14px;">' +
              '<strong>Detalles:</strong><br><br>' +
              'Numero: <strong>' + numeroSolicitud + '</strong><br>' +
              'Estado: <strong>' + this.obtenerEstadoTexto(nuevoEstado) + '</strong><br>' +
              'Fecha: <strong>' + new Date().toLocaleDateString('es-CL') + '</strong>' +
            '</td></tr>' +
          '</table>' +

          progresoHtml +
          alertaHtml +

          '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;"><tr><td align="center">' +
            '<a href="' + config.portal_url + '/#/seguimiento/' + numeroSolicitud + '" ' +
               'style="display:inline-block;padding:12px 30px;background:#4285F4;color:white;text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;font-family:Arial,sans-serif;">' +
              'Ver estado de mi solicitud' +
            '</a>' +
          '</td></tr></table>' +

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

  construirEmailDatosListos: function(nombre, numeroSolicitud, urlDescarga, formato, config) {
    var progresoHtml = this._construirProgreso('RESUELTA', '#34A853');

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

          '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;"><tr><td align="center">' +
            '<a href="' + urlDescarga + '" style="display:inline-block;padding:14px 36px;background:#34A853;color:white;text-decoration:none;border-radius:6px;font-weight:bold;font-size:15px;font-family:Arial,sans-serif;">Descargar mis datos</a>' +
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
              '<strong>Importante:</strong> Este link estara disponible por <strong>7 dias</strong>.' +
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