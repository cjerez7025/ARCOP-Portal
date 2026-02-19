// ============================================================
// PANEL DPO v5 — consume grafo de transiciones enriquecido
//
// El modal de cambio de estado:
// 1. Lee el tipo de la solicitud → carga el flujo correcto
// 2. Filtra las transiciones salientes del estado actual
// 3. Separa automáticas (condicion='automatica') de las que
//    el DPO elige (condicion='dpo_elige')
// 4. Por cada transición muestra su etiqueta, color y
//    recolecta los campos_requeridos propios de ESA flecha
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation }     from 'react-router-dom';
import { Search, Filter, Loader, X, AlertCircle, Zap, ChevronRight, Link2, CheckSquare } from 'lucide-react';
import { obtenerTodasSolicitudes, actualizarSolicitud, marcarComoResuelta } from '../services/dpoService';
import { obtenerFlujoConfig, COLOR_CLASSES, getColor } from '../services/flujoService';
import SolicitudesTable from '../components/SolicitudesTable';
import { toast } from 'react-toastify';

// ── Helpers ───────────────────────────────────────────────
const getField = (obj, field) => {
  if (!obj) return '';
  return obj[field] ?? obj[field.toUpperCase()] ?? obj[field.toLowerCase()] ?? '';
};

const getSolicitudId = (sol) => {
  for (const k of ['id', 'ID'])
    if (sol?.[k]?.toString().trim()) return sol[k].toString().trim();
  for (const k of ['numero_solicitud', 'NUMERO_SOLICITUD'])
    if (sol?.[k]?.toString().trim()) return sol[k].toString().trim();
  return null;
};

const formatFecha = (val) => {
  if (!val) return 'Sin fecha';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return 'Sin fecha';
    return d.toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return 'Sin fecha'; }
};

// ── Render dinámico de un campo requerido ─────────────────
const CampoInput = ({ campo, value, onChange }) => {
  const base = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  if (campo.tipo === 'checkbox') return (
    <label className="flex items-start gap-3 p-3 bg-gray-50 border rounded-xl cursor-pointer hover:bg-gray-100 select-none">
      <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 text-blue-600 rounded mt-0.5 flex-shrink-0" />
      <span className="text-sm text-gray-800">
        {campo.label}{campo.obligatorio && <span className="text-red-500 ml-1">*</span>}
      </span>
    </label>
  );

  if (campo.tipo === 'textarea') return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {campo.label}{campo.obligatorio && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={3}
        className={base} placeholder={campo.placeholder || ''} />
    </div>
  );

  if (campo.tipo === 'select') return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {campo.label}{campo.obligatorio && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select value={value || ''} onChange={e => onChange(e.target.value)} className={base}>
        <option value="">Seleccionar...</option>
        {(campo.opciones || []).map(op => <option key={op} value={op}>{op}</option>)}
      </select>
    </div>
  );

  if (campo.tipo === 'url') return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        <Link2 className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
        {campo.label}{campo.obligatorio && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input type="url" value={value || ''} onChange={e => onChange(e.target.value)}
        className={base} placeholder="https://..." />
    </div>
  );

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {campo.label}{campo.obligatorio && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input type={campo.tipo === 'date' ? 'date' : 'text'} value={value || ''}
        onChange={e => onChange(e.target.value)}
        className={base} placeholder={campo.placeholder || ''} />
    </div>
  );
};

// ── Badge de estado ───────────────────────────────────────
const EstadoBadge = ({ estadoId, estadosDef }) => {
  const def = estadosDef?.find(e => e.id === estadoId);
  const c   = getColor(def?.color);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {def?.nombre || estadoId}
    </span>
  );
};

// ── MODAL CAMBIAR ESTADO — corazón de toda la lógica ─────
const ModalCambiarEstado = ({ solicitud, flujoConfig, onConfirmar, onCancelar, procesando }) => {
  const tipo        = (getField(solicitud, 'tipo') || 'ACCESO').toUpperCase();
  const estadoActual = getField(solicitud, 'estado') || 'PENDIENTE';
  const numero       = getField(solicitud, 'numero_solicitud');

  // Flujo del derecho correspondiente
  const estadosDef = (flujoConfig?.derechos?.[tipo]?.estados || [])
    .filter(e => e.activo)
    .sort((a, b) => a.orden - b.orden);

  const defActual = estadosDef.find(e => e.id === estadoActual);

  // Separar transiciones automáticas de las que elige el DPO
  const todasTransiciones  = (defActual?.transiciones || []).filter(t => t.hacia);
  const transAuto          = todasTransiciones.filter(t => t.condicion === 'automatica');
  const transDPO           = todasTransiciones.filter(t => t.condicion !== 'automatica');

  // Estado del modal
  const [transSeleccionada, setTransSeleccionada] = useState(transDPO[0] || null);
  const [camposValues,      setCamposValues]       = useState({});

  // Al cambiar transición → limpiar campos
  const seleccionarTrans = (tr) => {
    setTransSeleccionada(tr);
    setCamposValues({});
  };

  const setValor = (campoId, val) =>
    setCamposValues(prev => ({ ...prev, [campoId]: val }));

  const camposActuales = transSeleccionada?.campos_requeridos || [];

  // Validar campos obligatorios de la transición seleccionada
  const camposFaltantes = camposActuales.filter(c => {
    if (!c.obligatorio) return false;
    const v = camposValues[c.id];
    return v === undefined || v === null || v === '' || v === false;
  });

  const puedeConfirmar = transSeleccionada?.hacia && camposFaltantes.length === 0;

  const defDestino = estadosDef.find(e => e.id === transSeleccionada?.hacia);

  // Sin transiciones disponibles
  if (todasTransiciones.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Sin transiciones disponibles</h3>
          <p className="text-sm text-gray-500 mb-5">
            El estado <strong>{defActual?.nombre || estadoActual}</strong> no tiene transiciones configuradas
            {defActual?.es_final && ' porque es un estado final'}.
          </p>
          <button onClick={onCancelar}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 text-sm">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
        <div className="p-6">

          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Cambiar Estado</h3>
              <p className="text-sm text-gray-400 mt-0.5">
                {numero} · Derecho de <span className="font-medium text-gray-600">{tipo}</span>
              </p>
            </div>
            <button onClick={onCancelar} className="text-gray-300 hover:text-gray-600 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Estado actual */}
          <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex-1">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Estado actual</p>
              <EstadoBadge estadoId={estadoActual} estadosDef={estadosDef} />
              {defActual?.descripcion && (
                <p className="text-xs text-gray-400 mt-1">{defActual.descripcion}</p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
            <div className="flex-1 text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Destino seleccionado</p>
              {transSeleccionada?.hacia
                ? <EstadoBadge estadoId={transSeleccionada.hacia} estadosDef={estadosDef} />
                : <span className="text-xs text-gray-400 italic">ninguno</span>}
            </div>
          </div>

          {/* Transiciones automáticas — informativas */}
          {transAuto.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-xs font-semibold text-yellow-700 flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5" /> Transiciones automáticas (no requieren acción del DPO)
              </p>
              <div className="space-y-1">
                {transAuto.map(tr => {
                  const c = getColor(tr.color);
                  return (
                    <div key={tr.id} className="flex items-center gap-2 text-xs text-yellow-800">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.stroke }} />
                      <span className="font-medium">{tr.etiqueta}</span>
                      <ChevronRight className="w-3 h-3 opacity-50" />
                      <span>{estadosDef.find(e => e.id === tr.hacia)?.nombre || tr.hacia}</span>
                      {tr.condicion_campo && (
                        <span className="text-yellow-600 ml-auto">
                          cuando {tr.condicion_campo} = {tr.condicion_valor}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transiciones que elige el DPO */}
          {transDPO.length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Selecciona la acción a tomar:
              </p>
              <div className="space-y-2">
                {transDPO.map(tr => {
                  const c   = getColor(tr.color);
                  const sel = transSeleccionada?.id === tr.id;
                  const dst = estadosDef.find(e => e.id === tr.hacia);
                  return (
                    <button key={tr.id} onClick={() => seleccionarTrans(tr)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                        sel
                          ? `${c.bg} ${c.border} shadow-sm`
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}>
                      <div className="flex items-center gap-3">
                        {/* Indicador de color de la flecha */}
                        <span className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ background: c.stroke }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-semibold text-sm ${sel ? c.text : 'text-gray-800'}`}>
                              {tr.etiqueta}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                            <EstadoBadge estadoId={tr.hacia} estadosDef={estadosDef} />
                            {(tr.campos_requeridos || []).length > 0 && (
                              <span className="text-xs text-purple-600 flex items-center gap-1">
                                <CheckSquare className="w-3 h-3" />
                                {tr.campos_requeridos.length} campo{tr.campos_requeridos.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          {tr.descripcion && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{tr.descripcion}</p>
                          )}
                        </div>
                        {sel && (
                          <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                            style={{ background: c.stroke }}>
                            <svg viewBox="0 0 12 12" className="w-3 h-3 fill-white">
                              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" fill="none" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Campos requeridos de la transición seleccionada */}
          {camposActuales.length > 0 && (
            <div className="mb-5 space-y-3">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-purple-500" />
                Completa los campos para <span className="text-purple-600">{transSeleccionada?.etiqueta}</span>
              </p>
              {camposActuales.map(campo => (
                <CampoInput key={campo.id} campo={campo}
                  value={camposValues[campo.id]}
                  onChange={val => setValor(campo.id, val)} />
              ))}
            </div>
          )}

          {/* Avisos de comportamiento del estado destino */}
          {defDestino && (
            <div className="space-y-2 mb-5">
              {defDestino.requiere_confirmacion && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Esta acción quedará registrada en el log de auditoría y no puede deshacerse.
                </div>
              )}
              {defDestino.envia_email && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Se enviará un email automático al titular al ejecutar este cambio.
                </div>
              )}
            </div>
          )}

          {/* Validación visible */}
          {transSeleccionada && camposFaltantes.length > 0 && (
            <p className="text-xs text-red-500 mb-4">
              Campos obligatorios faltantes: {camposFaltantes.map(c => c.label).join(', ')}
            </p>
          )}

          {/* Acciones */}
          <div className="flex gap-3">
            <button onClick={onCancelar} disabled={procesando}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm">
              Cancelar
            </button>
            <button
              onClick={() => onConfirmar(transSeleccionada, camposValues)}
              disabled={!puedeConfirmar || procesando}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold">
              {procesando
                ? 'Guardando...'
                : transSeleccionada
                  ? `${transSeleccionada.etiqueta} →`
                  : 'Selecciona una transición'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────
const PanelDPO = () => {
  const location = useLocation();

  const [solicitudes,    setSolicitudes]    = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [flujoConfig,    setFlujoConfig]    = useState(null);
  const [filtros,        setFiltros]        = useState({ estado: '', busqueda: '' });
  const [filtroEspecial, setFiltroEspecial] = useState(null);

  const [modalDetalle,       setModalDetalle]       = useState(null);
  const [modalCambiarEstado, setModalCambiarEstado] = useState(null);
  const [procesando,         setProcesando]         = useState(false);

  // Cargar flujoConfig al montar
  useEffect(() => {
    obtenerFlujoConfig().then(r => {
      if (r.status === 'success') setFlujoConfig(r.data);
    });
  }, []);

  // Filtro especial desde Dashboard
  useEffect(() => {
    if (location.state?.filtro) {
      setFiltroEspecial(location.state.filtro);
      setFiltros({ estado: '', busqueda: '' });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Cargar solicitudes
  const cargarSolicitudes = useCallback(async () => {
    try {
      setLoading(true);
      const result = await obtenerTodasSolicitudes(filtros);
      setSolicitudes(result.status === 'success' ? (result.data || []) : []);
    } catch {
      toast.error('Error al cargar solicitudes');
      setSolicitudes([]);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => { cargarSolicitudes(); }, []);

  // Filtrado local
  const solicitudesFiltradas = (() => {
    if (!filtroEspecial) return solicitudes;
    if (filtroEspecial.por_vencer) {
      const limit = new Date(Date.now() + 3 * 86400000);
      return solicitudes.filter(s => {
        const fl = new Date(s.fecha_limite);
        return fl <= limit && !['RESUELTA', 'CERRADA'].includes(s.estado);
      });
    }
    if (filtroEspecial.sin_asignar)
      return solicitudes.filter(s => !s.asignado_a && !['RESUELTA', 'CERRADA'].includes(s.estado));
    if (filtroEspecial.estado)
      return solicitudes.filter(s => s.estado === filtroEspecial.estado);
    return solicitudes;
  })();

  // Estados activos únicos para el filtro (extraídos del flujoConfig)
  const todosEstados = (() => {
    if (!flujoConfig) return [];
    const seen = new Set();
    return Object.values(flujoConfig.derechos || {})
      .flatMap(d => d.estados || [])
      .filter(e => { if (!e.activo || seen.has(e.id)) return false; seen.add(e.id); return true; })
      .sort((a, b) => a.orden - b.orden);
  })();

  // ── Confirmar cambio de estado ───────────────────────────
  const handleConfirmarCambio = async (transicion, camposValues) => {
    if (!modalCambiarEstado || !transicion?.hacia) return;
    try {
      setProcesando(true);
      const id = getSolicitudId(modalCambiarEstado);
      if (!id) { toast.error('No se pudo obtener el ID'); return; }

      const nuevoEstado = transicion.hacia;

      // Si hay url_datos en los campos → usar marcarComoResuelta para disparar email
      if (nuevoEstado === 'RESUELTA' && camposValues.url_datos) {
        const result = await marcarComoResuelta(
          id,
          camposValues.url_datos,
          camposValues.formato_entrega || 'PDF'
        );
        if (result.status === 'success') {
          toast.success('✅ Solicitud resuelta — email enviado al titular');
          setModalCambiarEstado(null);
          await cargarSolicitudes();
        } else {
          toast.error('Error: ' + (result.message || ''));
        }
        return;
      }

      // Caso general
      const payload = {
        estado:    nuevoEstado,
        notas_dpo: camposValues.notas_dpo || camposValues.motivo_denegacion || '',
        ...camposValues,
      };

      const result = await actualizarSolicitud(id, payload);
      if (result.status === 'success') {
        toast.success(`✅ ${transicion.etiqueta} → ${nuevoEstado}`);
        setModalCambiarEstado(null);
        await cargarSolicitudes();
      } else {
        toast.error('Error al actualizar: ' + (result.message || ''));
      }
    } catch {
      toast.error('Error inesperado al cambiar estado');
    } finally {
      setProcesando(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Cargando solicitudes...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Panel DPO</h1>
          <p className="text-gray-400 text-sm">Gestión de solicitudes ARCOP — Ley 21.719</p>
        </div>

        {/* Banner filtro especial */}
        {filtroEspecial && (
          <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <span className="text-sm text-blue-700 font-medium flex-1">
              {filtroEspecial.por_vencer   && '🔴 Filtrando: Por vencer (próximos 3 días)'}
              {filtroEspecial.sin_asignar  && '🟡 Filtrando: Sin asignar'}
              {filtroEspecial.estado === 'PENDIENTE' && '🔵 Filtrando: Pendientes de validación'}
            </span>
            <button onClick={() => setFiltroEspecial(null)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium underline">
              Ver todas
            </button>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={filtros.busqueda}
                  onChange={e => setFiltros(p => ({ ...p, busqueda: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && cargarSolicitudes()}
                  placeholder="Nombre, RUT o número..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Estado</label>
              <select value={filtros.estado}
                onChange={e => setFiltros(p => ({ ...p, estado: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                <option value="">Todos los estados</option>
                {todosEstados.map(e => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button onClick={cargarSolicitudes}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-1.5">
                <Filter className="w-4 h-4" /> Filtrar
              </button>
              <button onClick={() => { setFiltros({ estado: '', busqueda: '' }); setTimeout(cargarSolicitudes, 50); }}
                className="px-4 py-2 border border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 text-sm">
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Contador */}
        <p className="text-sm text-gray-400 mb-3">
          {solicitudesFiltradas.length > 0
            ? <>{solicitudesFiltradas.length} solicitud{solicitudesFiltradas.length !== 1 ? 'es' : ''}{filtroEspecial && <span className="ml-2 text-blue-500">(filtradas)</span>}</>
            : 'No hay solicitudes para mostrar'}
        </p>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <SolicitudesTable
            solicitudes={solicitudesFiltradas}
            estadosDef={todosEstados}
            onVerDetalle={sol => setModalDetalle(sol)}
            onCambiarEstado={sol => setModalCambiarEstado(sol)}
            onMarcarResuelta={null}   // integrado en el flujo dinámico
          />
        </div>
      </div>

      {/* Modal detalle */}
      {modalDetalle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Detalle de Solicitud</h2>
                  <p className="text-sm text-gray-400 mt-1">{getField(modalDetalle, 'numero_solicitud')}</p>
                </div>
                <button onClick={() => setModalDetalle(null)} className="text-gray-300 hover:text-gray-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Nombre',          getField(modalDetalle, 'nombre_completo')],
                  ['RUT',             getField(modalDetalle, 'rut')],
                  ['Email',           getField(modalDetalle, 'email')],
                  ['Teléfono',        getField(modalDetalle, 'telefono') || 'No proporcionado'],
                  ['Tipo de derecho', getField(modalDetalle, 'tipo')],
                  ['Estado',         <EstadoBadge key="e" estadoId={getField(modalDetalle, 'estado')} estadosDef={todosEstados} />],
                  ['Fecha solicitud', formatFecha(getField(modalDetalle, 'fecha_solicitud'))],
                  ['Fecha límite',    formatFecha(getField(modalDetalle, 'fecha_limite'))],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                    <div className="mt-1 text-sm text-gray-900">{val}</div>
                  </div>
                ))}
              </div>
              {getField(modalDetalle, 'notas_dpo') && (
                <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notas DPO</p>
                  <p className="text-sm text-gray-800">{getField(modalDetalle, 'notas_dpo')}</p>
                </div>
              )}
              <div className="flex justify-end mt-6 gap-3">
                <button onClick={() => { setModalDetalle(null); setModalCambiarEstado(modalDetalle); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium">
                  Cambiar estado
                </button>
                <button onClick={() => setModalDetalle(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 text-sm">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal cambiar estado — dinámico */}
      {modalCambiarEstado && flujoConfig && (
        <ModalCambiarEstado
          solicitud={modalCambiarEstado}
          flujoConfig={flujoConfig}
          procesando={procesando}
          onCancelar={() => setModalCambiarEstado(null)}
          onConfirmar={handleConfirmarCambio}
        />
      )}
    </div>
  );
};

export default PanelDPO;