// ============================================================
// src/components/TabImportar.jsx
// MMPA-119 — Carga masiva tabla rut_contactos desde archivo
//
// ARQUITECTURA CORRECTA:
//   Frontend (valida archivo) → POST /api/rut-contactos/importar
//   → Node.js backend → Firestore (Admin SDK)
//
// El frontend NO escribe directo a Firestore.
// ============================================================

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, FileSpreadsheet, AlertCircle, CheckCircle2,
  Download, Users, Info, ChevronDown, ChevronRight, Loader2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getAuth } from 'firebase/auth';

// ── Constantes ────────────────────────────────────────────
const MAX_FILAS        = 10_000;
const CHUNK_SIZE       = 2_000; // registros por llamada al backend
const COLUMNAS_VALIDAS = ['rut', 'email', 'telefono'];
const API_URL          = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const PLANTILLA_CSV    = 'rut,email,telefono\n12345678-9,cliente@empresa.cl,+56912345678\n98765432-1,otro@empresa.cl,+56987654321\n';

// ── Helper: obtener token JWT ─────────────────────────────
const getToken = async () => {
  const user = getAuth().currentUser;
  if (!user) return null;
  return user.getIdToken();
};

// ── Validadores ───────────────────────────────────────────
const validarRUT = (rut) => {
  if (!rut || typeof rut !== 'string') return false;
  const limpio = rut.replace(/[\.\-\s]/g, '').toUpperCase();
  if (limpio.length < 2) return false;
  const cuerpo = limpio.slice(0, -1);
  const dv     = limpio.slice(-1);
  if (!/^\d+$/.test(cuerpo)) return false;
  let suma = 0, mult = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const dvEsperado = 11 - (suma % 11);
  const dvStr = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : String(dvEsperado);
  return dv === dvStr;
};

const normalizarRUT = (rut) => {
  const limpio = rut.replace(/[\.\-\s]/g, '').toUpperCase();
  const cuerpo = limpio.slice(0, -1);
  const dv     = limpio.slice(-1);
  return `${Number(cuerpo).toLocaleString('es-CL')}-${dv}`;
};

const validarEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim() || '');

const validarTelefono = (tel) => {
  if (!tel) return true;
  const limpio = tel.replace(/[\s\-\(\)]/g, '');
  return /^(\+?56)?[29]\d{8}$/.test(limpio);
};

// ── Parser CSV ────────────────────────────────────────────
const parsearCSV = (texto) => {
  const lineas = texto.split(/\r?\n/).filter(l => l.trim());
  if (lineas.length < 2) throw new Error('El archivo no tiene datos.');

  const header = lineas[0].toLowerCase();
  const sep    = header.includes(';') ? ';' : ',';
  const cols   = header.split(sep).map(c => c.trim().replace(/"/g, ''));

  if (!cols.includes('rut'))   throw new Error('El archivo no tiene columna "rut".');
  if (!cols.includes('email')) throw new Error('El archivo no tiene columna "email".');

  return lineas.slice(1).map((linea, i) => {
    const vals = linea.split(sep).map(v => v.trim().replace(/"/g, ''));
    const fila = {};
    cols.forEach((col, j) => { if (COLUMNAS_VALIDAS.includes(col)) fila[col] = vals[j] || ''; });
    fila._linea = i + 2;
    return fila;
  }).filter(f => f.rut || f.email);
};

// ── Parser Excel ──────────────────────────────────────────
const parsearExcel = async (buffer) => {
  try {
    const XLSX = await import('xlsx');
    const wb   = XLSX.read(buffer, { type: 'array' });
    const ws   = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    return rows.map((row, i) => {
      const fila = {};
      Object.keys(row).forEach(k => {
        const kl = k.toLowerCase().trim();
        if (COLUMNAS_VALIDAS.includes(kl)) fila[kl] = String(row[k]).trim();
      });
      if (!fila.rut && !fila.email) return null;
      fila._linea = i + 2;
      return fila;
    }).filter(Boolean);
  } catch {
    throw new Error('No se pudo leer el Excel. Asegúrate de subir un archivo .xlsx válido.');
  }
};

// ── Validar una fila ──────────────────────────────────────
const validarFila = (fila) => {
  const errores = [];
  if (!fila.rut)                      errores.push('RUT vacío');
  else if (!validarRUT(fila.rut))     errores.push(`RUT inválido (${fila.rut})`);
  if (!fila.email)                    errores.push('Email vacío');
  else if (!validarEmail(fila.email)) errores.push(`Email inválido (${fila.email})`);
  if (fila.telefono && !validarTelefono(fila.telefono))
    errores.push(`Teléfono inválido (${fila.telefono})`);
  return errores;
};

// ── Enviar al backend en chunks ───────────────────────────
// reemplazar=true → el primer chunk le indica al backend que borre todo antes de insertar
const enviarAlBackend = async (registros, onProgreso, reemplazar = true) => {
  const token = await getToken();
  if (!token) throw new Error('No autenticado. Inicia sesión como DPO.');

  let totalEscritos = 0;

  for (let i = 0; i < registros.length; i += CHUNK_SIZE) {
    const chunk       = registros.slice(i, i + CHUNK_SIZE);
    const esPrimerChunk = i === 0;

    const res = await fetch(`${API_URL}/api/rut-contactos/importar`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        registros,
        reemplazar: esPrimerChunk && reemplazar,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Error del servidor: ${res.status}`);
    }

    const data = await res.json();
    totalEscritos += data.data?.escritos || 0;

    const pct = Math.round(((i + chunk.length) / registros.length) * 100);
    onProgreso(Math.min(pct, 100));
  }

  return totalEscritos;
};

// ── Verificar estado colección via backend ────────────────
const verificarColeccion = async () => {
  try {
    const token = await getToken();
    if (!token) return null;
    const res = await fetch(`${API_URL}/api/rut-contactos/estado`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.tiene_registros ?? null;
  } catch {
    return null;
  }
};

// ════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════
const TabImportar = () => {
  const fileRef = useRef(null);

  const [fase, setFase]                       = useState('idle');
  const [archivo, setArchivo]                 = useState(null);
  const [filas, setFilas]                     = useState([]);
  const [validas, setValidas]                 = useState([]);
  const [rechazadas, setRechazadas]           = useState([]);
  const [progreso, setProgreso]               = useState(0);
  const [totalImportados, setTotalImportados] = useState(null);
  const [verRechazadas, setVerRechazadas]     = useState(false);
  const [tieneRegistros, setTieneRegistros]   = useState(null);
  const [reemplazar, setReemplazar]           = useState(true);

  useEffect(() => {
    verificarColeccion().then(setTieneRegistros);
  }, []);

  // ── Procesar archivo ──────────────────────────────────────
  const procesarArchivo = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      toast.error('Solo se aceptan archivos CSV o Excel (.xlsx / .xls)');
      return;
    }
    setArchivo(file);
    setFase('parseando');
    setFilas([]); setValidas([]); setRechazadas([]);

    try {
      let rows = [];
      if (ext === 'csv') {
        const texto = await file.text();
        rows = parsearCSV(texto);
      } else {
        const buffer = await file.arrayBuffer();
        rows = await parsearExcel(buffer);
      }

      if (rows.length === 0) { toast.error('El archivo no tiene filas con datos.'); setFase('idle'); return; }
      if (rows.length > MAX_FILAS) { toast.error(`Máximo ${MAX_FILAS.toLocaleString()} filas.`); setFase('idle'); return; }

      const ok  = [];
      const err = [];
      rows.forEach(fila => {
        const errores = validarFila(fila);
        if (errores.length === 0) ok.push({ ...fila, rut_normalizado: normalizarRUT(fila.rut) });
        else err.push({ ...fila, errores });
      });

      setFilas(rows); setValidas(ok); setRechazadas(err);
      setFase('revision');
    } catch (e) {
      toast.error(e.message || 'Error al procesar el archivo');
      setFase('idle');
    }
  }, []);

  const onDrop       = useCallback((e) => { e.preventDefault(); procesarArchivo(e.dataTransfer.files[0]); }, [procesarArchivo]);
  const onFileChange = (e) => procesarArchivo(e.target.files[0]);

  // ── Confirmar y enviar al backend ─────────────────────────
  const confirmarImportacion = async () => {
    if (validas.length === 0) { toast.error('No hay filas válidas para importar.'); return; }
    setFase('subiendo');
    setProgreso(0);

    const registros = validas.map(f => ({
      rut:      f.rut_normalizado,
      email:    f.email,
      telefono: f.telefono || null,
    }));

    try {
      const escritos = await enviarAlBackend(registros, setProgreso, reemplazar);
      setTotalImportados(escritos);
      setTieneRegistros(true);
      setFase('done');
      toast.success(`✅ ${escritos.toLocaleString()} registros importados correctamente`);
    } catch (e) {
      console.error('[TabImportar]', e);
      toast.error('Error al importar: ' + (e.message || 'Error desconocido'));
      setFase('revision');
    }
  };

  // ── Reiniciar ─────────────────────────────────────────────
  const reiniciar = () => {
    setFase('idle'); setArchivo(null);
    setFilas([]); setValidas([]); setRechazadas([]);
    setProgreso(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  const descargarPlantilla = () => {
    const blob = new Blob([PLANTILLA_CSV], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'plantilla_rut_contactos.csv';
    a.click(); URL.revokeObjectURL(url);
  };

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════
  return (
    <div className="space-y-8">

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">📥 Importar datos</h2>
        <p className="text-sm text-gray-500">
          Carga masiva de contactos RUT para el proceso de validación de identidad.
          Los registros existentes se actualizan automáticamente (upsert).
        </p>
      </div>

      {/* Card tipo + estado */}
      <div className="flex items-start gap-4 p-4 rounded-xl border-2 border-blue-500 bg-blue-50">
        <div className="p-2 rounded-lg bg-blue-100 flex-shrink-0">
          <Users className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-blue-700">Tabla RUT-Contactos</p>
          <p className="text-xs text-gray-500 mt-0.5">Asocia RUT con email y teléfono para validación de identidad.</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {['rut *', 'email *', 'telefono (opcional)'].map(col => (
              <span key={col} className="px-2 py-0.5 bg-white border border-blue-200 text-blue-700 rounded text-xs font-mono">{col}</span>
            ))}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-xs text-gray-400">Estado Firebase</p>
          <p className="text-xs font-semibold mt-0.5">
            {tieneRegistros === null
              ? <span className="text-gray-400">Verificando...</span>
              : tieneRegistros
                ? <span className="text-green-600">✓ Con registros</span>
                : <span className="text-amber-600">⚠ Sin datos aún</span>
            }
          </p>
        </div>
      </div>

      {/* ── idle ─────────────────────────────────────────── */}
      {fase === 'idle' && (
        <div
          onDragOver={e => e.preventDefault()} onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group"
        >
          <div className="p-4 bg-gray-100 group-hover:bg-blue-100 rounded-2xl transition-colors">
            <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">Arrastra tu archivo aquí o haz clic para seleccionar</p>
            <p className="text-xs text-gray-400 mt-1">CSV (coma o punto y coma) · Excel (.xlsx / .xls) · Máx. {MAX_FILAS.toLocaleString()} filas</p>
          </div>
          <button onClick={e => { e.stopPropagation(); descargarPlantilla(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-white transition-colors">
            <Download className="w-3.5 h-3.5" /> Descargar plantilla CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onFileChange} />
        </div>
      )}

      {/* ── parseando ────────────────────────────────────── */}
      {fase === 'parseando' && (
        <div className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-gray-500">Procesando <strong>{archivo?.name}</strong>...</p>
        </div>
      )}

      {/* ── revisión ─────────────────────────────────────── */}
      {fase === 'revision' && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
            <FileSpreadsheet className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{archivo?.name}</p>
              <p className="text-xs text-gray-400">{filas.length.toLocaleString()} filas leídas</p>
            </div>
            <button onClick={reiniciar} className="text-xs text-gray-500 hover:text-red-600 transition-colors flex-shrink-0">Cambiar archivo</button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
              <p className="text-2xl font-bold text-blue-700">{filas.length.toLocaleString()}</p>
              <p className="text-xs text-blue-600 mt-1">Total leídas</p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
              <p className="text-2xl font-bold text-green-700">{validas.length.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">Válidas → se importarán</p>
            </div>
            <div className={`p-4 border rounded-xl text-center ${rechazadas.length > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-2xl font-bold ${rechazadas.length > 0 ? 'text-red-700' : 'text-gray-400'}`}>{rechazadas.length.toLocaleString()}</p>
              <p className={`text-xs mt-1 ${rechazadas.length > 0 ? 'text-red-600' : 'text-gray-400'}`}>Rechazadas → se omitirán</p>
            </div>
          </div>

          {rechazadas.length > 0 && (
            <div className="border border-amber-200 rounded-xl overflow-hidden">
              <button onClick={() => setVerRechazadas(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 text-sm font-medium text-amber-800">
                <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500" />Ver {rechazadas.length} filas rechazadas</span>
                {verRechazadas ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {verRechazadas && (
                <div className="max-h-52 overflow-y-auto divide-y divide-amber-100">
                  {rechazadas.map((fila, i) => (
                    <div key={i} className="px-4 py-2.5 bg-white text-xs">
                      <span className="font-mono text-gray-400 mr-2">Línea {fila._linea}:</span>
                      <span className="text-gray-700">{fila.rut || '(sin RUT)'} · {fila.email || '(sin email)'}</span>
                      <span className="ml-2 text-red-600">→ {fila.errores.join(', ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {rechazadas.length === 0 && (
            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />Todas las filas son válidas. Listo para importar.
            </div>
          )}

          {/* Toggle reemplazar / agregar */}
          <div
            onClick={() => setReemplazar(v => !v)}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors select-none ${reemplazar ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-100'}`}
          >
            <div className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${reemplazar ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'}`}>
              {reemplazar && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <div>
              <p className={`text-xs font-semibold ${reemplazar ? 'text-orange-700' : 'text-blue-700'}`}>
                {reemplazar ? 'Reemplazar todo — borra los registros actuales e inserta los nuevos' : 'Agregar / actualizar — mantiene registros existentes y agrega los nuevos'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {reemplazar ? 'Útil para cargar una nueva versión completa del archivo.' : 'Útil para añadir contactos sin perder los anteriores.'}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={reiniciar} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
            <button onClick={confirmarImportacion} disabled={validas.length === 0}
              className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors ${reemplazar ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
              <Upload className="w-4 h-4" />{reemplazar ? 'Reemplazar' : 'Importar'} {validas.length.toLocaleString()} registros válidos
            </button>
          </div>
        </div>
      )}

      {/* ── subiendo ─────────────────────────────────────── */}
      {fase === 'subiendo' && (
        <div className="space-y-5 py-4">
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">Enviando registros al servidor...</p>
              <p className="text-xs text-blue-600 mt-0.5">No cierres esta ventana</p>
            </div>
            <span className="text-sm font-bold text-blue-700">{progreso}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div className="h-3 bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${progreso}%` }} />
          </div>
          <p className="text-xs text-center text-gray-400">Enviando en lotes de {CHUNK_SIZE.toLocaleString()} registros al backend</p>
        </div>
      )}

      {/* ── done ─────────────────────────────────────────── */}
      {fase === 'done' && (
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="p-4 bg-green-100 rounded-2xl"><CheckCircle2 className="w-10 h-10 text-green-600" /></div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-800">Importación completada</p>
              <p className="text-sm text-gray-500 mt-1">
                <strong>{totalImportados?.toLocaleString()}</strong> registros importados ·{' '}
                <strong>{rechazadas.length.toLocaleString()}</strong> omitidos
              </p>
              <p className="text-xs text-gray-400 mt-1">La tabla <span className="font-mono">rut_contactos</span> en Firebase está actualizada</p>
            </div>
          </div>

          {rechazadas.length > 0 && (
            <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {rechazadas.length} filas fueron omitidas. Corrígelas en el archivo y cárgalas nuevamente.
            </div>
          )}

          <button onClick={reiniciar}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-colors">
            <Upload className="w-4 h-4" /> Importar otro archivo
          </button>
        </div>
      )}

    </div>
  );
};

export default TabImportar;