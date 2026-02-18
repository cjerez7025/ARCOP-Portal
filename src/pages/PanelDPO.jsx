import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Filter, Loader, X, CheckCircle, Clock } from 'lucide-react';
import { obtenerTodasSolicitudes, actualizarSolicitud, marcarComoResuelta } from '../services/dpoService';
import SolicitudesTable from '../components/SolicitudesTable';
import { ESTADOS, ESTADO_LABELS } from '../utils/constants';
import { toast } from 'react-toastify';

const PanelDPO = () => {
  const location = useLocation();

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ estado: '', busqueda: '' });
  const [filtroEspecial, setFiltroEspecial] = useState(null); // ← filtro desde Dashboard

  const [modalDetalle, setModalDetalle] = useState(null);
  const [modalCambiarEstado, setModalCambiarEstado] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [modalResuelta, setModalResuelta] = useState(null);
  const [urlDescarga, setUrlDescarga] = useState('');
  const [formatoEntregado, setFormatoEntregado] = useState('PDF');
  const [procesando, setProcesando] = useState(false);

  // ── Leer filtro enviado desde Dashboard ────────────────────
  useEffect(() => {
    if (location.state?.filtro) {
      setFiltroEspecial(location.state.filtro);
      // Limpiar filtros normales para que no interfieran
      setFiltros({ estado: '', busqueda: '' });
      // Limpiar el state del navegador para que no persista al volver
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      const result = await obtenerTodasSolicitudes(filtros);
      if (result.status === 'success') {
        // Ordenar de más nuevas a más antiguas
        const ordenadas = [...(result.data || [])].sort(
          (a, b) => new Date(b.fecha_solicitud) - new Date(a.fecha_solicitud)
        );
        setSolicitudes(ordenadas);
      } else {
        toast.error('Error al cargar solicitudes');
        setSolicitudes([]);
      }
    } catch (error) {
      toast.error('Error al cargar solicitudes');
      setSolicitudes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAplicarFiltros = () => {
    setFiltroEspecial(null); // limpiar filtro especial al aplicar filtros manuales
    cargarSolicitudes();
  };

  const handleLimpiarFiltros = () => {
    setFiltros({ estado: '', busqueda: '' });
    setFiltroEspecial(null);
    setTimeout(() => cargarSolicitudes(), 100);
  };

  // ── Calcular solicitudes filtradas ─────────────────────────
  const solicitudesFiltradas = (() => {
    if (!filtroEspecial) return solicitudes;

    if (filtroEspecial.por_vencer) {
      const hoy = new Date();
      const limite = new Date(hoy.getTime() + 3 * 24 * 60 * 60 * 1000);
      return solicitudes.filter(s => {
        if (s.estado === 'RESUELTA' || s.estado === 'CERRADA') return false;
        const fechaLimite = new Date(s.fecha_limite);
        return fechaLimite >= hoy && fechaLimite <= limite;
      });
    }

    if (filtroEspecial.sin_asignar) {
      return solicitudes.filter(
        s => !s.asignado_a && s.estado !== 'CERRADA' && s.estado !== 'RESUELTA'
      );
    }

    if (filtroEspecial.estado) {
      return solicitudes.filter(s => s.estado === filtroEspecial.estado);
    }

    return solicitudes;
  })();

  // ── Helpers ────────────────────────────────────────────────
  const getFieldValue = (obj, fieldName) => {
    if (!obj) return '';
    if (obj[fieldName] !== undefined && obj[fieldName] !== null && obj[fieldName] !== '')
      return obj[fieldName];
    const upper = fieldName.toUpperCase();
    if (obj[upper] !== undefined && obj[upper] !== null && obj[upper] !== '')
      return obj[upper];
    const lower = fieldName.toLowerCase();
    if (obj[lower] !== undefined && obj[lower] !== null && obj[lower] !== '')
      return obj[lower];
    return '';
  };

  const getSolicitudId = (solicitud) => {
    if (!solicitud) return null;
    for (const campo of ['id', 'ID', 'Id']) {
      const valor = solicitud[campo];
      if (valor && valor.toString().trim() !== '') return valor.toString().trim();
    }
    for (const campo of ['numero_solicitud', 'NUMERO_SOLICITUD', 'Numero_Solicitud']) {
      const valor = solicitud[campo];
      if (valor && valor.toString().trim() !== '') return valor.toString().trim();
    }
    return null;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleDateString('es-CL', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return 'Fecha inválida'; }
  };

  // ── Handlers ───────────────────────────────────────────────
  const handleVerDetalle = (solicitud) => setModalDetalle(solicitud);
  const handleCerrarDetalle = () => setModalDetalle(null);

  const handleAbrirCambiarEstado = (solicitud) => {
    setModalCambiarEstado(solicitud);
    setNuevoEstado(getFieldValue(solicitud, 'estado') || 'PENDIENTE');
  };

  const handleCambiarEstado = async () => {
    if (!modalCambiarEstado || !nuevoEstado) {
      toast.error('Selecciona un estado válido');
      return;
    }
    try {
      setProcesando(true);
      const id = getSolicitudId(modalCambiarEstado);
      if (!id) { toast.error('No se pudo obtener el ID'); return; }
      const result = await actualizarSolicitud(id, { estado: nuevoEstado });
      if (result.status === 'success') {
        toast.success('✅ Estado actualizado correctamente');
        setModalCambiarEstado(null);
        await cargarSolicitudes();
      } else {
        toast.error('Error al actualizar estado: ' + (result.message || ''));
      }
    } catch (error) {
      toast.error('Error al actualizar estado');
    } finally {
      setProcesando(false);
    }
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
    } catch (error) {
      toast.error('Error al marcar como resuelta');
    } finally {
      setProcesando(false);
    }
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
          <p className="text-gray-600">Gestión de solicitudes de acceso a datos personales</p>
        </div>

        {/* Banner filtro especial desde Dashboard */}
        {filtroEspecial && (
          <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <span className="text-sm text-blue-700 font-medium">
              {filtroEspecial.por_vencer   && '🔴 Filtrando: Solicitudes por vencer (próximos 3 días)'}
              {filtroEspecial.sin_asignar  && '🟡 Filtrando: Solicitudes sin asignar'}
              {filtroEspecial.estado === 'PENDIENTE' && '🔵 Filtrando: Pendientes de validación'}
            </span>
            <button
              onClick={() => setFiltroEspecial(null)}
              className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium underline"
            >
              Ver todas
            </button>
          </div>
        )}

        {/* Filtros normales */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

            {/* Buscar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Buscar
              </label>
              <input
                type="text"
                value={filtros.busqueda}
                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleAplicarFiltros()}
                placeholder="Nombre, RUT o email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtrar por estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Filtrar por estado
              </label>
              <select
                value={filtros.estado}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="VALIDADA">Validada</option>
                <option value="EN_PROCESO">En Proceso</option>
                <option value="RESUELTA">Resuelta</option>
                <option value="CERRADA">Cerrada</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAplicarFiltros}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Aplicar filtros
            </button>
            <button
              onClick={handleLimpiarFiltros}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Contador */}
        <div className="mb-4 text-sm text-gray-600">
          {solicitudesFiltradas.length > 0 ? (
            <p>
              Mostrando <span className="font-semibold">{solicitudesFiltradas.length}</span> solicitud
              {solicitudesFiltradas.length !== 1 ? 'es' : ''}
              {filtroEspecial && (
                <span className="ml-2 text-blue-600 font-medium">(filtradas)</span>
              )}
            </p>
          ) : (
            <p>No hay solicitudes para mostrar</p>
          )}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <SolicitudesTable
            solicitudes={solicitudesFiltradas}
            onVerDetalle={handleVerDetalle}
            onCambiarEstado={handleAbrirCambiarEstado}
            onMarcarResuelta={handleAbrirMarcarResuelta}
          />
        </div>
      </div>

      {/* Modal Detalle */}
      {modalDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Detalle de Solicitud</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {getFieldValue(modalDetalle, 'numero_solicitud') || getFieldValue(modalDetalle, 'NUMERO_SOLICITUD')}
                  </p>
                </div>
                <button onClick={handleCerrarDetalle} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {getFieldValue(modalDetalle, 'nombre_completo') || getFieldValue(modalDetalle, 'NOMBRE_COMPLETO')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">RUT</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {getFieldValue(modalDetalle, 'rut') || getFieldValue(modalDetalle, 'RUT')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {getFieldValue(modalDetalle, 'email') || getFieldValue(modalDetalle, 'EMAIL')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {getFieldValue(modalDetalle, 'telefono') || getFieldValue(modalDetalle, 'TELEFONO') || 'No proporcionado'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {ESTADO_LABELS[getFieldValue(modalDetalle, 'estado') || getFieldValue(modalDetalle, 'ESTADO')] || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {getFieldValue(modalDetalle, 'tipo') || getFieldValue(modalDetalle, 'TIPO') || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha Solicitud</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatearFecha(getFieldValue(modalDetalle, 'fecha_solicitud') || getFieldValue(modalDetalle, 'FECHA_SOLICITUD'))}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha Límite</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatearFecha(getFieldValue(modalDetalle, 'fecha_limite') || getFieldValue(modalDetalle, 'FECHA_LIMITE'))}
                    </p>
                  </div>
                </div>

                {(getFieldValue(modalDetalle, 'notas_dpo') || getFieldValue(modalDetalle, 'NOTAS_DPO')) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notas DPO</label>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {getFieldValue(modalDetalle, 'notas_dpo') || getFieldValue(modalDetalle, 'NOTAS_DPO')}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6 justify-end">
                <button
                  onClick={() => { handleCerrarDetalle(); handleAbrirCambiarEstado(modalDetalle); }}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium"
                >
                  Cambiar Estado
                </button>
                <button
                  onClick={handleCerrarDetalle}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cambiar Estado */}
      {modalCambiarEstado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cambiar Estado</h3>
            <p className="text-sm text-gray-600 mb-4">
              Solicitud: <span className="font-semibold">
                {getFieldValue(modalCambiarEstado, 'numero_solicitud') || getFieldValue(modalCambiarEstado, 'NUMERO_SOLICITUD')}
              </span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nuevo Estado</label>
              <select
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="PENDIENTE">Pendiente</option>
                <option value="VALIDADA">Validada</option>
                <option value="EN_PROCESO">En Proceso</option>
                <option value="RESUELTA">Resuelta</option>
                <option value="CERRADA">Cerrada</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setModalCambiarEstado(null)}
                disabled={procesando}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleCambiarEstado}
                disabled={procesando}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {procesando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Marcar Resuelta */}
      {modalResuelta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Marcar como Resuelta</h3>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de Descarga *
                </label>
                <input
                  type="url"
                  value={urlDescarga}
                  onChange={(e) => setUrlDescarga(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL donde el usuario puede descargar sus datos
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formato Entregado
                </label>
                <select
                  value={formatoEntregado}
                  onChange={(e) => setFormatoEntregado(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PDF">PDF</option>
                  <option value="EXCEL">Excel</option>
                  <option value="CSV">CSV</option>
                  <option value="JSON">JSON</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setModalResuelta(null)}
                disabled={procesando}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleMarcarResuelta}
                disabled={procesando || !urlDescarga.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
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