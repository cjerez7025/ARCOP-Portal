import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout Components
import Layout from './components/layout/Layout';

// Páginas existentes
import FormularioSolicitud from './components/FormularioSolicitud';
import ValidarIdentidad from './pages/ValidarIdentidad';
import Seguimiento from './pages/Seguimiento';
import PanelDPO from './pages/PanelDPO';

// Páginas nuevas
import Dashboard from './pages/Dashboard';
import Configuracion from './pages/Configuracion';
// import Reportes from './pages/Reportes';
// import BuscarSolicitud from './pages/BuscarSolicitud';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<FormularioSolicitud />} />
          <Route path="/validar/:token" element={<ValidarIdentidad />} />
          <Route path="/seguimiento/:numero" element={<Seguimiento />} />
          
          {/* Rutas DPO */}
          <Route path="/dpo" element={<PanelDPO />} />
          <Route path="/dpo/dashboard" element={<Dashboard />} />
          <Route path="/dpo/configuracion" element={<Configuracion />} />
          {/* <Route path="/dpo/reportes" element={<Reportes />} /> */}
          
          {/* Rutas públicas adicionales */}
          {/* <Route path="/buscar" element={<BuscarSolicitud />} /> */}
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

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