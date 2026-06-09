// ============================================================
// PanelDPO.jsx — v4.2
// CAMBIOS sobre v4.1:
//   - Modal detalle: muestra documentacion_archivos con botón descarga
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Filter, Loader, X, CheckCircle, Clock, User, AlertTriangle, Link, AlignLeft, ToggleLeft, ChevronDown, Upload, ListChecks, XCircle } from 'lucide-react';
import { obtenerTodasSolicitudes, actualizarSolicitud, marcarComoResuelta, rechazarSolicitud } from '../services/dpoService';
import SolicitudesTable from '../components/SolicitudesTable';
import { ESTADOS, ESTADO_LABELS } from '../utils/constants';
import { toast } from 'react-toastify';
import { obtenerFlujoConfig, buildConfigDefault } from '../services/flujoService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// ── Render de un campo de transición ─────────────────────
const CampoTransicion = ({ campo, value, onChange, solicitudId }) => {
  const base = 'corp-input';

  const [modoUrl,      setModoUrl]      = useState('url');   // 'url' | 'archivo'
  const [subiendo,     setSubiendo]     = useState(false);
  const [archivoNombre, setArchivoNombre] = useState('');

  switch (campo.tipo) {
    case 'url':
      return (
        <div className="space-y-2">
          <div style={{ display: 'inline-flex', gap: 2, padding: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }}>
            <button type="button"
              onClick={() => setModoUrl('url')}
              style={{ padding: '4px 12px', fontSize: '0.75rem', fontWeight: 500, borderRadius: 6, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: modoUrl === 'url' ? 'rgba(99,102,241,0.3)' : 'transparent', color: modoUrl === 'url' ? 'white' : 'rgba(255,255,255,0.5)' }}>
              Ingresar URL
            </button>
            <button type="button"
              onClick={() => setModoUrl('archivo')}
              style={{ padding: '4px 12px', fontSize: '0.75rem', fontWeight: 500, borderRadius: 6, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: modoUrl === 'archivo' ? 'rgba(99,102,241,0.3)' : 'transparent', color: modoUrl === 'archivo' ? 'white' : 'rgba(255,255,255,0.5)' }}>
              Subir desde disco
            </button>
          </div>

          {modoUrl === 'url' ? (
            <input type="url" value={value || ''} onChange={e => onChange(campo.id, e.target.value)}
              placeholder={campo.placeholder || 'https://...'}
              className={base} />
          ) : (
            <div>
              {archivoNombre ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, background: 'rgba(16,185,129,0.08)' }}>
                  <CheckCircle style={{ width: 16, height: 16, color: '#6EE7B7', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', color: '#6EE7B7', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{archivoNombre}</span>
                  <button type="button"
                    onClick={() => { setArchivoNombre(''); onChange(campo.id, ''); }}
                    style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer' }}>
                    Cambiar
                  </button>
                </div>
              ) : (
                <label style={{ display: 'block', cursor: 'pointer', pointerEvents: subiendo ? 'none' : 'auto', opacity: subiendo ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', fontSize: '0.875rem', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 8, background: 'rgba(255,255,255,0.04)', transition: 'all 0.15s' }}>
                    {subiendo
                      ? <><Loader style={{ width: 16, height: 16, color: 'var(--dpo-color-primario, #6366F1)' }} className="animate-spin flex-shrink-0" /><span style={{ color: 'rgba(255,255,255,0.55)' }}>Subiendo...</span></>
                      : <><Upload style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} /><span style={{ color: 'rgba(255,255,255,0.35)' }}>Haz clic para seleccionar un archivo</span></>
                    }
                  </div>
                  <input type="file" className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    disabled={subiendo}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setSubiendo(true);
                      try {
                        const fd = new FormData();
                        fd.append('archivos', file);
                        fd.append('solicitudId', solicitudId || 'sin-id');
                        const res  = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: fd });
                        const json = await res.json();
                        if (!res.ok) throw new Error(json.error || 'Error al subir');
                        const subido = json.data[0];
                        setArchivoNombre(subido.nombre);
                        onChange(campo.id, subido.url);
                      } catch (err) {
                        alert(err.message || 'Error al subir el archivo');
                      } finally {
                        setSubiendo(false);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
              )}
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>PDF, JPG, PNG, DOC, DOCX — máx. 5 MB</p>
            </div>
          )}
        </div>
      );
    case 'textarea':
      return (
        <textarea rows={3} value={value || ''} onChange={e => onChange(campo.id, e.target.value)}
          placeholder={campo.placeholder || ''}
          className={base + ' resize-none'} />
      );
    case 'select':
      return (
        <select value={value || ''} onChange={e => onChange(campo.id, e.target.value)} className={base}>
          <option value="">— Selecciona —</option>
          {(campo.opciones || []).map(op => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
      );
    case 'multiselect': {
      const seleccionados = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
      const toggle = (op) => {
        const nuevo = seleccionados.includes(op)
          ? seleccionados.filter(s => s !== op)
          : [...seleccionados, op];
        onChange(campo.id, nuevo.join(', '));
      };
      return (
        <div className="flex flex-wrap gap-2">
          {(campo.opciones || []).map(op => {
            const activo = seleccionados.includes(op);
            return (
              <button key={op} type="button" onClick={() => toggle(op)}
                className={`px-3 py-1.5 text-sm rounded-lg border-2 font-medium transition-all ${
                  activo
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700'
                }`}>
                {op}
              </button>
            );
          })}
        </div>
      );
    }
    case 'checkbox':
      return (
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" checked={!!value} onChange={e => onChange(campo.id, e.target.checked)}
            className="w-4 h-4 mt-0.5 accent-blue-600 flex-shrink-0" />
          <span className="text-sm text-gray-700">{campo.label}</span>
        </label>
      );
    default: // text
      return (
        <input type="text" value={value || ''} onChange={e => onChange(campo.id, e.target.value)}
          placeholder={campo.placeholder || ''}
          className={base} />
      );
  }
};

// ── Icono por tipo de campo ───────────────────────────────
const iconoCampo = (tipo) => {
  if (tipo === 'url')         return <Link className="w-3.5 h-3.5" />;
  if (tipo === 'textarea')    return <AlignLeft className="w-3.5 h-3.5" />;
  if (tipo === 'checkbox')    return <ToggleLeft className="w-3.5 h-3.5" />;
  if (tipo === 'select')      return <ChevronDown className="w-3.5 h-3.5" />;
  if (tipo === 'multiselect') return <ListChecks className="w-3.5 h-3.5" />;
  return null;
};

// ─────────────────────────────────────────────────────────
const PanelDPO = () => {
  const location = useLocation();

  const [solicitudes,         setSolicitudes]         = useState([]);
  const [loading,             setLoading]             = useState(true);
  const [filtros,             setFiltros]             = useState({ estado: '', busqueda: '' });
  const [filtroEspecial,      setFiltroEspecial]      = useState(null);

  const [modalDetalle,        setModalDetalle]        = useState(null);
  const [modalCambiarEstado,  setModalCambiarEstado]  = useState(null);
  const [nuevoEstado,         setNuevoEstado]         = useState('');
  const [actorSeleccionado,   setActorSeleccionado]   = useState(null);
  const [actorLibre,          setActorLibre]          = useState('');
  const [actoresDisponibles,  setActoresDisponibles]  = useState([]);
  const [flujoConfig,         setFlujoConfig]         = useState(() => buildConfigDefault());

  const [valoresCampos,       setValoresCampos]       = useState({});

  const [procesando,          setProcesando]          = useState(false);
  const [modalResuelta,       setModalResuelta]       = useState(null);
  const [urlDescarga,         setUrlDescarga]         = useState('');
  const [formatoEntregado,    setFormatoEntregado]    = useState('PDF');

  const [modalRechazar,       setModalRechazar]       = useState(null);
  const [causalRechazo,       setCausalRechazo]       = useState('');
  const [notaRechazo,         setNotaRechazo]         = useState('');

  // ── Inicialización ─────────────────────────────────────
  useEffect(() => {
    cargarDatos();
    cargarFlujoConfig();
  }, []);

  useEffect(() => {
    if (location.state?.filtro) {
      const f = location.state.filtro;
      if (f.estado)       setFiltros(prev => ({ ...prev, estado: f.estado }));
      if (f.por_vencer)   setFiltroEspecial({ por_vencer: true });
      if (f.sin_asignar)  setFiltroEspecial({ sin_asignar: true });
    }
  }, [location.state]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const result = await obtenerTodasSolicitudes({});
      if (result.status === 'success') setSolicitudes(result.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const cargarFlujoConfig = async () => {
    try {
      console.log('🔄 Cargando flujoConfig...');
      const result = await obtenerFlujoConfig();
      console.log('📋 obtenerFlujoConfig resultado:', result?.status, '| data:', result?.data ? 'OK' : 'null/falsy');
      if (result.status === 'success' && result.data) {
        setFlujoConfig(result.data);
        console.log('✅ flujoConfig seteado OK');
      } else {
        console.warn('⚠️ flujoConfig no seteado — status:', result?.status, '| data:', result?.data);
      }
    } catch (e) {
      console.error('❌ Error cargando flujoConfig:', e);
    }
  };

  // ── Filtrado ───────────────────────────────────────────
  const solicitudesFiltradas = useMemo(() => {
    let s = [...solicitudes];
    if (filtros.estado)   s = s.filter(x => x.estado === filtros.estado);
    if (filtros.busqueda) {
      const q = filtros.busqueda.toLowerCase();
      s = s.filter(x =>
        (x.nombre_completo || '').toLowerCase().includes(q) ||
        (x.rut             || '').toLowerCase().includes(q) ||
        (x.email           || '').toLowerCase().includes(q) ||
        (x.numero_solicitud|| '').toLowerCase().includes(q)
      );
    }
    if (filtroEspecial?.por_vencer) {
      const limite = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      s = s.filter(x => {
        if (!x.fecha_limite) return false;
        const fl = new Date(x.fecha_limite);
        return x.estado !== 'RESUELTA' && x.estado !== 'CERRADA' && fl < limite;
      });
    } else if (filtroEspecial?.sin_asignar) {
      s = s.filter(x => !x.asignado_a && x.estado !== 'CERRADA' && x.estado !== 'RESUELTA');
    } else if (filtroEspecial?.estado) {
      s = s.filter(x => x.estado === filtroEspecial.estado);
    }
    s.sort((a, b) => {
      const fa = a.fecha_solicitud ? new Date(a.fecha_solicitud).getTime() : 0;
      const fb = b.fecha_solicitud ? new Date(b.fecha_solicitud).getTime() : 0;
      return fb - fa;
    });
    return s;
  }, [solicitudes, filtros, filtroEspecial]);

  // ── Helpers ────────────────────────────────────────────
  const getFieldValue = (obj, fieldName) => {
    if (!obj) return '';
    if (fieldName === 'tipo_derecho') {
      const v = obj['tipo_derecho'] ?? obj['tipo'];
      return (v !== undefined && v !== null && v !== '') ? v : '';
    }
    for (const k of [fieldName, fieldName.toUpperCase(), fieldName.toLowerCase()]) {
      if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
    }
    return '';
  };

  const getSolicitudId = (s) => {
    if (!s) return null;
    for (const c of ['id', 'ID', 'Id']) {
      const v = s[c]; if (v && v.toString().trim()) return v.toString().trim();
    }
    for (const c of ['numero_solicitud', 'NUMERO_SOLICITUD']) {
      const v = s[c]; if (v && v.toString().trim()) return v.toString().trim();
    }
    return null;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return 'Fecha inválida';
      return d.toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return 'Fecha inválida'; }
  };

  const normId = (s) => (s || '').toString().toUpperCase().trim();

  const getEstadosDerecho = (tipo) => {
    if (!flujoConfig) return [];
    const tipoNorm = normId(tipo);
    return (flujoConfig.derechos?.[tipoNorm]?.estados || []).map(e => ({
      ...e,
      id: normId(e.id),
      transiciones_posibles: (e.transiciones_posibles || []).map(normId),
      actores:           e.actores           || [],
      campos_transicion: e.campos_transicion || [],
    }));
  };

  const calcFechaTerminoSLA = (slaDias) => {
    if (!slaDias) return null;
    let dias = slaDias;
    const fecha = new Date();
    while (dias > 0) {
      fecha.setDate(fecha.getDate() + 1);
      if (fecha.getDay() !== 0 && fecha.getDay() !== 6) dias--;
    }
    return fecha;
  };

  // ── Handlers ───────────────────────────────────────────
  const handleVerDetalle    = (s) => setModalDetalle(s);
  const handleCerrarDetalle = ()  => setModalDetalle(null);

  const handleAbrirCambiarEstado = async (solicitud) => {
    const estadoActualId = normId(getFieldValue(solicitud, 'estado') || 'PENDIENTE');
    const tipo           = normId(getFieldValue(solicitud, 'tipo_derecho') || 'ACCESO');

    let config = flujoConfig;
    if (!config) {
      try {
        const result = await obtenerFlujoConfig();
        if (result.status === 'success' && result.data) {
          config = result.data;
          setFlujoConfig(config);
        }
      } catch (e) {
        console.error('❌ Error cargando flujoConfig on-demand:', e);
      }
    }

    const estadosDerecho = config
      ? (config.derechos?.[tipo]?.estados || []).map(e => ({
          ...e,
          id: normId(e.id),
          transiciones_posibles: (e.transiciones_posibles || []).map(normId),
          actores: e.actores || [],
          campos_transicion: e.campos_transicion || [],
        }))
      : [];

    const defActual      = estadosDerecho.find(e => e.id === estadoActualId);
    const transIds       = defActual?.transiciones_posibles || [];
    const estadosDestino = estadosDerecho.filter(e => transIds.includes(e.id) && e.activo !== false);
    const primerDestino  = estadosDestino.length > 0 ? estadosDestino[0].id : '';

    const actoresInicio = primerDestino
      ? (estadosDerecho.find(e => e.id === primerDestino)?.actores || [])
      : [];

    setModalCambiarEstado(solicitud);
    setNuevoEstado(primerDestino);
    setActorSeleccionado(null);
    setActorLibre('');
    setValoresCampos({});
    setActoresDisponibles(actoresInicio);
  };

  const handleCambioEstadoDestino = (estadoId) => {
    const id             = normId(estadoId);
    const tipo           = normId(getFieldValue(modalCambiarEstado, 'tipo_derecho') || 'ACCESO');
    const estadosDerecho = getEstadosDerecho(tipo);
    const actores        = estadosDerecho.find(e => e.id === id)?.actores || [];

    setNuevoEstado(id);
    setActorSeleccionado(null);
    setActorLibre('');
    setValoresCampos({});
    setActoresDisponibles(actores);
  };

  const handleCampoTransicion = (id, valor) => {
    setValoresCampos(prev => ({ ...prev, [id]: valor }));
  };

  const handleCambiarEstado = async () => {
    if (!modalCambiarEstado || !nuevoEstado) {
      toast.error('Selecciona un estado válido');
      return;
    }

    const tipo           = normId(getFieldValue(modalCambiarEstado, 'tipo_derecho') || 'ACCESO');
    const estadosDerecho = getEstadosDerecho(tipo);
    const defDestino     = estadosDerecho.find(e => e.id === normId(nuevoEstado));
    const camposDestino  = defDestino?.campos_transicion || [];

    const faltantes = camposDestino.filter(c => {
      if (!c.obligatorio) return false;
      if (c.tipo === 'checkbox') return !valoresCampos[c.id];
      return !valoresCampos[c.id] || valoresCampos[c.id].toString().trim() === '';
    });

    if (faltantes.length > 0) {
      toast.error('Completa los campos requeridos: ' + faltantes.map(c => c.label).join(', '));
      return;
    }

    let asignadoNombre = '';
    let asignadoEmail  = '';
    if (actorSeleccionado) {
      asignadoNombre = actorSeleccionado.nombre;
      asignadoEmail  = actorSeleccionado.email;
    } else if (actorLibre.trim()) {
      asignadoNombre = actorLibre.trim();
    }

    const slaDias      = defDestino?.sla_dias || 0;
    const fechaTermino = calcFechaTerminoSLA(slaDias);

    try {
      setProcesando(true);
      const id = getSolicitudId(modalCambiarEstado);
      if (!id) { toast.error('No se pudo obtener el ID'); return; }

      const esResueltaConUrl = nuevoEstado.toUpperCase() === 'RESUELTA' && valoresCampos.url_datos;

      let result;
      if (esResueltaConUrl) {
        result = await marcarComoResuelta(id, valoresCampos.url_datos, valoresCampos.formato_entrega || 'PDF');
      } else {
        result = await actualizarSolicitud(id, {
          estado:               nuevoEstado,
          notas_dpo:            '',
          asignado_a:           asignadoNombre,
          asignado_email:       asignadoEmail,
          asignado_en:          new Date().toISOString(),
          fecha_entrada_estado: new Date().toISOString(),
          fecha_termino_sla:    fechaTermino ? fechaTermino.toISOString() : '',
          campos_transicion:    valoresCampos,
        });
      }

      if (result.status === 'success') {
        const msg = asignadoNombre
          ? `Estado cambiado a "${nuevoEstado}" — asignado a ${asignadoNombre}`
          : `Estado cambiado a "${nuevoEstado}"`;
        toast.success(msg);
        setModalCambiarEstado(null);
        setValoresCampos({});
        await cargarDatos();
      } else {
        toast.error(result.message || 'Error al cambiar estado');
      }
    } catch (e) {
      toast.error('Error: ' + e.message);
    } finally {
      setProcesando(false);
    }
  };

  const ESTADOS_FINALES_RECHAZO = new Set(['CERRADA', 'DESCARGA_CONFIRMADA', 'WITHDRAWN', 'DESISTIDA', 'REJECTED']);

  const handleAbrirRechazar = (s) => {
    setModalRechazar(s);
    setCausalRechazo('');
    setNotaRechazo('');
  };

  const handleConfirmarRechazo = async () => {
    if (!causalRechazo) { toast.error('Selecciona una causal'); return; }
    if (notaRechazo.trim().length < 20) { toast.error('La nota debe tener al menos 20 caracteres'); return; }
    try {
      setProcesando(true);
      const id = getSolicitudId(modalRechazar);
      if (!id) { toast.error('No se pudo obtener el ID'); return; }
      const result = await rechazarSolicitud(id, causalRechazo, notaRechazo.trim());
      if (result.status === 'success') {
        toast.success('Solicitud rechazada y email enviado al titular');
        setModalRechazar(null);
        setModalDetalle(null);
        await cargarDatos();
      } else {
        toast.error(result.message || 'Error al rechazar');
      }
    } catch (e) {
      toast.error('Error: ' + e.message);
    } finally {
      setProcesando(false);
    }
  };

  const handleAbrirMarcarResuelta = (s) => {
    setModalResuelta(s);
    setUrlDescarga('');
    setFormatoEntregado('PDF');
  };

  const handleMarcarResuelta = async () => {
    if (!urlDescarga.trim()) { toast.error('La URL de descarga es requerida'); return; }
    try {
      setProcesando(true);
      const id = getSolicitudId(modalResuelta);
      const result = await marcarComoResuelta(id, urlDescarga, formatoEntregado);
      if (result.status === 'success') {
        toast.success('Solicitud resuelta y email enviado al titular');
        setModalResuelta(null);
        await cargarDatos();
      } else {
        toast.error(result.message || 'Error al resolver');
      }
    } catch (e) {
      toast.error('Error: ' + e.message);
    } finally {
      setProcesando(false);
    }
  };

  // ── Loading — skeleton ────────────────────────────────
  if (loading) return (
    <div className="dpo-layout" style={{ padding: '32px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ height: 10, width: 60, background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ height: 28, width: 160, background: 'rgba(255,255,255,0.08)', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        </div>
        <div className="corp-card" style={{ padding: 16, marginBottom: 24 }}>
          <div style={{ height: 36, background: 'rgba(255,255,255,0.06)', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
        <div className="corp-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 24 }}>
            {['60px', '120px', '80px', '140px', '80px', '80px', '80px'].map((w, i) => (
              <div key={i} style={{ height: 12, width: w, background: 'rgba(255,255,255,0.06)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ height: 16, width: 24, background: 'rgba(255,255,255,0.06)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: 16, width: 120, background: 'rgba(255,255,255,0.06)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: 16, width: 80, background: 'rgba(255,255,255,0.06)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: 22, width: 80, background: 'rgba(99,102,241,0.12)', borderRadius: 20, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: 16, width: 100, background: 'rgba(255,255,255,0.06)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: 32, width: 60, background: 'rgba(255,255,255,0.06)', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="dpo-layout" style={{ padding: '32px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }} className="sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(165,180,252,0.8)', marginBottom: 4 }}>Zona DPO</p>
            <h1 style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: 24, fontWeight: 800, color: 'white', margin: 0 }}>Solicitudes</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
              {solicitudesFiltradas.length} de {solicitudes.length} solicitudes
            </p>
          </div>
          <button onClick={cargarDatos} className="btn-ghost" style={{ alignSelf: 'flex-start', padding: '6px 14px', minHeight: 'auto', fontSize: 13 }}>
            Actualizar
          </button>
        </div>

        {/* Filtros */}
        <div className="corp-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'rgba(255,255,255,0.35)' }} />
              <input type="text" placeholder="Buscar por nombre, RUT, email o número..."
                value={filtros.busqueda}
                onChange={e => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                className="corp-input" style={{ paddingLeft: 40 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
              <select value={filtros.estado}
                onChange={e => { setFiltros(prev => ({ ...prev, estado: e.target.value })); setFiltroEspecial(null); }}
                className="corp-input" style={{ width: 'auto' }}>
                <option value="">Todos los estados</option>
                {Object.entries(ESTADO_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              {(filtros.estado || filtros.busqueda || filtroEspecial) && (
                <button onClick={() => { setFiltros({ estado: '', busqueda: '' }); setFiltroEspecial(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#FCA5A5', border: '1px solid rgba(252,165,165,0.3)', padding: '6px 10px', borderRadius: 6, background: 'none', cursor: 'pointer' }}>
                  <X style={{ width: 12, height: 12 }} /> Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="corp-card" style={{ overflow: 'hidden' }}>
          <SolicitudesTable
            solicitudes={solicitudesFiltradas}
            onVerDetalle={handleVerDetalle}
            onCambiarEstado={handleAbrirCambiarEstado}
            onMarcarResuelta={handleAbrirMarcarResuelta}
          />
        </div>

      </div>

      {/* ══════════════════════════════════════════════════
          MODAL DETALLE
      ══════════════════════════════════════════════════ */}
      {modalDetalle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, maxWidth: 672, width: '100%', padding: 24, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', margin: 0 }}>Detalle de Solicitud</h3>
              <button onClick={handleCerrarDetalle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}>
                <X style={{ width: 22, height: 22 }} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                ['Nombre',         'nombre_completo'],
                ['RUT',            'rut'],
                ['Email',          'email'],
                ['Teléfono',       'telefono'],
                ['Estado',         'estado'],
                ['Tipo',           'tipo_derecho'],
                ['Fecha Solicitud','fecha_solicitud'],
                ['Fecha Límite',   'fecha_limite'],
              ].map(([label, field]) => (
                <div key={field}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}>{label}</label>
                  <p style={{ marginTop: 4, fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                    {field.includes('fecha')
                      ? formatearFecha(getFieldValue(modalDetalle, field))
                      : (getFieldValue(modalDetalle, field) || '—')}
                  </p>
                </div>
              ))}
            </div>

            {getFieldValue(modalDetalle, 'dato_incorrecto') && (
              <div style={{ marginTop: 16, padding: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#FCD34D', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Dato a rectificar</label>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)', margin: 0 }}>{getFieldValue(modalDetalle, 'dato_incorrecto')}</p>
                {getFieldValue(modalDetalle, 'valor_correcto') && (
                  <>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#FCD34D', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, marginTop: 12 }}>Valor correcto</label>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)', margin: 0 }}>{getFieldValue(modalDetalle, 'valor_correcto')}</p>
                  </>
                )}
              </div>
            )}

            {getFieldValue(modalDetalle, 'asignado_a') && (
              <div style={{ marginTop: 16, padding: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <User style={{ width: 16, height: 16, color: '#A5B4FC' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#A5B4FC' }}>
                  Asignado a: {getFieldValue(modalDetalle, 'asignado_a')}
                </span>
              </div>
            )}
            {getFieldValue(modalDetalle, 'fecha_termino_sla') && (
              <div style={{ marginTop: 12, padding: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock style={{ width: 16, height: 16, color: '#FCD34D' }} />
                <span style={{ fontSize: '0.875rem', color: '#FCD34D' }}>
                  SLA vence: <strong>{formatearFecha(getFieldValue(modalDetalle, 'fecha_termino_sla'))}</strong>
                </span>
              </div>
            )}
            {getFieldValue(modalDetalle, 'notas_dpo') && (
              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>Notas DPO</label>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.04)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', margin: 0 }}>
                  {getFieldValue(modalDetalle, 'notas_dpo')}
                </p>
              </div>
            )}

            {modalDetalle.documentacion_archivos && modalDetalle.documentacion_archivos.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>📎 Documentación adjunta</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {modalDetalle.documentacion_archivos.map((arch, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span style={{ fontSize: '1.1rem' }}>
                          {arch.tipo?.includes('pdf') ? '📕' : arch.tipo?.includes('image') ? '🖼️' : '📄'}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.85)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{arch.nombre}</p>
                          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                            {arch.tamaño ? (arch.tamaño / 1024).toFixed(0) + ' KB' : ''} · {arch.tipo?.split('/')[1]?.toUpperCase() || ''}
                          </p>
                        </div>
                      </div>
                      <a href={arch.url} target="_blank" rel="noopener noreferrer" download={arch.nombre}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--dpo-color-primario, #6366F1)', color: 'white', fontSize: '0.75rem', fontWeight: 500, borderRadius: 8, textDecoration: 'none', flexShrink: 0 }}>
                        ⬇ Descargar
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'space-between' }}>
              <div>
                {!ESTADOS_FINALES_RECHAZO.has(getFieldValue(modalDetalle, 'estado')) && (
                  <button onClick={() => { handleCerrarDetalle(); handleAbrirRechazar(modalDetalle); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(239,68,68,0.12)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer' }}>
                    <XCircle style={{ width: 16, height: 16 }} />
                    Rechazar solicitud
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => { handleCerrarDetalle(); handleAbrirCambiarEstado(modalDetalle); }}
                  style={{ padding: '8px 16px', background: 'var(--dpo-color-primario, #6366F1)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer' }}>
                  Cambiar Estado
                </button>
                <button onClick={handleCerrarDetalle}
                  style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer' }}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MODAL CAMBIAR ESTADO
      ══════════════════════════════════════════════════ */}
      {modalCambiarEstado && (() => {
        const tipo           = normId(getFieldValue(modalCambiarEstado, 'tipo_derecho') || 'ACCESO');
        const estadoActualId = normId(getFieldValue(modalCambiarEstado, 'estado') || 'PENDIENTE');
        const numero         = getFieldValue(modalCambiarEstado, 'numero_solicitud');
        const nombreTitular  = getFieldValue(modalCambiarEstado, 'nombre_completo');

        const estadosDerecho  = getEstadosDerecho(tipo);
        const defActual       = estadosDerecho.find(e => e.id === estadoActualId);
        const transicionesIds = defActual?.transiciones_posibles || [];
        const estadosDestino  = estadosDerecho.filter(
          e => transicionesIds.includes(e.id) && e.activo !== false
        );

        const tieneFlujoCargado = !!flujoConfig && estadosDerecho.length > 0;
        const destinoUnico      = tieneFlujoCargado && estadosDestino.length === 1;
        const variosDestinos    = tieneFlujoCargado && estadosDestino.length > 1;
        const usarFallback      = !tieneFlujoCargado;

        const esEstadoFinal = tieneFlujoCargado && (
          defActual?.es_final === true ||
          (!defActual && false) ||
          (defActual && transicionesIds.length === 0)
        );

        const nuevoEstadoNorm  = normId(nuevoEstado);
        const defDestinoRender = estadosDerecho.find(e => e.id === nuevoEstadoNorm);
        const fechaTermino     = calcFechaTerminoSLA(defDestinoRender?.sla_dias || 0);
        const hayActores       = actoresDisponibles.length > 0;

        const defDestino    = defDestinoRender;
        const camposDestino = defDestino?.campos_transicion || [];
        const hayCampos     = camposDestino.length > 0;

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
            <div style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, maxWidth: 520, width: '100%', padding: 24, boxShadow: '0 25px 50px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto' }}>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', margin: '0 0 4px' }}>Cambiar Estado</h3>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>
                {numero && <><span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{numero}</span> — </>}
                {nombreTitular && <><span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{nombreTitular}</span> — </>}
                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{tipo}</span>
              </p>

              <div style={{ marginBottom: 16, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                Estado actual: <strong style={{ color: 'rgba(255,255,255,0.9)' }}>{defActual?.nombre || estadoActualId}</strong>
              </div>

              {esEstadoFinal && tieneFlujoCargado && (
                <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(100,116,139,0.08)', border: '1px solid rgba(100,116,139,0.25)', borderRadius: 10, fontSize: '0.875rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle style={{ width: 16, height: 16, color: '#64748B', flexShrink: 0 }} />
                  Este estado es final. No hay transiciones disponibles en el flujo configurado.
                </div>
              )}

              {destinoUnico && !esEstadoFinal && (() => {
                const dest = estadosDestino[0];
                return (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: 8 }}>Mover a estado</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 10, border: '2px solid rgba(99,102,241,0.5)', background: 'rgba(99,102,241,0.08)' }}>
                      <CheckCircle style={{ width: 20, height: 20, color: '#A5B4FC', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#A5B4FC', margin: 0 }}>{dest.nombre}</p>
                        {dest.descripcion && (
                          <p style={{ fontSize: '0.75rem', color: 'rgba(165,180,252,0.7)', marginTop: 2 }}>{dest.descripcion}</p>
                        )}
                      </div>
                      {dest.envia_email && (
                        <span style={{ fontSize: '0.75rem', background: 'rgba(99,102,241,0.2)', color: '#A5B4FC', padding: '2px 8px', borderRadius: 12, flexShrink: 0 }}>
                          Email titular
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
                      Siguiente paso definido por el flujo configurado para {tipo}.
                    </p>
                  </div>
                );
              })()}

              {variosDestinos && !esEstadoFinal && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: 8 }}>Mover a estado</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {estadosDestino.map(est => {
                      const sel = (nuevoEstado || '').toUpperCase() === est.id;
                      return (
                        <label key={est.id}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, border: `2px solid ${sel ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.10)'}`, background: sel ? 'rgba(99,102,241,0.08)' : 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
                          <input type="radio" name="estadoDestino" style={{ width: 16, height: 16, accentColor: 'var(--dpo-color-primario, #6366F1)' }}
                            checked={sel} onChange={() => handleCambioEstadoDestino(est.id)} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: sel ? '#A5B4FC' : 'rgba(255,255,255,0.85)', margin: 0 }}>{est.nombre}</p>
                            {est.descripcion && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{est.descripcion}</p>}
                          </div>
                          {est.envia_email && (
                            <span style={{ fontSize: '0.75rem', background: 'rgba(99,102,241,0.15)', color: '#A5B4FC', padding: '2px 8px', borderRadius: 12, flexShrink: 0 }}>
                              Email titular
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {usarFallback && !esEstadoFinal && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: 8 }}>Mover a estado</label>
                  <div style={{ marginBottom: 8, padding: '8px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, fontSize: '0.75rem', color: '#FCD34D', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />
                    Flujo no configurado para {tipo}. Selecciona el estado manualmente.
                  </div>
                  <select value={nuevoEstado} onChange={e => handleCambioEstadoDestino(e.target.value)}
                    className="corp-input">
                    <option value="">— Selecciona estado destino —</option>
                    {['PENDIENTE','VALIDADA','EN_PROCESO','RESUELTA','CERRADA'].map(id => (
                      <option key={id} value={id} disabled={id === estadoActualId}>{id}</option>
                    ))}
                  </select>
                </div>
              )}

              {hayCampos && nuevoEstado !== estadoActualId && (
                <div style={{ marginBottom: 16, border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10, padding: 16, background: 'rgba(139,92,246,0.06)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C4B5FD', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                    <AlertTriangle style={{ width: 14, height: 14 }} />
                    Información requerida para esta transición
                  </p>
                  {camposDestino.map(campo => {
                    if (campo.tipo === 'checkbox') {
                      return (
                        <div key={campo.id}>
                          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
                            <input type="checkbox"
                              checked={!!valoresCampos[campo.id]}
                              onChange={e => handleCampoTransicion(campo.id, e.target.checked)}
                              style={{ width: 16, height: 16, marginTop: 2, accentColor: '#8B5CF6', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)' }}>
                              {campo.label}
                              {campo.obligatorio && <span style={{ color: '#FCA5A5', marginLeft: 4 }}>*</span>}
                            </span>
                          </label>
                          {campo.ayuda && (
                            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: 4, marginLeft: 24 }}>{campo.ayuda}</p>
                          )}
                        </div>
                      );
                    }
                    return (
                      <div key={campo.id}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>
                          {iconoCampo(campo.tipo)}
                          {campo.label}
                          {campo.obligatorio && <span style={{ color: '#FCA5A5' }}>*</span>}
                        </label>
                        {campo.ayuda && (
                          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{campo.ayuda}</p>
                        )}
                        <CampoTransicion
                          campo={campo}
                          value={valoresCampos[campo.id]}
                          onChange={handleCampoTransicion}
                          solicitudId={modalCambiarEstado?.id}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {nuevoEstado && nuevoEstado !== estadoActualId && (hayActores || (defDestinoRender?.sla_dias > 0)) && (
                <div style={{ border: '1px solid rgba(99,102,241,0.25)', borderRadius: 10, padding: 16, background: 'rgba(99,102,241,0.06)', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <User style={{ width: 16, height: 16, color: '#A5B4FC' }} />
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#A5B4FC', margin: 0 }}>Responsable de la actividad</h4>
                    {!hayActores && <span style={{ fontSize: '0.75rem', color: 'rgba(165,180,252,0.55)' }}>(opcional)</span>}
                  </div>

                  {hayActores ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {actoresDisponibles.map((actor, i) => (
                        <label key={i}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, border: `2px solid ${actorSeleccionado?.email === actor.email ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`, background: actorSeleccionado?.email === actor.email ? 'rgba(99,102,241,0.10)' : 'rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'all 0.15s' }}>
                          <input type="radio" name="actor" style={{ width: 16, height: 16, accentColor: 'var(--dpo-color-primario, #6366F1)' }}
                            checked={actorSeleccionado?.email === actor.email}
                            onChange={() => { setActorSeleccionado(actor); setActorLibre(''); }} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: 0 }}>{actor.nombre}</p>
                            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{actor.email}</p>
                          </div>
                          {actor.rol && (
                            <span style={{ fontSize: '0.75rem', color: '#A5B4FC', background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: 12 }}>
                              {actor.rol}
                            </span>
                          )}
                        </label>
                      ))}
                      <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, border: `2px solid ${!actorSeleccionado && !!actorLibre ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`, background: !actorSeleccionado && !!actorLibre ? 'rgba(99,102,241,0.10)' : 'rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <input type="radio" name="actor" style={{ width: 16, height: 16, accentColor: 'var(--dpo-color-primario, #6366F1)' }}
                          checked={!actorSeleccionado && !!actorLibre}
                          onChange={() => setActorSeleccionado(null)} />
                        <input type="text" placeholder="Otro responsable..."
                          value={actorLibre}
                          onClick={() => setActorSeleccionado(null)}
                          onChange={e => { setActorLibre(e.target.value); setActorSeleccionado(null); }}
                          style={{ flex: 1, fontSize: '0.875rem', borderBottom: '1px solid rgba(255,255,255,0.2)', outline: 'none', background: 'transparent', color: 'white', padding: '2px 0' }} />
                      </label>
                    </div>
                  ) : (
                    <input type="text" placeholder="Nombre del responsable (opcional)"
                      value={actorLibre}
                      onChange={e => setActorLibre(e.target.value)}
                      className="corp-input" />
                  )}
                </div>
              )}

              {fechaTermino && nuevoEstado !== estadoActualId && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, marginBottom: 16, fontSize: '0.875rem' }}>
                  <Clock style={{ width: 16, height: 16, color: '#FCD34D', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ color: '#FCD34D' }}>
                    <p style={{ margin: 0 }}>Plazo SLA: debe completarse antes del</p>
                    <p style={{ fontWeight: 700, marginTop: 2 }}>
                      {fechaTermino.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button onClick={() => { setModalCambiarEstado(null); setValoresCampos({}); }} disabled={procesando}
                  style={{ padding: '8px 16px', color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={handleCambiarEstado}
                  disabled={procesando || (!usarFallback && nuevoEstado === estadoActualId)}
                  style={{ padding: '8px 16px', background: 'var(--dpo-color-primario, #6366F1)', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', opacity: (procesando || (!usarFallback && nuevoEstado === estadoActualId)) ? 0.5 : 1 }}>
                  {procesando ? 'Guardando...' : 'Confirmar cambio'}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════
          MODAL RECHAZAR SOLICITUD
      ══════════════════════════════════════════════════ */}
      {modalRechazar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, maxWidth: 480, width: '100%', padding: 24, boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flexShrink: 0, width: 40, height: 40, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <XCircle style={{ width: 20, height: 20, color: '#FCA5A5' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', margin: 0 }}>Rechazar solicitud</h3>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{getFieldValue(modalRechazar, 'numero_solicitud')} — {getFieldValue(modalRechazar, 'nombre_completo')}</p>
              </div>
            </div>

            <div style={{ marginBottom: 16, padding: '10px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, fontSize: '0.75rem', color: '#FCA5A5', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
              Esta acción es irreversible. El estado quedará bloqueado y se enviará un email al titular.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>
                  Causal de rechazo <span style={{ color: '#FCA5A5' }}>*</span>
                </label>
                <select
                  value={causalRechazo}
                  onChange={e => setCausalRechazo(e.target.value)}
                  className="corp-input">
                  <option value="">— Selecciona una causal —</option>
                  <option value="Solicitud improcedente">Solicitud improcedente</option>
                  <option value="Identidad no verificable">Identidad no verificable</option>
                  <option value="Solicitud duplicada">Solicitud duplicada</option>
                  <option value="Desistimiento del titular">Desistimiento del titular</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>
                  Nota explicativa <span style={{ color: '#FCA5A5' }}>*</span>
                  <span style={{ marginLeft: 4, fontWeight: 400, color: 'rgba(255,255,255,0.35)', fontSize: '0.8125rem' }}>(mínimo 20 caracteres)</span>
                </label>
                <textarea
                  rows={4}
                  value={notaRechazo}
                  onChange={e => setNotaRechazo(e.target.value)}
                  placeholder="Explica el motivo del rechazo con detalle suficiente para el titular..."
                  className="corp-input"
                  style={{ resize: 'none', borderColor: notaRechazo.length > 0 && notaRechazo.trim().length < 20 ? 'rgba(239,68,68,0.6)' : undefined }}
                />
                <p style={{ fontSize: '0.75rem', marginTop: 4, color: notaRechazo.trim().length >= 20 ? '#6EE7B7' : 'rgba(255,255,255,0.35)' }}>
                  {notaRechazo.trim().length} / 20 caracteres mínimos
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button
                onClick={() => setModalRechazar(null)}
                disabled={procesando}
                style={{ padding: '8px 16px', color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button
                onClick={handleConfirmarRechazo}
                disabled={procesando || !causalRechazo || notaRechazo.trim().length < 20}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(239,68,68,0.85)', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', opacity: (procesando || !causalRechazo || notaRechazo.trim().length < 20) ? 0.5 : 1 }}>
                <XCircle style={{ width: 16, height: 16 }} />
                {procesando ? 'Rechazando...' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MODAL MARCAR RESUELTA
      ══════════════════════════════════════════════════ */}
      {modalResuelta && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, maxWidth: 480, width: '100%', padding: 24, boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', margin: '0 0 20px' }}>Marcar como Resuelta</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>URL de descarga <span style={{ color: '#FCA5A5' }}>*</span></label>
                <input type="url" value={urlDescarga} onChange={e => setUrlDescarga(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="corp-input" />
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>URL donde el titular puede descargar sus datos</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>Formato entregado</label>
                <select value={formatoEntregado} onChange={e => setFormatoEntregado(e.target.value)}
                  className="corp-input">
                  <option>PDF</option>
                  <option>CSV</option>
                  <option>JSON</option>
                  <option>XML</option>
                  <option>Físico</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalResuelta(null)} disabled={procesando}
                style={{ padding: '8px 16px', color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleMarcarResuelta} disabled={procesando || !urlDescarga.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', opacity: (procesando || !urlDescarga.trim()) ? 0.5 : 1 }}>
                <CheckCircle style={{ width: 16, height: 16 }} />
                {procesando ? 'Enviando...' : 'Marcar Resuelta y Enviar Email'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PanelDPO;