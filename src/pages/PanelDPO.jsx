import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Clock, Loader, AlertTriangle, 
  Search, Filter, Download, Upload, X, Link as LinkIcon 
} from 'lucide-react';
import { obtenerTodasSolicitudes, obtenerEstadisticas, actualizarSolicitud, marcarComoResuelta } from '../services/dpoService';

const PanelDPO = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [modalResuelta, setModalResuelta] = useState(null);
  const [urlDescarga, setUrlDescarga] = useState('');
  const [formatoEntregado, setFormatoEntregado] = useState('PDF');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [filtroEstado]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [solicitudesResult, statsResult] = await Promise.all([
        obtenerTodasSolicitudes({ estado: filtroEstado, busqueda }),
        obtenerEstadisticas()
      ]);

      if (solicitudesResult.status === 'success') {
        setSolicitudes(solicitudesResult.data);
      }
      if (statsResult.status === 'success') {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      await actualizarSolicitud(id, { estado: nuevoEstado });
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cambiar estado');
    }
  };

  const abrirModalResuelta = (solicitud) => {
    setModalResuelta(solicitud);
    setUrlDescarga('');
    setFormatoEntregado(solicitud.formato_preferido || 'PDF');
  };

  const cerrarModal = () => {
    setModalResuelta(null);
    setUrlDescarga('');
    setFormatoEntregado('PDF');
  };

  const handleMarcarResuelta = async () => {
    if (!urlDescarga.trim()) {
      alert('Por favor ingresa el link de descarga');
      return;
    }

    // Validar que sea un link válido
    try {
      new URL(urlDescarga);
    } catch (e) {
      alert('Por favor ingresa un link válido (debe empezar con https://)');
      return;
    }

    try {
      setEnviando(true);
      await marcarComoResuelta(modalResuelta.id, urlDescarga, formatoEntregado);
      alert('✅ Solicitud marcada como resuelta. Email enviado al usuario.');
      cerrarModal();
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al marcar como resuelta');
    } finally {
      setEnviando(false);
    }
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      'PENDIENTE': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      'VALIDADA': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Validada' },
      'EN_PROCESO': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'En Proceso' },
      'RESUELTA': { bg: 'bg-green-100', text: 'text-green-800', label: 'Resuelta' },
      'CERRADA': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cerrada' }
    };
    const badge = badges[estado] || badges['PENDIENTE'];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando panel DPO...</p>
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

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Total</div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow p-6">
              <div className="text-sm text-yellow-700 mb-1">Pendientes</div>
              <div className="text-3xl font-bold text-yellow-800">{stats.pendientes}</div>
            </div>
            <div className="bg-blue-50 rounded-lg shadow p-6">
              <div className="text-sm text-blue-700 mb-1">Validadas</div>
              <div className="text-3xl font-bold text-blue-800">{stats.validadas}</div>
            </div>
            <div className="bg-purple-50 rounded-lg shadow p-6">
              <div className="text-sm text-purple-700 mb-1">En Proceso</div>
              <div className="text-3xl font-bold text-purple-800">{stats.en_proceso}</div>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-6">
              <div className="text-sm text-green-700 mb-1">Resueltas</div>
              <div className="text-3xl font-bold text-green-800">{stats.resueltas}</div>
            </div>
            <div className="bg-red-50 rounded-lg shadow p-6">
              <div className="text-sm text-red-700 mb-1">Por Vencer</div>
              <div className="text-3xl font-bold text-red-800">{stats.por_vencer}</div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-2" />
                Buscar
              </label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, RUT o email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-2" />
                Filtrar por estado
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
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
          <div className="mt-4 flex gap-2">
            <button
              onClick={cargarDatos}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Aplicar filtros
            </button>
            <button
              onClick={() => {
                setBusqueda('');
                setFiltroEstado('');
                cargarDatos();
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Tabla de solicitudes */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RUT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Formato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {solicitudes.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      No hay solicitudes que coincidan con los filtros
                    </td>
                  </tr>
                ) : (
                  solicitudes.map((sol) => (
                    <tr key={sol.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {sol.numero_solicitud}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sol.nombre_completo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sol.rut}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sol.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEstadoBadge(sol.estado)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sol.formato_preferido}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sol.fecha_solicitud).toLocaleDateString('es-CL')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          
                          {/* Cambiar a EN_PROCESO */}
                          {sol.estado === 'VALIDADA' && (
                            <button
                              onClick={() => handleCambiarEstado(sol.id, 'EN_PROCESO')}
                              className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-xs"
                              title="Cambiar a En Proceso"
                            >
                              🔄 Procesar
                            </button>
                          )}

                          {/* Marcar como RESUELTA (con modal) */}
                          {sol.estado === 'EN_PROCESO' && (
                            <button
                              onClick={() => abrirModalResuelta(sol)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
                              title="Marcar como Resuelta"
                            >
                              ✅ Entregar
                            </button>
                          )}

                          {/* Cerrar solicitud */}
                          {sol.estado === 'RESUELTA' && (
                            <button
                              onClick={() => handleCambiarEstado(sol.id, 'CERRADA')}
                              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-xs"
                              title="Cerrar solicitud"
                            >
                              🔒 Cerrar
                            </button>
                          )}

                          {/* Ver seguimiento */}
                          <a
                            href={`/#/seguimiento/${sol.numero_solicitud}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                            title="Ver seguimiento"
                          >
                            👁️ Ver
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal para marcar como RESUELTA */}
      {modalResuelta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Entregar datos al usuario</h2>
                <p className="text-gray-600 mt-1">Solicitud #{modalResuelta.numero_solicitud}</p>
              </div>
              <button
                onClick={cerrarModal}
                className="text-gray-400 hover:text-gray-600"
                disabled={enviando}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              
              {/* Información del usuario */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Usuario</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-blue-700">Nombre:</span>
                    <span className="ml-2 text-blue-900 font-medium">{modalResuelta.nombre_completo}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Email:</span>
                    <span className="ml-2 text-blue-900 font-medium">{modalResuelta.email}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Formato solicitado:</span>
                    <span className="ml-2 text-blue-900 font-medium">{modalResuelta.formato_preferido}</span>
                  </div>
                </div>
              </div>

              {/* Instrucciones */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-800 mb-2">Instrucciones:</p>
                    <ol className="list-decimal list-inside space-y-1 text-yellow-700">
                      <li>Sube el archivo con los datos a <strong>Google Drive</strong></li>
                      <li>Haz clic derecho → <strong>"Obtener enlace"</strong></li>
                      <li>Configura: <strong>"Cualquiera con el enlace"</strong></li>
                      <li>Configura expiración: <strong>48 horas</strong></li>
                      <li>Copia el link y pégalo abajo</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Input URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <LinkIcon className="w-4 h-4 inline mr-2" />
                  Link de descarga de Google Drive
                </label>
                <input
                  type="url"
                  value={urlDescarga}
                  onChange={(e) => setUrlDescarga(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={enviando}
                />
                <p className="text-xs text-gray-500 mt-1">
                  El link debe ser público y tener expiración de 48 horas
                </p>
              </div>

              {/* Formato entregado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formato del archivo entregado
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="PDF"
                      checked={formatoEntregado === 'PDF'}
                      onChange={(e) => setFormatoEntregado(e.target.value)}
                      className="mr-2"
                      disabled={enviando}
                    />
                    <span>PDF</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="Excel"
                      checked={formatoEntregado === 'Excel'}
                      onChange={(e) => setFormatoEntregado(e.target.value)}
                      className="mr-2"
                      disabled={enviando}
                    />
                    <span>Excel</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="Ambos"
                      checked={formatoEntregado === 'Ambos'}
                      onChange={(e) => setFormatoEntregado(e.target.value)}
                      className="mr-2"
                      disabled={enviando}
                    />
                    <span>Ambos (PDF + Excel)</span>
                  </label>
                </div>
              </div>

              {/* ¿Qué pasará? */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">✅ Al confirmar:</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• La solicitud cambiará a estado <strong>RESUELTA</strong></li>
                  <li>• Se enviará un email automático al usuario con el link</li>
                  <li>• El usuario podrá descargar sus datos desde el seguimiento</li>
                  <li>• El link expirará en 48 horas</li>
                </ul>
              </div>

            </div>

            {/* Botones */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={cerrarModal}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                disabled={enviando}
              >
                Cancelar
              </button>
              <button
                onClick={handleMarcarResuelta}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={enviando || !urlDescarga.trim()}
              >
                {enviando ? (
                  <>
                    <Loader className="w-5 h-5 inline animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 inline mr-2" />
                    Marcar como Resuelta y Enviar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelDPO;