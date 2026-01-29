import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FormularioSolicitud from './components/FormularioSolicitud';
import ValidarIdentidad from './pages/ValidarIdentidad';
import { FileText, Shield, Phone, Mail } from 'lucide-react';
import { EMPRESA } from './utils/constants';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Portal ARCOP
                  </h1>
                  <p className="text-xs text-gray-500">
                    Protección de Datos Personales
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Ley 21.719
                </span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main con Rutas */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<FormularioSolicitud />} />
            <Route path="/validar/:token" element={<ValidarIdentidad />} />
          </Routes>
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Delegado de Protección de Datos (DPO)
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2 text-blue-600" />
                    <a href={`mailto:${EMPRESA.DPO_EMAIL}`} className="hover:text-blue-600">
                      {EMPRESA.DPO_EMAIL}
                    </a>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2 text-blue-600" />
                    <a href={`tel:${EMPRESA.DPO_TELEFONO}`} className="hover:text-blue-600">
                      {EMPRESA.DPO_TELEFONO}
                    </a>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Información Legal
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><a href="#" className="hover:text-blue-600">Política de Privacidad</a></li>
                  <li><a href="#" className="hover:text-blue-600">Términos y Condiciones</a></li>
                  <li><a href="#" className="hover:text-blue-600">Ley 21.719 ↗</a></li>
                </ul>
              </div>
            </div>
            <div className="pt-6 border-t text-center text-sm text-gray-500">
              © 2026 {EMPRESA.NOMBRE} | RUT: {EMPRESA.RUT}
            </div>
          </div>
        </footer>

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
      </div>
    </Router>
  );
}

export default App;