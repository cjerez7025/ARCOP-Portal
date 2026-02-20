// ============================================
// EMAILSERVICE.GS - ENVÍO DE EMAILS
// ============================================

const EmailService = {
  
  /**
   * Envía email de confirmación de solicitud
   */
  enviarConfirmacion: function(solicitud) {
    try {
      const config = this.obtenerConfigParaEmail();
      
      // Construir URL de validación con # para HashRouter
      const frontendUrl = solicitud.frontend_url || 'http://localhost:3000';
      const validarUrl = `${frontendUrl}/#/validar/${solicitud.token_validacion}`;
      
      Logger.log('🔗 URL de validación: ' + validarUrl);
      
      const htmlBody = this.construirEmailConfirmacion(solicitud, validarUrl, config);
      
      GmailApp.sendEmail(
        solicitud.email,
        'Portal ARCOP - Solicitud recibida #' + solicitud.numero_solicitud,
        'Solicitud recibida',
        {
          htmlBody: htmlBody,
          name: config.nombre
        }
      );
      
      Logger.log('✅ Email de confirmación enviado a: ' + solicitud.email);
      
    } catch (error) {
      Logger.log('❌ Error al enviar email: ' + error);
    }
  },
  
  /**
   * Construye HTML del email de confirmación
   */
  construirEmailConfirmacion: function(solicitud, validarUrl, config) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: white; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 14px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .info-box { background: #f0f4ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
          .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">✅ Solicitud Recibida</h1>
            <p style="margin: 10px 0 0;">Portal ARCOP - Ley 21.719</p>
          </div>
          
          <div class="content">
            <h2>Hola ${solicitud.nombre_completo},</h2>
            <p>Hemos recibido tu solicitud de acceso a datos personales. A continuación, los detalles:</p>
            
            <div class="info-box">
              <strong>📋 Información de tu solicitud:</strong><br><br>
              • <strong>Número:</strong> ${solicitud.numero_solicitud}<br>
              • <strong>Tipo:</strong> Acceso a datos personales<br>
              • <strong>Estado:</strong> Pendiente de validación<br>
              • <strong>Fecha límite:</strong> ${new Date(solicitud.fecha_limite).toLocaleDateString('es-CL')}
            </div>
            
            <div class="alert-box">
              ⚠️ <strong>Importante:</strong> Para continuar con tu solicitud, debes validar tu identidad haciendo clic en el siguiente botón:
            </div>
            
            <div style="text-align: center;">
              <a href="${validarUrl}" class="button">
                🔐 Validar mi identidad
              </a>
            </div>
            
            <p style="margin-top: 30px;">
              <strong>¿Qué sigue?</strong><br>
              1. Valida tu identidad (obligatorio)<br>
              2. Procesaremos tu solicitud<br>
              3. Recibirás tus datos en formato ${solicitud.formato_preferido}
            </p>
            
            <p style="font-size: 12px; color: #999; margin-top: 20px;">
              Si el botón no funciona, copia este link en tu navegador:<br>
              <a href="${validarUrl}" style="color: #667eea; word-break: break-all;">${validarUrl}</a>
            </p>
          </div>
          
          <div class="footer">
            <strong>${config.nombre}</strong><br>
            RUT: ${config.rut}<br>
            📧 ${config.email} | 📞 ${config.telefono}<br><br>
            <small>Este es un email automático generado por Portal ARCOP.</small>
          </div>
        </div>
      </body>
      </html>
    `;
  },
  
  /**
   * Obtiene configuración para emails
   */
  obtenerConfigParaEmail: function() {
    try {
      var config = ConfiguracionService.obtener();
      if (config.status === 'success') {
        return {
          nombre:     config.data.empresa_nombre  || 'Portal ARCOP',
          rut:        config.data.empresa_rut     || '12.345.678-9',
          email:      config.data.dpo_email       || 'dpo@arcop.cl',
          telefono:   config.data.dpo_telefono    || '+56 2 2345 6789',
          portal_url: config.data.portal_url      || 'https://arcop-portal.vercel.app'
        };
      }
    } catch (error) {
      Logger.log('No se pudo obtener config: ' + error);
    }
    return {
      nombre:     'Portal ARCOP',
      rut:        '12.345.678-9',
      email:      'dpo@arcop.cl',
      telefono:   '+56 2 2345 6789',
      portal_url: 'https://arcop-portal.vercel.app'
    };
  }
};