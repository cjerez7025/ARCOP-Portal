// ============================================================
// PanelDPO.jsx — v4.1
// CORRECCIONES sobre v4.0:
//   1. getFieldValue: fallback tipo_derecho → tipo (datos legacy Firestore)
//   2. Modal detalle: campo 'tipo' → 'tipo_derecho'
//   3. handleAbrirCambiarEstado: lee tipo_derecho con fallback
//   4. handleCambioEstadoDestino: idem
//   5. handleCambiarEstado: idem
//   6. Modal cambiar estado (render): idem
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Filter, Loader, X, CheckCircle, Clock, User, AlertTriangle, Link, AlignLeft, ToggleLeft, ChevronDown } from 'lucide-react';
import { obtenerTodasSolicitudes, actualizarSolicitud, marcarComoResuelta } from '../services/dpoService';
import SolicitudesTable from '../components/SolicitudesTable';
import { ESTADOS, ESTADO_LABELS } from '../utils/constants';
import { toast } from 'react-toastify';
import { obtenerFlujoConfig, buildConfigDefault } from '../services/flujoService';

// ── Render de un campo de transición ─────────────────────
const CampoTransicion = ({ campo, value, onChange }) => {
  const base = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white';

  switch (campo.tipo) {
    case 'url':
      return (
        <input type="url" value={value || ''} onChange={e => onChange(campo.id, e.target.value)}
          placeholder={campo.placeholder || 'https://...'}
          className={base} />
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
  if (tipo === 'url')      return <Link className="w-3.5 h-3.5" />;
  if (tipo === 'textarea') return <AlignLeft className="w-3.5 h-3.5" />;
  if (tipo === 'checkbox') return <ToggleLeft className="w-3.5 h-3.5" />;
  if (tipo === 'select')   return <ChevronDown className="w-3.5 h-3.5" />;
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
  // Inicializado con config por defecto para que el modal funcione inmediatamente
  // Se reemplaza con la config guardada en Sheets cuando carga
  const [flujoConfig,         setFlujoConfig]         = useState(() => buildConfigDefault());

  // NUEVO: valores de campos de transición capturados en el modal
  const [valoresCampos,       setValoresCampos]       = useState({});

  const [procesando,          setProcesando]          = useState(false);
  const [modalResuelta,       setModalResuelta]       = useState(null);
  const [urlDescarga,         setUrlDescarga]         = useState('');
  const [formatoEntregado,    setFormatoEntregado]    = useState('PDF');

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
    // Ordenar por fecha_solicitud descendente (más recientes primero)
    s.sort((a, b) => {
      const fa = a.fecha_solicitud ? new Date(a.fecha_solicitud).getTime() : 0;
      const fb = b.fecha_solicitud ? new Date(b.fecha_solicitud).getTime() : 0;
      return fb - fa;
    });
    return s;
  }, [solicitudes, filtros, filtroEspecial]);

  // ── Helpers ────────────────────────────────────────────

  // ▸ CORRECCIÓN v4.1: fallback tipo_derecho → tipo para datos legacy Firestore
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

  // ── Helpers de flujo (normalizados, sin race condition) ──

  // ID canónico: mayúsculas, sin espacios
  const normId = (s) => (s || '').toString().toUpperCase().trim();

  // Estados del flujo con IDs y transiciones completamente normalizados
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

  // Calcula fecha de término en días hábiles desde hoy
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
    // ▸ CORRECCIÓN v4.1: leer tipo_derecho con fallback a tipo legacy
    const tipo           = normId(getFieldValue(solicitud, 'tipo_derecho') || 'ACCESO');

    // Si flujoConfig aún no cargó, esperar a que lo haga antes de abrir el modal
    let config = flujoConfig;
    if (!config) {
      console.log('⏳ flujoConfig null — cargando antes de abrir modal...');
      try {
        const result = await obtenerFlujoConfig();
        if (result.status === 'success' && result.data) {
          config = result.data;
          setFlujoConfig(config);
          console.log('✅ flujoConfig cargado on-demand');
        } else {
          console.warn('⚠️ obtenerFlujoConfig falló on-demand:', result);
        }
      } catch (e) {
        console.error('❌ Error cargando flujoConfig on-demand:', e);
      }
    }

    // Resolver transiciones usando config local (no el state que puede estar desactualizado)
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

    console.log('🎯 Modal flujo —', tipo, estadoActualId, '→', primerDestino, '| destinos:', estadosDestino.map(e => e.id));

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
    // ▸ CORRECCIÓN v4.1: leer tipo_derecho con fallback
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

    // ── Validar campos de transición obligatorios ──────
    // ▸ CORRECCIÓN v4.1: leer tipo_derecho con fallback
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

    // ── Determinar actor asignado ──────────────────────
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

      // ── Payload completo hacia dpoService ─────────────
      console.log('🚀 handleCambiarEstado — nuevoEstado:', nuevoEstado, '| valoresCampos:', valoresCampos);

      // ── Si el estado destino es RESUELTA y hay url_datos,
      //    usar resolverSolicitud (marcarResuelta en backend) que ya
      //    envía el email correcto con botón de descarga.
      //    Para todos los demás estados, usar actualizarSolicitud normal.
      const esResueltaConUrl = nuevoEstado.toUpperCase() === 'RESUELTA' && valoresCampos.url_datos;

      let result;
      if (esResueltaConUrl) {
        console.log('📦 Ruta RESUELTA → marcarComoResuelta con url:', valoresCampos.url_datos);
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

  // ── Loading ────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Loader className="w-8 h-8 animate-spin" />
        <span className="text-sm font-medium">Cargando solicitudes...</span>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-indigo-500 mb-1">Zona DPO</p>
            <h1 className="text-2xl font-bold text-slate-900">Solicitudes</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {solicitudesFiltradas.length} de {solicitudes.length} solicitudes
            </p>
          </div>
          <button onClick={cargarDatos}
            className="flex items-center gap-1.5 text-sm text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-white transition-colors">
            Actualizar
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar por nombre, RUT, email o número..."
              value={filtros.busqueda}
              onChange={e => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select value={filtros.estado}
              onChange={e => { setFiltros(prev => ({ ...prev, estado: e.target.value })); setFiltroEspecial(null); }}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
              <option value="">Todos los estados</option>
              {Object.entries(ESTADO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            {(filtros.estado || filtros.busqueda || filtroEspecial) && (
              <button onClick={() => { setFiltros({ estado: '', busqueda: '' }); setFiltroEspecial(null); }}
                className="flex items-center gap-1 text-xs text-rose-500 border border-rose-200 px-2.5 py-1.5 rounded-lg hover:bg-rose-50">
                <X className="w-3 h-3" /> Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                ['Tipo',           'tipo_derecho'],   // ▸ CORRECCIÓN v4.1
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
            {getFieldValue(modalDetalle, 'asignado_a') && (
              <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-700">
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
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => { handleCerrarDetalle(); handleAbrirCambiarEstado(modalDetalle); }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm">
                Cambiar Estado
              </button>
              <button onClick={handleCerrarDetalle}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MODAL CAMBIAR ESTADO — v4.1 con tipo_derecho
      ══════════════════════════════════════════════════ */}
      {modalCambiarEstado && (() => {
        // ▸ CORRECCIÓN v4.1: leer tipo_derecho con fallback a tipo legacy
        const tipo           = normId(getFieldValue(modalCambiarEstado, 'tipo_derecho') || 'ACCESO');
        const estadoActualId = normId(getFieldValue(modalCambiarEstado, 'estado') || 'PENDIENTE');
        const numero         = getFieldValue(modalCambiarEstado, 'numero_solicitud');
        const nombreTitular  = getFieldValue(modalCambiarEstado, 'nombre_completo');

        // getEstadosDerecho ya normaliza id Y transiciones_posibles — fuente única de verdad
        const estadosDerecho  = getEstadosDerecho(tipo);
        const defActual       = estadosDerecho.find(e => e.id === estadoActualId);
        const transicionesIds = defActual?.transiciones_posibles || [];  // ya normalizados
        const estadosDestino  = estadosDerecho.filter(
          e => transicionesIds.includes(e.id) && e.activo !== false
        );

        // ── Lógica de presentación ──────────────────────────────
        const tieneFlujoCargado = !!flujoConfig && estadosDerecho.length > 0;
        const destinoUnico      = tieneFlujoCargado && estadosDestino.length === 1;
        const variosDestinos    = tieneFlujoCargado && estadosDestino.length > 1;
        // Fallback SOLO si no hay flujo cargado para este tipo
        const usarFallback      = !tieneFlujoCargado;

        // Estado final: es_final explícito O sin transiciones configuradas
        const esEstadoFinal = tieneFlujoCargado && (
          defActual?.es_final === true ||
          (!defActual && false) ||  // estado desconocido → no bloquear
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

              <h3 className="text-xl font-bold text-gray-900 mb-1">Cambiar Estado</h3>
              <p className="text-sm text-gray-500 mb-5">
                {numero && <><span className="font-semibold text-gray-700">{numero}</span> — </>}
                {nombreTitular && <><span className="font-semibold text-gray-700">{nombreTitular}</span> — </>}
                <span className="font-semibold text-gray-700">{tipo}</span>
              </p>

              {/* Estado actual */}
              <div className="mb-4 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                Estado actual: <strong className="text-gray-800">{defActual?.nombre || estadoActualId}</strong>
              </div>

              {/* ── Estado final: no hay a dónde ir ── */}
              {esEstadoFinal && tieneFlujoCargado && (
                <div className="mb-4 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  Este estado es final. No hay transiciones disponibles en el flujo configurado.
                </div>
              )}

              {/* ── Destino único: mostrar como info, sin selector ── */}
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

              {/* ── Varios destinos: radio buttons ── */}
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

              {/* ── Fallback: flujo no cargado, mostrar advertencia + selector básico ── */}
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

              {/* ── Campos de transición del estado destino ── */}
              {hayCampos && nuevoEstado !== estadoActualId && (
                <div className="mb-4 border border-violet-200 rounded-xl p-4 bg-violet-50 space-y-4">
                  <p className="text-xs font-bold text-violet-700 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Información requerida para esta transición
                  </p>
                  {camposDestino.map(campo => {
                    // Los campos tipo "checkbox" se renderizan de manera diferente
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
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Asignación de responsable ──
                   Muestra el bloque si:
                   - hay actores predefinidos en el estado destino (hayActores), O
                   - el estado destino tiene SLA (sla_dias > 0), lo que indica que requiere responsable
              */}
              {nuevoEstado && nuevoEstado !== estadoActualId && (hayActores || (defDestinoRender?.sla_dias > 0)) && (
                <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-sm font-semibold text-indigo-800">Responsable de la actividad</h4>
                    {!hayActores && <span className="text-xs text-indigo-400">(opcional)</span>}
                  </div>

                  {hayActores ? (
                    <div className="space-y-2">
                      {actoresDisponibles.map((actor, i) => (
                        <label key={i}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            actorSeleccionado?.email === actor.email
                              ? 'border-indigo-500 bg-white'
                              : 'border-transparent bg-white/60 hover:bg-white'
                          }`}>
                          <input type="radio" name="actor" className="w-4 h-4 accent-indigo-600"
                            checked={actorSeleccionado?.email === actor.email}
                            onChange={() => { setActorSeleccionado(actor); setActorLibre(''); }} />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">{actor.nombre}</p>
                            <p className="text-xs text-gray-500">{actor.email}</p>
                          </div>
                          {actor.rol && (
                            <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                              {actor.rol}
                            </span>
                          )}
                        </label>
                      ))}
                      {/* Opción texto libre */}
                      <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        !actorSeleccionado && !!actorLibre ? 'border-indigo-500 bg-white' : 'border-transparent bg-white/60 hover:bg-white'
                      }`}>
                        <input type="radio" name="actor" className="w-4 h-4 accent-indigo-600"
                          checked={!actorSeleccionado && !!actorLibre}
                          onChange={() => setActorSeleccionado(null)} />
                        <input type="text" placeholder="Otro responsable..."
                          value={actorLibre}
                          onClick={() => setActorSeleccionado(null)}
                          onChange={e => { setActorLibre(e.target.value); setActorSeleccionado(null); }}
                          className="flex-1 text-sm border-b border-gray-300 focus:border-indigo-500 focus:outline-none bg-transparent py-0.5" />
                      </label>
                    </div>
                  ) : (
                    <input type="text" placeholder="Nombre del responsable (opcional)"
                      value={actorLibre}
                      onChange={e => setActorLibre(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-indigo-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none" />
                  )}
                </div>
              )}

              {/* SLA info */}
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
          MODAL MARCAR RESUELTA
      ══════════════════════════════════════════════════ */}
      {modalResuelta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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