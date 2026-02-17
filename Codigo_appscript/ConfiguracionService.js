// ============================================
// CONFIGURACIONSERVICE.GS - GESTIÓN DE CONFIGURACIÓN
// ============================================

const ConfiguracionService = {
  
  /**
   * Obtiene la configuración actual
   */
  obtener: function() {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let configSheet = ss.getSheetByName(Config.SHEETS.CONFIGURACION);
      
      // Si no existe, crearla
      if (!configSheet) {
        Logger.log('⚠️ Hoja CONFIGURACION no existe, creando...');
        configSheet = this.crearHoja();
      }
      
      const data = configSheet.getDataRange().getValues();
      const config = {};
      
      // Convertir array a objeto
      for (let i = 1; i < data.length; i++) {
        const key = data[i][0];
        const value = data[i][1];
        if (key) {
          config[key] = value;
        }
      }
      
      Logger.log('✅ Configuración obtenida: ' + Object.keys(config).length + ' parámetros');
      
      return {
        status: 'success',
        data: config
      };
      
    } catch (error) {
      Logger.log('❌ Error en obtener: ' + error);
      return {
        status: 'error',
        message: error.toString()
      };
    }
  },
  
  /**
   * Guarda la configuración
   */
  guardar: function(configuracion) {
    try {
      // Validar
      const validacion = ValidacionService.validarConfiguracion(configuracion);
      if (!validacion.valido) {
        return {
          status: 'error',
          message: 'Errores de validación',
          errores: validacion.errores
        };
      }
      
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let configSheet = ss.getSheetByName(Config.SHEETS.CONFIGURACION);
      
      if (!configSheet) {
        configSheet = this.crearHoja();
      }
      
      // Limpiar datos existentes (excepto headers)
      const lastRow = configSheet.getLastRow();
      if (lastRow > 1) {
        configSheet.getRange(2, 1, lastRow - 1, 2).clearContent();
      }
      
      // Preparar datos
      const dataToWrite = [];
      for (let key in configuracion) {
        if (configuracion.hasOwnProperty(key)) {
          dataToWrite.push([key, configuracion[key]]);
        }
      }
      
      // Escribir
      if (dataToWrite.length > 0) {
        configSheet.getRange(2, 1, dataToWrite.length, 2).setValues(dataToWrite);
      }
      
      Logger.log('✅ Configuración guardada: ' + dataToWrite.length + ' parámetros');
      
      return {
        status: 'success',
        message: 'Configuración guardada exitosamente',
        data: configuracion
      };
      
    } catch (error) {
      Logger.log('❌ Error en guardar: ' + error);
      return {
        status: 'error',
        message: error.toString()
      };
    }
  },
  
  /**
   * Restaura configuración por defecto
   */
  restaurarDefault: function() {
    try {
      const resultado = this.guardar(Config.CONFIG_DEFAULT);
      
      if (resultado.status === 'success') {
        Logger.log('✅ Configuración restaurada a valores por defecto');
        return {
          status: 'success',
          message: 'Configuración restaurada exitosamente',
          data: Config.CONFIG_DEFAULT
        };
      } else {
        return resultado;
      }
      
    } catch (error) {
      Logger.log('❌ Error en restaurarDefault: ' + error);
      return {
        status: 'error',
        message: error.toString()
      };
    }
  },
  
  /**
   * Exporta configuración
   */
  exportar: function() {
    try {
      const resultado = this.obtener();
      
      if (resultado.status === 'success') {
        return {
          status: 'success',
          data: resultado.data,
          timestamp: new Date().toISOString()
        };
      } else {
        return resultado;
      }
      
    } catch (error) {
      Logger.log('❌ Error en exportar: ' + error);
      return {
        status: 'error',
        message: error.toString()
      };
    }
  },
  
  /**
   * Crea hoja de configuración
   */
  crearHoja: function() {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const configSheet = ss.insertSheet(Config.SHEETS.CONFIGURACION);
      
      // Headers
      configSheet.getRange('A1:B1').setValues([['PARAMETRO', 'VALOR']]);
      configSheet.getRange('A1:B1').setFontWeight('bold');
      configSheet.getRange('A1:B1').setBackground('#4285F4');
      configSheet.getRange('A1:B1').setFontColor('#FFFFFF');
      
      // Datos por defecto
      const datosDefault = [];
      for (let key in Config.CONFIG_DEFAULT) {
        if (Config.CONFIG_DEFAULT.hasOwnProperty(key)) {
          datosDefault.push([key, Config.CONFIG_DEFAULT[key]]);
        }
      }
      
      configSheet.getRange(2, 1, datosDefault.length, 2).setValues(datosDefault);
      
      // Formato
      configSheet.setColumnWidth(1, 250);
      configSheet.setColumnWidth(2, 400);
      configSheet.setFrozenRows(1);
      
      Logger.log('✅ Hoja CONFIGURACION creada');
      
      return configSheet;
      
    } catch (error) {
      Logger.log('❌ Error en crearHoja: ' + error);
      throw error;
    }
  }
};
