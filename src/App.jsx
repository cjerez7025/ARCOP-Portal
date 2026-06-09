// ============================================================
// src/App.jsx — v2.1
// CAMBIOS respecto a v2.0:
//   - Agrega ruta /login → LoginDPO
//   - Envuelve todas las rutas /dpo/* en ProtectedRoute
//   - ProtectedRoute redirige a /login si no hay sesión Firebase
// ============================================================
import React, { useEffect } from 'react';
import { cargarBranding } from './services/brandingService';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


// Layout
import Layout from './components/layout/Layout';

// Auth
import { AuthProvider }  from './context/AuthContext';
import ProtectedRoute    from './components/ProtectedRoute';

// Páginas públicas
import FormularioSolicitud from './components/FormularioSolicitud';
import ValidarIdentidad    from './pages/ValidarIdentidad';
import Seguimiento         from './pages/Seguimiento';
import LoginDPO            from './pages/LoginDPO';

// Páginas DPO (protegidas)
import PanelDPO        from './pages/PanelDPO';
import Dashboard       from './pages/Dashboard';
import Reportes        from './pages/Reportes';
import Configuracion   from './pages/Configuracion';
import BuscarSolicitud from './pages/BuscarSolicitud';
import GestionUsuarios    from './pages/GestionUsuarios';
import DetalleSolicitud  from './pages/DetalleSolicitud';

// Páginas de roles internos
import PanelLegal    from './pages/PanelLegal';
import PanelOperador from './pages/PanelOperador';
import PanelAuditor  from './pages/PanelAuditor';
function App() {
  useEffect(() => { cargarBranding(); }, []);

  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>

            {/* ── Rutas públicas ─────────────────────────── */}
            <Route path="/"                    element={<FormularioSolicitud />} />
            <Route path="/validar/:token"      element={<ValidarIdentidad />} />
            <Route path="/seguimiento/:numero" element={<Seguimiento />} />
            <Route path="/login"               element={<LoginDPO />} />
            <Route path="/buscar"              element={<BuscarSolicitud />} /> 
            {/* ── Rutas DPO protegidas ───────────────────── */}
            <Route path="/dpo" element={
              <ProtectedRoute><PanelDPO /></ProtectedRoute>
            } />
            <Route path="/dpo/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/dpo/reportes" element={
              <ProtectedRoute><Reportes /></ProtectedRoute>
            } />
            <Route path="/dpo/configuracion" element={
              <ProtectedRoute><Configuracion /></ProtectedRoute>
            } />
            <Route path="/dpo/usuarios" element={
              <ProtectedRoute><GestionUsuarios /></ProtectedRoute>
            } />
            <Route path="/dpo/detalle/:numero" element={
              <ProtectedRoute><DetalleSolicitud /></ProtectedRoute>
            } />

            {/* ── Rutas roles internos ───────────────────── */}
            <Route path="/legal" element={
              <ProtectedRoute><PanelLegal /></ProtectedRoute>
            } />
            <Route path="/operador" element={
              <ProtectedRoute><PanelOperador /></ProtectedRoute>
            } />
            <Route path="/auditor" element={
              <ProtectedRoute><PanelAuditor /></ProtectedRoute>
            } />

            {/* ── Fallback ───────────────────────────────── */}
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
    </AuthProvider>
  );
}

export default App;