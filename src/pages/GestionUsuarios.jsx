// src/pages/GestionUsuarios.jsx — MMPA-65 / MMPA-108
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { UserPlus, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import httpAdapter from '../adapters/httpAdapter';
import ModalNuevoUsuario from '../components/ModalNuevoUsuario';
import ModalCambiarRol from '../components/ModalCambiarRol';

const ROL_BADGE_STYLE = {
  admin:          { background: 'rgba(139,92,246,0.15)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.3)' },
  dpo:            { background: 'rgba(59,130,246,0.15)',  color: '#93C5FD', border: '1px solid rgba(59,130,246,0.3)' },
  legal_reviewer: { background: 'rgba(245,158,11,0.15)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.3)' },
  arco_operator:  { background: 'rgba(16,185,129,0.15)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.3)' },
  auditor_viewer: { background: 'rgba(100,116,139,0.15)',color: '#94A3B8', border: '1px solid rgba(100,116,139,0.3)' },
};

const ROL_BADGE_DEFAULT = { background: 'rgba(100,116,139,0.15)', color: '#94A3B8', border: '1px solid rgba(100,116,139,0.3)' };

const ROL_LABEL = {
  admin:          'Administrador',
  dpo:            'DPO',
  legal_reviewer: 'Revisor Legal',
  arco_operator:  'Operador ARCO',
  auditor_viewer: 'Auditor',
};

function formatDate(str) {
  if (!str) return '—';
  try {
    return new Date(str).toLocaleDateString('es-CL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function GestionUsuarios() {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [usuarios,   setUsuarios]   = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalRol,   setModalRol]   = useState(null);
  const [toggling,   setToggling]   = useState(null);
  const [toggledOk,  setToggledOk]  = useState(null);

  useEffect(() => {
    if (userRole !== null && userRole !== 'admin') {
      toast.error('Acceso restringido a administradores');
      navigate('/dpo');
    }
  }, [userRole, navigate]);

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    const result = await httpAdapter.getUsuarios();
    if (result.status === 'success') {
      setUsuarios(result.data || []);
    } else {
      toast.error('No se pudo cargar la lista de usuarios');
    }
    setCargando(false);
  }, []);

  useEffect(() => { cargarUsuarios(); }, [cargarUsuarios]);

  const handleToggleEstado = async (u) => {
    if (toggling) return;
    setToggling(u.uid);
    const result = await httpAdapter.cambiarEstadoUsuario(u.uid, !u.activo);
    if (result.status === 'success') {
      setUsuarios(prev => prev.map(x => x.uid === u.uid ? { ...x, activo: !u.activo } : x));
      setToggledOk(u.uid);
      setTimeout(() => setToggledOk(null), 1500);
    } else {
      toast.error(result.message || 'Error al cambiar estado');
    }
    setToggling(null);
  };

  if (userRole !== 'admin') return null;

  return (
    <div className="dpo-layout" style={{ padding: '32px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: 24, fontWeight: 800, color: 'white', margin: 0 }}>Gestión de usuarios</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>Administra los usuarios internos del sistema</p>
          </div>
          <button onClick={() => setModalNuevo(true)} className="btn-primary">
            <UserPlus style={{ width: 16, height: 16 }} /> Nuevo usuario
          </button>
        </div>

        <div className="corp-card" style={{ overflow: 'hidden' }}>
          {/* Barra superior */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {cargando ? '…' : `${usuarios.length} usuario${usuarios.length !== 1 ? 's' : ''}`}
            </span>
            <button onClick={cargarUsuarios} disabled={cargando} title="Recargar"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}>
              <RefreshCw style={{ width: 16, height: 16 }} className={cargando ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Skeleton loading */}
          {cargando && (
            <div>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', animation: 'pulse 1.5s ease-in-out infinite' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, width: '30%', background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: 6 }} />
                    <div style={{ height: 11, width: '50%', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
                  </div>
                  <div style={{ height: 20, width: 80, background: 'rgba(99,102,241,0.12)', borderRadius: 20 }} />
                  <div style={{ height: 20, width: 36, background: 'rgba(255,255,255,0.08)', borderRadius: 20 }} />
                  <div style={{ height: 30, width: 90, background: 'rgba(255,255,255,0.06)', borderRadius: 8 }} />
                </div>
              ))}
            </div>
          )}

          {!cargando && (
            <>
              {/* Tabla desktop */}
              <table className="corp-table hidden md:table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Último acceso</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u, idx) => {
                    const esSelf = u.uid === user?.uid;
                    return (
                      <tr key={u.uid} className="animate-fade-up" style={{ animationDelay: `${idx * 55}ms` }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div aria-hidden="true" style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))', color: '#A5B4FC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, border: '1px solid rgba(99,102,241,0.25)' }}>
                              {(u.nombre || u.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{u.nombre || '—'}</span>
                          </div>
                        </td>
                        <td style={{ color: 'rgba(255,255,255,0.55)' }}>{u.email}</td>
                        <td>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={ROL_BADGE_STYLE[u.rol] || ROL_BADGE_DEFAULT}>
                            {ROL_LABEL[u.rol] || u.rol || 'Sin rol'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button onClick={() => !esSelf && handleToggleEstado(u)} disabled={esSelf || toggling === u.uid}
                              title={esSelf ? 'No puedes desactivar tu propia cuenta' : (u.activo ? 'Desactivar' : 'Activar')}
                              style={{ position: 'relative', display: 'inline-flex', height: 20, width: 36, flexShrink: 0, borderRadius: 10, transition: 'background 0.2s', background: u.activo ? '#10B981' : 'rgba(255,255,255,0.2)', opacity: esSelf || toggling === u.uid ? 0.5 : 1, cursor: esSelf || toggling === u.uid ? 'not-allowed' : 'pointer', border: 'none' }}>
                              <span style={{ display: 'inline-block', height: 16, width: 16, marginTop: 2, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transform: u.activo ? 'translateX(18px)' : 'translateX(2px)', transition: 'transform 0.2s' }} />
                            </button>
                            {toggledOk === u.uid
                              ? <CheckCircle style={{ width: 16, height: 16, color: '#10B981' }} className="animate-fade-up" />
                              : <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{u.activo ? 'Activo' : 'Inactivo'}</span>
                            }
                          </div>
                        </td>
                        <td style={{ color: 'rgba(255,255,255,0.55)' }}>{formatDate(u.ultimoAcceso)}</td>
                        <td>
                          <button onClick={() => !esSelf && setModalRol(u)} disabled={esSelf}
                            title={esSelf ? 'No puedes cambiar tu propio rol' : 'Cambiar rol'}
                            style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, border: esSelf ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(99,102,241,0.4)', color: esSelf ? 'rgba(255,255,255,0.25)' : '#A5B4FC', background: 'none', cursor: esSelf ? 'not-allowed' : 'pointer', fontWeight: 500, transition: 'all 0.15s' }}>
                            Cambiar rol
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {usuarios.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', padding: '48px 20px' }}>No hay usuarios registrados</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Vista mobile */}
              <div className="md:hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                {usuarios.map((u, idx) => {
                  const esSelf = u.uid === user?.uid;
                  return (
                    <div key={u.uid} className="animate-fade-up" style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.06)', animationDelay: `${idx * 55}ms` }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                          <div aria-hidden="true" style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))', color: '#A5B4FC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, border: '1px solid rgba(99,102,241,0.25)' }}>
                            {(u.nombre || u.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.9)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nombre || '—'}</p>
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                          </div>
                        </div>
                        <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          style={ROL_BADGE_STYLE[u.rol] || ROL_BADGE_DEFAULT}>
                          {ROL_LABEL[u.rol] || u.rol || 'Sin rol'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => !esSelf && handleToggleEstado(u)} disabled={esSelf || toggling === u.uid}
                            style={{ position: 'relative', display: 'inline-flex', height: 20, width: 36, flexShrink: 0, borderRadius: 10, background: u.activo ? '#10B981' : 'rgba(255,255,255,0.2)', opacity: esSelf || toggling === u.uid ? 0.5 : 1, cursor: esSelf || toggling === u.uid ? 'not-allowed' : 'pointer', border: 'none' }}>
                            <span style={{ display: 'inline-block', height: 16, width: 16, marginTop: 2, borderRadius: '50%', background: 'white', transform: u.activo ? 'translateX(18px)' : 'translateX(2px)', transition: 'transform 0.2s' }} />
                          </button>
                          {toggledOk === u.uid
                            ? <CheckCircle style={{ width: 16, height: 16, color: '#10B981' }} className="animate-fade-up" />
                            : <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{u.activo ? 'Activo' : 'Inactivo'}</span>
                          }
                        </div>
                        <button onClick={() => !esSelf && setModalRol(u)} disabled={esSelf}
                          style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, border: esSelf ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(99,102,241,0.4)', color: esSelf ? 'rgba(255,255,255,0.25)' : '#A5B4FC', background: 'none', cursor: esSelf ? 'not-allowed' : 'pointer', fontWeight: 500 }}>
                          Cambiar rol
                        </button>
                      </div>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>Último acceso: {formatDate(u.ultimoAcceso)}</p>
                    </div>
                  );
                })}
                {usuarios.length === 0 && (
                  <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.35)', padding: '48px 20px' }}>No hay usuarios registrados</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {modalNuevo && (
        <ModalNuevoUsuario
          onClose={() => setModalNuevo(false)}
          onCreado={cargarUsuarios}
        />
      )}
      {modalRol && (
        <ModalCambiarRol
          usuario={modalRol}
          onClose={() => setModalRol(null)}
          onActualizado={cargarUsuarios}
        />
      )}
    </div>
  );
}
