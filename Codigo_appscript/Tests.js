// ============================================
// TESTS.GS - FUNCIONES DE PRUEBA
// ============================================
function testActualizarEstado() {
  const resultado = DPOHandlers.actualizarSolicitud({
    id: 'SOL-2026-12748',   // ← pon un número real de tu hoja
    estado: 'EN_PROCESO'
  });
  Logger.log(JSON.stringify(resultado));
}
/**
 * Test completo del sistema
 */
function testSistemaCompleto() {
  Logger.log('🧪 === TEST COMPLETO ===');
  
  const solicitudTest = {
    id: Utils.generarId(),
    numero_solicitud: Utils.generarNumeroSolicitud(),
    fecha_solicitud: new Date().toISOString(),
    tipo: 'ACCESO',
    estado: Config.ESTADOS.PENDIENTE,
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
    creado_en: new Date().toISOString(),
    frontend_url: 'http://localhost:3000'
  };
  
  try {
    Logger.log('\n🔍 TEST 1: Validación');
    const validacion = ValidacionService.validarSolicitud(solicitudTest);
    Logger.log('Validación: ' + (validacion.valida ? '✅ OK' : '❌ FALLÓ'));
    
    if (!validacion.valida) {
      Logger.log('Error: ' + validacion.mensaje);
      return;
    }
    
    Logger.log('\n💾 TEST 2: Guardar en Sheets');
    GoogleSheetsService.guardarSolicitud(solicitudTest);
    Logger.log('✅ Guardado');
    
    Logger.log('\n📧 TEST 3: Email confirmación');
    EmailService.enviarConfirmacion(solicitudTest);
    Logger.log('✅ Email enviado');
    
    Logger.log('\n📧 TEST 4: Email cambio estado');
    NotificacionService.enviarCambioEstado(
      solicitudTest.email,
      solicitudTest.numero_solicitud,
      Config.ESTADOS.VALIDADA
    );
    Logger.log('✅ Notificación enviada');
    
    Logger.log('\n🎉 === TEST EXITOSO ===');
    Logger.log('Revisa: ' + solicitudTest.email);
    
  } catch (error) {
    Logger.log('\n❌ ERROR: ' + error);
  }
}

/**
 * Test email cambio de estado
 */
function testEmailCambioEstado() {
  Logger.log('🧪 === TEST EMAIL CAMBIO ESTADO ===');
  
  NotificacionService.enviarCambioEstado(
    'jerezcarlos70@gmail.com',
    'SOL-2026-TEST',
    Config.ESTADOS.VALIDADA
  );
  
  Logger.log('✅ Email enviado - Revisa tu bandeja');
}

/**
 * Test email datos listos
 */
function testEmailDatosListos() {
  Logger.log('🧪 === TEST EMAIL DATOS LISTOS ===');
  
  NotificacionService.enviarDatosListos(
    'jerezcarlos70@gmail.com',
    'Carlos Test',
    'SOL-2026-TEST',
    'https://drive.google.com/file/d/test',
    'PDF'
  );
  
  Logger.log('✅ Email enviado - Revisa tu bandeja');
}

/**
 * Test configuración
 */
function testConfiguracion() {
  Logger.log('🧪 === TEST CONFIGURACIÓN ===');
  
  // Test 1: Obtener
  Logger.log('\n📥 TEST 1: Obtener configuración');
  const config = ConfiguracionService.obtener();
  Logger.log('Resultado: ' + JSON.stringify(config));
  
  // Test 2: Guardar
  Logger.log('\n💾 TEST 2: Guardar configuración');
  const nuevaConfig = {
    empresa_nombre: 'Test Empresa',
    empresa_rut: '11.111.111-1',
    dpo_email: 'test@test.cl',
    dias_respuesta: '20'
  };
  const resultadoGuardar = ConfiguracionService.guardar(nuevaConfig);
  Logger.log('Resultado: ' + JSON.stringify(resultadoGuardar));
  
  // Test 3: Validar
  Logger.log('\n✅ TEST 3: Validar configuración');
  const validacion = ValidacionService.validarConfiguracion(nuevaConfig);
  Logger.log('Resultado: ' + JSON.stringify(validacion));
  
  // Test 4: Restaurar
  Logger.log('\n🔄 TEST 4: Restaurar default');
  const resultadoRestaurar = ConfiguracionService.restaurarDefault();
  Logger.log('Resultado: ' + JSON.stringify(resultadoRestaurar));
  
  Logger.log('\n✅ === TEST COMPLETADO ===');
}

/**
 * Test validación RUT
 */
function testValidacionRUT() {
  Logger.log('🧪 === TEST VALIDACIÓN RUT ===');
  
  const rutsPrueba = [
    { rut: '12.345.678-9', esperado: false },
    { rut: '11.111.111-1', esperado: true },
    { rut: '7.777.777-K', esperado: true },
    { rut: '18.765.432-0', esperado: true },
    { rut: '12345678-9', esperado: false },
    { rut: '123456789', esperado: false }
  ];
  
  rutsPrueba.forEach(prueba => {
    const resultado = ValidacionService.validarRUT(prueba.rut);
    const ok = resultado === prueba.esperado ? '✅' : '❌';
    Logger.log(`${ok} RUT: ${prueba.rut} - Resultado: ${resultado} - Esperado: ${prueba.esperado}`);
  });
  
  Logger.log('\n✅ === TEST RUT COMPLETADO ===');
}

/**
 * Test búsquedas
 */
function testBusquedas() {
  Logger.log('🧪 === TEST BÚSQUEDAS ===');
  
  // Crear solicitud de prueba primero
  const solicitudTest = {
    id: Utils.generarId(),
    numero_solicitud: Utils.generarNumeroSolicitud(),
    fecha_solicitud: new Date().toISOString(),
    tipo: 'ACCESO',
    estado: Config.ESTADOS.PENDIENTE,
    nombre_completo: 'Test Búsqueda',
    rut: '11.111.111-1',
    email: 'test@busqueda.cl',
    telefono: '+56 9 1111 1111',
    alcance_acceso: 'TODOS',
    categorias: '[]',
    formato_preferido: 'PDF',
    token_validacion: Utils.generarToken(),
    token_expiracion: Utils.calcularExpiracionToken(),
    fecha_limite: Utils.calcularFechaLimite(),
    dias_restantes: 15,
    ip_origen: 'test-local',
    user_agent: 'test-browser',
    creado_en: new Date().toISOString(),
    frontend_url: 'http://localhost:3000'
  };
  
  Logger.log('\n💾 Guardando solicitud de prueba...');
  GoogleSheetsService.guardarSolicitud(solicitudTest);
  
  Logger.log('\n🔍 TEST 1: Buscar por token');
  const porToken = GoogleSheetsService.buscarPorToken(solicitudTest.token_validacion);
  Logger.log('Resultado: ' + (porToken ? '✅ Encontrada' : '❌ No encontrada'));
  
  Logger.log('\n🔍 TEST 2: Buscar por email');
  const porEmail = GoogleSheetsService.buscarPorEmail(solicitudTest.email);
  Logger.log('Resultado: ' + porEmail.length + ' solicitudes encontradas');
  
  Logger.log('\n🔍 TEST 3: Buscar por número');
  const porNumero = GoogleSheetsService.buscarPorNumero(solicitudTest.numero_solicitud);
  Logger.log('Resultado: ' + (porNumero ? '✅ Encontrada' : '❌ No encontrada'));
  
  Logger.log('\n✅ === TEST BÚSQUEDAS COMPLETADO ===');
}

/**
 * Test actualización de campos
 */
function testActualizacion() {
  Logger.log('🧪 === TEST ACTUALIZACIÓN ===');
  
  // Obtener primera solicitud
  const solicitudes = GoogleSheetsService.obtenerTodas();
  if (solicitudes.length === 0) {
    Logger.log('❌ No hay solicitudes para probar');
    return;
  }
  
  const solicitud = solicitudes[0];
  Logger.log('📋 Probando con solicitud: ' + solicitud.numero_solicitud);
  
  Logger.log('\n🔄 TEST 1: Actualizar estado');
  const resultado1 = GoogleSheetsService.actualizarCampo(solicitud.id, 'estado', Config.ESTADOS.EN_PROCESO);
  Logger.log('Resultado: ' + (resultado1 ? '✅ OK' : '❌ FALLÓ'));
  
  Logger.log('\n🔄 TEST 2: Actualizar notas');
  const resultado2 = GoogleSheetsService.actualizarCampo(solicitud.id, 'notas_dpo', 'Nota de prueba');
  Logger.log('Resultado: ' + (resultado2 ? '✅ OK' : '❌ FALLÓ'));
  
  Logger.log('\n✅ === TEST ACTUALIZACIÓN COMPLETADO ===');
}
function testSlack() {
  var url = PropertiesService.getScriptProperties()
              .getProperty('SLACK_WEBHOOK_URL');
  
  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      text: '🧪 Test Portal ARCOP — conexión exitosa!'
    })
  });
}