// ============================================
// PORTAL ARCOP - PUNTO DE ENTRADA
// ============================================

/**
 * Maneja peticiones POST (crear solicitud)
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'createSolicitud') {
      return SolicitudService.crear(data.solicitud);
    }
    
    if (data.action === 'validarIdentidad') {
      return SolicitudService.validarIdentidad(data.token);
    }
    
    return Utils.crearRespuesta(false, 'Acción no válida');
    
  } catch (error) {
    Logger.log('❌ Error en doPost: ' + error);
    return Utils.crearRespuesta(false, error.toString());
  }
}

/**
 * Maneja peticiones GET (consultas)
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'getSolicitud') {
      return SolicitudService.obtenerPorToken(e.parameter.token);
    }
    
    if (action === 'getSolicitudesPorEmail') {
      return SolicitudService.obtenerPorEmail(e.parameter.email);
    }
    
    return Utils.crearRespuesta(false, 'Acción no válida');
    
  } catch (error) {
    Logger.log('Error en doGet: ' + error);
    return Utils.crearRespuesta(false, error.toString());
  }
}
/**
 * Función de prueba completa
 */
function testSistemaCompleto() {
  Logger.log('🧪 === INICIANDO TEST COMPLETO ===');
  
  // Datos de prueba
  const solicitudTest = {
    id: Utils.generarId(),
    numero_solicitud: Utils.generarNumeroSolicitud(),
    fecha_solicitud: new Date().toISOString(),
    tipo: 'ACCESO',
    estado: ConfiguracionService.ESTADOS.PENDIENTE,
    nombre_completo: 'Carlos Jerez TEST',
    rut: '12.345.678-9',
    email: 'jerezcarlos70@gmail.com',
    telefono: '+56 9 8765 4321',
    alcance_acceso: 'TODOS',
    categorias: '[]',
    formato_preferido: 'PDF',
    token_validacion: Utils.generarToken(),
    token_expiracion: Utils.calcularExpiracionToken(),
    fecha_limite: Utils.calcularFechaLimite(),
    dias_restantes: 15,
    ip_origen: 'test-local',
    user_agent: 'test-browser',
    creado_en: new Date().toISOString()
  };
  
  Logger.log('📝 Datos de prueba creados');
  Logger.log('Número: ' + solicitudTest.numero_solicitud);
  Logger.log('Email: ' + solicitudTest.email);
  
  try {
    // Test 1: Validación
    Logger.log('\n🔍 TEST 1: Validación');
    const validacion = ValidacionService.validarSolicitud(solicitudTest);
    Logger.log('Validación: ' + (validacion.valida ? '✅ OK' : '❌ FALLÓ'));
    
    if (!validacion.valida) {
      Logger.log('Error: ' + validacion.mensaje);
      return;
    }
    
    // Test 2: Guardar en Sheets
    Logger.log('\n💾 TEST 2: Guardar en Sheets');
    GoogleSheetsService.guardarSolicitud(solicitudTest);
    Logger.log('✅ Guardado en Sheets');
    
    // Test 3: Enviar Email
    Logger.log('\n📧 TEST 3: Enviar Email');
    EmailService.enviarConfirmacion(solicitudTest);
    Logger.log('✅ Email enviado');
    
    // Test 4: Registrar Log
    Logger.log('\n📋 TEST 4: Registrar Log');
    Utils.registrarLog('TEST_COMPLETO', solicitudTest.numero_solicitud, 'Test exitoso');
    Logger.log('✅ Log registrado');
    
    Logger.log('\n🎉 === TEST COMPLETO EXITOSO ===');
    Logger.log('📧 Revisa tu email: ' + solicitudTest.email);
    Logger.log('📊 Revisa Google Sheets: hoja SOLICITUDES');
    
  } catch (error) {
    Logger.log('\n❌ ERROR EN TEST: ' + error);
    Logger.log('Stack: ' + error.stack);
  }
}
