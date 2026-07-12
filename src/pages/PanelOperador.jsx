import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ClipboardList, MessageSquare, Plus, UserCheck } from 'lucide-react';
import { useRol } from '../hooks/useRol';
import adapter from '../adapters';

const ESTADOS_OPERADOR = ['EN_PROCESO', 'EN_REVISION_LEGAL', 'PENDIENTE_INFO'];
const ESTADOS_FINALES  = new Set(['RESUELTA', 'CERRADA', 'REJECTED', 'WITHDRAWN', 'DESCARGA_CONFIRMADA']);

export default function PanelOperador() {
  const { esOperador, esInterno } = useRol();
  const [solicitudes, setSolicitudes] = useState([]);
  const [seleccionada, setSeleccionada] = useState(null);
  const [nota, setNota]               = useState('');
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [asignadoA, setAsignadoA]     = useState('');
  const [asignadoEmail, setAsignadoEmail] = useState('');
  const [loading, setLoading]         = useState(true);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    const res = await adapter.getSolicitudes({});
    if (res.status === 'success') {
      setSolicitudes(res.data.filter(s => !ESTADOS_FINALES.has(s.estado)));
    }
    setLoading(false);
  }

  async function handleGuardarNota() {
    if (!nota.trim()) { toast.error('Escribe una nota'); return; }
    const res = await adapter.updateSolicitud(seleccionada.id, {
      estado: seleccionada.estado,
      nota,
    });
    if (res.status === 'success') {
      toast.success('Nota guardada');
      setNota('');
    } else {
      toast.error('Error al guardar nota');
    }
  }

  async function handleAsignar() {
    if (!asignadoA.trim() || !asignadoEmail.trim()) {
      toast.error('Nombre y email del responsable son obligatorios');
      return;
    }
    const res = await adapter.asignarResponsable(seleccionada.id, {
      asignado_a:    asignadoA.trim(),
      asignado_email: asignadoEmail.trim(),
      nota:          nota.trim() || undefined,
    });
    if (res.status === 'success') {
      toast.success(`Solicitud asignada a ${asignadoA}`);
      setAsignadoA('');
      setAsignadoEmail('');
      setNota('');
      cargar();
    } else {
      toast.error(res.message || 'Error al asignar');
    }
  }

  async function handleCambiarEstado() {
    if (!nuevoEstado) { toast.error('Selecciona un estado'); return; }
    if (!ESTADOS_OPERADOR.includes(nuevoEstado)) {
      toast.error('No tienes permisos para ese estado');
      return;
    }
    const res = await adapter.updateSolicitud(seleccionada.id, {
      estado: nuevoEstado,
      nota:   nota || `Estado cambiado por operador a ${nuevoEstado}`,
    });
    if (res.status === 'success') {
      toast.success('Estado actualizado');
      setNuevoEstado('');
      setNota('');
      cargar();
    } else {
      toast.error(res.message || 'Error al actualizar estado');
    }
  }

  if (!esInterno) return (
    <div className="p-8 text-center text-gray-500">
      No tienes permisos para esta sección.
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <ClipboardList className="w-6 h-6 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-900">Panel Operador</h1>
        <span className="ml-2 bg-indigo-100 text-indigo-700 text-sm font-medium px-3 py-1 rounded-full">
          {solicitudes.length} activas
        </span>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-12">Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="space-y-3">
            {solicitudes.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">
                No hay solicitudes activas
              </p>
            )}
            {solicitudes.map(s => (
              <div
                key={s.id}
                onClick={() => { setSeleccionada(s); setNota(''); setNuevoEstado(''); setAsignadoA(''); setAsignadoEmail(''); }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  seleccionada?.id === s.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-gray-900 text-sm">{s.numero_solicitud}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {s.tipo_derecho} · {s.nombre_completo}
                </p>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-400">{s.estado}</span>
                  {s.asignado_a && (
                    <span className="text-xs text-indigo-600">→ {s.asignado_a}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {seleccionada && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
              <div>
                <h2 className="font-bold text-gray-900">{seleccionada.numero_solicitud}</h2>
                <p className="text-sm text-gray-500">
                  {seleccionada.tipo_derecho} · {seleccionada.nombre_completo}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  <MessageSquare className="inline w-3 h-3 mr-1" />
                  Nota interna
                </label>
                <textarea
                  value={nota}
                  onChange={e => setNota(e.target.value)}
                  rows={3}
                  placeholder="Gestión realizada, pendientes, observaciones..."
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <button
                  onClick={handleGuardarNota}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Guardar nota
                </button>
              </div>

              {esOperador && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                    Cambiar estado
                  </label>
                  <select
                    value={nuevoEstado}
                    onChange={e => setNuevoEstado(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="">Seleccionar estado...</option>
                    {ESTADOS_OPERADOR.map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleCambiarEstado}
                    className="w-full bg-indigo-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-indigo-700">
                    Actualizar estado
                  </button>
                </div>
              )}

              {esOperador && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                    <UserCheck className="inline w-3 h-3 mr-1" />
                    Asignar responsable
                  </label>
                  {seleccionada.asignado_a && (
                    <p className="text-xs text-indigo-600 mb-2">
                      Actual: {seleccionada.asignado_a}
                    </p>
                  )}
                  <input
                    type="text"
                    value={asignadoA}
                    onChange={e => setAsignadoA(e.target.value)}
                    placeholder="Nombre del responsable"
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <input
                    type="email"
                    value={asignadoEmail}
                    onChange={e => setAsignadoEmail(e.target.value)}
                    placeholder="Email del responsable"
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <button
                    onClick={handleAsignar}
                    disabled={!asignadoA.trim() || !asignadoEmail.trim()}
                    className="w-full bg-teal-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed">
                    Asignar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
