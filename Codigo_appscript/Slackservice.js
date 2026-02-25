// ============================================================
// SLACKSERVICE.GS — v2.0
// Notificaciones Portal ARCOP → canales Slack por derecho
//
// CAMBIOS v2:
//   - Cada derecho puede tener su propio webhook Slack,
//     configurado desde TabFlujos (campo slack_webhook en
//     config.derechos[TIPO].slack_webhook, guardado en Sheets)
//   - _getWebhookUrl(tipo): busca webhook del derecho primero,
//     luego fallback a SLACK_WEBHOOK_URL general en Properties
//   - _enviar(payload, webhookUrl): recibe URL explícita
//   - probarWebhook(url, derecho): handler para doPost
//     action='probarSlackWebhook', llamado desde el portal
//
// SETUP:
//   1. En Slack: crear un webhook por canal/derecho
//   2. En Portal → Configuración → Flujos → seleccionar
//      derecho → sección "Canal Slack" → pegar URL → Guardar
//   3. Opcional: SLACK_WEBHOOK_URL en Script Properties
//      como fallback para derechos sin canal propio
// ============================================================

const SlackService = {

  // ── Webhook: busca por derecho, fallback general ────────
  _getWebhookUrl: function(tipo) {
    // 1. Webhook específico del derecho desde flujoConfig en Sheets
    try {
      if (tipo) {
        var configResult = ConfiguracionService.obtener();
        var flujoRaw = configResult.data && configResult.data.flujo_config;
        if (flujoRaw) {
          var flujo = JSON.parse(flujoRaw);
          var tipoKey = (tipo + '').toUpperCase();
          var webhookDerecho = flujo.derechos &&
                               flujo.derechos[tipoKey] &&
                               flujo.derechos[tipoKey].slack_webhook;
          if (webhookDerecho && (webhookDerecho + '').trim()) {
            Logger.log('[Slack] Usando webhook de derecho: ' + tipoKey);
            return (webhookDerecho + '').trim();
          }
        }
      }
    } catch (e) {
      Logger.log('[Slack] Error leyendo flujoConfig para webhook: ' + e);
    }

    // 2. Fallback: SLACK_WEBHOOK_URL general en Script Properties
    try {
      var urlGeneral = PropertiesService.getScriptProperties()
                         .getProperty('SLACK_WEBHOOK_URL');
      if (urlGeneral && (urlGeneral + '').trim()) {
        Logger.log('[Slack] Usando webhook general (fallback)');
        return (urlGeneral + '').trim();
      }
    } catch (e) {
      Logger.log('[Slack] Error leyendo SLACK_WEBHOOK_URL: ' + e);
    }

    Logger.log('[Slack] Sin webhook configurado para derecho: ' +
               (tipo || 'desconocido') + ' — notificación omitida');
    return null;
  },

  // ── Enviar payload a URL específica ────────────────────
  _enviar: function(payload, webhookUrl) {
    if (!webhookUrl) return false;
    try {
      var response = UrlFetchApp.fetch(webhookUrl, {
        method:             'post',
        contentType:        'application/json',
        payload:            JSON.stringify(payload),
        muteHttpExceptions: true,
      });
      var code = response.getResponseCode();
      if (code === 200) {
        Logger.log('[Slack] Mensaje enviado OK');
        return true;
      }
      Logger.log('[Slack] Error HTTP ' + code + ': ' + response.getContentText());
      return false;
    } catch (e) {
      Logger.log('[Slack] Error al enviar: ' + e);
      return false;
    }
  },

  // ── Helper: URL del portal ──────────────────────────────
  _getPortalUrl: function() {
    try {
      var config = ConfiguracionService.obtener();
      return (config.data && config.data.portal_url) || 'https://portal-arcop.vercel.app';
    } catch (e) {
      return 'https://portal-arcop.vercel.app';
    }
  },

  // ── Helpers de presentación ─────────────────────────────
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

  _formatFecha: function(valor) {
    if (!valor) return '—';
    try {
      var d = new Date(valor);
      if (isNaN(d.getTime())) return String(valor);
      return d.toLocaleDateString('es-CL', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch (e) { return String(valor); }
  },

  // ──────────────────────────────────────────────────────
  // 1. NUEVA SOLICITUD RECIBIDA
  //    Llamar desde SolicitudService.crear()
  // ──────────────────────────────────────────────────────
  notificarNuevaSolicitud: function(solicitud) {
    var tipo      = (solicitud.tipo || 'ACCESO').toUpperCase();
    var portalUrl = this._getPortalUrl();
    var emoji     = this._emojiDerecho(tipo);
    var webhook   = this._getWebhookUrl(tipo);
    if (!webhook) return false;

    return this._enviar({
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: emoji + '  Nueva solicitud ' + tipo + ' recibida',
            emoji: true,
          }
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: '*Número:*\n`' + (solicitud.numero_solicitud || '—') + '`' },
            { type: 'mrkdwn', text: '*Derecho:*\n' + tipo },
            { type: 'mrkdwn', text: '*Titular:*\n' + (solicitud.nombre_completo || '—') },
            { type: 'mrkdwn', text: '*RUT:*\n' + (solicitud.rut || '—') },
            { type: 'mrkdwn', text: '*Fecha límite:*\n' + this._formatFecha(solicitud.fecha_limite) },
            { type: 'mrkdwn', text: '*Estado:*\n🕐 Pendiente de validación' },
          ]
        },
        {
          type: 'actions',
          elements: [{
            type: 'button',
            text: { type: 'plain_text', text: '📋 Ver en Portal', emoji: true },
            url: portalUrl + '/#/dpo',
            style: 'primary',
          }]
        },
        { type: 'divider' }
      ]
    }, webhook);
  },

  // ──────────────────────────────────────────────────────
  // 2. CAMBIO DE ESTADO
  //    Llamar desde DPOHandlers.actualizarSolicitud()
  //    y SolicitudService.validarIdentidad()
  // ──────────────────────────────────────────────────────
  notificarCambioEstado: function(params) {
    // params: { numero, tipo, nombreTitular, estadoAnterior,
    //           estadoNuevo, asignadoA, fechaTerminoSLA }
    var tipo      = (params.tipo || 'ACCESO').toUpperCase();
    var portalUrl = this._getPortalUrl();
    var webhook   = this._getWebhookUrl(tipo);
    if (!webhook) return false;

    var emojiNuevo    = this._emojiEstado(params.estadoNuevo);
    var textoAnterior = this._textoEstado(params.estadoAnterior);
    var textoNuevo    = this._textoEstado(params.estadoNuevo);

    var fields = [
      { type: 'mrkdwn', text: '*Número:*\n`' + (params.numero || '—') + '`' },
      { type: 'mrkdwn', text: '*Derecho:*\n' + tipo },
      { type: 'mrkdwn', text: '*Titular:*\n' + (params.nombreTitular || '—') },
      { type: 'mrkdwn', text: '*Transición:*\n' + textoAnterior + ' → *' + textoNuevo + '*' },
    ];
    if (params.asignadoA) {
      fields.push({ type: 'mrkdwn', text: '*Asignado a:*\n' + params.asignadoA });
    }
    if (params.fechaTerminoSLA) {
      fields.push({ type: 'mrkdwn', text: '*SLA hasta:*\n' + this._formatFecha(params.fechaTerminoSLA) });
    }

    return this._enviar({
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: emojiNuevo + '  ' + tipo + ' — ' + textoNuevo,
            emoji: true,
          }
        },
        { type: 'section', fields: fields },
        {
          type: 'actions',
          elements: [{
            type: 'button',
            text: { type: 'plain_text', text: '📋 Ver solicitud', emoji: true },
            url: portalUrl + '/#/dpo',
          }]
        },
        { type: 'divider' }
      ]
    }, webhook);
  },

  // ──────────────────────────────────────────────────────
  // 3. SOLICITUD RESUELTA
  //    Llamar desde DPOHandlers.marcarResuelta()
  // ──────────────────────────────────────────────────────
  notificarResuelta: function(params) {
    // params: { numero, tipo, nombreTitular, formato }
    var tipo    = (params.tipo || 'ACCESO').toUpperCase();
    var webhook = this._getWebhookUrl(tipo);
    if (!webhook) return false;

    return this._enviar({
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📤  ' + tipo + ' — Datos enviados al titular',
            emoji: true,
          }
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: '*Número:*\n`' + (params.numero || '—') + '`' },
            { type: 'mrkdwn', text: '*Titular:*\n' + (params.nombreTitular || '—') },
            { type: 'mrkdwn', text: '*Derecho:*\n' + tipo },
            { type: 'mrkdwn', text: '*Formato:*\n' + (params.formato || 'PDF') },
          ]
        },
        {
          type: 'context',
          elements: [{
            type: 'mrkdwn',
            text: '⏳ Esperando confirmación de descarga del titular',
          }]
        },
        { type: 'divider' }
      ]
    }, webhook);
  },

  // ──────────────────────────────────────────────────────
  // 4. DESCARGA CONFIRMADA
  //    Llamar desde DPOHandlers.confirmarDescarga()
  // ──────────────────────────────────────────────────────
  notificarDescargaConfirmada: function(params) {
    // params: { numero, tipo, nombreTitular, timestamp }
    var tipo    = (params.tipo || 'ACCESO').toUpperCase();
    var webhook = this._getWebhookUrl(tipo);
    if (!webhook) return false;

    return this._enviar({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '📥 *' + tipo + '* — Descarga confirmada por el titular\n`' +
                  (params.numero || '—') + '` · ' +
                  (params.nombreTitular || '—') + ' · ' +
                  this._formatFecha(params.timestamp),
          }
        },
        { type: 'divider' }
      ]
    }, webhook);
  },

  // ──────────────────────────────────────────────────────
  // 5. ALERTA SLA (trigger diario — notifica en cada canal)
  //    Llamar desde checkSLADiario() (trigger instalado)
  // ──────────────────────────────────────────────────────
  notificarAlertasSLA: function() {
    try {
      var solicitudes = GoogleSheetsService.obtenerTodas();
      var hoy         = new Date();
      var limite      = new Date(hoy.getTime() + 3 * 24 * 60 * 60 * 1000);
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

      // Agrupar por tipo de derecho → enviar a cada canal
      var porTipo = {};
      urgentes.forEach(function(s) {
        var t = ((s.tipo || 'ACCESO') + '').toUpperCase();
        if (!porTipo[t]) porTipo[t] = [];
        porTipo[t].push(s);
      });

      var self = this;
      Object.keys(porTipo).forEach(function(tipo) {
        var webhook = self._getWebhookUrl(tipo);
        if (!webhook) return;

        var lista = porTipo[tipo].map(function(s) {
          var fl       = new Date(s.fecha_limite);
          var diasRest = Math.ceil((fl - hoy) / (1000 * 60 * 60 * 24));
          var urgencia = diasRest <= 1 ? '🔴' : '🟡';
          return urgencia + ' `' + s.numero_solicitud + '` — ' +
                 (s.nombre_completo || '?') + ' — *' + diasRest + ' día(s)*';
        }).join('\n');

        self._enviar({
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: '⚠️  Alerta SLA ' + tipo + ' — ' +
                      porTipo[tipo].length + ' solicitud(es) por vencer',
                emoji: true,
              }
            },
            { type: 'section', text: { type: 'mrkdwn', text: lista } },
            {
              type: 'actions',
              elements: [{
                type: 'button',
                text: { type: 'plain_text', text: '⚡ Ver urgentes', emoji: true },
                url: portalUrl + '/#/dpo',
                style: 'danger',
              }]
            },
            { type: 'divider' }
          ]
        }, webhook);
      });

      return true;

    } catch (e) {
      Logger.log('[Slack] Error en notificarAlertasSLA: ' + e);
      return false;
    }
  },

  // ──────────────────────────────────────────────────────
  // 6. PROBAR WEBHOOK (llamado desde doPost del portal)
  //    action: 'probarSlackWebhook'
  //    data:   { webhook_url, derecho }
  // ──────────────────────────────────────────────────────
  probarWebhook: function(webhookUrl, derecho) {
    if (!webhookUrl) return { status: 'error', message: 'URL requerida' };
    try {
      var response = UrlFetchApp.fetch(webhookUrl, {
        method:             'post',
        contentType:        'application/json',
        payload:            JSON.stringify({
          text: '🧪 *Test Portal ARCOP* — Webhook del derecho *' +
                (derecho || '?') + '* configurado correctamente ✅',
        }),
        muteHttpExceptions: true,
      });
      var code = response.getResponseCode();
      if (code === 200) return { status: 'success', message: 'Mensaje de prueba enviado OK' };
      return {
        status: 'error',
        message: 'HTTP ' + code + ': ' + response.getContentText(),
      };
    } catch (e) {
      return { status: 'error', message: e.toString() };
    }
  },

};

// ============================================================
// TRIGGER DIARIO ALERTAS SLA — ejecutar UNA VEZ:
//
// function instalarTriggerSLA() {
//   ScriptApp.newTrigger('checkSLADiario')
//     .timeBased().everyDays(1).atHour(8).create();
//   Logger.log('Trigger SLA instalado');
// }
//
// function checkSLADiario() {
//   SlackService.notificarAlertasSLA();
// }
// ============================================================