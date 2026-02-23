// ============================================================
// Navbar v3 — dual theme
// Portal público (/): dark glassmorphism
// Zona DPO (/dpo/*): claro, igual que antes
// ============================================================
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck, FileText, Menu, X,
  LayoutDashboard, ClipboardList, BarChart2,
  Settings, Home, Search, ChevronRight
} from 'lucide-react';

const NAV_DPO = [
  { to: '/dpo/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/dpo',               label: 'Solicitudes',   icon: ClipboardList   },
  { to: '/dpo/reportes',      label: 'Reportes',      icon: BarChart2       },
  { to: '/dpo/configuracion', label: 'Configuración', icon: Settings        },
];

const NAV_PUBLIC = [
  { to: '/',       label: 'Inicio',       icon: Home   },
  { to: '/buscar', label: 'Mi Solicitud', icon: Search },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location        = useLocation();
  const isDPO           = location.pathname.startsWith('/dpo');
  const isPublic        = !isDPO; // portal público = tema oscuro

  const isActive = (path) =>
    path === '/dpo' ? location.pathname === '/dpo' : location.pathname.startsWith(path);

  const navItems = isDPO ? NAV_DPO : NAV_PUBLIC;

  // ── Tema claro (DPO) — igual que el original ─────────
  if (isDPO) {
    return (
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dpo/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Portal ARCOP</h1>
                  <p className="text-xs text-gray-500">Ley 21.719 — Zona DPO</p>
                </div>
              </Link>
            </div>

            {/* Nav desktop DPO */}
            <div className="hidden md:flex items-center space-x-1">
              {NAV_DPO.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    isActive(to)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
              <Link to="/" className="ml-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 border border-gray-200 hover:bg-gray-50">
                <Home className="w-4 h-4" />
                Portal
              </Link>
            </div>

            {/* Mobile */}
            <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-gray-600">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-1">
            {NAV_DPO.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive(to) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                <Icon className="w-4 h-4" /> {label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    );
  }

  // ── Tema oscuro (Portal público) ─────────────────────
  return (
    <nav style={{
      position:       'sticky',
      top:            0,
      zIndex:         50,
      background:     'rgba(14,14,23,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom:   '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(99,102,241,0.35)',
            }}>
              <ShieldCheck size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <div style={{ lineHeight: 1 }}>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#F0F0F5', letterSpacing: '-0.01em' }}>
                Portal ARCOP
              </span>
              <span style={{ display: 'block', fontSize: '9px', fontWeight: 600, color: '#5A5A72', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Ley 21.719
              </span>
            </div>
          </Link>

          {/* Nav desktop público */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {NAV_PUBLIC.map(({ to, label, icon: Icon }) => {
              const active = isActive(to);
              return (
                <Link key={to} to={to} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '8px',
                  fontSize: '13px', fontWeight: active ? 600 : 400,
                  color: active ? '#F0F0F5' : '#6B6B85',
                  background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                  textDecoration: 'none', transition: 'all 0.15s',
                }}>
                  <Icon size={14} />
                  {label}
                </Link>
              );
            })}
            <Link to="/dpo/dashboard" style={{
              marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              color: '#fff', textDecoration: 'none',
              boxShadow: '0 2px 10px rgba(99,102,241,0.3)',
            }}>
              Panel DPO <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;