// ============================================================
// CAMPO RENDERER
// Renderiza un campo del formulario según su tipo.
// Agnóstico del derecho — solo necesita la definición del campo.
// ============================================================

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { CATEGORIAS_DATOS } from '../utils/constants';

const inputClass = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm';
const errorClass = 'mt-1 text-sm text-red-600 flex items-center gap-1';

const CampoRenderer = ({ campo, register, watch, setValue, errors }) => {
  const error = errors?.[campo.id];

  const label = (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {campo.label}
      {campo.obligatorio && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  const ayuda = campo.ayuda
    ? <p className="text-xs text-gray-500 mt-1">{campo.ayuda}</p>
    : null;

  const errorMsg = error
    ? <p className={errorClass}><AlertCircle className="w-4 h-4" />{error.message || 'Campo requerido'}</p>
    : null;

  const registerOptions = campo.obligatorio
    ? { required: `${campo.label} es obligatorio` }
    : {};

  // ── Tipos ──────────────────────────────────────────────

  if (campo.tipo === 'text' || campo.tipo === 'email' || campo.tipo === 'tel') {
    return (
      <div>
        {label}
        <input
          {...register(campo.id, registerOptions)}
          type={campo.tipo}
          placeholder={campo.placeholder || ''}
          className={inputClass}
        />
        {ayuda}
        {errorMsg}
      </div>
    );
  }

  if (campo.tipo === 'rut') {
    return (
      <div>
        {label}
        <input
          {...register(campo.id, registerOptions)}
          type="text"
          placeholder={campo.placeholder || '12.345.678-9'}
          maxLength={12}
          className={inputClass}
          onChange={(e) => {
            // Formateo RUT inline
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
        {ayuda}
        {errorMsg}
      </div>
    );
  }

  if (campo.tipo === 'textarea') {
    return (
      <div>
        {label}
        <textarea
          {...register(campo.id, registerOptions)}
          rows={3}
          placeholder={campo.placeholder || ''}
          className={inputClass}
        />
        {ayuda}
        {errorMsg}
      </div>
    );
  }

  if (campo.tipo === 'select') {
    return (
      <div>
        {label}
        <select {...register(campo.id, registerOptions)} className={inputClass}>
          <option value="">— Seleccione —</option>
          {(campo.opciones || []).map(op => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
        {ayuda}
        {errorMsg}
      </div>
    );
  }

  if (campo.tipo === 'radio') {
    const watched = watch?.(campo.id);
    return (
      <div>
        {label}
        <div className="space-y-2">
          {(campo.opciones || []).map(op => (
            <label key={op.value} className="flex items-start p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                {...register(campo.id, registerOptions)}
                type="radio"
                value={op.value}
                className="w-4 h-4 text-blue-600 mt-0.5"
              />
              <span className="ml-3 text-sm text-gray-800">{op.label}</span>
            </label>
          ))}
        </div>
        {/* Campo especial: si el radio es alcance_acceso y vale ESPECIFICO → mostrar categorías */}
        {campo.id === 'alcance_acceso' && watched === 'ESPECIFICO' && (
          <div className="mt-3 bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Seleccione las categorías</p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIAS_DATOS.map(cat => (
                <label key={cat.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    {...register('categorias')}
                    type="checkbox"
                    value={cat.value}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        {ayuda}
        {errorMsg}
      </div>
    );
  }

  if (campo.tipo === 'checkbox_single') {
    return (
      <div>
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
        {errorMsg}
      </div>
    );
  }

  // Fallback
  return (
    <div>
      {label}
      <input {...register(campo.id, registerOptions)} type="text" className={inputClass} />
      {ayuda}{errorMsg}
    </div>
  );
};

export default CampoRenderer;