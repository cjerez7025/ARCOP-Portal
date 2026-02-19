// ============================================================
// src/__tests__/flujoService.test.js
// Tests de la lógica de flujo de estados ARCOP
// Mockea el adapter para no depender de red
// Corre con: npm test -- --testPathPattern=flujoService
// ============================================================

// Mock del adapter ANTES de importar el service
jest.mock('../adapters', () => ({
  __esModule: true,
  default: {
    getFlujoConfig:  jest.fn(),
    saveFlujoConfig: jest.fn(),
  },
}));

import adapter from '../adapters';
import {
  obtenerFlujoConfig,
  guardarFlujoConfig,
  crearEstadoCustom,
  crearTransicion,
  crearCampoRequerido,
  restaurarFlujoDefault,
  buildConfigDefault,
} from '../services/flujoService';

beforeEach(() => {
  jest.clearAllMocks();
});

// ── buildConfigDefault / estructura base ──────────────────
describe('estructura del config por defecto', () => {
  test('tiene los 5 derechos ARCOP', () => {
    // Obtener defaults a través del servicio
    adapter.getFlujoConfig.mockResolvedValueOnce({ status: 'success', data: null });

    return obtenerFlujoConfig().then(result => {
      const derechos = Object.keys(result.data.derechos);
      expect(derechos).toEqual(
        expect.arrayContaining(['ACCESO', 'RECTIFICACION', 'CANCELACION', 'OPOSICION', 'PORTABILIDAD'])
      );
      expect(derechos).toHaveLength(5);
    });
  });

  test('cada derecho tiene estados activos', () => {
    adapter.getFlujoConfig.mockResolvedValueOnce({ status: 'success', data: null });

    return obtenerFlujoConfig().then(result => {
      Object.entries(result.data.derechos).forEach(([key, derecho]) => {
        expect(derecho.estados).toBeDefined();
        expect(derecho.estados.length).toBeGreaterThan(0);
        const activos = derecho.estados.filter(e => e.activo);
        expect(activos.length).toBeGreaterThan(0);
      });
    });
  });

  test('cada flujo tiene al menos un estado inicial y un estado final', () => {
    adapter.getFlujoConfig.mockResolvedValueOnce({ status: 'success', data: null });

    return obtenerFlujoConfig().then(result => {
      Object.entries(result.data.derechos).forEach(([key, derecho]) => {
        const inicial = derecho.estados.find(e => e.es_inicial);
        const final_  = derecho.estados.find(e => e.es_final);
        expect(inicial).toBeDefined();
        expect(final_).toBeDefined();
      });
    });
  });

  test('los estados de ley tienen artículo definido', () => {
    adapter.getFlujoConfig.mockResolvedValueOnce({ status: 'success', data: null });

    return obtenerFlujoConfig().then(result => {
      Object.values(result.data.derechos).forEach(derecho => {
        derecho.estados
          .filter(e => e.origen === 'ley')
          .forEach(e => {
            expect(e.articulo).toBeTruthy();
          });
      });
    });
  });
});

// ── obtenerFlujoConfig ────────────────────────────────────
describe('obtenerFlujoConfig', () => {
  test('retorna defaults cuando el adapter devuelve null', async () => {
    adapter.getFlujoConfig.mockResolvedValueOnce({ status: 'success', data: null });
    const result = await obtenerFlujoConfig();
    expect(result.status).toBe('success');
    expect(result.source).toBe('default');
    expect(result.data.derechos).toBeDefined();
  });

  test('retorna y mergea config guardada con defaults', async () => {
    const configParcial = {
      derechos: {
        ACCESO: {
          estados: [
            { id: 'PENDIENTE', nombre: 'Pendiente Custom', activo: true,
              origen: 'ley', es_inicial: true, es_final: false,
              transiciones: [], color: 'yellow', orden: 1 }
          ]
        }
      }
    };
    adapter.getFlujoConfig.mockResolvedValueOnce({ status: 'success', data: configParcial });

    const result = await obtenerFlujoConfig();
    expect(result.status).toBe('success');
    // El config mergeado debe tener todos los derechos
    expect(Object.keys(result.data.derechos)).toHaveLength(5);
    // Y el nombre custom debe preservarse
    const acceso = result.data.derechos.ACCESO;
    const pendiente = acceso.estados.find(e => e.id === 'PENDIENTE');
    expect(pendiente.nombre).toBe('Pendiente Custom');
  });

  test('usa defaults si el adapter falla', async () => {
    adapter.getFlujoConfig.mockRejectedValueOnce(new Error('red no disponible'));
    const result = await obtenerFlujoConfig();
    expect(result.status).toBe('success');
    expect(result.source).toBe('default');
  });
});

// ── guardarFlujoConfig ────────────────────────────────────
describe('guardarFlujoConfig', () => {
  test('delega al adapter con el config completo', async () => {
    adapter.saveFlujoConfig.mockResolvedValueOnce({ status: 'success' });

    const config = { version: '1.0', derechos: {} };
    const result = await guardarFlujoConfig(config);

    expect(adapter.saveFlujoConfig).toHaveBeenCalledWith(config);
    expect(result.status).toBe('success');
  });

  test('retorna error si el adapter falla', async () => {
    adapter.saveFlujoConfig.mockRejectedValueOnce(new Error('fallo'));
    const result = await guardarFlujoConfig({});
    expect(result.status).toBe('error');
    expect(result.message).toContain('fallo');
  });
});

// ── crearEstadoCustom ─────────────────────────────────────
describe('crearEstadoCustom', () => {
  test('crea estado con valores por defecto', () => {
    const estado = crearEstadoCustom();
    expect(estado.id).toMatch(/^CUSTOM_/);
    expect(estado.origen).toBe('custom');
    expect(estado.activo).toBe(true);
    expect(estado.protegido).toBe(false);
    expect(estado.es_final).toBe(false);
    expect(estado.transiciones).toEqual([]);
  });

  test('permite sobreescribir campos', () => {
    const estado = crearEstadoCustom({ nombre: 'Mi Estado', color: 'green', es_final: true });
    expect(estado.nombre).toBe('Mi Estado');
    expect(estado.color).toBe('green');
    expect(estado.es_final).toBe(true);
    expect(estado.origen).toBe('custom'); // no sobreescrito
  });

  test('genera IDs únicos', () => {
    const ids = new Set(Array.from({ length: 50 }, () => crearEstadoCustom().id));
    expect(ids.size).toBe(50);
  });
});

// ── crearTransicion ───────────────────────────────────────
describe('crearTransicion', () => {
  test('crea transición con valores por defecto', () => {
    const tr = crearTransicion({ hacia: 'VALIDADA' });
    expect(tr.id).toMatch(/^tr_/);
    expect(tr.hacia).toBe('VALIDADA');
    expect(tr.condicion).toBe('dpo_elige');
    expect(tr.campos_requeridos).toEqual([]);
    expect(tr.color).toBe('blue');
  });

  test('permite condición automática', () => {
    const tr = crearTransicion({
      hacia: 'VALIDADA',
      condicion: 'automatica',
      condicion_campo: 'identidad_validada',
      condicion_valor: 'TRUE',
    });
    expect(tr.condicion).toBe('automatica');
    expect(tr.condicion_campo).toBe('identidad_validada');
    expect(tr.condicion_valor).toBe('TRUE');
  });

  test('genera IDs únicos', () => {
    const ids = new Set(Array.from({ length: 50 }, () => crearTransicion({ hacia: 'X' }).id));
    expect(ids.size).toBe(50);
  });
});

// ── crearCampoRequerido ───────────────────────────────────
describe('crearCampoRequerido', () => {
  test('crea campo con defaults', () => {
    const campo = crearCampoRequerido({ label: 'Motivo' });
    expect(campo.id).toBeDefined();
    expect(campo.label).toBe('Motivo');
    expect(campo.tipo).toBe('text');
    expect(campo.obligatorio).toBe(false);
  });

  test('permite campo obligatorio', () => {
    const campo = crearCampoRequerido({ label: 'URL datos', tipo: 'url', obligatorio: true });
    expect(campo.obligatorio).toBe(true);
    expect(campo.tipo).toBe('url');
  });
});

// ── Integridad del flujo ACCESO ───────────────────────────
describe('flujo ACCESO — integridad de transiciones', () => {
  test('todos los estados destino en transiciones existen en el flujo', async () => {
    adapter.getFlujoConfig.mockResolvedValueOnce({ status: 'success', data: null });
    const result = await obtenerFlujoConfig();
    const acceso = result.data.derechos.ACCESO;
    const idsEstados = new Set(acceso.estados.map(e => e.id));

    acceso.estados.forEach(estado => {
      (estado.transiciones || []).forEach(tr => {
        expect(idsEstados.has(tr.hacia)).toBe(true);
      });
    });
  });

  test('no hay ciclos de un solo paso (A→A)', async () => {
    adapter.getFlujoConfig.mockResolvedValueOnce({ status: 'success', data: null });
    const result = await obtenerFlujoConfig();

    Object.values(result.data.derechos).forEach(derecho => {
      derecho.estados.forEach(estado => {
        (estado.transiciones || []).forEach(tr => {
          expect(tr.hacia).not.toBe(estado.id);
        });
      });
    });
  });
});