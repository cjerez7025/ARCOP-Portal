// ==================================================
// CONFIGURACIÓN CENTRALIZADA
// ==================================================

export const CONFIG = {
  // URL del Frontend (React)
  FRONTEND_URL: process.env.REACT_APP_FRONTEND_URL || window.location.origin,
  
  // URL del Backend (Apps Script)
  APPS_SCRIPT_URL: process.env.REACT_APP_APPS_SCRIPT_URL,
  
  // Información de la empresa
  EMPRESA: {
    NOMBRE: process.env.REACT_APP_EMPRESA_NOMBRE || 'Empresa XYZ SpA',
    RUT: process.env.REACT_APP_EMPRESA_RUT || '12.345.678-9',
    DPO_EMAIL: process.env.REACT_APP_DPO_EMAIL || 'dpo@empresa.cl',
    DPO_TELEFONO: process.env.REACT_APP_DPO_TELEFONO || '+56 2 2345 6789'
  }
};

// Validar configuración en desarrollo
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Configuración cargada:');
  console.log('  Frontend URL:', CONFIG.FRONTEND_URL);
  console.log('  Apps Script URL:', CONFIG.APPS_SCRIPT_URL ? '✅ Configurada' : '❌ Falta configurar');
}

export default CONFIG;