// src/components/ModalCambiarRol.jsx — MMPA-65 / MMPA-108
import React, { useEffect, useRef, useState } from 'react';
import { X, UserCog } from 'lucide-react';
import { toast } from 'react-toastify';
import httpAdapter from '../adapters/httpAdapter';

const ROLES = [
  { value: 'admin',          label: 'Administrador' },
  { value: 'dpo',            label: 'DPO' },
  { value: 'legal_reviewer', label: 'Revisor Legal' },
  { value: 'arco_operator',  label: 'Operador ARCO' },
  { value: 'auditor_viewer', label: 'Auditor (lectura)' },
];

export default function ModalCambiarRol({ usuario, onClose, onActualizado }) {
  const overlayRef = useRef(null);
  const [rol,      setRol]      = useState(usuario.rol || '');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rol === usuario.rol) return;
    setEnviando(true);
    const result = await httpAdapter.cambiarRolUsuario(usuario.uid, rol);
    setEnviando(false);
    if (result.status === 'success') {
      toast.success('Rol actualizado');
      onActualizado();
      onClose();
    } else {
      toast.error(result.message || 'Error al cambiar rol');
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div className="corp-card w-full max-w-md animate-fade-up" style={{ overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCog style={{ width: 18, height: 18, color: 'white' }} />
            </div>
            <h2 style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: 0 }}>
              Cambiar rol
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 4 }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Usuario
            </label>
            <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8 }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'white', margin: 0 }}>{usuario.nombre || '—'}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{usuario.email}</p>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>Nuevo rol</label>
            <select value={rol} onChange={e => setRol(e.target.value)} className="corp-input">
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12, borderTop: '1px solid rgba(255,255,255,0.10)', paddingTop: 16 }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
              Cancelar
            </button>
            <button type="submit" disabled={enviando || rol === usuario.rol} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              {enviando ? 'Guardando...' : 'Guardar cambio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
