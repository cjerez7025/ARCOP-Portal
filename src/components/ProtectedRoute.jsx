// ============================================================
// src/components/ProtectedRoute.jsx
// Redirige a /login si el usuario no está autenticado.
// Muestra spinner mientras Firebase verifica la sesión.
// ============================================================
import React from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Firebase todavía verificando sesión — esperar antes de redirigir
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="bg-blue-600 p-3 rounded-xl animate-pulse">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-gray-500">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}