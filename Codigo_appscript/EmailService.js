// ============================================
// SERVICIO DE EMAILS
// ============================================

const EmailService = {
  
  /**
   * Envía email de confirmación
   */
  enviarConfirmacion: function(solicitud) {
    try {
      Logger.log('📧 Enviando email de confirmación...');
      
      const htmlBody = this._generarTemplateConfirmacion(solicitud);
      
      GmailApp.sendEmail(
        solicitud.email,
        'Portal ARCOP - Confirme su solicitud de acceso a datos',
        'Por favor active la visualización HTML para ver este mensaje',
        {
          htmlBody: htmlBody,
          name: 'Portal ARCOP'
        }
      );
      
      Logger.log('✅ Email enviado a: ' + solicitud.email);
      
    } catch (error) {
      Logger.log('❌ Error al enviar email: ' + error);
      throw error;
    }
  },
  
  /**
   * Envía email de validación exitosa
   */
  enviarValidacionExitosa: function(solicitud) {
    try {
      const htmlBody = this._generarTemplateValidacion(solicitud);
      
      GmailApp.sendEmail(
        solicitud.email,
        'Portal ARCOP - Identidad confirmada',
        'Identidad confirmada',
        {
          htmlBody: htmlBody,
          name: 'Portal ARCOP'
        }
      );
      
    } catch (error) {
      Logger.log('❌ Error: ' + error);
      throw error;
    }
  },
  
  /**
   * Envía email con datos solicitados
   */
  enviarDatos: function(solicitud, urlDescarga) {
    try {
      const htmlBody = this._generarTemplateDatos(solicitud, urlDescarga);
      
      GmailApp.sendEmail(
        solicitud.email,
        'Portal ARCOP - Sus datos personales',
        'Sus datos personales',
        {
          htmlBody: htmlBody,
          name: 'Portal ARCOP'
        }
      );
      
    } catch (error) {
      Logger.log('❌ Error: ' + error);
      throw error;
    }
  },
  
  /**
   * Genera template HTML de confirmación
   */
  _generarTemplateConfirmacion: function(solicitud) {
    const config = ConfiguracionService.EMPRESA;
    
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: white;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #4285F4 0%, #3367D6 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🔒 Portal ARCOP</h1>
            <p style="margin: 10px 0 0; font-size: 14px;">Protección de Datos Personales - Ley 21.719</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px; background: #f9f9f9;">
            <h2>Hola ${solicitud.nombre_completo},</h2>
            
            <p>Hemos recibido tu solicitud para acceder a tus datos personales conforme a la <strong>Ley 21.719 de Protección de Datos Personales de Chile</strong>.</p>
            
            <p><strong>Para continuar, confirma tu identidad:</strong></p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000/validar/${solicitud.token_validacion}" 
                 style="display: inline-block; padding: 16px 40px; background: #4285F4; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                ✅ Confirmar mi identidad
              </a>
            </div>
            
            <div style="background: #e8f0fe; border-left: 4px solid #4285F4; padding: 20px; margin: 25px 0;">
              <strong>📋 Detalles de tu solicitud:</strong><br><br>
              • <strong>Número:</strong> ${solicitud.numero_solicitud}<br>
              • <strong>RUT:</strong> ${solicitud.rut}<br>
              • <strong>Email:</strong> ${solicitud.email}<br>
              • <strong>Formato:</strong> ${solicitud.formato_preferido}
            </div>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              ⏰ <strong>Importante:</strong> Este link expira en <strong>30 minutos</strong>.
            </div>
            
            <hr style="border: 0; border-top: 1px solid #ddd; margin: 25px 0;">
            
            <p style="color: #666; font-size: 14px;">
              ℹ️ Si no realizaste esta solicitud, puedes ignorar este correo.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; padding: 30px; color: #666; font-size: 13px; background: #f5f5f5;">
            <strong>${config.NOMBRE}</strong><br>
            RUT: ${config.RUT}<br>
            📧 ${config.DPO_EMAIL} | 📞 ${config.DPO_TELEFONO}<br><br>
            <small style="color: #999;">Este es un email automático. Por favor no respondas.</small>
          </div>
          
        </div>
      </body>
      </html>
    `;
  },
  
  /**
   * Genera template de validación exitosa
   */
  _generarTemplateValidacion: function(solicitud) {
    // Similar estructura, mensaje diferente
    return `...`; // Implementar según necesites
  },
  
  /**
   * Genera template con datos
   */
  _generarTemplateDatos: function(solicitud, urlDescarga) {
    // Template para enviar link de descarga
    return `...`; // Implementar según necesites
  }
};