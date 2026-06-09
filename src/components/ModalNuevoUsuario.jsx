// src/components/ModalNuevoUsuario.jsx — MMPA-65 / MMPA-108
import React, { useEffect, useRef, useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';
import httpAdapter from '../adapters/httpAdapter';

const ROLES = [
  { value: 'admin',          label: 'Administrador' },
  { value: 'dpo',            label: 'DPO' },
  { value: 'legal_reviewer', label: 'Revisor Legal' },
  { value: 'arco_operator',  label: 'Operador ARCO' },
  { value: 'auditor_viewer', label: 'Auditor (lectura)' },
];

export default function ModalNuevoUsuario({ onClose, onCreado }) {
  const overlayRef = useRef(null);
  const [form,     setForm]     = useState({ nombre: '', email: '', rol: '' });
  const [enviando, setEnviando] = useState(false);
  const [errors,   setErrors]   = useState({});

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const validate = () => {
    const e = {};
    if (!form.nombre.trim() || form.nombre.trim().length < 3) e.nombre = 'Mínimo 3 caracteres';
    if (!form.email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Email inválido';
    if (!form.rol) e.rol = 'Selecciona un rol';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setEnviando(true);
    const result = await httpAdapter.crearUsuario({
      email:  form.email.trim(),
      nombre: form.nombre.trim(),
      rol:    form.rol,
    });
    setEnviando(false);
    if (result.status === 'success') {
      toast.success(`Invitación enviada a ${form.email.trim()}`);
      onCreado();
      onClose();
    } else if (result.message?.toLowerCase().includes('ya existe')) {
      toast.error('El email ya está registrado en el sistema');
    } else {
      toast.error('Error al crear usuario. Inténtalo de nuevo.');
    }
  };

  const setField = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
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
              <UserPlus style={{ width: 18, height: 18, color: 'white' }} />
            </div>
            <h2 style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: 0 }}>
              Nuevo usuario
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 4 }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>
              Nombre completo <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input type="text" value={form.nombre} onChange={e => setField('nombre', e.target.value)}
              placeholder="Ej. María González" className={`corp-input${errors.nombre ? ' error' : ''}`} />
            {errors.nombre && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.nombre}</p>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>
              Correo electrónico <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input type="email" value={form.email} onChange={e => setField('email', e.target.value)}
              placeholder="usuario@empresa.cl" className={`corp-input${errors.email ? ' error' : ''}`} />
            {errors.email && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.email}</p>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>
              Rol <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select value={form.rol} onChange={e => setField('rol', e.target.value)}
              className={`corp-input${errors.rol ? ' error' : ''}`}>
              <option value="">Selecciona un rol</option>
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {errors.rol && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.rol}</p>}
          </div>

          <div style={{ display: 'flex', gap: 12, borderTop: '1px solid rgba(255,255,255,0.10)', paddingTop: 16 }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
              Cancelar
            </button>
            <button type="submit" disabled={enviando} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              {enviando ? 'Enviando...' : 'Crear y enviar invitación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
