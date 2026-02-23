// ============================================================
// CAMPO RENDERER v2
// Soporta dark={true} para contexto fintech dark (FormularioSolicitud)
// Sin dark prop = comportamiento original (PanelDPO, Configuracion)
// ============================================================

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { CATEGORIAS_DATOS } from '../utils/constants';

const CampoRenderer = ({ campo, register, watch, setValue, errors, dark = false }) => {
  const error = errors?.[campo.id];

  // ── Estilos condicionales dark / light ─────────────────
  const s = dark ? {
    label:       { fontSize: '13px', fontWeight: 500, color: '#9090A8', marginBottom: '6px', display: 'block', fontFamily: 'var(--font-body)' },
    labelAst:    { color: '#EF4444', marginLeft: '3px' },
    input:       {
      width: '100%', padding: '10px 14px',
      background: 'rgba(28,28,40,0.8)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '10px',
      color: '#F0F0F5',
      fontSize: '14px',
      fontFamily: 'var(--font-body)',
      outline: 'none',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    },
    inputFocus:  { borderColor: 'rgba(99,102,241,0.5)', boxShadow: '0 0 0 3px rgba(99,102,241,0.12)' },
    ayuda:       { fontSize: '11px', color: '#5A5A72', marginTop: '5px' },
    error:       { fontSize: '12px', color: '#EF4444', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' },
    radioItem:   {
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '10px 14px', cursor: 'pointer',
      background: 'rgba(28,28,40,0.6)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '10px',
      marginBottom: '6px',
      transition: 'border-color 0.15s',
    },
    radioLabel:  { fontSize: '13px', color: '#C8C8D8' },
    checkItem:   {
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '12px 14px', cursor: 'pointer',
      background: 'rgba(28,28,40,0.6)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '10px',
    },
    checkLabel:  { fontSize: '13px', color: '#C8C8D8', fontWeight: 500 },
    checkAyuda:  { fontSize: '11px', color: '#5A5A72', marginTop: '3px' },
    catGrid:     {
      background: 'rgba(22,22,31,0.8)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '10px', padding: '14px', marginTop: '8px',
    },
    catLabel:    { fontSize: '11px', color: '#9090A8', marginBottom: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' },
    catItem:     { fontSize: '13px', color: '#9090A8' },
  } : {
    label:       {},
    labelAst:    {},
    input:       {},
    ayuda:       {},
    error:       {},
    radioItem:   {},
    radioLabel:  {},
    checkItem:   {},
    checkLabel:  {},
    checkAyuda:  {},
    catGrid:     {},
    catLabel:    {},
    catItem:     {},
  };

  // Clases Tailwind para modo light (original)
  const inputClass = dark
    ? undefined
    : 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm';

  const errorClass = dark
    ? undefined
    : 'mt-1 text-sm text-red-600 flex items-center gap-1';

  const registerOptions = campo.obligatorio
    ? { required: `${campo.label} es obligatorio` }
    : {};

  // ── Subcomponentes ─────────────────────────────────────
  const Label = () => dark ? (
    <label style={s.label}>
      {campo.label}
      {campo.obligatorio && <span style={s.labelAst}>*</span>}
    </label>
  ) : (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {campo.label}
      {campo.obligatorio && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  const Ayuda = () => campo.ayuda ? (
    dark
      ? <p style={s.ayuda}>{campo.ayuda}</p>
      : <p className="text-xs text-gray-500 mt-1">{campo.ayuda}</p>
  ) : null;

  const ErrorMsg = () => error ? (
    dark ? (
      <div style={s.error}>
        <AlertCircle size={12} />
        {error.message || 'Campo requerido'}
      </div>
    ) : (
      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {error.message || 'Campo requerido'}
      </p>
    )
  ) : null;

  // Input con focus dark manejado via CSS en index.css (.input-dark)
  const DarkInput = ({ type = 'text', extraProps = {}, style = {} }) => (
    <input
      {...extraProps}
      type={type}
      className="arcop-input-dark"
      style={{ ...s.input, ...style }}
    />
  );

  // ── Tipos ──────────────────────────────────────────────

  if (campo.tipo === 'text' || campo.tipo === 'email' || campo.tipo === 'tel') {
    return (
      <div>
        <Label />
        {dark ? (
          <input
            {...register(campo.id, registerOptions)}
            type={campo.tipo}
            placeholder={campo.placeholder || ''}
            className="arcop-input-dark"
            style={s.input}
          />
        ) : (
          <input
            {...register(campo.id, registerOptions)}
            type={campo.tipo}
            placeholder={campo.placeholder || ''}
            className={inputClass}
          />
        )}
        <Ayuda />
        <ErrorMsg />
      </div>
    );
  }

  if (campo.tipo === 'rut') {
    return (
      <div>
        <Label />
        <input
          {...register(campo.id, registerOptions)}
          type="text"
          placeholder={campo.placeholder || '12.345.678-9'}
          maxLength={12}
          className={dark ? 'arcop-input-dark' : inputClass}
          style={dark ? s.input : {}}
          onChange={(e) => {
            let v = e.target.value.replace(/[^0-9kK]/g, '');
            if (v.length > 1) {
              const dv  = v.slice(-1);
              let num   = v.slice(0, -1);
              num = num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
              v = `${num}-${dv}`;
            }
            setValue(campo.id, v);
          }}
        />
        <Ayuda />
        <ErrorMsg />
      </div>
    );
  }

  if (campo.tipo === 'textarea') {
    return (
      <div>
        <Label />
        <textarea
          {...register(campo.id, registerOptions)}
          rows={3}
          placeholder={campo.placeholder || ''}
          className={dark ? 'arcop-input-dark' : inputClass}
          style={dark ? { ...s.input, resize: 'vertical' } : {}}
        />
        <Ayuda />
        <ErrorMsg />
      </div>
    );
  }

  if (campo.tipo === 'select') {
    return (
      <div>
        <Label />
        <select
          {...register(campo.id, registerOptions)}
          className={dark ? 'arcop-input-dark' : inputClass}
          style={dark ? { ...s.input, cursor: 'pointer' } : {}}
        >
          <option value="" style={dark ? { background: '#1C1C28', color: '#9090A8' } : {}}>
            — Seleccione —
          </option>
          {(campo.opciones || []).map(op => (
            <option
              key={op.value}
              value={op.value}
              style={dark ? { background: '#1C1C28', color: '#F0F0F5' } : {}}
            >
              {op.label}
            </option>
          ))}
        </select>
        <Ayuda />
        <ErrorMsg />
      </div>
    );
  }

  if (campo.tipo === 'radio') {
    const watched = watch?.(campo.id);
    return (
      <div>
        <Label />
        <div style={{ display: 'flex', flexDirection: 'column', gap: dark ? '6px' : '8px' }}>
          {(campo.opciones || []).map(op => (
            dark ? (
              <label key={op.value} style={s.radioItem}>
                <input
                  {...register(campo.id, registerOptions)}
                  type="radio"
                  value={op.value}
                  style={{ marginTop: '2px', accentColor: '#6366F1', flexShrink: 0 }}
                />
                <span style={s.radioLabel}>{op.label}</span>
              </label>
            ) : (
              <label key={op.value} className="flex items-start p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  {...register(campo.id, registerOptions)}
                  type="radio"
                  value={op.value}
                  className="w-4 h-4 text-blue-600 mt-0.5"
                />
                <span className="ml-3 text-sm text-gray-800">{op.label}</span>
              </label>
            )
          ))}
        </div>

        {campo.id === 'alcance_acceso' && watched === 'ESPECIFICO' && (
          dark ? (
            <div style={s.catGrid}>
              <p style={s.catLabel}>Seleccione las categorías</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {CATEGORIAS_DATOS.map(cat => (
                  <label key={cat.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      {...register('categorias')}
                      type="checkbox"
                      value={cat.value}
                      style={{ accentColor: '#6366F1' }}
                    />
                    <span style={s.catItem}>{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-3 bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Seleccione las categorías</p>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIAS_DATOS.map(cat => (
                  <label key={cat.value} className="flex items-center gap-2 cursor-pointer">
                    <input {...register('categorias')} type="checkbox" value={cat.value} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )
        )}
        <Ayuda />
        <ErrorMsg />
      </div>
    );
  }

  if (campo.tipo === 'checkbox_single') {
    return (
      <div>
        {dark ? (
          <label style={s.checkItem}>
            <input
              {...register(campo.id, registerOptions)}
              type="checkbox"
              style={{ width: '15px', height: '15px', marginTop: '2px', accentColor: '#6366F1', flexShrink: 0 }}
            />
            <div>
              <span style={s.checkLabel}>{campo.label}</span>
              {campo.ayuda && <p style={s.checkAyuda}>{campo.ayuda}</p>}
            </div>
          </label>
        ) : (
          <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              {...register(campo.id, registerOptions)}
              type="checkbox"
              className="w-4 h-4 text-blue-600 rounded mt-0.5"
            />
            <div>
              <span className="text-sm font-medium text-gray-800">{campo.label}</span>
              {campo.ayuda && <p className="text-xs text-gray-500 mt-0.5">{campo.ayuda}</p>}
            </div>
          </label>
        )}
        <ErrorMsg />
      </div>
    );
  }

  // Fallback
  return (
    <div>
      <Label />
      <input
        {...register(campo.id, registerOptions)}
        type="text"
        className={dark ? 'arcop-input-dark' : inputClass}
        style={dark ? s.input : {}}
      />
      <Ayuda />
      <ErrorMsg />
    </div>
  );
};

export default CampoRenderer;