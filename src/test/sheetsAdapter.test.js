// ============================================================
// src/__tests__/sheetsAdapter.test.js
// Tests del adapter — mockea fetch globalmente, sin red real
// Corre con: npm test -- --testPathPattern=sheetsAdapter
// ============================================================

// Mock de fetch ANTES de importar el adapter
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock de la variable de entorno
process.env.REACT_APP_APPS_SCRIPT_URL = 'https://script.google.com/mock';

// Importar DESPUÉS del mock
const sheetsAdapter = require('../adapters/sheetsAdapter').default;

// Helper para simular respuesta de fetch
const mockResponse = (data, ok = true) => {
  const body = JSON.stringify(data);
  return Promise.resolve({
    ok,
    text:  () => Promise.resolve(body),
    json:  () => Promise.resolve(data),
  });
};

beforeEach(() => {
  mockFetch.mockClear();
});

// ── getConfig ─────────────────────────────────────────────
describe('sheetsAdapter.getConfig', () => {
  test('hace GET a getConfiguracion y retorna data', async () => {
    const mockData = { empresa_nombre: 'ARCOP', dpo_email: 'dpo@arcop.cl' };
    mockFetch.mockReturnValueOnce(mockResponse({ status: 'success', data: mockData }));

    const result = await sheetsAdapter.getConfig();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('action=getConfiguracion');
    expect(result.status).toBe('success');
    expect(result.data).toEqual(mockData);
  });
});

// ── saveConfig ────────────────────────────────────────────
describe('sheetsAdapter.saveConfig', () => {
  test('hace POST a guardarConfiguracion con los datos', async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ status: 'success' }));

    const config = { empresa_nombre: 'Test', dpo_email: 'test@test.cl' };
    const result = await sheetsAdapter.saveConfig(config);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('action=guardarConfiguracion');
    expect(options.method).toBe('POST');

    const body = JSON.parse(options.body);
    expect(body.empresa_nombre).toBe('Test');
    expect(body.dpo_email).toBe('test@test.cl');
    expect(result.status).toBe('success');
  });
});

// ── getFormularioConfig ───────────────────────────────────
describe('sheetsAdapter.getFormularioConfig', () => {
  test('parsea campos_formulario si es string JSON', async () => {
    const formulario = { version: '1.0', derechos: { ACCESO: { activo: true, campos: [] } } };
    mockFetch.mockReturnValueOnce(mockResponse({
      status: 'success',
      data: { campos_formulario: JSON.stringify(formulario) },
    }));

    const result = await sheetsAdapter.getFormularioConfig();
    expect(result.status).toBe('success');
    expect(result.data).toEqual(formulario);
  });

  test('retorna data: null si campos_formulario no existe', async () => {
    mockFetch.mockReturnValueOnce(mockResponse({
      status: 'success',
      data: { empresa_nombre: 'ARCOP' }, // sin campos_formulario
    }));

    const result = await sheetsAdapter.getFormularioConfig();
    expect(result.status).toBe('success');
    expect(result.data).toBeNull();
  });

  test('retorna data: null si campos_formulario es JSON inválido', async () => {
    mockFetch.mockReturnValueOnce(mockResponse({
      status: 'success',
      data: { campos_formulario: 'no es json válido {{{' },
    }));

    const result = await sheetsAdapter.getFormularioConfig();
    expect(result.status).toBe('success');
    expect(result.data).toBeNull();
  });
});

// ── saveFormularioConfig ──────────────────────────────────
describe('sheetsAdapter.saveFormularioConfig', () => {
  test('serializa formularioConfig como JSON y no pisa otros campos', async () => {
    const configExistente = { empresa_nombre: 'ARCOP', dpo_email: 'dpo@arcop.cl' };
    const nuevoFormulario  = { version: '1.0', derechos: {} };

    // Primera llamada: getConfiguracion (para leer config actual)
    mockFetch.mockReturnValueOnce(mockResponse({ status: 'success', data: configExistente }));
    // Segunda llamada: guardarConfiguracion
    mockFetch.mockReturnValueOnce(mockResponse({ status: 'success' }));

    await sheetsAdapter.saveFormularioConfig(nuevoFormulario);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [, options] = mockFetch.mock.calls[1];
    const body = JSON.parse(options.body);

    // Debe preservar campos existentes
    expect(body.empresa_nombre).toBe('ARCOP');
    expect(body.dpo_email).toBe('dpo@arcop.cl');
    // Y agregar el formulario serializado
    expect(body.campos_formulario).toBe(JSON.stringify(nuevoFormulario));
  });
});

// ── getFlujoConfig ────────────────────────────────────────
describe('sheetsAdapter.getFlujoConfig', () => {
  test('parsea flujo_config si es string JSON', async () => {
    const flujo = { version: '1.0', derechos: { ACCESO: { estados: [] } } };
    mockFetch.mockReturnValueOnce(mockResponse({
      status: 'success',
      data: { flujo_config: JSON.stringify(flujo) },
    }));

    const result = await sheetsAdapter.getFlujoConfig();
    expect(result.status).toBe('success');
    expect(result.data).toEqual(flujo);
  });

  test('retorna data: null si flujo_config no existe', async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ status: 'success', data: {} }));
    const result = await sheetsAdapter.getFlujoConfig();
    expect(result.data).toBeNull();
  });
});

// ── saveFlujoConfig ───────────────────────────────────────
describe('sheetsAdapter.saveFlujoConfig', () => {
  test('serializa flujoConfig y no pisa otros campos', async () => {
    const configExistente = { empresa_nombre: 'ARCOP', campos_formulario: '{}' };
    const nuevoFlujo       = { version: '1.0', derechos: {} };

    mockFetch.mockReturnValueOnce(mockResponse({ status: 'success', data: configExistente }));
    mockFetch.mockReturnValueOnce(mockResponse({ status: 'success' }));

    await sheetsAdapter.saveFlujoConfig(nuevoFlujo);

    const [, options] = mockFetch.mock.calls[1];
    const body = JSON.parse(options.body);

    expect(body.empresa_nombre).toBe('ARCOP');
    expect(body.campos_formulario).toBe('{}'); // preservado
    expect(body.flujo_config).toBe(JSON.stringify(nuevoFlujo));
  });
});

// ── Error sin API_URL ─────────────────────────────────────
describe('sheetsAdapter sin API_URL', () => {
  test('lanza error si REACT_APP_APPS_SCRIPT_URL no está configurada', async () => {
    const urlOriginal = process.env.REACT_APP_APPS_SCRIPT_URL;
    delete process.env.REACT_APP_APPS_SCRIPT_URL;

    // Forzar recarga del módulo para que tome el nuevo env
    jest.resetModules();
    const adapterSinUrl = require('../adapters/sheetsAdapter').default;

    await expect(adapterSinUrl.getConfig()).rejects.toThrow('REACT_APP_APPS_SCRIPT_URL');

    process.env.REACT_APP_APPS_SCRIPT_URL = urlOriginal;
  });
});