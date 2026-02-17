// ============================================
// GOOGLESHEETSSERVICE.GS - GESTIÓN DE SHEETS
// ============================================

const GoogleSheetsService = {
  
  /**
   * Guarda solicitud en Google Sheets
   */
  guardarSolicitud: function(solicitud) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(Config.SHEETS.SOLICITUDES);
      
      // Si no existe la hoja, crearla
      if (!sheet) {
        sheet = this.crearHojaSolicitudes(ss);
      }
      
      // Preparar fila de datos
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
        solicitud.categorias,
        solicitud.formato_preferido,
        'FALSE', // identidad_validada
        solicitud.token_validacion,
        solicitud.token_expiracion,
        solicitud.fecha_limite,
        solicitud.dias_restantes,
        solicitud.ip_origen,
        solicitud.user_agent,
        '', // notas_dpo
        '', // url_datos
        '', // formato_entrega
        solicitud.creado_en
      ];
      
      // Agregar fila
      sheet.appendRow(fila);
      
      Logger.log('✅ Solicitud guardada en Sheets');
      
    } catch (error) {
      Logger.log('❌ Error al guardar en Sheets: ' + error);
      throw error;
    }
  },
  
  /**
   * Crea la hoja de solicitudes con headers
   */
  crearHojaSolicitudes: function(ss) {
    Logger.log('📝 Creando hoja SOLICITUDES...');
    
    const sheet = ss.insertSheet(Config.SHEETS.SOLICITUDES);
    
    // Headers
    const headers = [
      'ID',
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
      'IP_ORIGEN',
      'USER_AGENT',
      'NOTAS_DPO',
      'URL_DATOS',
      'FORMATO_ENTREGA',
      'CREADO_EN'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.getRange(1, 1, 1, headers.length).setBackground('#4285F4');
    sheet.getRange(1, 1, 1, headers.length).setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    
    Logger.log('✅ Hoja SOLICITUDES creada');
    
    return sheet;
  },
  
  /**
   * Busca solicitud por token
   */
  buscarPorToken: function(token) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(Config.SHEETS.SOLICITUDES);
      
      if (!sheet) {
        return null;
      }
      
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const tokenIndex = Utils.buscarIndiceColumna(headers, 'token_validacion');
      
      if (tokenIndex === -1) {
        return null;
      }
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][tokenIndex] === token) {
          return {
            fila: i + 1,
            datos: Utils.filaAObjeto(headers, data[i])
          };
        }
      }
      
      return null;
      
    } catch (error) {
      Logger.log('❌ Error al buscar por token: ' + error);
      return null;
    }
  },
  
  /**
   * Busca solicitudes por email
   */
  buscarPorEmail: function(email) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(Config.SHEETS.SOLICITUDES);
      
      if (!sheet) {
        return [];
      }
      
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const emailIndex = Utils.buscarIndiceColumna(headers, 'email');
      const solicitudes = [];
      
      if (emailIndex === -1) {
        return [];
      }
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][emailIndex].toLowerCase() === email.toLowerCase()) {
          solicitudes.push(Utils.filaAObjeto(headers, data[i]));
        }
      }
      
      return solicitudes;
      
    } catch (error) {
      Logger.log('❌ Error al buscar por email: ' + error);
      return [];
    }
  },
  
  /**
   * Busca solicitud por número
   */
  buscarPorNumero: function(numero) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(Config.SHEETS.SOLICITUDES);
      
      if (!sheet) {
        return null;
      }
      
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const numeroIndex = Utils.buscarIndiceColumna(headers, 'numero_solicitud');
      
      if (numeroIndex === -1) {
        return null;
      }
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][numeroIndex] === numero) {
          return Utils.filaAObjeto(headers, data[i]);
        }
      }
      
      return null;
      
    } catch (error) {
      Logger.log('❌ Error al buscar por número: ' + error);
      return null;
    }
  },
  
  /**
   * Actualiza un campo de una solicitud
   */
  actualizarCampo: function(id, nombreCampo, valor) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(Config.SHEETS.SOLICITUDES);
      
      if (!sheet) {
        return false;
      }
      
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const idIndex = Utils.buscarIndiceColumna(headers, 'id');
      const campoIndex = Utils.buscarIndiceColumna(headers, nombreCampo);
      
      if (idIndex === -1 || campoIndex === -1) {
        return false;
      }
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][idIndex] === id) {
          sheet.getRange(i + 1, campoIndex + 1).setValue(valor);
          return true;
        }
      }
      
      return false;
      
    } catch (error) {
      Logger.log('❌ Error al actualizar campo: ' + error);
      return false;
    }
  },
  
  /**
   * Obtiene todas las solicitudes
   */
  obtenerTodas: function() {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(Config.SHEETS.SOLICITUDES);
      
      if (!sheet) {
        return [];
      }
      
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const solicitudes = [];
      
      for (let i = 1; i < data.length; i++) {
        solicitudes.push(Utils.filaAObjeto(headers, data[i]));
      }
      
      return solicitudes;
      
    } catch (error) {
      Logger.log('❌ Error al obtener todas: ' + error);
      return [];
    }
  }
};