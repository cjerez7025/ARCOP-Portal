import React, { useState, useEffect } from 'react';
import {
  Building2, User, Palette, Clock, Settings, FileText,
  Save, RotateCcw, Loader, AlertCircle, GitBranch,
  Mail, Phone, Globe, Eye, EyeOff,
  Download, Shield, Database
} from 'lucide-react';

import {
  obtenerConfiguracion, guardarConfiguracion,
  restaurarConfiguracion, exportarConfiguracion
} from '../services/configuracionService';
import { toast } from 'react-toastify';

import TabFormularios      from '../components/TabFormularios';
import TabFlujos           from '../components/TabFlujos';
import useFormularioConfig from '../hooks/useFormularioConfig';
import useFlujoConfig      from '../hooks/useFlujoConfig';
import TabDerechos from '../components/TabDerechos';

// ── Helpers UI ────────────────────────────────────────────
const Campo = ({ label, ayuda, obligatorio, children, fullWidth }) => (
  <div className={fullWidth ? 'md:col-span-2' : ''}>
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      {label}{obligatorio && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {ayuda && <p className="text-xs text-gray-400 mt-1">{ayuda}</p>}
  </div>
);

const Input = ({ value, onChange, placeholder, type = 'text', readOnly }) => (
  <input type={type} value={value || ''} onChange={e => onChange?.(e.target.value)}
    placeholder={placeholder} readOnly={readOnly}
    className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
      ${readOnly ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                 : 'focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'}`} />
);

const Seccion = ({ titulo, descripcion, children }) => (
  <div className="space-y-4">
    <div className="border-b border-gray-100 pb-2">
      <h3 className="text-base font-bold text-gray-800">{titulo}</h3>
      {descripcion && <p className="text-xs text-gray-500 mt-0.5">{descripcion}</p>}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
  </div>
);

// ── TAB EMPRESA ───────────────────────────────────────────
const TabEmpresa = ({ config, onChange }) => (
  <div className="space-y-8">
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">🏢 Datos de la Empresa</h2>
      <p className="text-sm text-gray-500">
        Información legal que aparece en los emails enviados a los titulares y en el portal público.
      </p>
    </div>

    <Seccion titulo="Identificación legal" descripcion="Datos obligatorios según Art. 11 Ley 21.719">
      <Campo label="Nombre de la empresa" obligatorio>
        <Input value={config.empresa_nombre} onChange={v => onChange('empresa_nombre', v)}
          placeholder="Ej: ARCOP Consultores SpA" />
      </Campo>
      <Campo label="RUT empresa" obligatorio>
        <Input value={config.empresa_rut} onChange={v => onChange('empresa_rut', v)}
          placeholder="Ej: 12.345.678-9" />
      </Campo>
      <Campo label="Razón social" ayuda="Nombre legal completo">
        <Input value={config.empresa_razon_social} onChange={v => onChange('empresa_razon_social', v)}
          placeholder="Ej: ARCOP Consultores SpA" />
      </Campo>
      <Campo label="Dirección">
        <Input value={config.empresa_direccion} onChange={v => onChange('empresa_direccion', v)}
          placeholder="Ej: Av. Providencia 1234, Santiago" />
      </Campo>
    </Seccion>

    <Seccion titulo="Contacto público" descripcion="Visible para los titulares de datos">
      <Campo label="Teléfono">
        <Input value={config.empresa_telefono} onChange={v => onChange('empresa_telefono', v)}
          placeholder="+56 2 2345 6789" />
      </Campo>
      <Campo label="Email de contacto">
        <Input type="email" value={config.empresa_email} onChange={v => onChange('empresa_email', v)}
          placeholder="contacto@empresa.cl" />
      </Campo>
      <Campo label="Sitio web" ayuda="URL completa incluyendo https://" fullWidth>
        <Input value={config.empresa_web} onChange={v => onChange('empresa_web', v)}
          placeholder="https://empresa.cl" />
      </Campo>
    </Seccion>

    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Vista previa — pie de email</p>
      <div className="bg-white rounded-lg border border-blue-100 p-4 text-xs text-gray-600 space-y-1">
        <p className="font-bold text-gray-800">{config.empresa_nombre || 'Nombre de empresa'}</p>
        <p>RUT: {config.empresa_rut || '12.345.678-9'}</p>
        <p>📧 {config.empresa_email || 'contacto@empresa.cl'} · 📞 {config.empresa_telefono || '+56 2 2345 6789'}</p>
        <p className="text-blue-600">{config.empresa_web || 'https://empresa.cl'}</p>
      </div>
    </div>
  </div>
);

// ── TAB DPO ───────────────────────────────────────────────
const TabDPO = ({ config, onChange }) => (
  <div className="space-y-8">
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">👤 Delegado de Protección de Datos</h2>
      <p className="text-sm text-gray-500">
        El DPO gestiona los derechos ARCOP. Sus datos aparecen en las notificaciones y están disponibles para los titulares.
      </p>
    </div>

    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
      <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-800">Obligación legal — Art. 30 Ley 21.719</p>
        <p className="text-xs text-amber-700 mt-0.5">
          La organización debe designar un DPO y publicar sus datos de contacto. El email es obligatorio y debe ser accesible para los titulares.
        </p>
      </div>
    </div>

    <Seccion titulo="Datos del DPO">
      <Campo label="Nombre completo" obligatorio>
        <Input value={config.dpo_nombre} onChange={v => onChange('dpo_nombre', v)}
          placeholder="Ej: María González Torres" />
      </Campo>
      <Campo label="Cargo">
        <Input value={config.dpo_cargo} onChange={v => onChange('dpo_cargo', v)}
          placeholder="Ej: Delegada de Protección de Datos" />
      </Campo>
      <Campo label="Email DPO" obligatorio ayuda="Recibe todas las notificaciones del sistema">
        <Input type="email" value={config.dpo_email} onChange={v => onChange('dpo_email', v)}
          placeholder="dpo@empresa.cl" />
      </Campo>
      <Campo label="Teléfono DPO">
        <Input value={config.dpo_telefono} onChange={v => onChange('dpo_telefono', v)}
          placeholder="+56 9 8765 4321" />
      </Campo>
      <Campo label="Horario de atención" ayuda="Visible en el portal público" fullWidth>
        <Input value={config.dpo_horario} onChange={v => onChange('dpo_horario', v)}
          placeholder="Ej: Lunes a Viernes, 9:00 - 18:00 hrs" />
      </Campo>
    </Seccion>

    <Seccion titulo="Notificaciones" descripcion="Alertas que recibe el DPO">
      <Campo label="Email copia (CC)" ayuda="Correo adicional que recibe copia de todas las notificaciones">
        <Input type="email" value={config.email_cc} onChange={v => onChange('email_cc', v)}
          placeholder="supervisor@empresa.cl" />
      </Campo>
      <Campo label="Notificaciones">
        <select value={config.notif_activas || 'SI'}
          onChange={e => onChange('notif_activas', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
          <option value="SI">✅ Activadas — todas las alertas</option>
          <option value="CRITICAS">⚠️ Solo críticas — vencimientos y errores</option>
          <option value="NO">⛔ Desactivadas — sin alertas</option>
        </select>
      </Campo>
    </Seccion>

    {/* Card preview */}
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Vista previa — tarjeta DPO en portal</p>
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{config.dpo_nombre || 'Nombre del DPO'}</p>
            <p className="text-xs text-gray-500">{config.dpo_cargo || 'Delegado de Protección de Datos'}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{config.dpo_email || 'dpo@empresa.cl'}</span>
              {config.dpo_telefono && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{config.dpo_telefono}</span>}
              {config.dpo_horario  && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{config.dpo_horario}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ── TAB BRANDING ──────────────────────────────────────────
const TabBranding = ({ config, onChange }) => {
  const [verLogo, setVerLogo] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">🎨 Apariencia del Portal</h2>
        <p className="text-sm text-gray-500">
          Personaliza el nombre, colores y logo del portal público que ven los titulares.
        </p>
      </div>

      <Seccion titulo="Identidad del portal">
        <Campo label="Nombre del portal" ayuda="Aparece en el encabezado y en los emails">
          <Input value={config.portal_nombre} onChange={v => onChange('portal_nombre', v)}
            placeholder="Portal ARCOP" />
        </Campo>
        <Campo label="URL pública" ayuda="Usada en los links de validación de identidad">
          <Input value={config.portal_url} onChange={v => onChange('portal_url', v)}
            placeholder="https://arcop.miempresa.cl" />
        </Campo>
      </Seccion>

      <Seccion titulo="Colores corporativos">
        <Campo label="Color principal" ayuda="Botones, cabeceras y elementos destacados">
          <div className="flex items-center gap-3">
            <input type="color" value={config.portal_color || '#2563eb'}
              onChange={e => onChange('portal_color', e.target.value)}
              className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5 flex-shrink-0" />
            <Input value={config.portal_color || '#2563eb'}
              onChange={v => onChange('portal_color', v)} placeholder="#2563eb" />
          </div>
        </Campo>
        <Campo label="Color secundario" ayuda="Hover y elementos de apoyo">
          <div className="flex items-center gap-3">
            <input type="color" value={config.portal_color_secundario || '#1e40af'}
              onChange={e => onChange('portal_color_secundario', e.target.value)}
              className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5 flex-shrink-0" />
            <Input value={config.portal_color_secundario || '#1e40af'}
              onChange={v => onChange('portal_color_secundario', v)} placeholder="#1e40af" />
          </div>
        </Campo>
      </Seccion>

      <div className="space-y-3">
        <div className="border-b border-gray-100 pb-2">
          <h3 className="text-base font-bold text-gray-800">Logo</h3>
          <p className="text-xs text-gray-500 mt-0.5">URL pública de la imagen (PNG o SVG, fondo transparente recomendado)</p>
        </div>
        <Campo label="URL del logo">
          <div className="flex gap-2">
            <Input value={config.logo_url} onChange={v => onChange('logo_url', v)}
              placeholder="https://empresa.cl/logo.png" />
            <button onClick={() => setVerLogo(!verLogo)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 flex-shrink-0">
              {verLogo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Campo>
        {verLogo && config.logo_url && (
          <div className="p-4 bg-gray-100 rounded-xl flex items-center justify-center" style={{ minHeight: 80 }}>
            <img src={config.logo_url} alt="Logo preview" className="max-h-16 max-w-full object-contain"
              onError={e => { e.target.style.display = 'none'; }} />
          </div>
        )}
      </div>

      {/* Preview del portal */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Vista previa — encabezado del portal</p>
        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 px-5 py-4"
               style={{ background: config.portal_color || '#2563eb' }}>
            {config.logo_url
              ? <img src={config.logo_url} alt="Logo" className="h-8 object-contain"
                     onError={e => { e.target.style.display = 'none'; }} />
              : <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
            }
            <div>
              <p className="font-bold text-white text-sm">{config.portal_nombre || 'Portal ARCOP'}</p>
              <p className="text-white/70 text-xs">Ley 21.719 · Derechos ARCOP</p>
            </div>
          </div>
          <div className="bg-white px-5 py-4 border-t border-gray-100">
            <div className="flex gap-2 flex-wrap">
              {['Acceso', 'Rectificación', 'Cancelación', 'Oposición', 'Portabilidad'].map(d => (
                <span key={d} className="px-3 py-1 text-xs font-medium text-white rounded-full"
                      style={{ background: config.portal_color || '#2563eb' }}>
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── TAB PLAZOS ────────────────────────────────────────────
const TabPlazos = ({ config, onChange }) => {
  const diasResp  = parseInt(config.dias_respuesta)  || 15;
  const diasAlert = parseInt(config.dias_alerta)     || 3;
  const diasValid = parseInt(config.dias_validacion) || 5;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">⏱️ Plazos y Tiempos</h2>
        <p className="text-sm text-gray-500">
          El plazo legal base es 15 días hábiles (Art. 11 Ley 21.719). Puedes ser más ágil pero no superar ese límite.
        </p>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          <strong>Plazo legal máximo: 15 días hábiles.</strong> Si la organización no responde en ese plazo,
          el titular puede reclamar ante la Agencia de Protección de Datos Personales.
        </p>
      </div>

      <div className="space-y-6">
        {/* Días respuesta */}
        <div className="p-4 border border-gray-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Días para responder una solicitud</p>
              <p className="text-xs text-gray-400 mt-0.5">Días hábiles desde la validación de identidad</p>
            </div>
            <div className="text-right">
              <span className={`text-3xl font-bold ${diasResp > 15 ? 'text-red-600' : 'text-blue-600'}`}>{diasResp}</span>
              <p className="text-xs text-gray-400">días hábiles</p>
            </div>
          </div>
          <input type="range" min="5" max="30" step="1" value={diasResp}
            onChange={e => onChange('dias_respuesta', e.target.value)}
            className="w-full accent-blue-600" />
          <div className="flex justify-between text-xs text-gray-400">
            <span>5 días (muy ágil)</span>
            <span className={diasResp > 15 ? 'text-red-500 font-semibold' : 'text-green-600 font-semibold'}>
              {diasResp > 15 ? '⚠️ Supera el límite legal' : '✅ Dentro del límite legal'}
            </span>
            <span>30 días</span>
          </div>
        </div>

        {/* Días alerta */}
        <div className="p-4 border border-gray-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Días de alerta antes del vencimiento</p>
              <p className="text-xs text-gray-400 mt-0.5">El DPO recibe alerta cuando quedan estos días</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-orange-500">{diasAlert}</span>
              <p className="text-xs text-gray-400">días antes</p>
            </div>
          </div>
          <input type="range" min="1" max="10" step="1" value={diasAlert}
            onChange={e => onChange('dias_alerta', e.target.value)}
            className="w-full accent-orange-500" />
        </div>

        {/* Días validación */}
        <div className="p-4 border border-gray-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Días para validar identidad</p>
              <p className="text-xs text-gray-400 mt-0.5">Si el titular no valida en este plazo, la solicitud se cancela</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-purple-500">{diasValid}</span>
              <p className="text-xs text-gray-400">días</p>
            </div>
          </div>
          <input type="range" min="1" max="15" step="1" value={diasValid}
            onChange={e => onChange('dias_validacion', e.target.value)}
            className="w-full accent-purple-500" />
        </div>

        {/* Zona horaria */}
        <div className="p-4 border border-gray-200 rounded-xl">
          <p className="text-sm font-semibold text-gray-800 mb-3">Zona horaria</p>
          <select value={config.timezone || 'America/Santiago'}
            onChange={e => onChange('timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
            <option value="America/Santiago">🇨🇱 America/Santiago (Chile)</option>
            <option value="America/Bogota">🇨🇴 America/Bogota (Colombia)</option>
            <option value="America/Lima">🇵🇪 America/Lima (Perú)</option>
            <option value="America/Argentina/Buenos_Aires">🇦🇷 America/Buenos_Aires (Argentina)</option>
            <option value="America/Mexico_City">🇲🇽 America/Mexico_City (México)</option>
          </select>
        </div>
      </div>

      {/* Línea de tiempo visual */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Línea de tiempo de una solicitud</p>
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
          <div className="flex items-end gap-1">
            {[
              { dia: 0,                   label: 'Solicitud',  color: '#2563eb' },
              { dia: diasValid,           label: 'Validación', color: '#8B5CF6' },
              { dia: diasResp - diasAlert,label: 'Alerta DPO', color: '#F97316' },
              { dia: diasResp,            label: 'Límite',     color: diasResp > 15 ? '#EF4444' : '#10B981' },
            ].map((punto, i, arr) => {
              const pct = diasResp > 0 ? (punto.dia / diasResp) * 100 : 0;
              return (
                <div key={i} className="flex flex-col items-center" style={{ marginLeft: i > 0 ? `${pct - (arr[i-1].dia/diasResp*100)}%` : '0', flex: '0 0 auto' }}>
                  <p className="text-xs text-gray-500 mb-1 whitespace-nowrap">{punto.label}</p>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                       style={{ background: punto.color }}>{punto.dia}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 h-2 bg-gray-200 rounded-full relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 rounded-full"
                 style={{ width: `${Math.min((diasResp/30)*100, 100)}%`,
                          background: `linear-gradient(to right, #2563eb, #8B5CF6, #F97316, ${diasResp > 15 ? '#EF4444' : '#10B981'})` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── TAB AVANZADO ──────────────────────────────────────────
const TabAvanzado = ({ config, onRestaurar, onExportar }) => (
  <div className="space-y-8">
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">⚙️ Configuración Avanzada</h2>
      <p className="text-sm text-gray-500">
        Herramientas de administración, respaldos y mantenimiento del sistema.
      </p>
    </div>

    {/* Métricas del sistema */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <Database className="w-5 h-5 text-blue-600 mb-2" />
        <p className="text-xs text-gray-500 font-medium">Versión del sistema</p>
        <p className="text-xl font-bold text-blue-700 mt-0.5">{config.version || '1.0.0'}</p>
      </div>
      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
        <Shield className="w-5 h-5 text-green-600 mb-2" />
        <p className="text-xs text-gray-500 font-medium">Ley aplicable</p>
        <p className="text-xl font-bold text-green-700 mt-0.5">Ley 21.719</p>
      </div>
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
        <Clock className="w-5 h-5 text-purple-600 mb-2" />
        <p className="text-xs text-gray-500 font-medium">Zona horaria activa</p>
        <p className="text-xl font-bold text-purple-700 mt-0.5">{(config.timezone || 'America/Santiago').split('/')[1] || 'Santiago'}</p>
      </div>
    </div>

    {/* Exportar */}
    <div className="border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Download className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-gray-800">Exportar configuración</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Descarga un archivo JSON con toda la configuración actual. Útil como respaldo antes de cambios importantes.
            </p>
          </div>
        </div>
        <button onClick={onExportar}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-700 text-sm font-medium flex-shrink-0">
          <Download className="w-4 h-4" /> Exportar JSON
        </button>
      </div>
    </div>

    {/* Restaurar */}
    <div className="border border-amber-200 rounded-xl p-5 bg-amber-50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <RotateCcw className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-800">Restaurar valores predeterminados</h3>
            <p className="text-xs text-amber-700 mt-0.5">
              Restablece empresa, DPO, branding y plazos a los valores de fábrica.
              <strong className="ml-1">Esta acción no puede deshacerse.</strong>
            </p>
          </div>
        </div>
        <button onClick={onRestaurar}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 text-sm font-medium flex-shrink-0">
          <RotateCcw className="w-4 h-4" /> Restaurar
        </button>
      </div>
    </div>

    {/* Marco legal */}
    <div className="border border-blue-200 rounded-xl p-5 bg-blue-50">
      <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4" /> Marco legal de referencia
      </h3>
      <div className="space-y-2 text-xs text-blue-800">
        {[
          ['Ley 21.719',         'Ley Marco de Datos Personales de Chile'],
          ['Vigencia',           'En vigor desde el 1 de diciembre de 2026'],
          ['Autoridad',          'Agencia de Protección de Datos Personales (APDP)'],
          ['Multas graves',      'Hasta 5.000 UTM por infracciones (Art. 48)'],
          ['Plazo ARCOP',        '15 días hábiles máximo para responder (Art. 11)'],
          ['Registro de DPO',    'Obligatorio designar y publicar datos del DPO (Art. 30)'],
        ].map(([titulo, desc]) => (
          <p key={titulo}>• <strong>{titulo}</strong> — {desc}</p>
        ))}
      </div>
    </div>
  </div>
);

// ── Componente principal ──────────────────────────────────
const Configuracion = () => {
  const [loading,           setLoading]           = useState(true);
  const [guardando,         setGuardando]          = useState(false);
  const [tabActiva,         setTabActiva]          = useState('empresa');
  const [config,            setConfig]             = useState({});
  const [cambiosPendientes, setCambiosPendientes]  = useState(false);

  const formularioHook = useFormularioConfig();
  const flujoHook      = useFlujoConfig();

  useEffect(() => { cargarConfiguracion(); }, []);

  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      const result = await obtenerConfiguracion();
      if (result.status === 'success') setConfig(result.data);
      else toast.error('Error al cargar configuración');
    } catch { toast.error('Error al cargar configuración'); }
    finally   { setLoading(false); }
  };

  const handleChange = (campo, valor) => {
    setConfig(prev => ({ ...prev, [campo]: valor }));
    setCambiosPendientes(true);
  };

  const handleGuardar = async () => {
    if (!config.empresa_nombre?.trim() || !config.dpo_email?.trim()) {
      toast.error('Completa los campos obligatorios: Nombre empresa y Email DPO');
      return;
    }
    try {
      setGuardando(true);
      const result = await guardarConfiguracion(config);
      if (result.status === 'success') {
        toast.success('✅ Configuración guardada correctamente');
        setCambiosPendientes(false);
        await cargarConfiguracion();
      } else toast.error('Error al guardar: ' + (result.message || ''));
    } catch { toast.error('Error al guardar configuración'); }
    finally   { setGuardando(false); }
  };

  const handleRestaurar = async () => {
    if (!window.confirm('¿Restaurar la configuración a valores predeterminados? No puede deshacerse.')) return;
    try {
      setGuardando(true);
      const result = await restaurarConfiguracion();
      if (result.status === 'success') {
        toast.success('✅ Configuración restaurada');
        setCambiosPendientes(false);
        await cargarConfiguracion();
      } else toast.error('Error al restaurar: ' + (result.message || ''));
    } catch { toast.error('Error al restaurar configuración'); }
    finally   { setGuardando(false); }
  };

  const handleExportar = async () => {
    try { await exportarConfiguracion(); toast.success('✅ Configuración exportada'); }
    catch { toast.error('Error al exportar'); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader className="w-12 h-12 text-blue-600 animate-spin" />
    </div>
  );

const tabs = [
  { id: 'empresa',  nombre: 'Empresa',  icono: Building2 },
  { id: 'dpo',      nombre: 'DPO',      icono: User      },
  { id: 'branding', nombre: 'Branding', icono: Palette   },
  { id: 'plazos',   nombre: 'Plazos',   icono: Clock     },
  { id: 'derechos', nombre: 'Derechos', icono: Shield    },
  { id: 'avanzado', nombre: 'Avanzado', icono: Settings  },
];

const tabsSimples = ['empresa', 'dpo', 'branding', 'plazos'];
  const tabActivaEsSimple = tabsSimples.includes(tabActiva);
  const flujoDirty       = flujoHook?.dirty;
  const formularioDirty  = formularioHook?.dirty;
  const derechosDirty    = tabActiva === 'derechos' && (flujoDirty || formularioDirty);

  const handleGuardarDerechos = async () => {
    try {
      if (flujoDirty)      await flujoHook.guardar();
      if (formularioDirty) await formularioHook.guardar();
    } catch (e) {
      toast.error('Error al guardar derechos: ' + (e.message || ''));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-3xl font-bold text-gray-900 mb-6">⚙️ Configuración del Sistema</h1>

        {cambiosPendientes && tabActivaEsSimple && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-yellow-700 text-sm">Tienes cambios sin guardar</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex overflow-x-auto">
              {tabs.map(tab => {
                const Icono = tab.icono;
                return (
                  <button key={tab.id} onClick={() => setTabActiva(tab.id)}
                    className={`flex items-center gap-2 px-5 py-4 font-medium border-b-2 transition-colors whitespace-nowrap text-sm ${
                      tabActiva === tab.id
                        ? 'border-blue-600 text-blue-600 bg-white'
                        : 'border-transparent text-gray-600 hover:bg-gray-100'}`}>
                    <Icono className="w-4 h-4" />
                    {tab.nombre}

                  </button>
                );
              })}
            </div>
          </div>

          {/* Contenido */}
          <div className="p-8">
            {tabActiva === 'empresa'     && <TabEmpresa   config={config} onChange={handleChange} />}
            {tabActiva === 'dpo'         && <TabDPO       config={config} onChange={handleChange} />}
            {tabActiva === 'branding'    && <TabBranding  config={config} onChange={handleChange} />}
            {tabActiva === 'plazos'      && <TabPlazos    config={config} onChange={handleChange} />}
            {tabActiva === 'avanzado'    && <TabAvanzado  config={config} onRestaurar={handleRestaurar} onExportar={handleExportar} />}
            {tabActiva === 'derechos'    && <TabDerechos  formularioHook={formularioHook} flujoHook={flujoHook} />}
          </div>

          {/* Footer */}
          {/* Footer */}
          <div className="border-t border-gray-200 px-8 py-5 bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-yellow-600">
              {((cambiosPendientes && tabActivaEsSimple) || derechosDirty) && (
                <span className="flex items-center gap-1"><AlertCircle className="w-4 h-4" />Cambios sin guardar</span>
              )}
            </div>

            <div>
              {tabActivaEsSimple && (
                <button onClick={handleGuardar} disabled={guardando || !cambiosPendientes}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl disabled:opacity-50 hover:bg-blue-700 text-sm font-semibold">
                  {guardando ? <><Loader className="w-4 h-4 animate-spin" />Guardando...</>
                             : <><Save className="w-4 h-4" />Guardar cambios</>}
                </button>
              )}
              {tabActiva === 'derechos' && (
                <button onClick={handleGuardarDerechos}
                  disabled={flujoHook?.guardando || formularioHook?.guardando || !derechosDirty}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl disabled:opacity-50 hover:bg-blue-700 text-sm font-semibold">
                  {(flujoHook?.guardando || formularioHook?.guardando)
                    ? <><Loader className="w-4 h-4 animate-spin" />Guardando...</>
                    : <><Save className="w-4 h-4" />Guardar cambios</>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;