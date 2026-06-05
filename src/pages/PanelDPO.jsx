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
  const base = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white';

  const [modoUrl,      setModoUrl]      = useState('url');   // 'url' | 'archivo'
  const [subiendo,     setSubiendo]     = useState(false);
  const [archivoNombre, setArchivoNombre] = useState('');

  switch (campo.tipo) {
    case 'url':
      return (
        <div className="space-y-2">
          <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg w-fit">
            <button type="button"
              onClick={() => setModoUrl('url')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                modoUrl === 'url' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              Ingresar URL
            </button>
            <button type="button"
              onClick={() => setModoUrl('archivo')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                modoUrl === 'archivo' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
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
                <div className="flex items-center gap-2 px-3 py-2 border border-green-300 rounded-lg bg-green-50">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-green-800 flex-1 truncate">{archivoNombre}</span>
                  <button type="button"
                    onClick={() => { setArchivoNombre(''); onChange(campo.id, ''); }}
                    className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0">
                    Cambiar
                  </button>
                </div>
              ) : (
                <label className={`block cursor-pointer ${subiendo ? 'pointer-events-none opacity-60' : ''}`}>
                  <div className="flex items-center gap-2 px-3 py-2.5 text-sm border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 bg-gray-50 hover:bg-blue-50 transition-all">
                    {subiendo
                      ? <><Loader className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" /><span className="text-gray-500">Subiendo...</span></>
                      : <><Upload className="w-4 h-4 text-gray-400 flex-shrink-0" /><span className="text-gray-400">Haz clic para seleccionar un archivo</span></>
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
              <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOC, DOCX — máx. 5 MB</p>
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
            <div style={{ height: 10, width: 60, background: '#E5E7EB', borderRadius: 4, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ height: 28, width: 160, background: '#E5E7EB', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        </div>
        <div className="corp-card" style={{ padding: 16, marginBottom: 24 }}>
          <div style={{ height: 36, background: '#F3F4F6', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
        <div className="corp-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 24 }}>
            {['60px', '120px', '80px', '140px', '80px', '80px', '80px'].map((w, i) => (
              <div key={i} style={{ height: 12, width: w, background: '#F3F4F6', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '16px 20px', borderBottom: '1px solid #F9FAFB' }}>
              <div style={{ height: 16, width: 24, background: '#F3F4F6', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: 16, width: 120, background: '#F3F4F6', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: 16, width: 80, background: '#F3F4F6', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: 22, width: 80, background: '#EFF6FF', borderRadius: 20, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: 16, width: 100, background: '#F3F4F6', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: 32, width: 60, background: '#F3F4F6', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
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
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1D4ED8', marginBottom: 4 }}>Zona DPO</p>
            <h1 style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>Solicitudes</h1>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
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
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9CA3AF' }} />
              <input type="text" placeholder="Buscar por nombre, RUT, email o número..."
                value={filtros.busqueda}
                onChange={e => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                className="corp-input" style={{ paddingLeft: 40 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter style={{ width: 16, height: 16, color: '#9CA3AF', flexShrink: 0 }} />
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
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#DC2626', border: '1px solid rgba(220,38,38,0.3)', padding: '6px 10px', borderRadius: 6, background: 'none', cursor: 'pointer' }}>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,36,99,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-gray-900">Detalle de Solicitud</h3>
              <button onClick={handleCerrarDetalle} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-500">{label}</label>
                  <p className="mt-1 text-sm text-gray-900 font-medium">
                    {field.includes('fecha')
                      ? formatearFecha(getFieldValue(modalDetalle, field))
                      : (getFieldValue(modalDetalle, field) || '—')}
                  </p>
                </div>
              ))}
            </div>

            {/* Datos específicos de la solicitud */}
            {getFieldValue(modalDetalle, 'dato_incorrecto') && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <label className="block text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-1">Dato a rectificar</label>
                <p className="text-sm text-gray-900">{getFieldValue(modalDetalle, 'dato_incorrecto')}</p>
                {getFieldValue(modalDetalle, 'valor_correcto') && (
                  <>
                    <label className="block text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-1 mt-3">Valor correcto</label>
                    <p className="text-sm text-gray-900">{getFieldValue(modalDetalle, 'valor_correcto')}</p>
                  </>
                )}
              </div>
            )}

            {getFieldValue(modalDetalle, 'asignado_a') && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  Asignado a: {getFieldValue(modalDetalle, 'asignado_a')}
                </span>
              </div>
            )}
            {getFieldValue(modalDetalle, 'fecha_termino_sla') && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-700">
                  SLA vence: <strong>{formatearFecha(getFieldValue(modalDetalle, 'fecha_termino_sla'))}</strong>
                </span>
              </div>
            )}
            {getFieldValue(modalDetalle, 'notas_dpo') && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500 mb-1">Notas DPO</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {getFieldValue(modalDetalle, 'notas_dpo')}
                </p>
              </div>
            )}

            {/* ── Archivos adjuntos ── */}
            {modalDetalle.documentacion_archivos && modalDetalle.documentacion_archivos.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500 mb-2">📎 Documentación adjunta</label>
                <div className="space-y-2">
                  {modalDetalle.documentacion_archivos.map((arch, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">
                          {arch.tipo?.includes('pdf') ? '📕' : arch.tipo?.includes('image') ? '🖼️' : '📄'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{arch.nombre}</p>
                          <p className="text-xs text-gray-400">
                            {arch.tamaño ? (arch.tamaño / 1024).toFixed(0) + ' KB' : ''} · {arch.tipo?.split('/')[1]?.toUpperCase() || ''}
                          </p>
                        </div>
                      </div>
                      <a href={arch.url} target="_blank" rel="noopener noreferrer" download={arch.nombre}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 flex-shrink-0">
                        ⬇ Descargar
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6 justify-between">
              <div>
                {!ESTADOS_FINALES_RECHAZO.has(getFieldValue(modalDetalle, 'estado')) && (
                  <button onClick={() => { handleCerrarDetalle(); handleAbrirRechazar(modalDetalle); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm">
                    <XCircle className="w-4 h-4" />
                    Rechazar solicitud
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { handleCerrarDetalle(); handleAbrirCambiarEstado(modalDetalle); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
                  Cambiar Estado
                </button>
                <button onClick={handleCerrarDetalle}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm">
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
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,36,99,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
            <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

              <h3 className="text-xl font-bold text-gray-900 mb-1">Cambiar Estado</h3>
              <p className="text-sm text-gray-500 mb-5">
                {numero && <><span className="font-semibold text-gray-700">{numero}</span> — </>}
                {nombreTitular && <><span className="font-semibold text-gray-700">{nombreTitular}</span> — </>}
                <span className="font-semibold text-gray-700">{tipo}</span>
              </p>

              <div className="mb-4 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                Estado actual: <strong className="text-gray-800">{defActual?.nombre || estadoActualId}</strong>
              </div>

              {esEstadoFinal && tieneFlujoCargado && (
                <div className="mb-4 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  Este estado es final. No hay transiciones disponibles en el flujo configurado.
                </div>
              )}

              {destinoUnico && !esEstadoFinal && (() => {
                const dest = estadosDestino[0];
                return (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Mover a estado</p>
                    <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-blue-500 bg-blue-50">
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-blue-800">{dest.nombre}</p>
                        {dest.descripcion && (
                          <p className="text-xs text-blue-600 mt-0.5">{dest.descripcion}</p>
                        )}
                      </div>
                      {dest.envia_email && (
                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full flex-shrink-0">
                          Email titular
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 pl-1">
                      Siguiente paso definido por el flujo configurado para {tipo}.
                    </p>
                  </div>
                );
              })()}

              {variosDestinos && !esEstadoFinal && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mover a estado</label>
                  <div className="space-y-2">
                    {estadosDestino.map(est => {
                      const sel = (nuevoEstado || '').toUpperCase() === est.id;
                      return (
                        <label key={est.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            sel ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                          }`}>
                          <input type="radio" name="estadoDestino" className="w-4 h-4 accent-blue-600"
                            checked={sel} onChange={() => handleCambioEstadoDestino(est.id)} />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">{est.nombre}</p>
                            {est.descripcion && <p className="text-xs text-gray-500 mt-0.5">{est.descripcion}</p>}
                          </div>
                          {est.envia_email && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex-shrink-0">
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
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mover a estado</label>
                  <div className="mb-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    Flujo no configurado para {tipo}. Selecciona el estado manualmente.
                  </div>
                  <select value={nuevoEstado} onChange={e => handleCambioEstadoDestino(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                    <option value="">— Selecciona estado destino —</option>
                    {['PENDIENTE','VALIDADA','EN_PROCESO','RESUELTA','CERRADA'].map(id => (
                      <option key={id} value={id} disabled={id === estadoActualId}>{id}</option>
                    ))}
                  </select>
                </div>
              )}

              {hayCampos && nuevoEstado !== estadoActualId && (
                <div className="mb-4 border border-violet-200 rounded-xl p-4 bg-violet-50 space-y-4">
                  <p className="text-xs font-bold text-violet-700 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Información requerida para esta transición
                  </p>
                  {camposDestino.map(campo => {
                    if (campo.tipo === 'checkbox') {
                      return (
                        <div key={campo.id}>
                          <label className="flex items-start gap-2 cursor-pointer group">
                            <input type="checkbox"
                              checked={!!valoresCampos[campo.id]}
                              onChange={e => handleCampoTransicion(campo.id, e.target.checked)}
                              className="w-4 h-4 mt-0.5 accent-violet-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700 group-hover:text-gray-900">
                              {campo.label}
                              {campo.obligatorio && <span className="text-rose-500 ml-1">*</span>}
                            </span>
                          </label>
                          {campo.ayuda && (
                            <p className="text-xs text-gray-400 mt-1 ml-6">{campo.ayuda}</p>
                          )}
                        </div>
                      );
                    }
                    return (
                      <div key={campo.id}>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                          {iconoCampo(campo.tipo)}
                          {campo.label}
                          {campo.obligatorio && <span className="text-rose-500">*</span>}
                        </label>
                        {campo.ayuda && (
                          <p className="text-xs text-gray-400 mb-1.5">{campo.ayuda}</p>
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
                <div className="border border-blue-200 rounded-xl p-4 bg-blue-50 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-semibold text-blue-800">Responsable de la actividad</h4>
                    {!hayActores && <span className="text-xs text-blue-400">(opcional)</span>}
                  </div>

                  {hayActores ? (
                    <div className="space-y-2">
                      {actoresDisponibles.map((actor, i) => (
                        <label key={i}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            actorSeleccionado?.email === actor.email
                              ? 'border-blue-500 bg-white'
                              : 'border-transparent bg-white/60 hover:bg-white'
                          }`}>
                          <input type="radio" name="actor" className="w-4 h-4 accent-blue-600"
                            checked={actorSeleccionado?.email === actor.email}
                            onChange={() => { setActorSeleccionado(actor); setActorLibre(''); }} />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">{actor.nombre}</p>
                            <p className="text-xs text-gray-500">{actor.email}</p>
                          </div>
                          {actor.rol && (
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                              {actor.rol}
                            </span>
                          )}
                        </label>
                      ))}
                      <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        !actorSeleccionado && !!actorLibre ? 'border-blue-500 bg-white' : 'border-transparent bg-white/60 hover:bg-white'
                      }`}>
                        <input type="radio" name="actor" className="w-4 h-4 accent-blue-600"
                          checked={!actorSeleccionado && !!actorLibre}
                          onChange={() => setActorSeleccionado(null)} />
                        <input type="text" placeholder="Otro responsable..."
                          value={actorLibre}
                          onClick={() => setActorSeleccionado(null)}
                          onChange={e => { setActorLibre(e.target.value); setActorSeleccionado(null); }}
                          className="flex-1 text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent py-0.5" />
                      </label>
                    </div>
                  ) : (
                    <input type="text" placeholder="Nombre del responsable (opcional)"
                      value={actorLibre}
                      onChange={e => setActorLibre(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none" />
                  )}
                </div>
              )}

              {fechaTermino && nuevoEstado !== estadoActualId && (
                <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 text-sm">
                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-amber-700">
                    <p>Plazo SLA: debe completarse antes del</p>
                    <p className="font-bold text-amber-800 mt-0.5">
                      {fechaTermino.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button onClick={() => { setModalCambiarEstado(null); setValoresCampos({}); }} disabled={procesando}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium">
                  Cancelar
                </button>
                <button onClick={handleCambiarEstado}
                  disabled={procesando || (!usarFallback && nuevoEstado === estadoActualId)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm">
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,36,99,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Rechazar solicitud</h3>
                <p className="text-sm text-gray-500">{getFieldValue(modalRechazar, 'numero_solicitud')} — {getFieldValue(modalRechazar, 'nombre_completo')}</p>
              </div>
            </div>

            <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              Esta acción es irreversible. El estado quedará bloqueado y se enviará un email al titular.
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Causal de rechazo <span className="text-red-500">*</span>
                </label>
                <select
                  value={causalRechazo}
                  onChange={e => setCausalRechazo(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:outline-none bg-white">
                  <option value="">— Selecciona una causal —</option>
                  <option value="Solicitud improcedente">Solicitud improcedente</option>
                  <option value="Identidad no verificable">Identidad no verificable</option>
                  <option value="Solicitud duplicada">Solicitud duplicada</option>
                  <option value="Desistimiento del titular">Desistimiento del titular</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nota explicativa <span className="text-red-500">*</span>
                  <span className="ml-1 font-normal text-gray-400">(mínimo 20 caracteres)</span>
                </label>
                <textarea
                  rows={4}
                  value={notaRechazo}
                  onChange={e => setNotaRechazo(e.target.value)}
                  placeholder="Explica el motivo del rechazo con detalle suficiente para el titular..."
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none resize-none ${
                    notaRechazo.length > 0 && notaRechazo.trim().length < 20
                      ? 'border-red-400 focus:ring-red-300'
                      : 'border-gray-300 focus:ring-red-400'
                  }`}
                />
                <p className={`text-xs mt-1 ${
                  notaRechazo.trim().length >= 20 ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {notaRechazo.trim().length} / 20 caracteres mínimos
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setModalRechazar(null)}
                disabled={procesando}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium">
                Cancelar
              </button>
              <button
                onClick={handleConfirmarRechazo}
                disabled={procesando || !causalRechazo || notaRechazo.trim().length < 20}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium">
                <XCircle className="w-4 h-4" />
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,36,99,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Marcar como Resuelta</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">URL de descarga <span className="text-rose-500">*</span></label>
                <input type="url" value={urlDescarga} onChange={e => setUrlDescarga(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                <p className="text-xs text-gray-400 mt-1">URL donde el titular puede descargar sus datos</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Formato entregado</label>
                <select value={formatoEntregado} onChange={e => setFormatoEntregado(e.target.value)}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                  <option>PDF</option>
                  <option>CSV</option>
                  <option>JSON</option>
                  <option>XML</option>
                  <option>Físico</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setModalResuelta(null)} disabled={procesando}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium">
                Cancelar
              </button>
              <button onClick={handleMarcarResuelta} disabled={procesando || !urlDescarga.trim()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
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