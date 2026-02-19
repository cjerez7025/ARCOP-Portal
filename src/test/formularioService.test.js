// ============================================================
// src/__tests__/formularioService.test.js
// Tests del servicio de formularios dinámicos
// Corre con: npm test -- --testPathPattern=formularioService
// ============================================================

jest.mock('../adapters', () => ({
  __esModule: true,
  default: {
    getFormularioConfig:  jest.fn(),
    saveFormularioConfig: jest.fn(),
  },
}));

import adapter from '../adapters';
import {
  obtenerFormularioConfig,
  guardarFormularioConfig,
  restaurarDerechoADefault,
  crearCampoCustom,
} from '../services/formularioService';

beforeEach(() => jest.clearAllMocks());

// ── Estructura del config por defecto ─────────────────────
describe('config por defecto de formularios', () => {
  test('tiene los 5 derechos ARCOP', async () => {
    adapter.getFormularioConfig.mockResolvedValueOnce({ status: 'success', data: null });
    const result = await obtenerFormularioConfig();
    const derechos = Object.keys(result.data.derechos);
    expect(derechos).toEqual(
      expect.arrayContaining(['ACCESO', 'RECTIFICACION', 'CANCELACION', 'OPOSICION', 'PORTABILIDAD'])
    );
  });

  test('cada derecho tiene campos activos por defecto', async () => {
    adapter.getFormularioConfig.mockResolvedValueOnce({ status: 'success', data: null });
    const result = await obtenerFormularioConfig();
    Object.entries(result.data.derechos).forEach(([key, derecho]) => {
      expect(derecho.campos).toBeDefined();
      expect(derecho.campos.length).toBeGreaterThan(0);
      const activos = derecho.campos.filter(c => c.activo);
      expect(activos.length).toBeGreaterThan(0);
    });
  });

  test('los campos obligatorios por ley no son desactivables', async () => {
    adapter.getFormularioConfig.mockResolvedValueOnce({ status: 'success', data: null });
    const result = await obtenerFormularioConfig();
    Object.values(result.data.derechos).forEach(derecho => {
      derecho.campos
        .filter(c => c.obligatorio && c.protegido)
        .forEach(c => {
          // Si es protegido y obligatorio, debe ser origen 'ley'
          expect(c.origen).toBe('ley');
        });
    });
  });

  test('todos los campos tienen id único dentro de cada derecho', async () => {
    adapter.getFormularioConfig.mockResolvedValueOnce({ status: 'success', data: null });
    const result = await obtenerFormularioConfig();
    Object.entries(result.data.derechos).forEach(([key, derecho]) => {
      const ids = derecho.campos.map(c => c.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });
  });
});

// ── obtenerFormularioConfig ───────────────────────────────
describe('obtenerFormularioConfig', () => {
  test('usa defaults cuando el adapter devuelve null', async () => {
    adapter.getFormularioConfig.mockResolvedValueOnce({ status: 'success', data: null });
    const result = await obtenerFormularioConfig();
    expect(result.status).toBe('success');
    expect(result.source).toBe('default');
  });

  test('mergea campos nuevos al config guardado', async () => {
    // Config guardado solo tiene ACCESO (incompleto)
    const configParcial = {
      version: '1.0',
      derechos: {
        ACCESO: { activo: true, campos: [{ id: 'nombre_completo', tipo: 'text', label: 'Nombre', activo: true, protegido: true, obligatorio: true, origen: 'ley', orden: 1 }] }
      }
    };
    adapter.getFormularioConfig.mockResolvedValueOnce({ status: 'success', data: configParcial });

    const result = await obtenerFormularioConfig();
    expect(result.status).toBe('success');
    // Debe tener todos los derechos después del merge
    expect(Object.keys(result.data.derechos)).toHaveLength(5);
    // Y el campo custom del ACCESO debe estar
    const accesoCampos = result.data.derechos.ACCESO.campos;
    const nombreCampo = accesoCampos.find(c => c.id === 'nombre_completo');
    expect(nombreCampo).toBeDefined();
  });

  test('usa defaults si el adapter lanza error', async () => {
    adapter.getFormularioConfig.mockRejectedValueOnce(new Error('timeout'));
    const result = await obtenerFormularioConfig();
    expect(result.status).toBe('success');
    expect(result.source).toBe('default');
  });
});

// ── guardarFormularioConfig ───────────────────────────────
describe('guardarFormularioConfig', () => {
  test('delega al adapter', async () => {
    adapter.saveFormularioConfig.mockResolvedValueOnce({ status: 'success' });
    const config = { version: '1.0', derechos: {} };
    await guardarFormularioConfig(config);
    expect(adapter.saveFormularioConfig).toHaveBeenCalledWith(config);
  });

  test('retorna error si el adapter falla', async () => {
    adapter.saveFormularioConfig.mockRejectedValueOnce(new Error('sin conexión'));
    const result = await guardarFormularioConfig({});
    expect(result.status).toBe('error');
  });
});

// ── restaurarDerechoADefault ──────────────────────────────
describe('restaurarDerechoADefault', () => {
  test('retorna campos del derecho ACCESO', () => {
    const restored = restaurarDerechoADefault('ACCESO');
    expect(restored.activo).toBe(true);
    expect(restored.campos).toBeDefined();
    expect(restored.campos.length).toBeGreaterThan(0);
  });

  test('los campos restaurados incluyen nombre_completo y rut', () => {
    const restored = restaurarDerechoADefault('ACCESO');
    const ids = restored.campos.map(c => c.id);
    expect(ids).toContain('nombre_completo');
    expect(ids).toContain('rut');
    expect(ids).toContain('email');
  });

  test('funciona para todos los derechos', () => {
    ['ACCESO', 'RECTIFICACION', 'CANCELACION', 'OPOSICION', 'PORTABILIDAD'].forEach(d => {
      const restored = restaurarDerechoADefault(d);
      expect(restored.campos.length).toBeGreaterThan(0);
    });
  });
});

// ── crearCampoCustom ──────────────────────────────────────
describe('crearCampoCustom', () => {
  test('crea campo con defaults correctos', () => {
    const campo = crearCampoCustom('ACCESO', { label: 'Comentario adicional' });
    expect(campo.id).toMatch(/^custom_/);
    expect(campo.label).toBe('Comentario adicional');
    expect(campo.origen).toBe('custom');
    expect(campo.protegido).toBe(false);
    expect(campo.activo).toBe(true);
    expect(campo.editable).toBe(true);
  });

  test('genera IDs únicos', () => {
    const ids = new Set(Array.from({ length: 50 }, () => crearCampoCustom('ACCESO').id));
    expect(ids.size).toBe(50);
  });

  test('permite tipo select con opciones', () => {
    const campo = crearCampoCustom('ACCESO', {
      tipo: 'select',
      opciones: ['opcion1', 'opcion2'],
    });
    expect(campo.tipo).toBe('select');
    expect(campo.opciones).toHaveLength(2);
  });
});