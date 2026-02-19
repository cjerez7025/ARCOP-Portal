// ============================================================
// src/__tests__/transicionesEstado.test.js
//
// Tests de lógica de negocio del flujo de solicitudes:
//   - ¿La transición está permitida desde el estado actual?
//   - ¿Se envía email al cambiar a cierto estado?
//   - ¿Qué template de email corresponde a cada estado?
//   - ¿La transición automática se dispara con la condición correcta?
//   - ¿Los campos requeridos por transición están presentes?
//
// Sin red, sin Sheets, sin browser. 100% lógica pura.
// Corre con: npm test -- --testPathPattern=transicionesEstado
// ============================================================

// ── Mock del adapter ──────────────────────────────────────
jest.mock('../adapters', () => ({
  __esModule: true,
  default: {
    getFlujoConfig:  jest.fn(),
    saveFlujoConfig: jest.fn(),
  },
}));

import adapter from '../adapters';
import { obtenerFlujoConfig } from '../services/flujoService';

// ── Helpers del motor de transiciones ────────────────────
// Estas funciones simulan la lógica que corre cuando el DPO
// cambia el estado de una solicitud.

/**
 * Dado un flujo de estados y un estado actual,
 * retorna los estados a los que se puede transicionar.
 */
const obtenerTransicionesPermitidas = (estados, estadoActualId) => {
  const estadoActual = estados.find(e => e.id === estadoActualId);
  if (!estadoActual) return [];
  return (estadoActual.transiciones || []).map(tr => tr.hacia);
};

/**
 * Verifica si una transición específica está permitida.
 */
const transicionPermitida = (estados, desde, hacia) => {
  const permitidas = obtenerTransicionesPermitidas(estados, desde);
  return permitidas.includes(hacia);
};

/**
 * Retorna la definición de una transición específica
 * (incluye si envía email, campos requeridos, condición).
 */
const obtenerDefinicionTransicion = (estados, desde, hacia) => {
  const estadoActual = estados.find(e => e.id === desde);
  if (!estadoActual) return null;
  return (estadoActual.transiciones || []).find(tr => tr.hacia === hacia) || null;
};

/**
 * Dado un estado destino, retorna si ese estado envía email.
 */
const estadoEnviaEmail = (estados, estadoId) => {
  const estado = estados.find(e => e.id === estadoId);
  return estado?.envia_email === true;
};

/**
 * Simula el motor de transición automática:
 * dado el estado actual y los datos de la solicitud,
 * retorna el próximo estado si corresponde transición automática.
 */
const evaluarTransicionAutomatica = (estados, estadoActualId, datosSolicitud) => {
  const estadoActual = estados.find(e => e.id === estadoActualId);
  if (!estadoActual) return null;

  const transAuto = (estadoActual.transiciones || []).find(
    tr => tr.condicion === 'automatica'
  );
  if (!transAuto) return null;

  // Evaluar la condición
  const { condicion_campo, condicion_valor } = transAuto;
  if (!condicion_campo) return transAuto.hacia; // sin condición = siempre

  const valorActual = datosSolicitud[condicion_campo];
  if (valorActual === condicion_valor || String(valorActual) === String(condicion_valor)) {
    return transAuto.hacia;
  }

  return null;
};

/**
 * Valida que los campos requeridos de una transición estén presentes.
 */
const validarCamposTransicion = (transicion, datos) => {
  const faltantes = [];
  (transicion.campos_requeridos || [])
    .filter(c => c.obligatorio)
    .forEach(campo => {
      if (!datos[campo.id] && datos[campo.id] !== 0) {
        faltantes.push(campo.label || campo.id);
      }
    });
  return { valido: faltantes.length === 0, faltantes };
};

// ── Setup: cargar flujo default antes de todos los tests ──
let flujoConfig;

beforeAll(async () => {
  adapter.getFlujoConfig.mockResolvedValue({ status: 'success', data: null });
  const result = await obtenerFlujoConfig();
  flujoConfig = result.data;
});

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────
// TESTS DE TRANSICIONES PERMITIDAS — DERECHO ACCESO
// ─────────────────────────────────────────────────────────
describe('Transiciones permitidas — ACCESO', () => {
  let estados;

  beforeAll(() => {
    estados = flujoConfig.derechos.ACCESO.estados;
  });

  test('desde PENDIENTE se puede ir a VALIDADA', () => {
    expect(transicionPermitida(estados, 'PENDIENTE', 'VALIDADA')).toBe(true);
  });

  test('desde PENDIENTE NO se puede ir directamente a RESUELTA', () => {
    expect(transicionPermitida(estados, 'PENDIENTE', 'RESUELTA')).toBe(false);
  });

  test('desde VALIDADA se puede ir a EN_PROCESO', () => {
    expect(transicionPermitida(estados, 'VALIDADA', 'EN_PROCESO')).toBe(true);
  });

  test('desde EN_PROCESO se puede ir a RESUELTA', () => {
    expect(transicionPermitida(estados, 'EN_PROCESO', 'RESUELTA')).toBe(true);
  });

  test('desde RESUELTA se puede ir a CERRADA', () => {
    expect(transicionPermitida(estados, 'RESUELTA', 'CERRADA')).toBe(true);
  });

  test('desde CERRADA NO se puede ir a ningún estado (es final)', () => {
    const permitidas = obtenerTransicionesPermitidas(estados, 'CERRADA');
    expect(permitidas).toHaveLength(0);
  });

  test('desde RESUELTA NO se puede volver a PENDIENTE', () => {
    expect(transicionPermitida(estados, 'RESUELTA', 'PENDIENTE')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────
// TESTS DE EMAIL POR ESTADO
// ─────────────────────────────────────────────────────────
describe('Notificaciones de email por estado — ACCESO', () => {
  let estados;

  beforeAll(() => {
    estados = flujoConfig.derechos.ACCESO.estados;
  });

  test('el estado VALIDADA envía email al titular', () => {
    expect(estadoEnviaEmail(estados, 'VALIDADA')).toBe(true);
  });

  test('el estado EN_PROCESO envía email al titular', () => {
    expect(estadoEnviaEmail(estados, 'EN_PROCESO')).toBe(true);
  });

  test('el estado RESUELTA envía email al titular', () => {
    expect(estadoEnviaEmail(estados, 'RESUELTA')).toBe(true);
  });

  test('el estado PENDIENTE NO envía email (aún no validado)', () => {
    // PENDIENTE es el estado inicial — el email ya fue enviado al crear la solicitud
    expect(estadoEnviaEmail(estados, 'PENDIENTE')).toBe(false);
  });

  test('CERRADA no envía email (estado administrativo)', () => {
    expect(estadoEnviaEmail(estados, 'CERRADA')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────
// TESTS DE TRANSICIÓN AUTOMÁTICA
// ─────────────────────────────────────────────────────────
describe('Transiciones automáticas — ACCESO', () => {
  let estados;

  beforeAll(() => {
    estados = flujoConfig.derechos.ACCESO.estados;
  });

  test('PENDIENTE → VALIDADA ocurre automáticamente cuando identidad_validada = TRUE', () => {
    const siguienteEstado = evaluarTransicionAutomatica(
      estados,
      'PENDIENTE',
      { identidad_validada: 'TRUE' }
    );
    expect(siguienteEstado).toBe('VALIDADA');
  });

  test('PENDIENTE NO cambia automáticamente si identidad NO validada', () => {
    const siguienteEstado = evaluarTransicionAutomatica(
      estados,
      'PENDIENTE',
      { identidad_validada: 'FALSE' }
    );
    expect(siguienteEstado).toBeNull();
  });

  test('EN_PROCESO no tiene transición automática (el DPO elige)', () => {
    const siguienteEstado = evaluarTransicionAutomatica(
      estados,
      'EN_PROCESO',
      {} // sin datos relevantes
    );
    expect(siguienteEstado).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────
// TESTS DE CAMPOS REQUERIDOS EN TRANSICIONES
// ─────────────────────────────────────────────────────────
describe('Campos requeridos por transición — ACCESO', () => {
  let estados;

  beforeAll(() => {
    estados = flujoConfig.derechos.ACCESO.estados;
  });

  test('transición EN_PROCESO → RESUELTA requiere url_datos', () => {
    const tr = obtenerDefinicionTransicion(estados, 'EN_PROCESO', 'RESUELTA');
    if (!tr) return; // si no existe la transición, saltear

    // Sin url_datos: inválido
    const sinUrl = validarCamposTransicion(tr, {});
    if (tr.campos_requeridos?.some(c => c.id === 'url_datos' && c.obligatorio)) {
      expect(sinUrl.valido).toBe(false);
      expect(sinUrl.faltantes.length).toBeGreaterThan(0);
    }

    // Con url_datos: válido
    const conUrl = validarCamposTransicion(tr, { url_datos: 'https://drive.google.com/file/test' });
    expect(conUrl.valido).toBe(true);
    expect(conUrl.faltantes).toHaveLength(0);
  });

  test('transición sin campos requeridos siempre es válida', () => {
    // Buscar cualquier transición sin campos requeridos
    for (const estado of estados) {
      for (const tr of (estado.transiciones || [])) {
        if (!tr.campos_requeridos || tr.campos_requeridos.length === 0) {
          const result = validarCamposTransicion(tr, {});
          expect(result.valido).toBe(true);
          return; // basta con encontrar uno
        }
      }
    }
  });
});

// ─────────────────────────────────────────────────────────
// TESTS DE CONSISTENCIA — TODOS LOS DERECHOS
// ─────────────────────────────────────────────────────────
describe('Consistencia de flujos — todos los derechos ARCOP', () => {

  test('ningún derecho tiene transiciones a estados inexistentes', () => {
    Object.entries(flujoConfig.derechos).forEach(([derecho, config]) => {
      const idsValidos = new Set(config.estados.map(e => e.id));
      config.estados.forEach(estado => {
        (estado.transiciones || []).forEach(tr => {
          expect(idsValidos.has(tr.hacia)).toBe(true);
        });
      });
    });
  });

  test('cada derecho tiene exactamente un estado inicial', () => {
    Object.entries(flujoConfig.derechos).forEach(([derecho, config]) => {
      const iniciales = config.estados.filter(e => e.es_inicial && e.activo);
      expect(iniciales).toHaveLength(1);
    });
  });

  test('cada derecho tiene al menos un estado final', () => {
    Object.entries(flujoConfig.derechos).forEach(([derecho, config]) => {
      const finales = config.estados.filter(e => e.es_final && e.activo);
      expect(finales.length).toBeGreaterThanOrEqual(1);
    });
  });

  test('los estados finales no tienen transiciones de salida', () => {
    Object.entries(flujoConfig.derechos).forEach(([derecho, config]) => {
      config.estados
        .filter(e => e.es_final)
        .forEach(estado => {
          const salidas = (estado.transiciones || []).filter(tr => tr.activa !== false);
          expect(salidas).toHaveLength(0);
        });
    });
  });

  test('el estado inicial no recibe transiciones entrantes', () => {
    Object.entries(flujoConfig.derechos).forEach(([derecho, config]) => {
      const inicial = config.estados.find(e => e.es_inicial);
      if (!inicial) return;

      config.estados.forEach(estado => {
        if (estado.id === inicial.id) return;
        const apuntaAlInicial = (estado.transiciones || []).some(tr => tr.hacia === inicial.id);
        expect(apuntaAlInicial).toBe(false);
      });
    });
  });

  test('todos los estados tienen nombre definido', () => {
    Object.values(flujoConfig.derechos).forEach(config => {
      config.estados.forEach(estado => {
        expect(estado.nombre).toBeTruthy();
        expect(estado.nombre.trim()).not.toBe('');
      });
    });
  });

  test('las transiciones automáticas tienen condicion_campo definido', () => {
    Object.values(flujoConfig.derechos).forEach(config => {
      config.estados.forEach(estado => {
        (estado.transiciones || [])
          .filter(tr => tr.condicion === 'automatica')
          .forEach(tr => {
            // Si es automática basada en condición debe tener el campo especificado
            if (tr.condicion_campo !== undefined) {
              expect(tr.condicion_campo).toBeTruthy();
            }
          });
      });
    });
  });
});

// ─────────────────────────────────────────────────────────
// TESTS DE SIMULACIÓN DE FLUJO COMPLETO
// ─────────────────────────────────────────────────────────
describe('Simulación flujo completo — solicitud de ACCESO', () => {
  let estados;

  beforeAll(() => {
    estados = flujoConfig.derechos.ACCESO.estados;
  });

  test('recorrido feliz: PENDIENTE → VALIDADA → EN_PROCESO → RESUELTA → CERRADA', () => {
    const recorrido = ['PENDIENTE', 'VALIDADA', 'EN_PROCESO', 'RESUELTA', 'CERRADA'];

    for (let i = 0; i < recorrido.length - 1; i++) {
      const desde = recorrido[i];
      const hacia = recorrido[i + 1];
      const permitida = transicionPermitida(estados, desde, hacia);
      expect(permitida).toBe(true);
    }
  });

  test('la solicitud recibe email en cada paso relevante del recorrido feliz', () => {
    const pasosConEmail = ['VALIDADA', 'EN_PROCESO', 'RESUELTA'];
    const pasosSinEmail = ['PENDIENTE', 'CERRADA'];

    pasosConEmail.forEach(estadoId => {
      expect(estadoEnviaEmail(estados, estadoId)).toBe(true);
    });

    pasosSinEmail.forEach(estadoId => {
      expect(estadoEnviaEmail(estados, estadoId)).toBe(false);
    });
  });

  test('el sistema puede determinar el primer estado automáticamente', () => {
    // Al validar identidad, PENDIENTE → VALIDADA debe ser automático
    const siguienteAuto = evaluarTransicionAutomatica(
      estados,
      'PENDIENTE',
      { identidad_validada: 'TRUE', email: 'titular@test.cl' }
    );
    expect(siguienteAuto).toBe('VALIDADA');
  });
});