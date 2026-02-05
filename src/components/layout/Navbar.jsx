    import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Menu, X, Home, Search, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Detectar si estamos en zona DPO
  const isDPOZone = location.pathname.startsWith('/dpo');

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo y título */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Portal ARCOP</h1>
                <p className="text-xs text-gray-500">Ley 21.719</p>
              </div>
            </Link>
          </div>

          {/* Navegación Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {isDPOZone ? (
              // Menú DPO
              <>
                <Link
                  to="/dpo/dashboard"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive('/dpo/dashboard')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 inline mr-2" />
                  Dashboard
                </Link>
                <Link
                  to="/dpo"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive('/dpo')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  📋 Solicitudes
                </Link>
                <Link
                  to="/dpo/reportes"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive('/dpo/reportes')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  📊 Reportes
                </Link>
                <Link
                  to="/dpo/configuracion"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive('/dpo/configuracion')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  ⚙️ Configuración
                </Link>
                <div className="border-l border-gray-300 h-8 mx-2"></div>
                <Link
                  to="/"
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                >
                  ← Portal Público
                </Link>
              </>
            ) : (
              // Menú Público
              <>
                <Link
                  to="/"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive('/')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Home className="w-4 h-4 inline mr-2" />
                  Inicio
                </Link>
                <Link
                  to="/buscar"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive('/buscar')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Search className="w-4 h-4 inline mr-2" />
                  Mi Solicitud
                </Link>
                <div className="border-l border-gray-300 h-8 mx-2"></div>
                <Link
                  to="/dpo/dashboard"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  👨‍💼 Panel DPO
                </Link>
              </>
            )}
          </div>

          {/* Botón menú móvil */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {isDPOZone ? (
              // Menú móvil DPO
              <>
                <Link
                  to="/dpo/dashboard"
                  className={`block px-4 py-3 rounded-lg font-medium ${
                    isActive('/dpo/dashboard')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="w-4 h-4 inline mr-2" />
                  Dashboard
                </Link>
                <Link
                  to="/dpo"
                  className={`block px-4 py-3 rounded-lg font-medium ${
                    isActive('/dpo')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  📋 Solicitudes
                </Link>
                <Link
                  to="/dpo/reportes"
                  className={`block px-4 py-3 rounded-lg font-medium ${
                    isActive('/dpo/reportes')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  📊 Reportes
                </Link>
                <Link
                  to="/dpo/configuracion"
                  className={`block px-4 py-3 rounded-lg font-medium ${
                    isActive('/dpo/configuracion')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ⚙️ Configuración
                </Link>
                <div className="border-t border-gray-200 my-2"></div>
                <Link
                  to="/"
                  className="block px-4 py-3 text-gray-600 hover:text-gray-900 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ← Portal Público
                </Link>
              </>
            ) : (
              // Menú móvil Público
              <>
                <Link
                  to="/"
                  className={`block px-4 py-3 rounded-lg font-medium ${
                    isActive('/')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home className="w-4 h-4 inline mr-2" />
                  Inicio
                </Link>
                <Link
                  to="/buscar"
                  className={`block px-4 py-3 rounded-lg font-medium ${
                    isActive('/buscar')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Search className="w-4 h-4 inline mr-2" />
                  Mi Solicitud
                </Link>
                <div className="border-t border-gray-200 my-2"></div>
                <Link
                  to="/dpo/dashboard"
                  className="block px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  👨‍💼 Panel DPO
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;