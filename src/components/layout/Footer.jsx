import React from 'react';
import { Mail, Phone, ExternalLink } from 'lucide-react';
import { EMPRESA } from '../../utils/constants';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Contenido principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          
          {/* Columna 1: DPO */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Delegado de Protección de Datos (DPO)
            </h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                <a 
                  href={`mailto:${EMPRESA.DPO_EMAIL}`} 
                  className="hover:text-blue-600 transition-colors"
                >
                  {EMPRESA.DPO_EMAIL}
                </a>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                <a 
                  href={`tel:${EMPRESA.DPO_TELEFONO}`} 
                  className="hover:text-blue-600 transition-colors"
                >
                  {EMPRESA.DPO_TELEFONO}
                </a>
              </div>
            </div>
          </div>

          {/* Columna 2: Enlaces útiles */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Información Legal
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <button className="hover:text-blue-600 transition-colors">
                  Política de Privacidad
                </button>
              </li>
              <li>
                <button className="hover:text-blue-600 transition-colors">
                  Términos y Condiciones
                </button>
              </li>
              <li>
                <a 
                  href="https://www.bcn.cl/leychile/navegar?idNorma=1198130" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-blue-600 transition-colors inline-flex items-center"
                >
                  Ley 21.719
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 3: Sobre ARCOP */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Sobre Portal ARCOP
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Portal para el ejercicio de derechos de acceso, rectificación, cancelación 
              y oposición de datos personales, en cumplimiento de la Ley 21.719 sobre 
              Protección de Datos Personales.
            </p>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
            
            {/* Copyright */}
            <div className="text-sm text-gray-500 text-center md:text-left">
              © {new Date().getFullYear()} {EMPRESA.NOMBRE} | RUT: {EMPRESA.RUT}
            </div>

            {/* Badge Ley */}
            <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-xs font-medium text-blue-900">
                Cumplimiento Ley 21.719
              </span>
            </div>
          </div>
        </div>

        {/* Versión (opcional, útil para debugging) */}
        <div className="mt-4 text-center">
          <span className="text-xs text-gray-400">
            Portal ARCOP v1.0.0
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;