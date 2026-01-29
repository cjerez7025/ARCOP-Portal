// ============================================
// SERVICIO DE GOOGLE SHEETS
// ============================================

const GoogleSheetsService = {
  
  /**
   * Guarda solicitud en Sheets
   */
  guardarSolicitud: function(solicitud) {
    try {
      Logger.log('💾 Guardando solicitud en Sheets...');
      
      const sheet = this._getOrCreateSolicitudesSheet();
      
      const fila = [
        solicitud.id,
        solicitud.numero_solicitud,
        solicitud.fecha_solicitud,
        solicitud.tipo,
        solicitud.estado,
        solicitud.nombre_completo,
        solicitud.rut,
        solicitud.email,
        solicitud.telefono,
        solicitud.alcance_acceso,
        JSON.stringify(solicitud.categorias || []),
        solicitud.formato_preferido,
        'FALSE', // identidad_validada
        solicitud.token_validacion,
        solicitud.token_expiracion,
        solicitud.fecha_limite,
        solicitud.dias_restantes,
        '', // asignado_a
        '', // fecha_resolucion
        '', // url_descarga
        '', // url_expiracion
        solicitud.ip_origen || '',
        solicitud.user_agent || '',
        solicitud.creado_en,
        solicitud.creado_en // actualizado_en
      ];
      
      sheet.appendRow(fila);
      
      Logger.log('✅ Solicitud guardada en Sheets');
      return true;
      
    } catch (error) {
      Logger.log('❌ Error al guardar en Sheets: ' + error);
      throw error;
    }
  },
  
  /**
   * Busca solicitud por token
   */
  buscarPorToken: function(token) {
    try {
      Logger.log('🔍 Buscando solicitud por token...');
      
      const sheet = ConfiguracionService.getOrCreateSheet(ConfiguracionService.SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      
      // Buscar en todas las filas (empezar en 1 para saltar headers)
      for (let i = 1; i < data.length; i++) {
        if (data[i][13] === token) { // Columna N (token_validacion, índice 13)
          Logger.log('✅ Solicitud encontrada');
          return this._mapearFilaASolicitud(data[i], i + 1);
        }
      }
      
      Logger.log('⚠️ Solicitud no encontrada');
      return null;
      
    } catch (error) {
      Logger.log('❌ Error en buscarPorToken: ' + error);
      throw error;
    }
  },
  
  /**
   * Busca solicitudes por email
   */
  buscarPorEmail: function(email) {
    try {
      Logger.log('🔍 Buscando solicitudes por email: ' + email);
      
      const sheet = ConfiguracionService.getOrCreateSheet(ConfiguracionService.SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      const solicitudes = [];
      
      // Buscar en todas las filas
      for (let i = 1; i < data.length; i++) {
        if (data[i][7] === email) { // Columna H (email, índice 7)
          solicitudes.push(this._mapearFilaASolicitud(data[i], i + 1));
        }
      }
      
      Logger.log('✅ Encontradas ' + solicitudes.length + ' solicitudes');
      return solicitudes;
      
    } catch (error) {
      Logger.log('❌ Error en buscarPorEmail: ' + error);
      throw error;
    }
  },
  
  /**
   * Actualiza estado de solicitud
   */
  actualizarEstado: function(token, nuevoEstado) {
    try {
      Logger.log('🔄 Actualizando estado a: ' + nuevoEstado);
      
      const sheet = ConfiguracionService.getOrCreateSheet(ConfiguracionService.SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      
      // Buscar fila con el token
      for (let i = 1; i < data.length; i++) {
        if (data[i][13] === token) { // Columna N (token_validacion)
          
          // Actualizar estado (columna E, índice 4)
          sheet.getRange(i + 1, 5).setValue(nuevoEstado);
          
          // Marcar identidad como validada (columna M, índice 12)
          sheet.getRange(i + 1, 13).setValue('TRUE');
          
          // Actualizar timestamp (columna Y, índice 24)
          sheet.getRange(i + 1, 25).setValue(new Date().toISOString());
          
          Logger.log('✅ Estado actualizado');
          return true;
        }
      }
      
      Logger.log('⚠️ Solicitud no encontrada para actualizar');
      return false;
      
    } catch (error) {
      Logger.log('❌ Error en actualizarEstado: ' + error);
      throw error;
    }
  },
  
  /**
   * Obtiene o crea hoja de solicitudes con headers
   */
  _getOrCreateSolicitudesSheet: function() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(ConfiguracionService.SHEET_NAME);
    
    if (!sheet) {
      Logger.log('📋 Creando hoja SOLICITUDES...');
      
      sheet = ss.insertSheet(ConfiguracionService.SHEET_NAME);
      
      // Headers
      const headers = [
        'ID_SOLICITUD',
        'NUMERO_SOLICITUD',
        'FECHA_SOLICITUD',
        'TIPO',
        'ESTADO',
        'NOMBRE_COMPLETO',
        'RUT',
        'EMAIL',
        'TELEFONO',
        'ALCANCE_ACCESO',
        'CATEGORIAS',
        'FORMATO_PREFERIDO',
        'IDENTIDAD_VALIDADA',
        'TOKEN_VALIDACION',
        'TOKEN_EXPIRACION',
        'FECHA_LIMITE',
        'DIAS_RESTANTES',
        'ASIGNADO_A',
        'FECHA_RESOLUCION',
        'URL_DESCARGA',
        'URL_EXPIRACION',
        'IP_ORIGEN',
        'USER_AGENT',
        'CREADO_EN',
        'ACTUALIZADO_EN'
      ];
      
      sheet.appendRow(headers);
      
      // Formatear headers
      const headerRange = sheet.getRange('A1:Y1');
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285F4');
      headerRange.setFontColor('#ffffff');
      
      // Congelar primera fila
      sheet.setFrozenRows(1);
      
      // Ajustar ancho de columnas
      sheet.autoResizeColumns(1, 25);
      
      Logger.log('✅ Hoja SOLICITUDES creada');
    }
    
    return sheet;
  },
  
  /**
   * Mapea fila de Sheets a objeto solicitud
   */
  _mapearFilaASolicitud: function(fila, numeroFila) {
    return {
      fila: numeroFila,
      id: fila[0],
      numero_solicitud: fila[1],
      fecha_solicitud: fila[2],
      tipo: fila[3],
      estado: fila[4],
      nombre_completo: fila[5],
      rut: fila[6],
      email: fila[7],
      telefono: fila[8],
      alcance_acceso: fila[9],
      categorias: fila[10],
      formato_preferido: fila[11],
      identidad_validada: fila[12],
      token_validacion: fila[13],
      token_expiracion: fila[14],
      fecha_limite: fila[15],
      dias_restantes: fila[16],
      asignado_a: fila[17],
      fecha_resolucion: fila[18],
      url_descarga: fila[19],
      url_expiracion: fila[20],
      ip_origen: fila[21],
      user_agent: fila[22],
      creado_en: fila[23],
      actualizado_en: fila[24]
    };
  },
  
  /**
   * Obtiene todas las solicitudes
   */
  obtenerTodas: function() {
    try {
      Logger.log('📊 Obteniendo todas las solicitudes...');
      
      const sheet = ConfiguracionService.getOrCreateSheet(ConfiguracionService.SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      const solicitudes = [];
      
      // Empezar en 1 para saltar headers
      for (let i = 1; i < data.length; i++) {
        solicitudes.push(this._mapearFilaASolicitud(data[i], i + 1));
      }
      
      Logger.log('✅ Total solicitudes: ' + solicitudes.length);
      return solicitudes;
      
    } catch (error) {
      Logger.log('❌ Error en obtenerTodas: ' + error);
      throw error;
    }
  },
  
  /**
   * Obtiene estadísticas
   */
  obtenerEstadisticas: function() {
    try {
      Logger.log('📈 Calculando estadísticas...');
      
      const solicitudes = this.obtenerTodas();
      
      const stats = {
        total: solicitudes.length,
        por_estado: {},
        por_tipo: {},
        por_formato: {}
      };
      
      solicitudes.forEach(sol => {
        // Contar por estado
        stats.por_estado[sol.estado] = (stats.por_estado[sol.estado] || 0) + 1;
        
        // Contar por tipo
        stats.por_tipo[sol.tipo] = (stats.por_tipo[sol.tipo] || 0) + 1;
        
        // Contar por formato
        stats.por_formato[sol.formato_preferido] = (stats.por_formato[sol.formato_preferido] || 0) + 1;
      });
      
      Logger.log('✅ Estadísticas calculadas');
      return stats;
      
    } catch (error) {
      Logger.log('❌ Error en obtenerEstadisticas: ' + error);
      throw error;
    }
  },
  
  /**
   * Actualiza múltiples campos de una solicitud
   */
  actualizarSolicitud: function(token, campos) {
    try {
      Logger.log('🔄 Actualizando campos de solicitud...');
      
      const sheet = ConfiguracionService.getOrCreateSheet(ConfiguracionService.SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      
      // Buscar fila con el token
      for (let i = 1; i < data.length; i++) {
        if (data[i][13] === token) {
          
          // Mapeo de campos a columnas
          const mapeo = {
            estado: 5,              // E
            asignado_a: 18,         // R
            fecha_resolucion: 19,   // S
            url_descarga: 20,       // T
            url_expiracion: 21      // U
          };
          
          // Actualizar cada campo
          for (const [campo, valor] of Object.entries(campos)) {
            if (mapeo[campo]) {
              sheet.getRange(i + 1, mapeo[campo]).setValue(valor);
            }
          }
          
          // Actualizar timestamp
          sheet.getRange(i + 1, 25).setValue(new Date().toISOString());
          
          Logger.log('✅ Solicitud actualizada');
          return true;
        }
      }
      
      Logger.log('⚠️ Solicitud no encontrada');
      return false;
      
    } catch (error) {
      Logger.log('❌ Error en actualizarSolicitud: ' + error);
      throw error;
    }
  }
};