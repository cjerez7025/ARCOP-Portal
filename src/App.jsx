import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout Components
import Layout from './components/layout/Layout';

// Páginas existentes (NO SE TOCAN)
import FormularioSolicitud from './components/FormularioSolicitud';
import ValidarIdentidad from './pages/ValidarIdentidad';
import Seguimiento from './pages/Seguimiento';
import PanelDPO from './pages/PanelDPO';

// Páginas nuevas (se agregarán después)
import Dashboard from './pages/Dashboard';
// import Reportes from './pages/Reportes';
// import Configuracion from './pages/Configuracion';
// import BuscarSolicitud from './pages/BuscarSolicitud';

function App() {
  return (
    <Router>
      {/* Layout envuelve todo: Navbar + Content + Footer */}
      <Layout>
        <Routes>
          {/* Rutas públicas existentes - NO SE TOCAN */}
          <Route path="/" element={<FormularioSolicitud />} />
          <Route path="/validar/:token" element={<ValidarIdentidad />} />
          <Route path="/seguimiento/:numero" element={<Seguimiento />} />
          
          {/* Rutas DPO existentes - NO SE TOCAN */}
          <Route path="/dpo" element={<PanelDPO />} />
          
          {/* Rutas nuevas (descomentar cuando estén listas) */}
          { <Route path="/dpo/dashboard" element={<Dashboard />} /> }
          {/* <Route path="/dpo/reportes" element={<Reportes />} /> */}
          {/* <Route path="/dpo/configuracion" element={<Configuracion />} /> */}
          {/* <Route path="/buscar" element={<BuscarSolicitud />} /> */}
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

      {/* Toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Router>
  );
}

export default App;