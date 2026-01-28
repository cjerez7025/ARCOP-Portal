// ==================================================
// PORTAL ARCOP - COMPONENTE PRINCIPAL
// ==================================================

import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FormularioSolicitud from './components/FormularioSolicitud';
import { FileText, Shield, Phone, Mail } from 'lucide-react';
import { EMPRESA } from './utils/constants';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* ========== HEADER ========== */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            
            {/* Logo y título */}
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
            
            {/* Badge Ley */}
            <div className="hidden sm:flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Ley 21.719
              </span>
            </div>
            
          </div>
        </div>
      </header>
      
      {/* ========== MAIN CONTENT ========== */}
      <main className="flex-grow py-8">
        <FormularioSolicitud />
      </main>
      
      {/* ========== FOOTER ========== */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          
          {/* Información de contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            
            {/* Contacto DPO */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Delegado de Protección de Datos (DPO)
              </h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2 text-blue-600" />
                  
                    href={`mailto:${EMPRESA.DPO_EMAIL}`}
                    className="hover:text-blue-600 transition"
                  >
                    {EMPRESA.DPO_EMAIL}
                  </a>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2 text-blue-600" />
                  
                    href={`tel:${EMPRESA.DPO_TELEFONO}`}
                    className="hover:text-blue-600 transition"
                  >
                    {EMPRESA.DPO_TELEFONO}
                  </a>
                </div>
              </div>
            </div>
            
            {/* Links útiles */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Información Legal
              </h3>
              <div className="space-y-2">
                
                  href="/politica-privacidad"
                  className="block text-sm text-gray-600 hover:text-blue-600 transition"
                >
                  Política de Privacidad
                </a>
                
                  href="/terminos"
                  className="block text-sm text-gray-600 hover:text-blue-600 transition"
                >
                  Términos y Condiciones
                </a>
                
                  href="https://www.bcn.cl/leychile/navegar?idNorma=1195657"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-gray-600 hover:text-blue-600 transition"
                >
                  Ley 21.719 ↗
                </a>
              </div>
            </div>
            
          </div>
          
          {/* Copyright */}
          <div className="pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              © {new Date().getFullYear()} {EMPRESA.NOMBRE} | RUT: {EMPRESA.RUT}
              <br className="sm:hidden" />
              <span className="hidden sm:inline"> | </span>
              Protección de Datos según Ley 21.719
            </p>
          </div>
          
        </div>
      </footer>
      
      {/* ========== TOAST NOTIFICATIONS ========== */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
    </div>
  );
}

export default App;