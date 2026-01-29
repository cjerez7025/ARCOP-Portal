// ============================================
// SERVICIO DE SOLICITUDES
// ============================================

const SolicitudService = {
  crear: function(solicitud) {
    // Validar
    const validacion = ValidacionService.validarSolicitud(solicitud);
    if (!validacion.valida) {
      return Utils.crearRespuesta(false, validacion.mensaje);
    }
    
    // Guardar en Sheets
    GoogleSheetsService.guardarSolicitud(solicitud);
    
    // Enviar email
    EmailService.enviarConfirmacion(solicitud);
    
    return Utils.crearRespuesta(true, 'Solicitud creada', solicitud);
  }
};