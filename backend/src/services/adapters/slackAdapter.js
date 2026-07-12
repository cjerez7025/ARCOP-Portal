'use strict';

function _emoji(tipo) {
  const m = { ACCESO:'🔍', RECTIFICACION:'✏️', CANCELACION:'🗑️',
    OPOSICION:'🚫', PORTABILIDAD:'📦' };
  return m[(tipo||'').toUpperCase()] || '📋';
}

function _bloques(title, fields, portalUrl) {
  return {
    blocks: [
      { type: 'header',
        text: { type: 'plain_text', text: title, emoji: true } },
      { type: 'section', fields },
      ...(portalUrl ? [{
        type: 'actions',
        elements: [{ type: 'button',
          text: { type: 'plain_text', text: '🔗 Ver en Panel DPO', emoji: true },
          url: `${portalUrl}/#/dpo`,
          style: 'primary',
        }],
      }] : []),
    ],
  };
}

function formatearNuevaSolicitud(solicitud, portalUrl) {
  const tipo = (solicitud.tipo || solicitud.tipo_derecho || 'ACCESO').toUpperCase();
  return _bloques(
    `${_emoji(tipo)} Nueva solicitud ${tipo}`,
    [
      { type: 'mrkdwn', text: `*Número:*\n\`${solicitud.numero_solicitud || '—'}\`` },
      { type: 'mrkdwn', text: `*Titular:*\n${solicitud.nombre_completo  || '—'}` },
      { type: 'mrkdwn', text: `*Email:*\n${solicitud.email              || '—'}` },
      { type: 'mrkdwn', text: `*Estado:*\n🟡 Pendiente` },
    ],
    portalUrl
  );
}

function formatearCambioEstado({
  numero, tipo, nombreTitular, estadoAnterior, estadoNuevo,
  asignadoA, asignadoEmail, fechaTerminoSLA,
}, portalUrl) {
  const tipoKey = (tipo || 'ACCESO').toUpperCase();
  const fields  = [
    { type: 'mrkdwn', text: `*Número:*\n\`${numero || '—'}\`` },
    { type: 'mrkdwn', text: `*Titular:*\n${nombreTitular || '—'}` },
    { type: 'mrkdwn', text: `*Transición:*\n${estadoAnterior} → *${estadoNuevo}*` },
  ];
  if (asignadoA) fields.push({
    type: 'mrkdwn',
    text: `*Asignado a:*\n${asignadoA}${asignadoEmail ? ` <${asignadoEmail}>` : ''}`,
  });
  if (fechaTerminoSLA) fields.push({
    type: 'mrkdwn',
    text: `*SLA hasta:*\n${String(fechaTerminoSLA).split('T')[0]}`,
  });
  return _bloques(`${_emoji(tipoKey)} ${tipoKey} — ${estadoNuevo}`, fields, portalUrl);
}

function formatearAlertaSLA(items, portalUrl) {
  const lista = items.slice(0, 10).map(s => ({
    type: 'mrkdwn',
    text: `${(s.diasRestantes ?? 99) <= 1 ? '🔴' : '🟡'} *${s.numero_solicitud}* — ${s.nombre_completo || '—'} — *${s.diasRestantes ?? '?'} día(s)*`,
  }));
  return {
    blocks: [
      { type: 'header',
        text: { type: 'plain_text', text: `⚠️ Alerta SLA — ${items.length} solicitud(es) por vencer`, emoji: true } },
      { type: 'section', fields: lista },
      ...(portalUrl ? [{
        type: 'actions',
        elements: [{ type: 'button',
          text: { type: 'plain_text', text: '🔗 Ver Panel DPO', emoji: true },
          url: `${portalUrl}/#/dpo` }],
      }] : []),
    ],
  };
}

module.exports = { formatearNuevaSolicitud, formatearCambioEstado, formatearAlertaSLA };
