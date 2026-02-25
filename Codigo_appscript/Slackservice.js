// ============================================================
// SLACKSERVICE.GS — v1.0
// Notificaciones Portal ARCOP → canal Slack
//
// SETUP (una sola vez):
//   1. En Slack: Apps → Incoming Webhooks → Add to Slack
//   2. Selecciona canal #portal-arcop (o el que quieras)
//   3. Copia la Webhook URL
//   4. En Apps Script → Configuración del proyecto → Propiedades de script
//      Agrega: SLACK_WEBHOOK_URL = https://hooks.slack.com/services/...
//
// EVENTOS notificados automáticamente:
//   - Nueva solicitud recibida
//   - Identidad validada
//   - Estado cambiado (cualquiera)
//   - SLA próximo a vencer (llamado por trigger diario)
//   - Descarga confirmada por titular
// ============================================================

const SlackService = {

  // ── Obtener webhook URL desde propiedades del script ────
  _getWebhookUrl: function() {
    try {
      var url = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');
      if (!url) {
        Logger.log('[Slack] SLACK_WEBHOOK_URL no configurada — notificación omitida');
        return null;
      }
      return url;
    } catch (e) {
      Logger.log('[Slack] Error leyendo webhook URL: ' + e);
      return null;
    }
  },

  // ── Enviar mensaje genérico ─────────────────────────────
  _enviar: function(payload) {
    var url = this._getWebhookUrl();
    if (!url) return false;

    try {
      var response = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
      });

      var code = response.getResponseCode();
      if (code === 200) {
        Logger.log('[Slack] Mensaje enviado OK');
        return true;
      } else {
        Logger.log('[Slack] Error HTTP ' + code + ': ' + response.getContentText());
        return false;
      }
    } catch (e) {
      Logger.log('[Slack] Error al enviar: ' + e);
      return false;
    }
  },

  // ── Helper: obtener URL del portal ─────────────────────
  _getPortalUrl: function() {
    try {
      var config = ConfiguracionService.obtener();
      return (config.data && config.data.portal_url) || 'https://portal-arcop.vercel.app';
    } catch (e) {
      return 'https://portal-arcop.vercel.app';
    }
  },

  // ── Helper: emoji por tipo de derecho ──────────────────
  _emojiDerecho: function(tipo) {
    var mapa = {
      'ACCESO':        '🔍',
      'RECTIFICACION': '✏️',
      'CANCELACION':   '🗑️',
      'OPOSICION':     '🚫',
      'PORTABILIDAD':  '📦',
    };
    return mapa[(tipo || '').toUpperCase()] || '📋';
  },

  // ── Helper: emoji por estado ────────────────────────────
  _emojiEstado: function(estado) {
    var mapa = {
      'PENDIENTE':           '🕐',
      'VALIDADA':            '✅',
      'EN_PROCESO':          '⚙️',
      'RESUELTA':            '📤',
      'DESCARGA_CONFIRMADA': '📥',
      'CERRADA':             '🗂️',
    };
    return mapa[(estado || '').toUpperCase()] || '📋';
  },

  // ── Helper: texto legible del estado ───────────────────
  _textoEstado: function(estado) {
    var mapa = {
      'PENDIENTE':           'Pendiente',
      'VALIDADA':            'Validada',
      'EN_PROCESO':          'En Proceso',
      'RESUELTA':            'Resuelta',
      'DESCARGA_CONFIRMADA': 'Descarga Confirmada',
      'CERRADA':             'Cerrada',
    };
    return mapa[(estado || '').toUpperCase()] || estado;
  },

  // ──────────────────────────────────────────────────────
  // 1. NUEVA SOLICITUD RECIBIDA
  // Llamar desde SolicitudService.crear() después de guardar
  // ──────────────────────────────────────────────────────
  notificarNuevaSolicitud: function(solicitud) {
    var portalUrl = this._getPortalUrl();
    var emoji     = this._emojiDerecho(solicitud.tipo);

    var payload = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: emoji + '  Nueva solicitud ARCOP recibida',
            emoji: true,
          }
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: '*Número:*\n`' + (solicitud.numero_solicitud || '—') + '`' },
            { type: 'mrkdwn', text: '*Derecho:*\n' + (solicitud.tipo || 'ACCESO') },
            { type: 'mrkdwn', text: '*Titular:*\n' + (solicitud.nombre_completo || '—') },
            { type: 'mrkdwn', text: '*RUT:*\n' + (solicitud.rut || '—') },
            { type: 'mrkdwn', text: '*Fecha límite:*\n' + this._formatFecha(solicitud.fecha_limite) },
            { type: 'mrkdwn', text: '*Estado:*\n🕐 Pendiente de validación' },
          ]
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: '📋 Ver en Portal', emoji: true },
              url: portalUrl + '/#/dpo',
              style: 'primary',
            }
          ]
        },
        { type: 'divider' }
      ]
    };

    return this._enviar(payload);
  },

  // ──────────────────────────────────────────────────────
  // 2. CAMBIO DE ESTADO
  // Llamar desde DPOHandlers.actualizarSolicitud()
  // ──────────────────────────────────────────────────────
  notificarCambioEstado: function(params) {
    // params: { numero, tipo, nombreTitular, estadoAnterior, estadoNuevo, asignadoA, fechaTerminoSLA }
    var portalUrl      = this._getPortalUrl();
    var emojiNuevo     = this._emojiEstado(params.estadoNuevo);
    var textoAnterior  = this._textoEstado(params.estadoAnterior);
    var textoNuevo     = this._textoEstado(params.estadoNuevo);

    var fields = [
      { type: 'mrkdwn', text: '*Número:*\n`' + (params.numero || '—') + '`' },
      { type: 'mrkdwn', text: '*Derecho:*\n' + (params.tipo || 'ACCESO') },
      { type: 'mrkdwn', text: '*Titular:*\n' + (params.nombreTitular || '—') },
      { type: 'mrkdwn', text: '*Transición:*\n' + textoAnterior + ' → *' + textoNuevo + '*' },
    ];

    if (params.asignadoA) {
      fields.push({ type: 'mrkdwn', text: '*Asignado a:*\n' + params.asignadoA });
    }
    if (params.fechaTerminoSLA) {
      fields.push({ type: 'mrkdwn', text: '*SLA hasta:*\n' + this._formatFecha(params.fechaTerminoSLA) });
    }

    var payload = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: emojiNuevo + '  Estado actualizado: ' + textoNuevo,
            emoji: true,
          }
        },
        { type: 'section', fields: fields },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: '📋 Ver solicitud', emoji: true },
              url: portalUrl + '/#/dpo',
            }
          ]
        },
        { type: 'divider' }
      ]
    };

    return this._enviar(payload);
  },

  // ──────────────────────────────────────────────────────
  // 3. SOLICITUD RESUELTA (datos enviados al titular)
  // Llamar desde DPOHandlers.marcarResuelta()
  // ──────────────────────────────────────────────────────
  notificarResuelta: function(params) {
    // params: { numero, tipo, nombreTitular, formato }
    var portalUrl = this._getPortalUrl();

    var payload = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📤  Solicitud resuelta — datos enviados al titular',
            emoji: true,
          }
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: '*Número:*\n`' + (params.numero || '—') + '`' },
            { type: 'mrkdwn', text: '*Titular:*\n' + (params.nombreTitular || '—') },
            { type: 'mrkdwn', text: '*Derecho:*\n' + (params.tipo || 'ACCESO') },
            { type: 'mrkdwn', text: '*Formato entregado:*\n' + (params.formato || 'PDF') },
          ]
        },
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: '⏳ Esperando confirmación de descarga del titular' }
          ]
        },
        { type: 'divider' }
      ]
    };

    return this._enviar(payload);
  },

  // ──────────────────────────────────────────────────────
  // 4. DESCARGA CONFIRMADA POR EL TITULAR
  // Llamar desde DPOHandlers.confirmarDescarga()
  // ──────────────────────────────────────────────────────
  notificarDescargaConfirmada: function(params) {
    // params: { numero, tipo, nombreTitular, timestamp }
    var payload = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '📥 *Descarga confirmada* — el titular accedió a sus datos\n`' +
                  (params.numero || '—') + '` · ' + (params.nombreTitular || '—') +
                  ' · ' + this._formatFecha(params.timestamp),
          }
        },
        { type: 'divider' }
      ]
    };

    return this._enviar(payload);
  },

  // ──────────────────────────────────────────────────────
  // 5. ALERTA SLA PRÓXIMO A VENCER
  // Llamar desde trigger diario (ver instrucciones abajo)
  // ──────────────────────────────────────────────────────
  notificarAlertasSLA: function() {
    try {
      var solicitudes = GoogleSheetsService.obtenerTodas();
      var hoy         = new Date();
      var limite      = new Date(hoy.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 días
      var portalUrl   = this._getPortalUrl();

      var urgentes = solicitudes.filter(function(s) {
        var estadosActivos = ['PENDIENTE', 'VALIDADA', 'EN_PROCESO'];
        if (estadosActivos.indexOf(s.estado) === -1) return false;
        if (!s.fecha_limite) return false;
        var fl = new Date(s.fecha_limite);
        return fl <= limite && fl >= hoy;
      });

      if (urgentes.length === 0) {
        Logger.log('[Slack] Sin alertas SLA hoy');
        return false;
      }

      // Construir lista de solicitudes urgentes
      var lista = urgentes.map(function(s) {
        var fl        = new Date(s.fecha_limite);
        var diasRest  = Math.ceil((fl - hoy) / (1000 * 60 * 60 * 24));
        var urgencia  = diasRest <= 1 ? '🔴' : '🟡';
        return urgencia + ' `' + s.numero_solicitud + '` — ' +
               (s.nombre_completo || '?') + ' — *' + diasRest + ' día(s)*';
      }).join('\n');

      var payload = {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '⚠️  Alerta SLA — ' + urgentes.length + ' solicitud(es) por vencer',
              emoji: true,
            }
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: lista }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: '⚡ Ver solicitudes urgentes', emoji: true },
                url: portalUrl + '/#/dpo',
                style: 'danger',
              }
            ]
          },
          { type: 'divider' }
        ]
      };

      return this._enviar(payload);

    } catch (e) {
      Logger.log('[Slack] Error en notificarAlertasSLA: ' + e);
      return false;
    }
  },

  // ── Helper: formatear fecha legible ────────────────────
  _formatFecha: function(valor) {
    if (!valor) return '—';
    try {
      var d = new Date(valor);
      if (isNaN(d.getTime())) return String(valor);
      return d.toLocaleDateString('es-CL', {
        day:   '2-digit',
        month: 'short',
        year:  'numeric',
      });
    } catch (e) {
      return String(valor);
    }
  },

};

// ============================================================
// TRIGGER DIARIO PARA ALERTAS SLA
// Ejecutar UNA VEZ para registrar el trigger automático:
//
// function instalarTriggerSLA() {
//   ScriptApp.newTrigger('checkSLADiario')
//     .timeBased()
//     .everyDays(1)
//     .atHour(8)           // 8:00 AM hora del servidor
//     .create();
//   Logger.log('Trigger SLA instalado');
// }
//
// function checkSLADiario() {
//   SlackService.notificarAlertasSLA();
// }
// ============================================================