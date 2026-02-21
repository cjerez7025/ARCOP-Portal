// ============================================================
// PanelDPO.jsx — v3
// Agrega selector de actor responsable al cambiar a un estado
// que tenga actores configurados en el flujo
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Filter, Loader, X, CheckCircle, Clock, User } from 'lucide-react';
import { obtenerTodasSolicitudes, actualizarSolicitud, marcarComoResuelta } from '../services/dpoService';
import SolicitudesTable from '../components/SolicitudesTable';
import { ESTADOS, ESTADO_LABELS } from '../utils/constants';
import { toast } from 'react-toastify';
import { obtenerFlujoConfig } from '../services/flujoService';

const PanelDPO = () => {
  const location = useLocation();

  const [solicitudes,         setSolicitudes]         = useState([]);
  const [loading,             setLoading]             = useState(true);
  const [filtros,             setFiltros]             = useState({ estado: '', busqueda: '' });
  const [filtroEspecial,      setFiltroEspecial]      = useState(null);

  const [modalDetalle,        setModalDetalle]        = useState(null);
  const [modalCambiarEstado,  setModalCambiarEstado]  = useState(null);
  const [nuevoEstado,         setNuevoEstado]         = useState('');
  const [actorSeleccionado,   setActorSeleccionado]   = useState(null);   // { nombre, email } | null
  const [actorLibre,          setActorLibre]          = useState('');     // texto libre si no hay actores
  const [actoresDisponibles,  setActoresDisponibles]  = useState([]);     // actores del estado destino
  const [flujoConfig,         setFlujoConfig]         = useState(null);   // flujo completo cargado

  const [modalResuelta,       setModalResuelta]       = useState(null);
  const [urlDescarga,         setUrlDescarga]         = useState('');
  const [formatoEntregado,    setFormatoEntregado]    = useState('PDF');
  const [procesando,          setProcesando]          = useState(false);

  // ── Leer filtro desde Dashboard ────────────────────────────
  useEffect(() => {
    if (location.state?.filtro) {
      setFiltroEspecial(location.state.filtro);
      setFiltros({ estado: '', busqueda: '' });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => { cargarSolicitudes(); }, []);

  // Cargar flujoConfig una sola vez
  useEffect(() => {
    obtenerFlujoConfig().then(r => {
      if (r.status === 'success') setFlujoConfig(r.data);
    }).catch(() => {});
  }, []);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      const result = await obtenerTodasSolicitudes(filtros);
      if (result.status === 'success') setSolicitudes(result.data || []);
      else toast.error('Error al cargar solicitudes');
    } catch { toast.error('Error al cargar solicitudes'); }
    finally { setLoading(false); }
  };

  const handleAplicarFiltros = () => cargarSolicitudes();

  // ── Solicitudes filtradas ──────────────────────────────────
  const solicitudesFiltradas = (() => {
    if (!filtroEspecial) return solicitudes;
    if (filtroEspecial.por_vencer) {
      const limite = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      return solicitudes.filter(s => {
        const fl = new Date(s.fecha_limite);
        return s.estado !== 'RESUELTA' && s.estado !== 'CERRADA' && fl < limite;
      });
    }
    if (filtroEspecial.sin_asignar) return solicitudes.filter(s => !s.asignado_a && s.estado !== 'CERRADA' && s.estado !== 'RESUELTA');
    if (filtroEspecial.estado) return solicitudes.filter(s => s.estado === filtroEspecial.estado);
    return solicitudes;
  })();

  // ── Helpers ────────────────────────────────────────────────
  const getFieldValue = (obj, fieldName) => {
    if (!obj) return '';
    for (const k of [fieldName, fieldName.toUpperCase(), fieldName.toLowerCase()]) {
      if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
    }
    return '';
  };

  const getSolicitudId = (solicitud) => {
    if (!solicitud) return null;
    for (const campo of ['id', 'ID', 'Id']) {
      const v = solicitud[campo];
      if (v && v.toString().trim()) return v.toString().trim();
    }
    for (const campo of ['numero_solicitud', 'NUMERO_SOLICITUD']) {
      const v = solicitud[campo];
      if (v && v.toString().trim()) return v.toString().trim();
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

  // Obtener actores configurados para un estado y tipo de solicitud
  const getActoresParaEstado = (estadoId, tipoSolicitud) => {
    if (!flujoConfig) return [];
    const tipo    = (tipoSolicitud || 'ACCESO').toUpperCase();
    const estados = flujoConfig.derechos?.[tipo]?.estados || [];
    const estado  = estados.find(e => e.id === estadoId);
    return estado?.actores || [];
  };

  // Calcular fecha de término según SLA del estado
  const getFechaTerminoSLA = (estadoId, tipoSolicitud) => {
    if (!flujoConfig) return null;
    const tipo    = (tipoSolicitud || 'ACCESO').toUpperCase();
    const estados = flujoConfig.derechos?.[tipo]?.estados || [];
    const estado  = estados.find(e => e.id === estadoId);
    const slaDias = estado?.sla_dias || 0;
    if (!slaDias) return null;
    // Calcular días hábiles desde hoy
    let dias = slaDias;
    const fecha = new Date();
    while (dias > 0) {
      fecha.setDate(fecha.getDate() + 1);
      const dow = fecha.getDay();
      if (dow !== 0 && dow !== 6) dias--; // excluye sábado y domingo
    }
    return fecha;
  };

  // ── Handlers ───────────────────────────────────────────────
  const handleVerDetalle = (solicitud) => setModalDetalle(solicitud);
  const handleCerrarDetalle = () => setModalDetalle(null);

  const handleAbrirCambiarEstado = (solicitud) => {
    const estadoActualId   = getFieldValue(solicitud, 'estado') || 'PENDIENTE';
    const tipo             = (getFieldValue(solicitud, 'tipo') || 'ACCESO').toUpperCase();
    const estadosDerecho   = flujoConfig?.derechos?.[tipo]?.estados || [];
    const defActual        = estadosDerecho.find(e => e.id === estadoActualId);
    const transIds         = defActual?.transiciones_posibles || [];
    const primerDestino    = transIds[0] || estadoActualId;

    setModalCambiarEstado(solicitud);
    setNuevoEstado(primerDestino);
    setActorSeleccionado(null);
    setActorLibre('');
    setActoresDisponibles(getActoresParaEstado(primerDestino, tipo));
  };

  // Cuando cambia el estado destino, actualizar lista de actores
  const handleCambioEstadoDestino = (estadoId) => {
    setNuevoEstado(estadoId);
    setActorSeleccionado(null);
    setActorLibre('');
    const tipo = getFieldValue(modalCambiarEstado, 'tipo') || 'ACCESO';
    setActoresDisponibles(getActoresParaEstado(estadoId, tipo));
  };

  const handleCambiarEstado = async () => {
    if (!modalCambiarEstado || !nuevoEstado) {
      toast.error('Selecciona un estado válido');
      return;
    }

    // Determinar quién queda asignado
    let asignadoNombre = '';
    let asignadoEmail  = '';
    if (actorSeleccionado) {
      asignadoNombre = actorSeleccionado.nombre;
      asignadoEmail  = actorSeleccionado.email;
    } else if (actorLibre.trim()) {
      asignadoNombre = actorLibre.trim();
    }

    // Calcular fechas SLA
    const tipo         = getFieldValue(modalCambiarEstado, 'tipo') || 'ACCESO';
    const fechaTermino = getFechaTerminoSLA(nuevoEstado, tipo);

    try {
      setProcesando(true);
      const id = getSolicitudId(modalCambiarEstado);
      if (!id) { toast.error('No se pudo obtener el ID'); return; }

      const result = await actualizarSolicitud(id, {
        estado:             nuevoEstado,
        asignado_a:         asignadoNombre,
        asignado_email:     asignadoEmail,
        asignado_en:        new Date().toISOString(),
        fecha_entrada_estado: new Date().toISOString(),
        fecha_termino_sla:  fechaTermino ? fechaTermino.toISOString() : '',
      });

      if (result.status === 'success') {
        const msg = asignadoNombre
          ? `✅ Estado actualizado y asignado a ${asignadoNombre}`
          : '✅ Estado actualizado correctamente';
        toast.success(msg);
        setModalCambiarEstado(null);
        await cargarSolicitudes();
      } else {
        toast.error('Error al actualizar estado: ' + (result.message || ''));
      }
    } catch { toast.error('Error al actualizar estado'); }
    finally { setProcesando(false); }
  };

  const handleAbrirMarcarResuelta = (solicitud) => {
    setModalResuelta(solicitud);
    setUrlDescarga('');
    setFormatoEntregado('PDF');
  };

  const handleMarcarResuelta = async () => {
    if (!modalResuelta || !urlDescarga.trim()) {
      toast.error('Ingresa la URL de descarga');
      return;
    }
    try {
      setProcesando(true);
      const id = getSolicitudId(modalResuelta);
      if (!id) { toast.error('No se pudo obtener el ID'); return; }
      const result = await marcarComoResuelta(id, urlDescarga, formatoEntregado);
      if (result.status === 'success') {
        toast.success('✅ Solicitud resuelta. Email enviado al usuario.');
        setModalResuelta(null);
        await cargarSolicitudes();
      } else {
        toast.error('Error: ' + (result.message || ''));
      }
    } catch { toast.error('Error al marcar como resuelta'); }
    finally { setProcesando(false); }
  };

  // ── Render ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel DPO</h1>
          <p className="text-gray-600">Gestión de solicitudes de derechos ARCOP</p>
        </div>

        {/* Banner filtro especial */}
        {filtroEspecial && (
          <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <span className="text-sm text-blue-700 font-medium">
              {filtroEspecial.por_vencer  && '🔴 Filtrando: Solicitudes por vencer (próximos 3 días)'}
              {filtroEspecial.sin_asignar && '🟡 Filtrando: Solicitudes sin asignar'}
              {filtroEspecial.estado === 'PENDIENTE' && '🔵 Filtrando: Pendientes de validación'}
            </span>
            <button onClick={() => setFiltroEspecial(null)}
              className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium underline">
              Ver todas
            </button>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" /> Buscar
              </label>
              <input type="text" value={filtros.busqueda}
                onChange={e => setFiltros({ ...filtros, busqueda: e.target.value })}
                onKeyPress={e => e.key === 'Enter' && handleAplicarFiltros()}
                placeholder="Nombre, RUT o email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" /> Estado
              </label>
              <select value={filtros.estado}
                onChange={e => setFiltros({ ...filtros, estado: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">Todos los estados</option>
                {Object.entries(ESTADO_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <button onClick={handleAplicarFiltros}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Aplicar filtros
          </button>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow-sm">
          <SolicitudesTable
            solicitudes={solicitudesFiltradas}
            onVerDetalle={handleVerDetalle}
            onCambiarEstado={handleAbrirCambiarEstado}
            onMarcarResuelta={handleAbrirMarcarResuelta}
          />
        </div>

      </div>

      {/* ── Modal Detalle ─────────────────────────────────── */}
      {modalDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-gray-900">Detalle de Solicitud</h3>
              <button onClick={handleCerrarDetalle} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Nombre', 'nombre_completo'],
                ['RUT', 'rut'],
                ['Email', 'email'],
                ['Teléfono', 'telefono'],
                ['Estado', 'estado'],
                ['Tipo', 'tipo'],
                ['Fecha Solicitud', 'fecha_solicitud'],
                ['Fecha Límite', 'fecha_limite'],
              ].map(([label, field]) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700">{label}</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {field.includes('fecha') ? formatearFecha(getFieldValue(modalDetalle, field)) : (getFieldValue(modalDetalle, field) || 'N/A')}
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
            {getFieldValue(modalDetalle, 'notas_dpo') && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Notas DPO</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {getFieldValue(modalDetalle, 'notas_dpo')}
                </p>
              </div>
            )}
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => { handleCerrarDetalle(); handleAbrirCambiarEstado(modalDetalle); }}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium">
                Cambiar Estado
              </button>
              <button onClick={handleCerrarDetalle}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Cambiar Estado ──────────────────────────── */}
      {modalCambiarEstado && (() => {
        const tipo             = (getFieldValue(modalCambiarEstado, 'tipo') || 'ACCESO').toUpperCase();
        const estadoActualId   = getFieldValue(modalCambiarEstado, 'estado') || 'PENDIENTE';
        const numero           = getFieldValue(modalCambiarEstado, 'numero_solicitud') || getFieldValue(modalCambiarEstado, 'NUMERO_SOLICITUD');
        const nombreTitular    = getFieldValue(modalCambiarEstado, 'nombre_completo');

        // Obtener estados del flujo del tipo correcto
        const estadosDerecho   = flujoConfig?.derechos?.[tipo]?.estados || [];
        const defActual        = estadosDerecho.find(e => e.id === estadoActualId);
        // Transiciones posibles desde el estado actual
        const transicionesIds  = defActual?.transiciones_posibles || [];
        const estadosDestino   = estadosDerecho.filter(e => transicionesIds.includes(e.id) && e.activo);
        // Si no hay flujoConfig o no hay transiciones, mostrar selector completo como fallback
        const usarFallback     = estadosDestino.length === 0;

        const fechaTermino     = getFechaTerminoSLA(nuevoEstado, tipo);
        const hayActores       = actoresDisponibles.length > 0;

        // Campos requeridos del estado destino (campos_transicion del destino)
        const defDestino       = estadosDerecho.find(e => e.id === nuevoEstado);
        const camposDestino    = defDestino?.campos_transicion || [];

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

              <h3 className="text-xl font-bold text-gray-900 mb-1">Cambiar Estado</h3>
              <p className="text-sm text-gray-500 mb-5">
                Solicitud <span className="font-semibold text-gray-700">{numero}</span>
                {nombreTitular && <> — <span className="font-semibold text-gray-700">{nombreTitular}</span></>}
                {' '}— Tipo: <span className="font-semibold text-gray-700">{tipo}</span>
              </p>

              {/* Estado actual */}
              <div className="mb-4 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                Estado actual: <strong className="text-gray-800">{defActual?.nombre || estadoActualId}</strong>
              </div>

              {/* Selector de estado destino */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mover a estado</label>
                {usarFallback ? (
                  // Fallback si no hay flujoConfig cargado
                  <select value={nuevoEstado} onChange={e => handleCambioEstadoDestino(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    {['PENDIENTE','VALIDADA','EN_PROCESO','RESUELTA','CERRADA'].map(id => (
                      <option key={id} value={id}>{id}</option>
                    ))}
                  </select>
                ) : (
                  // Opciones dinámicas desde el flujo configurado
                  <div className="space-y-2">
                    {estadosDestino.map(est => {
                      const seleccionado = nuevoEstado === est.id;
                      return (
                        <label key={est.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            seleccionado ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}>
                          <input type="radio" name="estadoDestino" className="w-4 h-4 accent-blue-600"
                            checked={seleccionado}
                            onChange={() => handleCambioEstadoDestino(est.id)} />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">{est.nombre}</p>
                            {est.descripcion && <p className="text-xs text-gray-500 mt-0.5">{est.descripcion}</p>}
                          </div>
                          {est.envia_email && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Email titular</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Asignación de actor ── */}
              {nuevoEstado && nuevoEstado !== estadoActualId && (
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
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{actor.nombre}</p>
                            {actor.email && <p className="text-xs text-gray-500">{actor.email}</p>}
                          </div>
                        </label>
                      ))}
                      {/* Opción "Otro" */}
                      <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        !actorSeleccionado && actorLibre
                          ? 'border-indigo-500 bg-white'
                          : 'border-transparent bg-white/60 hover:bg-white'
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

              {/* Info SLA */}
              {fechaTermino && nuevoEstado !== estadoActualId && (
                <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 text-sm">
                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-amber-700">
                    <p>Plazo SLA del estado <strong>{defDestino?.nombre}</strong>: debe completarse antes del</p>
                    <p className="font-bold text-amber-800 mt-0.5">
                      {fechaTermino.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">Se notificará al responsable asignado por email.</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button onClick={() => setModalCambiarEstado(null)} disabled={procesando}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">
                  Cancelar
                </button>
                <button onClick={handleCambiarEstado}
                  disabled={procesando || (!usarFallback && nuevoEstado === estadoActualId)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                  {procesando ? 'Guardando...' : 'Confirmar cambio'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Modal Marcar Resuelta ─────────────────────────── */}
      {modalResuelta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Marcar como Resuelta</h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL de Descarga *</label>
                <input type="url" value={urlDescarga} onChange={e => setUrlDescarga(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-gray-500 mt-1">URL donde el usuario puede descargar sus datos</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Formato Entregado</label>
                <select value={formatoEntregado} onChange={e => setFormatoEntregado(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="PDF">PDF</option>
                  <option value="CSV">CSV</option>
                  <option value="JSON">JSON</option>
                  <option value="XML">XML</option>
                  <option value="Físico">Físico / Presencial</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setModalResuelta(null)} disabled={procesando}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">
                Cancelar
              </button>
              <button onClick={handleMarcarResuelta} disabled={procesando || !urlDescarga.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
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