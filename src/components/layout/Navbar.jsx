// ============================================================
// src/components/layout/Navbar.jsx  v7
// FIX: overflow visible en nav + inner div → logo no se corta
// Logo público: size=100, Navbar height=100px
// Logo DPO:     size=100, Navbar height=100px
// ============================================================
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, X, LayoutDashboard, ClipboardList, BarChart2,
  Settings, Home, Search, ChevronRight, LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AlignDataSeal from '../AlignDataSeal';

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
  const [open,     setOpen]     = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const location                = useLocation();
  const navigate                = useNavigate();
  const { logout, user }        = useAuth();
  const isDPO                   = location.pathname.startsWith('/dpo');

  const isActive = (path) =>
    path === '/dpo' ? location.pathname === '/dpo' : location.pathname.startsWith(path);

  const handleLogout = async () => {
    try { setSaliendo(true); await logout(); navigate('/login'); }
    catch (e) { console.error(e); setSaliendo(false); }
  };

  // ── DPO ───────────────────────────────────────────────
  if (isDPO) return (
    <>
      <nav style={{
        background:  '#fff',
        boxShadow:   '0 1px 3px rgba(0,0,0,0.1)',
        position:    'sticky',
        top:         0,
        zIndex:      50,
        overflow:    'visible',   // ← clave: logo no se recorta
      }}>
        <div style={{
          maxWidth:   '1280px',
          margin:     '0 auto',
          padding:    '0 24px',
          overflow:   'visible',  // ← clave
        }}>
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            height:         '100px',
            overflow:       'visible',  // ← clave
          }}>

            {/* Logo */}
            <Link to="/dpo/dashboard"
              style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', overflow: 'visible' }}>
              <AlignDataSeal size={100} animated />
            </Link>

            {/* Nav desktop */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {NAV_DPO.map(({ to, label, icon: Icon }) => {
                const active = isActive(to);
                return (
                  <Link key={to} to={to} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '8px',
                    fontSize: '13px', fontWeight: active ? 600 : 500,
                    color:      active ? '#1D4ED8' : '#4B5563',
                    background: active ? '#EFF6FF' : 'transparent',
                    textDecoration: 'none', transition: 'all 0.15s',
                  }}>
                    <Icon style={{ width: 15, height: 15 }} />{label}
                  </Link>
                );
              })}
              <div style={{ width: '1px', height: '24px', background: '#E5E7EB', margin: '0 8px' }} />
              <Link to="/" style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 12px', borderRadius: '8px',
                fontSize: '13px', color: '#6B7280',
                border: '1px solid #E5E7EB', textDecoration: 'none',
              }}>
                <Home style={{ width: 14, height: 14 }} /> Portal
              </Link>
              <button onClick={handleLogout} disabled={saliendo} title={user?.email}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 12px', borderRadius: '8px',
                  fontSize: '13px', fontWeight: 500,
                  color: '#DC2626', border: '1px solid #FEE2E2',
                  background: 'transparent',
                  cursor: saliendo ? 'not-allowed' : 'pointer',
                  opacity: saliendo ? 0.5 : 1, marginLeft: '4px',
                }}>
                <LogOut style={{ width: 14, height: 14 }} />
                {saliendo ? 'Saliendo...' : 'Salir'}
              </button>
            </div>

            {/* Mobile burger */}
            <button onClick={() => setOpen(!open)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', padding: '8px' }}
              className="md:hidden">
              {open ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div style={{ borderTop: '1px solid #E5E7EB', background: '#fff', padding: '12px 16px' }}>
            {NAV_DPO.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px', marginBottom: '2px',
                fontSize: '14px', fontWeight: 500,
                color:      isActive(to) ? '#1D4ED8' : '#4B5563',
                background: isActive(to) ? '#EFF6FF' : 'transparent',
                textDecoration: 'none',
              }}>
                <Icon style={{ width: 16, height: 16 }} />{label}
              </Link>
            ))}
            <div style={{ borderTop: '1px solid #F3F4F6', marginTop: '8px', paddingTop: '8px' }}>
              <button onClick={() => { setOpen(false); handleLogout(); }} disabled={saliendo}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' }}>
                <LogOut style={{ width: 16, height: 16 }} />{saliendo ? 'Saliendo...' : 'Cerrar sesión'}
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );

  // ── Público ────────────────────────────────────────────
  return (
    <nav style={{
      position:             'sticky',
      top:                  0,
      zIndex:               50,
      background:           'rgba(14,14,23,0.85)',
      backdropFilter:       'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom:         '1px solid rgba(255,255,255,0.07)',
      overflow:             'visible',   // ← clave
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', overflow: 'visible' }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          height: '100px',
          overflow: 'visible',  // ← clave
        }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', overflow: 'visible' }}>
            <AlignDataSeal size={100} animated />
          </Link>

          {/* Nav desktop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {NAV_PUBLIC.map(({ to, label, icon: Icon }) => {
              const active = isActive(to);
              return (
                <Link key={to} to={to} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '8px',
                  fontSize: '13px', fontWeight: active ? 600 : 400,
                  color:      active ? '#F0F0F5' : '#6B6B85',
                  background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                  textDecoration: 'none', transition: 'all 0.15s',
                }}>
                  <Icon size={14} />{label}
                </Link>
              );
            })}
            <Link to="/dpo/dashboard" style={{
              marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '8px',
              fontSize: '13px', fontWeight: 600,
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