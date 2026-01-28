import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// ==================================================
// PORTAL ARCOP - PUNTO DE ENTRADA
// ==================================================

// Crear root y renderizar
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <App />
);

// Log de inicio
console.log('🔒 Portal ARCOP iniciado');
console.log('📅 Versión: 1.0');
console.log('⚖️ Ley 21.719 - Protección de Datos Personales');

// Métricas de rendimiento (opcional)
reportWebVitals();
