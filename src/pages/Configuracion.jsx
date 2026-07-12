import React, { useState, useEffect, useRef } from 'react';
import {
  Building2, User, Palette, Clock, Settings, FileText,
  Save, RotateCcw, Loader, AlertCircle, GitBranch,
  Mail, Phone, Globe, Eye, EyeOff,
  Download, Shield, Database, Upload, Wand2, Layout,
} from 'lucide-react';
import adapter from '../adapters';
import httpAdapter from '../adapters/httpAdapter';
import { cargarBranding } from '../services/brandingService';

import {
  obtenerConfiguracion, guardarConfiguracion,
  restaurarConfiguracion, exportarConfiguracion
} from '../services/configuracionService';
import { toast } from 'react-toastify';

import TabFormularios      from '../components/TabFormularios';
import TabFlujos           from '../components/TabFlujos';
import useFormularioConfig from '../hooks/useFormularioConfig';
import useFlujoConfig      from '../hooks/useFlujoConfig';
import TabDerechos         from '../components/TabDerechos';
import TabImportar         from '../components/TabImportar';

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

// ── WCAG helpers ─────────────────────────────────────────
function _lum(hex) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return 0;
  const toL = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * toL(parseInt(hex.slice(1,3),16)) +
         0.7152 * toL(parseInt(hex.slice(3,5),16)) +
         0.0722 * toL(parseInt(hex.slice(5,7),16));
}
function contrastRatio(h1, h2) {
  const [li, da] = [Math.max(_lum(h1), _lum(h2)), Math.min(_lum(h1), _lum(h2))];
  return (li + 0.05) / (da + 0.05);
}
const WcagBadge = ({ c1, c2, label }) => {
  if (!c1 || !c2) return null;
  const ratio = contrastRatio(c1, c2);
  const pass  = ratio >= 4.5;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '4px 0' }}>
      <span style={{ fontWeight: 700, color: pass ? '#16a34a' : '#dc2626', minWidth: 60 }}>
        {pass ? '✅' : '⚠️'} {ratio.toFixed(2)}:1
      </span>
      <span style={{ color: '#6b7280' }}>{label} — {pass ? 'WCAG AA ✓' : 'No cumple AA'}</span>
    </div>
  );
};

const FUENTES = ['Inter','Roboto','Open Sans','Lato','Montserrat','Poppins','Raleway','DM Sans','Plus Jakarta Sans'];

// ── TAB IDENTIDAD VISUAL ──────────────────────────────────
const TabIdentidadVisual = ({ config, onChange }) => {
  const [subTab,            setSubTab]            = useState('manual');
  const [guardando,         setGuardando]          = useState(false);
  const [extrayendo,        setExtrayendo]         = useState(false);
  const [urlExtraccion,     setUrlExtraccion]      = useState('');
  const [resultadoExt,      setResultadoExt]       = useState(null);
  const [templates,         setTemplates]          = useState([]);
  const [cargandoTemplates, setCargandoTemplates]  = useState(false);
  const [verLogo,           setVerLogo]            = useState(false);
  const [uploadingLogo,     setUploadingLogo]      = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (subTab === 'templates' && templates.length === 0) _cargarTemplates();
  }, [subTab]);

  const _cargarTemplates = async () => {
    setCargandoTemplates(true);
    const r = await httpAdapter.getBrandingTemplates();
    if (r.status === 'success') setTemplates(r.data || []);
    setCargandoTemplates(false);
  };

  const handleLogoUpload = async (file) => {
    if (file.size > 2 * 1024 * 1024) { toast.error('El logo no puede superar 2 MB'); return; }
    setUploadingLogo(true);
    const result = await adapter.uploadLogo(file);
    setUploadingLogo(false);
    if (result.status !== 'success') { toast.error('Error al subir el logo'); return; }
    onChange('logo_url', result.data.url);
    setVerLogo(true);
    toast.success('Logo subido correctamente');
  };

  const handleGuardar = async () => {
    const payload = {
      color_primario:      config.color_primario,
      color_secundario:    config.color_secundario,
      color_fondo:         config.color_fondo,
      color_texto:         config.color_texto,
      card_estilo:         config.card_estilo,
      card_radio:          config.card_radio,
      card_sombra:         config.card_sombra,
      fuente_titulo:       config.fuente_titulo,
      fuente_cuerpo:       config.fuente_cuerpo,
      logo_url:            config.logo_url,
      portal_nombre:       config.portal_nombre,
      aplicar_branding_dpo: config.aplicar_branding_dpo,
    };
    setGuardando(true);
    const r = await httpAdapter.saveBranding(payload);
    setGuardando(false);
    if (r.status === 'success') {
      toast.success('✅ Identidad visual guardada');
      await cargarBranding();
    } else {
      toast.error(r.message || 'Error al guardar branding');
    }
  };

  const handleExtraer = async () => {
    if (!urlExtraccion.trim()) { toast.error('Ingresa una URL'); return; }
    setExtrayendo(true);
    setResultadoExt(null);
    const r = await httpAdapter.extractBrandingFromUrl(urlExtraccion.trim());
    setExtrayendo(false);
    if (r.status === 'success') setResultadoExt(r.data);
    else toast.error(r.message || 'No se pudo extraer el branding');
  };

  const aplicarSugerido = () => {
    if (!resultadoExt?.sugerido) return;
    const s = resultadoExt.sugerido;
    if (s.color_primario)   onChange('color_primario',   s.color_primario);
    if (s.color_secundario) onChange('color_secundario', s.color_secundario);
    if (s.fuente_titulo)    onChange('fuente_titulo',    s.fuente_titulo);
    if (resultadoExt.logo_url) onChange('logo_url', resultadoExt.logo_url);
    toast.success('Sugerencias aplicadas — guarda para confirmar');
    setSubTab('manual');
  };

  const aplicarTemplate = (tpl) => {
    ['color_primario','color_secundario','color_fondo','color_texto',
     'card_estilo','card_radio','card_sombra','fuente_titulo','fuente_cuerpo'].forEach(k => {
      if (tpl[k] !== undefined) onChange(k, tpl[k]);
    });
    toast.success(`Plantilla "${tpl.nombre}" aplicada — guarda para confirmar`);
    setSubTab('manual');
  };

  const cp = config.color_primario   || '#2563eb';
  const cs = config.color_secundario || '#1e40af';
  const cf = config.color_fondo      || '#f8fafc';
  const ct = config.color_texto      || '#1e293b';

  const SUB_TABS = [
    { id: 'manual',    label: 'Manual',    Icon: Wand2  },
    { id: 'web',       label: 'Desde Web', Icon: Globe  },
    { id: 'templates', label: 'Plantillas', Icon: Layout },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">🎨 Identidad Visual</h2>
        <p className="text-sm text-gray-500">Personaliza colores, tipografía y estilo del portal público.</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {SUB_TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setSubTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              subTab === id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── Manual ── */}
      {subTab === 'manual' && (
        <div className="space-y-8">
          <Seccion titulo="Identidad del portal">
            <Campo label="Nombre del portal" ayuda="Aparece en el encabezado y en los emails">
              <Input value={config.portal_nombre} onChange={v => onChange('portal_nombre', v)} placeholder="Portal ARCOP" />
            </Campo>
            <Campo label="URL del logo" ayuda="PNG, SVG o JPG · máx. 2 MB · fondo transparente recomendado">
              <div className="flex gap-2">
                <Input value={config.logo_url} onChange={v => onChange('logo_url', v)} placeholder="https://empresa.cl/logo.png" />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingLogo}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                  {uploadingLogo ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </button>
                <button type="button" onClick={() => setVerLogo(!verLogo)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 flex-shrink-0">
                  {verLogo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Campo>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ''; }} />
            {verLogo && config.logo_url && (
              <div className="md:col-span-2 p-4 bg-gray-100 rounded-xl flex items-center justify-center" style={{ minHeight: 80 }}>
                <img src={config.logo_url} alt="Logo preview" className="max-h-16 max-w-full object-contain"
                  onError={e => { e.target.style.display = 'none'; }} />
          </div>
            )}
          </Seccion>

          <Seccion titulo="Colores" descripcion="Valores hexadecimales #RRGGBB">
            <Campo label="Color primario" ayuda="Botones y elementos destacados">
              <div className="flex items-center gap-3">
                <input type="color" value={cp} onChange={e => onChange('color_primario', e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5 flex-shrink-0" />
                <Input value={cp} onChange={v => onChange('color_primario', v)} placeholder="#2563eb" />
              </div>
            </Campo>
            <Campo label="Color secundario" ayuda="Hover y elementos de apoyo">
              <div className="flex items-center gap-3">
                <input type="color" value={cs} onChange={e => onChange('color_secundario', e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5 flex-shrink-0" />
                <Input value={cs} onChange={v => onChange('color_secundario', v)} placeholder="#1e40af" />
              </div>
            </Campo>
            <Campo label="Color de fondo" ayuda="Fondo general del portal">
              <div className="flex items-center gap-3">
                <input type="color" value={cf} onChange={e => onChange('color_fondo', e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5 flex-shrink-0" />
                <Input value={cf} onChange={v => onChange('color_fondo', v)} placeholder="#f8fafc" />
              </div>
            </Campo>
            <Campo label="Color de texto" ayuda="Texto principal del portal">
              <div className="flex items-center gap-3">
                <input type="color" value={ct} onChange={e => onChange('color_texto', e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5 flex-shrink-0" />
                <Input value={ct} onChange={v => onChange('color_texto', v)} placeholder="#1e293b" />
              </div>
            </Campo>
          </Seccion>

          {/* WCAG contrast (MMPA-148) */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contraste WCAG 2.1 — Accesibilidad</p>
            <WcagBadge c1={cp} c2={cf} label="Primario / Fondo" />
            <WcagBadge c1={ct} c2={cf} label="Texto / Fondo" />
            <WcagBadge c1={cp} c2={ct} label="Primario / Texto" />
            <p className="text-xs text-gray-400 mt-2">AA requiere ≥ 4.5:1 para texto normal · ≥ 3:1 para texto grande o UI</p>
          </div>

          <Seccion titulo="Tipografía">
            <Campo label="Fuente títulos">
              <select value={config.fuente_titulo || 'Inter'} onChange={e => onChange('fuente_titulo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                {FUENTES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </Campo>
            <Campo label="Fuente cuerpo">
              <select value={config.fuente_cuerpo || 'Inter'} onChange={e => onChange('fuente_cuerpo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                {FUENTES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </Campo>
          </Seccion>

          <Seccion titulo="Estilo de tarjetas">
            <Campo label="Forma">
              <select value={config.card_estilo || 'rounded'} onChange={e => onChange('card_estilo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                <option value="sharp">Esquinas rectas</option>
                <option value="rounded">Redondeadas</option>
                <option value="pill">Muy redondeadas</option>
              </select>
            </Campo>
            <Campo label="Sombra">
              <select value={config.card_sombra || 'soft'} onChange={e => onChange('card_sombra', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                <option value="none">Sin sombra</option>
                <option value="soft">Suave</option>
                <option value="medium">Media</option>
                <option value="strong">Pronunciada</option>
              </select>
            </Campo>
            <Campo label={`Radio de esquinas: ${config.card_radio || 12}px`} fullWidth>
              <input type="range" min="0" max="32" step="2" value={parseInt(config.card_radio) || 12}
                onChange={e => onChange('card_radio', e.target.value)}
                className="w-full accent-blue-600" />
            </Campo>
          </Seccion>

          {/* DPO branding toggle */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-800">Aplicar branding al panel DPO</p>
              <p className="text-xs text-gray-500 mt-0.5">Los colores afectan también la interfaz interna del equipo</p>
            </div>
            <button type="button" onClick={() => onChange('aplicar_branding_dpo', !config.aplicar_branding_dpo)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                config.aplicar_branding_dpo ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.aplicar_branding_dpo ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Vista previa */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Vista previa — encabezado del portal</p>
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 px-5 py-4" style={{ background: cp }}>
                {config.logo_url
                  ? <img src={config.logo_url} alt="Logo" className="h-8 object-contain"
                      onError={e => { e.target.style.display = 'none'; }} />
                  : <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>}
                <div>
                  <p className="font-bold text-white text-sm">{config.portal_nombre || 'Portal ARCOP'}</p>
                  <p className="text-white/70 text-xs">Ley 21.719 · Derechos ARCOP</p>
                </div>
              </div>
              <div className="px-5 py-4 border-t border-gray-100" style={{ background: cf }}>
                <div className="flex gap-2 flex-wrap">
                  {['Acceso', 'Rectificación', 'Cancelación', 'Oposición', 'Portabilidad'].map(d => (
                    <span key={d} className="px-3 py-1 text-xs font-medium text-white rounded-full" style={{ background: cp }}>{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button onClick={handleGuardar} disabled={guardando}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl disabled:opacity-50 hover:bg-blue-700 text-sm font-semibold">
              {guardando ? <><Loader className="w-4 h-4 animate-spin" />Guardando...</> : <><Save className="w-4 h-4" />Guardar identidad visual</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Desde Web ── */}
      {subTab === 'web' && (
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-800">
              <strong>Extracción automática:</strong> Ingresa la URL de tu sitio corporativo y el sistema detectará colores, logo y tipografías usados.
            </p>
          </div>
          <div className="flex gap-2">
            <Input value={urlExtraccion} onChange={setUrlExtraccion} placeholder="https://empresa.cl" />
            <button onClick={handleExtraer} disabled={extrayendo}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex-shrink-0">
              {extrayendo ? <><Loader className="w-4 h-4 animate-spin" />Extrayendo...</> : <><Globe className="w-4 h-4" />Extraer</>}
            </button>
          </div>

          {resultadoExt && (
            <div className="space-y-5">
              {resultadoExt.colors?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Colores detectados <span className="text-xs text-gray-400 font-normal">(clic para aplicar como primario)</span></p>
                  <div className="flex flex-wrap gap-2">
                    {resultadoExt.colors.map(c => (
                      <button key={c} onClick={() => onChange('color_primario', c)} title={`Aplicar ${c} como color primario`}
                        className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg hover:border-blue-400 text-xs font-mono transition-colors">
                        <span className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0" style={{ background: c }} />
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {resultadoExt.fonts?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Fuentes detectadas</p>
                  <div className="flex flex-wrap gap-2">
                    {resultadoExt.fonts.map(f => (
                      <button key={f} onClick={() => onChange('fuente_titulo', f)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-blue-50 rounded-lg text-xs transition-colors">{f}</button>
                    ))}
                  </div>
                </div>
              )}
              {resultadoExt.logo_url && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Logo detectado</p>
                  <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <img src={resultadoExt.logo_url} alt="" className="h-10 max-w-32 object-contain"
                      onError={e => { e.target.style.display = 'none'; }} />
                    <button onClick={() => onChange('logo_url', resultadoExt.logo_url)}
                      className="text-xs text-blue-600 hover:underline">Usar este logo</button>
                  </div>
                </div>
              )}
              <button onClick={aplicarSugerido}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                <Save className="w-4 h-4" /> Aplicar todas las sugerencias
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Plantillas ── */}
      {subTab === 'templates' && (
        <div className="space-y-4">
          {cargandoTemplates ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Layout className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Sin plantillas disponibles</p>
              <p className="text-xs mt-1">Ejecuta <code className="bg-gray-100 px-1 rounded">node backend/scripts/seed-templates.js</code> para cargarlas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(tpl => (
                <div key={tpl.id} className="border border-gray-200 rounded-xl overflow-hidden hover:border-blue-400 transition-colors cursor-pointer group">
                  <div className="h-14 relative" style={{ background: `linear-gradient(135deg, ${tpl.color_primario}, ${tpl.color_secundario})` }}>
                    <div className="absolute inset-0 flex items-center px-4 gap-2">
                      {[tpl.color_primario, tpl.color_secundario, tpl.color_fondo, tpl.color_texto].map((c, i) => (
                        <div key={i} title={c} className="w-5 h-5 rounded-full border-2 border-white/50 flex-shrink-0" style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{tpl.nombre}</p>
                        {tpl.descripcion && <p className="text-xs text-gray-500 mt-0.5 leading-tight">{tpl.descripcion}</p>}
                        <p className="text-xs text-gray-400 mt-1">{tpl.fuente_titulo} · {tpl.card_estilo}</p>
                      </div>
                      <button onClick={() => aplicarTemplate(tpl)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 flex-shrink-0 transition-colors">
                        Aplicar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
    <div className="dpo-layout flex items-center justify-center">
      <Loader className="w-12 h-12 text-blue-600 animate-spin" />
    </div>
  );

  const tabs = [
    { id: 'empresa',  nombre: 'Empresa',  icono: Building2 },
    { id: 'dpo',      nombre: 'DPO',      icono: User      },
    { id: 'branding', nombre: 'Branding', icono: Palette   },
    { id: 'plazos',   nombre: 'Plazos',   icono: Clock     },
    { id: 'derechos', nombre: 'Derechos', icono: Shield    },
    { id: 'importar', nombre: 'Importar', icono: Download  },
    { id: 'avanzado', nombre: 'Avanzado', icono: Settings  },
  ];

  // tabs que usan el botón guardar del footer de configuración general
  const tabsSimples = ['empresa', 'dpo', 'plazos'];
  const tabActivaEsSimple = tabsSimples.includes(tabActiva);
  const flujoDirty        = flujoHook?.dirty;
  const formularioDirty   = formularioHook?.dirty;
  const derechosDirty     = tabActiva === 'derechos' && (flujoDirty || formularioDirty);

  const handleGuardarDerechos = async () => {
    try {
      if (flujoDirty)      await flujoHook.guardar();
      if (formularioDirty) await formularioHook.guardar();
    } catch (e) {
      toast.error('Error al guardar derechos: ' + (e.message || ''));
    }
  };

  // ¿Hay algo que mostrar en el footer?
  const mostrarFooter = tabActivaEsSimple || tabActiva === 'derechos';

  return (
    <div className="dpo-layout py-8 px-4">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Configuración del Sistema</h1>

        {cambiosPendientes && tabActivaEsSimple && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-yellow-700 text-sm">Tienes cambios sin guardar</span>
          </div>
        )}

        <div className="glass-card rounded-2xl overflow-hidden">

          {/* Tabs */}
          <div className="border-b border-black/10 bg-black/5">
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
            {tabActiva === 'empresa'  && <TabEmpresa  config={config} onChange={handleChange} />}
            {tabActiva === 'dpo'      && <TabDPO      config={config} onChange={handleChange} />}
            {tabActiva === 'branding' && <TabIdentidadVisual config={config} onChange={handleChange} />}
            {tabActiva === 'plazos'   && <TabPlazos   config={config} onChange={handleChange} />}
            {tabActiva === 'avanzado' && <TabAvanzado config={config} onRestaurar={handleRestaurar} onExportar={handleExportar} />}
            {tabActiva === 'derechos' && <TabDerechos formularioHook={formularioHook} flujoHook={flujoHook} />}
            {tabActiva === 'importar' && <TabImportar />}  {/* ← MMPA-119 */}
          </div>

          {/* Footer — solo se muestra en tabs que tienen acción de guardar */}
          {mostrarFooter && (
            <div className="border-t border-gray-200 px-8 py-5 bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-yellow-600">
                {((cambiosPendientes && tabActivaEsSimple) || derechosDirty) && (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />Cambios sin guardar
                  </span>
                )}
              </div>

              <div>
                {tabActivaEsSimple && (
                  <button onClick={handleGuardar} disabled={guardando || !cambiosPendientes}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl disabled:opacity-50 hover:bg-blue-700 text-sm font-semibold">
                    {guardando
                      ? <><Loader className="w-4 h-4 animate-spin" />Guardando...</>
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
          )}

        </div>
      </div>
    </div>
  );
};

export default Configuracion;