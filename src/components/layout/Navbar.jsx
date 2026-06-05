// ============================================================
// src/components/layout/Navbar.jsx  v7
// FIX: overflow visible en nav + inner div → logo no se corta
// Logo público: size=100, Navbar height=100px
// Logo DPO:     size=100, Navbar height=100px
// ============================================================
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, X, LayoutDashboard, ClipboardList, BarChart2,
  Settings, Home, Search, ChevronRight, LogOut,
  FileText, Eye, Users, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRol } from '../../hooks/useRol';
import AlignDataSeal from '../AlignDataSeal';

const NAV_DPO = [
  { to: '/dpo/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/dpo',               label: 'Solicitudes',   icon: ClipboardList   },
  { to: '/dpo/reportes',      label: 'Reportes',      icon: BarChart2       },
  { to: '/dpo/configuracion', label: 'Configuración', icon: Settings        },
  { to: '/dpo/usuarios',      label: 'Usuarios',      icon: Users, roles: ['admin'] },
];
const NAV_PUBLIC = [
  { to: '/',       label: 'Inicio',       icon: Home   },
  { to: '/buscar', label: 'Mi Solicitud', icon: Search },
];

const NAV_INTERNO = [
  { to: '/dpo/dashboard', label: 'DPO',       icon: LayoutDashboard, roles: ['dpo', 'admin'] },
  { to: '/legal',         label: 'Legal',      icon: FileText,        roles: ['legal', 'dpo', 'admin'] },
  { to: '/operador',      label: 'Operador',   icon: ClipboardList,   roles: ['operador', 'dpo', 'admin'] },
  { to: '/auditor',       label: 'Auditoría',  icon: Eye,             roles: ['auditor', 'dpo', 'admin', 'legal', 'operador'] },
];

const RUTAS_INTERNAS = ['/dpo', '/legal', '/operador', '/auditor'];

const Navbar = () => {
  const [open,       setOpen]       = useState(false);
  const [saliendo,   setSaliendo]   = useState(false);
  const [portalColor, setPortalColor] = useState(null);
  const [logoUrl,     setLogoUrl]     = useState(null);
  const location                = useLocation();
  const navigate                = useNavigate();
  const { logout, user }        = useAuth();
  const { rol }                 = useRol();
  const isDPO                   = location.pathname.startsWith('/dpo');
  const isInterno               = RUTAS_INTERNAS.some(r => location.pathname.startsWith(r));

  useEffect(() => {
    if (isDPO) return;
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    fetch(`${API_URL}/api/config`)
      .then(r => r.ok ? r.json() : null)
      .then(body => {
        if (!body?.data) return;
        if (body.data.portal_color) setPortalColor(body.data.portal_color);
        if (body.data.logo_url)     setLogoUrl(body.data.logo_url);
      })
      .catch(() => {});
  }, [isDPO]);

  const isActive = (path) =>
    path === '/dpo' ? location.pathname === '/dpo' : location.pathname.startsWith(path);

  const handleLogout = async () => {
    try { setSaliendo(true); await logout(); navigate('/login'); }
    catch (e) { console.error(e); setSaliendo(false); }
  };

  // ── Panel interno (DPO + roles) ──────────────────────
  if (isInterno) return (
    <>
      <nav style={{
        background:           'rgba(10,18,40,0.97)',
        backdropFilter:       'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom:         '1px solid rgba(255,255,255,0.08)',
        boxShadow:            '0 1px 12px rgba(0,0,0,0.4)',
        position:             'sticky',
        top:                  0,
        zIndex:               50,
        overflow:             'visible',
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

            {/* Nav desktop — filtrado por rol */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {isDPO && NAV_DPO.filter(n => !n.roles || (rol && n.roles.includes(rol))).map(({ to, label, icon: Icon }) => {
                const active = isActive(to);
                return (
                  <Link key={to} to={to} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '8px',
                    fontSize: '13px', fontWeight: active ? 600 : 500,
                    color:      active ? '#93c5fd' : '#94a3b8',
                    background: active ? 'rgba(29,78,216,0.15)' : 'transparent',
                    textDecoration: 'none', transition: 'all 0.15s',
                  }}>
                    <Icon style={{ width: 15, height: 15 }} />{label}
                  </Link>
                );
              })}
              {!isDPO && NAV_INTERNO.filter(n => rol && n.roles.includes(rol)).map(({ to, label, icon: Icon }) => {
                const active = location.pathname.startsWith(to);
                return (
                  <Link key={to} to={to} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '8px',
                    fontSize: '13px', fontWeight: active ? 600 : 500,
                    color:      active ? '#93c5fd' : '#94a3b8',
                    background: active ? 'rgba(29,78,216,0.15)' : 'transparent',
                    textDecoration: 'none', transition: 'all 0.15s',
                  }}>
                    <Icon style={{ width: 15, height: 15 }} />{label}
                  </Link>
                );
              })}
              <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.12)', margin: '0 8px' }} />
              <Link to="/" style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 12px', borderRadius: '8px',
                fontSize: '13px', color: '#94a3b8',
                border: '1px solid rgba(255,255,255,0.12)', textDecoration: 'none',
              }}>
                <Home style={{ width: 14, height: 14 }} /> Portal
              </Link>
              <button onClick={handleLogout} disabled={saliendo} title={user?.email}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 12px', borderRadius: '8px',
                  fontSize: '13px', fontWeight: 500,
                  color: '#fca5a5', border: '1px solid rgba(252,165,165,0.25)',
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
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '8px' }}
              className="md:hidden">
              {open ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,18,40,0.97)', padding: '12px 16px' }}>
            {isDPO && NAV_DPO.filter(n => !n.roles || (rol && n.roles.includes(rol))).map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px', marginBottom: '2px',
                fontSize: '14px', fontWeight: 500,
                color:      isActive(to) ? '#93c5fd' : '#94a3b8',
                background: isActive(to) ? 'rgba(29,78,216,0.15)' : 'transparent',
                textDecoration: 'none',
              }}>
                <Icon style={{ width: 16, height: 16 }} />{label}
              </Link>
            ))}
            {!isDPO && NAV_INTERNO.filter(n => rol && n.roles.includes(rol)).map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px', marginBottom: '2px',
                fontSize: '14px', fontWeight: 500,
                color:      location.pathname.startsWith(to) ? '#93c5fd' : '#94a3b8',
                background: location.pathname.startsWith(to) ? 'rgba(29,78,216,0.15)' : 'transparent',
                textDecoration: 'none',
              }}>
                <Icon style={{ width: 16, height: 16 }} />{label}
              </Link>
            ))}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '8px', paddingTop: '8px' }}>
              <button onClick={() => { setOpen(false); handleLogout(); }} disabled={saliendo}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, color: '#fca5a5', background: 'none', border: 'none', cursor: 'pointer' }}>
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
    <>
      <nav className="corp-navbar">
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          {logoUrl
            ? <img src={logoUrl} alt="Logo" style={{ height: 32, maxWidth: 140, objectFit: 'contain' }}
                onError={e => { e.currentTarget.style.display = 'none'; }} />
            : <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 8, display: 'flex' }}>
                <ShieldCheck size={20} color="white" />
              </div>
          }
          <div>
            <span style={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 700, color: 'white', fontSize: '1rem', display: 'block', lineHeight: 1.2 }}>
              Portal ARCOP
            </span>
            <span style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Ley 21.719 · Protección de Datos
            </span>
          </div>
        </Link>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Nav desktop */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 4 }}>
          {NAV_PUBLIC.map(({ to, label, icon: Icon }) => {
            const active = isActive(to);
            return (
              <Link key={to} to={to} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8,
                fontSize: '0.875rem', fontWeight: active ? 600 : 500,
                color: active ? 'white' : 'rgba(255,255,255,0.70)',
                background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                textDecoration: 'none', transition: 'all 0.15s',
              }}>
                <Icon size={15} /> {label}
              </Link>
            );
          })}
          <Link to="/dpo/dashboard" className="btn-primary" style={{ marginLeft: 12, minHeight: 36, padding: '8px 18px', fontSize: '0.8rem' }}>
            Panel DPO <ChevronRight size={13} />
          </Link>
        </div>

        {/* Mobile burger */}
        <button onClick={() => setOpen(!open)} className="md:hidden"
          style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)', borderRadius: 8, padding: 8, color: 'white', cursor: 'pointer', marginLeft: 8 }}>
          {open ? <X style={{ width: 18, height: 18 }} /> : <Menu style={{ width: 18, height: 18 }} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden" style={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 49, background: '#0A2463', borderTop: '1px solid rgba(255,255,255,0.10)', padding: '12px 16px', boxShadow: '0 8px 24px rgba(10,36,99,0.3)' }}>
          {NAV_PUBLIC.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, marginBottom: 2,
              fontSize: '0.9rem', fontWeight: 500,
              color: isActive(to) ? 'white' : 'rgba(255,255,255,0.70)',
              background: isActive(to) ? 'rgba(255,255,255,0.15)' : 'transparent',
              textDecoration: 'none',
            }}>
              <Icon style={{ width: 16, height: 16 }} /> {label}
            </Link>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.10)', marginTop: 8, paddingTop: 10 }}>
            <Link to="/dpo/dashboard" onClick={() => setOpen(false)} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <LayoutDashboard style={{ width: 16, height: 16 }} /> Panel DPO
            </Link>
          </div>
        </div>
      )}

      {/* Spacer para contenido debajo del fixed navbar */}
      <div style={{ height: 64 }} />
    </>
  );
};

export default Navbar;