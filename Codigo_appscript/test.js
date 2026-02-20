function testConfirmarDescarga() {
  // Pon un número de solicitud real que esté en estado RESUELTA
  var resultado = DPOHandlers.confirmarDescarga({
    id: 'SOL-2026-18073',  // ← reemplaza con un número real
    descarga_confirmada_en: new Date().toISOString()
  });
  Logger.log(JSON.stringify(resultado));
}