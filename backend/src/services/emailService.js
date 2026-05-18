// ============================================================
// src/services/emailService.js
// Envío de emails transaccionales vía Resend.
// Todos los templates usan HTML tables — sin CSS externo,
// sin flexbox, sin emojis en subjects. Compatible con
// Gmail, Outlook, Apple Mail, webmail corporativo.
// ============================================================
'use strict';

const { Resend } = require('resend');

const resend         = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL     = process.env.RESEND_FROM      || 'portal@arcop.cl';
const FROM_NAME      = process.env.RESEND_FROM_NAME || 'Portal ARCOP';
const DPO_EMAIL      = process.env.DPO_EMAIL        || '';
const FRONTEND_URL   = process.env.FRONTEND_URL     || 'https://arcop-portal.vercel.app';

// ── Colores y etiquetas por estado ───────────────────────
const COLOR_ESTADO = {
  PENDIENTE:           '#D97706',
  VALIDADA:            '#2563EB',
  EN_PROCESO:          '#7C3AED',
  RESUELTA:            '#16A34A',
  DESCARGA_CONFIRMADA: '#0D9488',
  CERRADA:             '#6B7280',
};

const PASOS_PROGRESO = [
  { id: 'PENDIENTE',  label: 'Recibida'   },
  { id: 'VALIDADA',   label: 'Validada'   },
  { id: 'EN_PROCESO', label: 'En proceso' },
  { id: 'RESUELTA',   label: 'Lista'      },
  { id: 'CERRADA',    label: 'Cerrada'    },
];

// ─────────────────────────────────────────────────────────
// HELPERS HTML
// ─────────────────────────────────────────────────────────

function _barraProgreso(estadoActual) {
  const idxActual = PASOS_PROGRESO.findIndex(p => p.id === estadoActual);
  const celdas = PASOS_PROGRESO.map((paso, i) => {
    const ok  = i <= idxActual;
    const bg  = ok ? '#2563EB' : '#D1D5DB';
    const tc  = ok ? '#111827' : '#9CA3AF';
    return `
      <td align="center" style="padding:0 6px;vertical-align:top;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td align="center" style="width:28px;height:28px;border-radius:50%;background:${bg};">
            <span style="color:#fff;font-size:11px;font-weight:bold;font-family:Arial,sans-serif;line-height:28px;display:block;">${i+1}</span>
          </td>
        </tr><tr>
          <td align="center" style="padding-top:4px;">
            <span style="font-size:9px;color:${tc};font-family:Arial,sans-serif;white-space:nowrap;">${paso.label}</span>
          </td>
        </tr></table>
      </td>`;
  }).join('');
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:20px auto;"><tr>${celdas}</tr></table>`;
}

function _fila(label, valor) {
  return `
    <tr>
      <td style="padding:9px 0;border-bottom:1px solid #E5E7EB;width:150px;">
        <span style="font-size:11px;color:#6B7280;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.04em;">${label}</span>
      </td>
      <td style="padding:9px 0 9px 14px;border-bottom:1px solid #E5E7EB;">
        <span style="font-size:13px;font-weight:600;color:#111827;font-family:Arial,sans-serif;">${valor}</span>
      </td>
    </tr>`;
}

function _boton(texto, url, color) {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin:24px auto;">
      <tr><td align="center" style="background:${color || '#2563EB'};border-radius:6px;">
        <a href="${url}" style="display:inline-block;padding:13px 34px;color:#fff;text-decoration:none;font-size:15px;font-weight:bold;font-family:Arial,sans-serif;">${texto}</a>
      </td></tr>
    </table>`;
}

function _alerta(texto, tipo) {
  const bg  = tipo === 'warning' ? '#FEF3C7' : '#EFF6FF';
  const brd = tipo === 'warning' ? '#F59E0B' : '#2563EB';
  const tc  = tipo === 'warning' ? '#92400E' : '#1E40AF';
  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:14px 0;">
      <tr><td style="background:${bg};border-left:4px solid ${brd};padding:11px 14px;border-radius:0 6px 6px 0;">
        <span style="font-size:13px;color:${tc};font-family:Arial,sans-serif;line-height:1.5;">${texto}</span>
      </td></tr>
    </table>`;
}

function _header(titulo, subtitulo, color) {
  return `
    <tr><td align="center" style="background:${color || '#2563EB'};padding:30px 40px;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-family:Arial,sans-serif;font-weight:bold;">${titulo}</h1>
      ${subtitulo ? `<p style="margin:7px 0 0;color:rgba(255,255,255,0.85);font-size:13px;font-family:Arial,sans-serif;">${subtitulo}</p>` : ''}
    </td></tr>`;
}

function _footer(config) {
  const empresa = (config && config.empresa_nombre) || 'Portal ARCOP';
  const dpo     = (config && config.dpo_email)      || DPO_EMAIL;
  const tel     = (config && config.dpo_telefono)   || '';
  return `
    <tr><td style="background:#F3F4F6;padding:22px 40px;border-top:1px solid #E5E7EB;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center">
        <p style="margin:0;font-size:13px;font-weight:bold;color:#374151;font-family:Arial,sans-serif;">${empresa}</p>
        ${dpo ? `<p style="margin:4px 0 0;font-size:12px;color:#6B7280;font-family:Arial,sans-serif;">${dpo}${tel ? ' | ' + tel : ''}</p>` : ''}
        <p style="margin:8px 0 0;font-size:11px;color:#9CA3AF;font-family:Arial,sans-serif;">Email automatico generado por Portal ARCOP &mdash; Ley 21.719 Chile</p>
      </td></tr></table>
    </td></tr>`;
}

function _wrap(filas) {
  return `<!DOCTYPE html><html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F3F4F6;">
<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
  <td align="center" style="padding:24px 16px;">
    <table cellpadding="0" cellspacing="0" border="0" width="600"
      style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #E5E7EB;">
      ${filas}
    </table>
  </td>
</tr></table>
</body></html>`;
}

// ─────────────────────────────────────────────────────────
// TEMPLATES
// ─────────────────────────────────────────────────────────

function _tplRecepcion(solicitud, validarUrl, config) {
  const derechoLabel = {
    ACCESO:        'Acceso (Art. 5)',
    RECTIFICACION: 'Rectificacion (Art. 6)',
    CANCELACION:   'Cancelacion (Art. 7)',
    OPOSICION:     'Oposicion (Art. 8)',
    PORTABILIDAD:  'Portabilidad (Art. 9)',
  }[solicitud.tipo_derecho] || solicitud.tipo_derecho || 'Acceso';

  return _wrap(`
    ${_header('Solicitud Recibida', 'Portal ARCOP - Ley 21.719')}
    <tr><td style="padding:30px 40px;">
      <p style="margin:0 0 14px;font-size:15px;color:#111827;font-family:Arial,sans-serif;">
        Hola <strong>${solicitud.nombre_completo}</strong>,
      </p>
      <p style="margin:0 0 18px;font-size:14px;color:#374151;font-family:Arial,sans-serif;line-height:1.6;">
        Hemos recibido tu solicitud. Para procesarla debes confirmar tu identidad con el boton a continuacion.
      </p>
      ${_boton('Confirmar mi identidad', validarUrl)}
      ${_alerta('Este enlace expira en <strong>30 minutos</strong>. Si no solicitaste esto, ignora este correo.', 'warning')}
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:18px 0;">
        <tr><td style="padding-bottom:8px;"><span style="font-size:11px;font-weight:bold;color:#374151;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.06em;">Tu solicitud</span></td></tr>
        ${_fila('Numero',  solicitud.numero_solicitud)}
        ${_fila('Derecho', derechoLabel)}
        ${_fila('Estado',  'Pendiente de validacion')}
        ${_fila('Plazo',   '15 dias habiles desde validacion')}
      </table>
      <p style="margin:14px 0 0;font-size:12px;color:#6B7280;font-family:Arial,sans-serif;">
        Si el boton no funciona, pega este enlace en tu navegador:<br>
        <span style="color:#2563EB;word-break:break-all;">${validarUrl}</span>
      </p>
    </td></tr>
    ${_footer(config)}
  `);
}

function _tplCambioEstado(solicitud, nuevoEstado, config) {
  const color    = COLOR_ESTADO[nuevoEstado] || '#2563EB';
  const progreso = _barraProgreso(nuevoEstado);
  const portalUrl = (config && config.portal_url) || FRONTEND_URL;
  const seguimientoUrl = `${portalUrl}/#/seguimiento/${solicitud.numero_solicitud}`;

  const mensajes = {
    VALIDADA:   { titulo: 'Identidad confirmada',   cuerpo: 'Tu identidad ha sido confirmada. Comenzaremos a procesar tu solicitud de inmediato.', alerta: 'Plazo maximo de respuesta: <strong>15 dias habiles</strong> desde hoy.' },
    EN_PROCESO: { titulo: 'Solicitud en proceso',   cuerpo: 'Estamos recopilando y preparando tus datos conforme a la Ley 21.719. Te avisaremos cuando esten listos.', alerta: null },
    CERRADA:    { titulo: 'Solicitud cerrada',       cuerpo: 'Tu solicitud ha sido cerrada correctamente. La entrega de datos quedo registrada en el sistema.', alerta: null },
  };
  const msg = mensajes[nuevoEstado] || { titulo: `Estado: ${nuevoEstado}`, cuerpo: 'Tu solicitud ha sido actualizada.', alerta: null };

  return _wrap(`
    ${_header(msg.titulo, 'Portal ARCOP - Ley 21.719', color)}
    <tr><td style="padding:8px 40px 0;">${progreso}</td></tr>
    <tr><td style="padding:0 40px 30px;">
      <p style="margin:0 0 14px;font-size:15px;color:#111827;font-family:Arial,sans-serif;">
        Hola <strong>${solicitud.nombre_completo}</strong>,
      </p>
      <p style="margin:0 0 14px;font-size:14px;color:#374151;font-family:Arial,sans-serif;line-height:1.6;">${msg.cuerpo}</p>
      ${msg.alerta ? _alerta(msg.alerta) : ''}
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:14px 0;">
        ${_fila('Numero', solicitud.numero_solicitud)}
        ${_fila('Estado', nuevoEstado)}
      </table>
      ${_boton('Ver seguimiento', seguimientoUrl)}
    </td></tr>
    ${_footer(config)}
  `);
}

function _tplDatosListos(solicitud, urlDescarga, formato, config) {
  const portalUrl      = (config && config.portal_url) || FRONTEND_URL;
  const seguimientoUrl = `${portalUrl}/#/seguimiento/${solicitud.numero_solicitud}`;

  return _wrap(`
    ${_header('Sus datos estan listos', 'Portal ARCOP - Ley 21.719', '#16A34A')}
    <tr><td style="padding:8px 40px 0;">${_barraProgreso('RESUELTA')}</td></tr>
    <tr><td style="padding:0 40px 30px;">
      <p style="margin:0 0 14px;font-size:15px;color:#111827;font-family:Arial,sans-serif;">
        Hola <strong>${solicitud.nombre_completo}</strong>,
      </p>
      <p style="margin:0 0 14px;font-size:14px;color:#374151;font-family:Arial,sans-serif;line-height:1.6;">
        Hemos completado tu solicitud. Tus datos estan disponibles en formato <strong>${formato || 'PDF'}</strong>.
      </p>
      ${_boton('Descargar mis datos', seguimientoUrl, '#16A34A')}
      ${_alerta('Al descargar confirmaras que recibiste tus datos. Esto quedara registrado en el sistema.')}
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:14px 0;">
        ${_fila('Numero',  solicitud.numero_solicitud)}
        ${_fila('Formato', formato || 'PDF')}
        ${urlDescarga ? _fila('Acceso directo', `<a href="${urlDescarga}" style="color:#2563EB;">Enlace directo al archivo</a>`) : ''}
      </table>
    </td></tr>
    ${_footer(config)}
  `);
}

function _tplNuevaSolicitudDPO(solicitud, config) {
  const portalUrl  = (config && config.portal_url) || FRONTEND_URL;
  const panelUrl   = `${portalUrl}/#/dpo`;
  const fechaLimite = solicitud.fecha_limite
    ? new Date(solicitud.fecha_limite).toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' })
    : '—';

  return _wrap(`
    ${_header('Nueva solicitud ARCOP recibida', 'Panel DPO - Requiere atencion', '#7C3AED')}
    <tr><td style="padding:30px 40px;">
      <p style="margin:0 0 18px;font-size:14px;color:#374151;font-family:Arial,sans-serif;line-height:1.6;">
        Se ha registrado una nueva solicitud pendiente de validacion de identidad.
      </p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 18px;">
        ${_fila('Numero',       solicitud.numero_solicitud)}
        ${_fila('Titular',      solicitud.nombre_completo)}
        ${_fila('RUT',          solicitud.rut)}
        ${_fila('Derecho',      solicitud.tipo_derecho || 'ACCESO')}
        ${_fila('Estado',       'Pendiente de validacion')}
        ${_fila('Fecha limite', fechaLimite)}
      </table>
      ${_boton('Ver en Panel DPO', panelUrl, '#7C3AED')}
    </td></tr>
    ${_footer(config)}
  `);
}

function _tplRechazo(solicitud, causal, nota, config) {
  const mensajesCausal = {
    'Solicitud improcedente':    'Tu solicitud fue declarada improcedente. Según la normativa vigente (Ley 21.719), la solicitud no puede ser procesada en los términos planteados.',
    'Identidad no verificable':  'No fue posible verificar tu identidad con los medios disponibles. Para proteger tus datos y los de terceros, no es posible procesar solicitudes sin confirmar la identidad del solicitante.',
    'Solicitud duplicada':       'Tu solicitud es un duplicado de otra solicitud activa o ya procesada anteriormente para el mismo derecho ejercido.',
    'Desistimiento del titular': 'Has desistido de tu solicitud a petición propia. Si deseas ejercer este derecho en el futuro, puedes presentar una nueva solicitud.',
  };

  const descripcionCausal = mensajesCausal[causal] || causal;

  return _wrap(`
    ${_header('Solicitud Rechazada', 'Portal ARCOP - Ley 21.719', '#DC2626')}
    <tr><td style="padding:30px 40px;">
      <p style="margin:0 0 14px;font-size:15px;color:#111827;font-family:Arial,sans-serif;">
        Estimado/a <strong>${solicitud.nombre_completo}</strong>,
      </p>
      <p style="margin:0 0 18px;font-size:14px;color:#374151;font-family:Arial,sans-serif;line-height:1.6;">
        Lamentamos informarte que tu solicitud ha sido rechazada por la siguiente razon:
      </p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 18px;">
        <tr><td style="background:#FEF2F2;border-left:4px solid #DC2626;padding:14px 18px;border-radius:0 6px 6px 0;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:bold;color:#991B1B;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.05em;">Causal de rechazo</p>
          <p style="margin:0 0 8px;font-size:14px;font-weight:bold;color:#7F1D1D;font-family:Arial,sans-serif;">${causal}</p>
          <p style="margin:0;font-size:13px;color:#991B1B;font-family:Arial,sans-serif;line-height:1.55;">${descripcionCausal}</p>
        </td></tr>
      </table>
      ${nota ? `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 18px;">
        <tr><td style="background:#F9FAFB;border:1px solid #E5E7EB;padding:14px 18px;border-radius:6px;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:bold;color:#374151;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.05em;">Nota explicativa del DPO</p>
          <p style="margin:0;font-size:13px;color:#374151;font-family:Arial,sans-serif;line-height:1.55;">${nota}</p>
        </td></tr>
      </table>` : ''}
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:18px 0;">
        ${_fila('Numero solicitud', solicitud.numero_solicitud)}
        ${_fila('Derecho',          solicitud.tipo_derecho || '—')}
        ${_fila('Estado final',     'Rechazada')}
      </table>
      ${_alerta('Si consideras que esta decision es incorrecta, puedes contactar directamente al Delegado de Proteccion de Datos (DPO) respondiendo este correo.', 'warning')}
    </td></tr>
    ${_footer(config)}
  `);
}

// ─────────────────────────────────────────────────────────
// API PÚBLICA
// ─────────────────────────────────────────────────────────

async function enviarRecepcion(solicitud, config) {
  const validarUrl = `${FRONTEND_URL}/#/validar/${solicitud.token_validacion}`;

  // Email al titular
  const r = await resend.emails.send({
    from:    `${FROM_NAME} <${FROM_EMAIL}>`,
    to:      [solicitud.email],
    subject: `Portal ARCOP - Solicitud recibida #${solicitud.numero_solicitud}`,
    html:    _tplRecepcion(solicitud, validarUrl, config),
    reply_to: (config && config.dpo_email) || DPO_EMAIL || undefined,
  });

  // Notif interna al DPO (fire-and-forget)
  const dpoEmail = (config && config.dpo_email) || DPO_EMAIL;
  if (dpoEmail) {
    resend.emails.send({
      from:    `${FROM_NAME} <${FROM_EMAIL}>`,
      to:      [dpoEmail],
      subject: `[Portal ARCOP] Nueva solicitud ${solicitud.tipo_derecho || 'ARCOP'} - ${solicitud.numero_solicitud}`,
      html:    _tplNuevaSolicitudDPO(solicitud, config),
    }).catch(e => console.error('[emailService] Fallo notif DPO:', e.message));
  }

  return r;
}

async function enviarCambioEstado(solicitud, nuevoEstado, config) {
  const ESTADOS_SIN_EMAIL = new Set(['PENDIENTE', 'DESCARGA_CONFIRMADA']);
  if (ESTADOS_SIN_EMAIL.has(nuevoEstado)) return { skipped: true };

  // RESUELTA tiene template especial
  if (nuevoEstado === 'RESUELTA') {
    console.warn('[emailService] Para RESUELTA usar enviarDatosListos()');
    return { skipped: true, reason: 'USAR_enviarDatosListos' };
  }

  const asuntos = {
    VALIDADA:   `Portal ARCOP - Identidad confirmada #${solicitud.numero_solicitud}`,
    EN_PROCESO: `Portal ARCOP - Solicitud en proceso #${solicitud.numero_solicitud}`,
    CERRADA:    `Portal ARCOP - Solicitud cerrada #${solicitud.numero_solicitud}`,
  };

  return resend.emails.send({
    from:     `${FROM_NAME} <${FROM_EMAIL}>`,
    to:       [solicitud.email],
    subject:  asuntos[nuevoEstado] || `Portal ARCOP - Actualizacion #${solicitud.numero_solicitud}`,
    html:     _tplCambioEstado(solicitud, nuevoEstado, config),
    reply_to: (config && config.dpo_email) || DPO_EMAIL || undefined,
  });
}

async function enviarDatosListos(solicitud, urlDescarga, formato, config) {
  return resend.emails.send({
    from:     `${FROM_NAME} <${FROM_EMAIL}>`,
    to:       [solicitud.email],
    subject:  `Portal ARCOP - Sus datos personales estan listos #${solicitud.numero_solicitud}`,
    html:     _tplDatosListos(solicitud, urlDescarga, formato, config),
    reply_to: (config && config.dpo_email) || DPO_EMAIL || undefined,
  });
}

async function enviarRechazo(solicitud, causal, nota, config) {
  return resend.emails.send({
    from:     `${FROM_NAME} <${FROM_EMAIL}>`,
    to:       [solicitud.email],
    subject:  `Portal ARCOP - Solicitud rechazada #${solicitud.numero_solicitud}`,
    html:     _tplRechazo(solicitud, causal, nota, config),
    reply_to: (config && config.dpo_email) || DPO_EMAIL || undefined,
  });
}

module.exports = { enviarRecepcion, enviarCambioEstado, enviarDatosListos, enviarRechazo };