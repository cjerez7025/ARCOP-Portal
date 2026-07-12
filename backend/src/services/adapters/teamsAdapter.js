'use strict';

function _card(title, facts, portalUrl) {
  return {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.4',
        body: [
          { type: 'TextBlock', text: title,
            weight: 'Bolder', size: 'Medium', color: 'Accent', wrap: true },
          { type: 'FactSet', facts },
        ],
        actions: portalUrl ? [{
          type: 'Action.OpenUrl',
          title: 'Ver en Panel DPO',
          url: `${portalUrl}/#/dpo`,
        }] : [],
      },
    }],
  };
}

function formatearNuevaSolicitud(solicitud, portalUrl) {
  const tipo = (solicitud.tipo || solicitud.tipo_derecho || 'ACCESO').toUpperCase();
  return _card(`Nueva solicitud ${tipo}`, [
    { title: 'Número',  value: solicitud.numero_solicitud || '—' },
    { title: 'Titular', value: solicitud.nombre_completo  || '—' },
    { title: 'Email',   value: solicitud.email            || '—' },
    { title: 'Estado',  value: 'Pendiente' },
  ], portalUrl);
}

function formatearCambioEstado({
  numero, tipo, nombreTitular, estadoAnterior, estadoNuevo,
  asignadoA, asignadoEmail, fechaTerminoSLA,
}, portalUrl) {
  const tipoKey = (tipo || 'ACCESO').toUpperCase();
  const facts   = [
    { title: 'Número',     value: numero        || '—' },
    { title: 'Titular',    value: nombreTitular  || '—' },
    { title: 'Transición', value: `${estadoAnterior} → ${estadoNuevo}` },
  ];
  if (asignadoA) facts.push({
    title: 'Asignado a',
    value: asignadoA + (asignadoEmail ? ` (${asignadoEmail})` : ''),
  });
  if (fechaTerminoSLA) facts.push({
    title: 'SLA hasta',
    value: String(fechaTerminoSLA).split('T')[0],
  });
  return _card(`${tipoKey} — ${estadoNuevo}`, facts, portalUrl);
}

function formatearAlertaSLA(items, portalUrl) {
  const facts = items.slice(0, 10).map(s => ({
    title: s.numero_solicitud || '—',
    value: `${s.nombre_completo || '—'} — ${s.diasRestantes ?? '?'} día(s)`,
  }));
  return _card(
    `⚠️ Alerta SLA — ${items.length} solicitud(es) por vencer`,
    facts, portalUrl
  );
}

module.exports = { formatearNuevaSolicitud, formatearCambioEstado, formatearAlertaSLA };
