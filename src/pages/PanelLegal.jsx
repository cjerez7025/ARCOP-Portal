import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { CheckCircle, ArrowLeft, Clock, FileText } from 'lucide-react';
import { useRol } from '../hooks/useRol';
import adapter from '../adapters';

const ESTADOS_REVISION_LEGAL = ['EN_REVISION_LEGAL', 'VALIDADA', 'EN_PROCESO'];

export default function PanelLegal() {
  const { esLegal } = useRol();
  const [solicitudes, setSolicitudes]   = useState([]);
  const [seleccionada, setSeleccionada] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [observacion, setObservacion]   = useState('');

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    const res = await adapter.getSolicitudes({});
    if (res.status === 'success') {
      setSolicitudes(res.data.filter(s => ESTADOS_REVISION_LEGAL.includes(s.estado)));
    }
    setLoading(false);
  }

  async function handleAprobar() {
    if (!seleccionada) return;
    const res = await adapter.updateSolicitud(seleccionada.id, {
      estado: 'APROBADA_LEGAL',
      nota:   observacion || 'Aprobada por equipo legal',
    });
    if (res.status === 'success') {
      toast.success('Solicitud aprobada por legal');
      setSeleccionada(null);
      setObservacion('');
      cargar();
    } else {
      toast.error(res.message || 'Error al aprobar');
    }
  }

  async function handleDevolver() {
    if (!seleccionada || !observacion.trim()) {
      toast.error('Debes ingresar las observaciones para devolver al DPO');
      return;
    }
    const res = await adapter.updateSolicitud(seleccionada.id, {
      estado: 'EN_PROCESO',
      nota:   `Devuelta por legal: ${observacion}`,
    });
    if (res.status === 'success') {
      toast.success('Solicitud devuelta al DPO con observaciones');
      setSeleccionada(null);
      setObservacion('');
      cargar();
    } else {
      toast.error(res.message || 'Error al devolver');
    }
  }

  if (!esLegal) return (
    <div className="p-8 text-center text-gray-500">
      No tienes permisos para acceder a esta sección.
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <FileText className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Revisión Legal</h1>
        <span className="ml-2 bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1 rounded-full">
          {solicitudes.length} pendientes
        </span>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-12">Cargando...</p>
      ) : solicitudes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
          <p>No hay solicitudes pendientes de revisión legal</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="space-y-3">
            {solicitudes.map(s => (
              <div
                key={s.id}
                onClick={() => { setSeleccionada(s); setObservacion(''); }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  seleccionada?.id === s.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{s.numero_solicitud}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {s.tipo_derecho} · {s.nombre_completo}
                    </p>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {s.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {seleccionada && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="font-bold text-gray-900 mb-1">{seleccionada.numero_solicitud}</h2>
              <p className="text-sm text-gray-500 mb-4">
                {seleccionada.tipo_derecho} · {seleccionada.nombre_completo}
              </p>

              <div className="space-y-2 text-sm mb-6">
                {[
                  ['RUT',        seleccionada.rut],
                  ['Email',      seleccionada.email],
                  ['Estado',     seleccionada.estado],
                  ['Asignado a', seleccionada.asignado_a || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-gray-400 w-24 flex-shrink-0">{k}</span>
                    <span className="text-gray-800">{v}</span>
                  </div>
                ))}
              </div>

              <textarea
                value={observacion}
                onChange={e => setObservacion(e.target.value)}
                placeholder="Observaciones legales (obligatorio para devolver)"
                rows={3}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-800 resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleAprobar}
                  className="flex-1 bg-green-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Aprobar
                </button>
                <button
                  onClick={handleDevolver}
                  className="flex-1 bg-amber-500 text-white text-sm font-medium py-2 rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Devolver al DPO
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
