// ============================================================
// Navbar v3 — Fintech dark, glassmorphism sutil
// ============================================================
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck, Menu, X,
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

  const isActive = (path) =>
    path === '/dpo' ? location.pathname === '/dpo' : location.pathname.startsWith(path);

  const navItems = isDPO ? NAV_DPO : NAV_PUBLIC;

  return (
    <nav style={{
      position:       'sticky',
      top:            0,
      zIndex:         50,
      background:     'rgba(10,10,15,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom:   '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>

          {/* Logo */}
          <Link to={isDPO ? '/dpo/dashboard' : '/'} style={{
            display:        'flex',
            alignItems:     'center',
            gap:            '10px',
            textDecoration: 'none',
          }}>
            <div style={{
              width:          '32px',
              height:         '32px',
              borderRadius:   '8px',
              background:     'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              boxShadow:      '0 2px 12px rgba(99,102,241,0.35)',
            }}>
              <ShieldCheck size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <div style={{ lineHeight: 1 }}>
              <span style={{
                display:      'block',
                fontSize:     '14px',
                fontWeight:   700,
                color:        '#F0F0F5',
                letterSpacing:'-0.01em',
                fontFamily:   'var(--font-body)',
              }}>
                Portal ARCOP
              </span>
              <span style={{
                display:      'block',
                fontSize:     '9px',
                fontWeight:   600,
                color:        '#5A5A72',
                letterSpacing:'0.12em',
                textTransform:'uppercase',
              }}>
                Ley 21.719
              </span>
            </div>

            {isDPO && (
              <div style={{
                marginLeft:    '12px',
                paddingLeft:   '12px',
                borderLeft:    '1px solid rgba(255,255,255,0.1)',
                fontSize:      '9px',
                fontWeight:    700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color:         '#818CF8',
                background:    'rgba(99,102,241,0.1)',
                padding:       '3px 10px',
                borderRadius:  '20px',
              }}>
                Zona DPO
              </div>
            )}
          </Link>

          {/* Nav desktop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
               className="hidden-mobile">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = isActive(to);
              return (
                <Link key={to} to={to} style={{
                  display:        'flex',
                  alignItems:     'center',
                  gap:            '6px',
                  padding:        '6px 12px',
                  borderRadius:   '8px',
                  fontSize:       '13px',
                  fontWeight:     active ? 600 : 400,
                  color:          active ? '#F0F0F5' : '#6B6B85',
                  background:     active ? 'rgba(255,255,255,0.07)' : 'transparent',
                  textDecoration: 'none',
                  transition:     'all 0.15s',
                }}>
                  <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                  {label}
                </Link>
              );
            })}

            {!isDPO ? (
              <Link to="/dpo/dashboard" style={{
                marginLeft:     '8px',
                display:        'flex',
                alignItems:     'center',
                gap:            '6px',
                padding:        '6px 14px',
                borderRadius:   '8px',
                fontSize:       '13px',
                fontWeight:     600,
                background:     'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                color:          '#fff',
                textDecoration: 'none',
                boxShadow:      '0 2px 10px rgba(99,102,241,0.3)',
              }}>
                Panel DPO
                <ChevronRight size={13} />
              </Link>
            ) : (
              <Link to="/" style={{
                marginLeft:     '8px',
                display:        'flex',
                alignItems:     'center',
                gap:            '6px',
                padding:        '6px 12px',
                borderRadius:   '8px',
                fontSize:       '13px',
                fontWeight:     400,
                color:          '#6B6B85',
                border:         '1px solid rgba(255,255,255,0.08)',
                textDecoration: 'none',
              }}>
                <Home size={13} />
                Portal
              </Link>
            )}
          </div>

          {/* Hamburger mobile */}
          <button
            onClick={() => setOpen(!open)}
            style={{
              background: 'none',
              border:     'none',
              cursor:     'pointer',
              color:      '#6B6B85',
              padding:    '4px',
              display:    'none',
            }}
            className="show-mobile"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{
          borderTop:  '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(10,10,15,0.98)',
          padding:    '12px 24px 20px',
        }}>
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              onClick={() => setOpen(false)}
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            '10px',
                padding:        '10px 12px',
                borderRadius:   '10px',
                fontSize:       '14px',
                fontWeight:     isActive(to) ? 600 : 400,
                color:          isActive(to) ? '#F0F0F5' : '#6B6B85',
                background:     isActive(to) ? 'rgba(255,255,255,0.07)' : 'transparent',
                textDecoration: 'none',
                marginBottom:   '2px',
              }}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '10px', paddingTop: '10px' }}>
            {isDPO ? (
              <Link to="/" onClick={() => setOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 12px', borderRadius: '10px', fontSize: '14px',
                color: '#6B6B85', textDecoration: 'none',
              }}>
                <Home size={16} /> Portal público
              </Link>
            ) : (
              <Link to="/dpo/dashboard" onClick={() => setOpen(false)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff',
                textDecoration: 'none',
              }}>
                Panel DPO <ChevronRight size={14} />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Responsive helpers */}
      <style>{`
        @media (min-width: 768px) {
          .hidden-mobile { display: flex !important; }
          .show-mobile   { display: none !important; }
        }
        @media (max-width: 767px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: block !important; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;