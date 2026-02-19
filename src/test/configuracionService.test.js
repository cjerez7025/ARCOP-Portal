// ============================================================
// src/__tests__/configuracionService.test.js
// Tests de validación del cliente (sin llamadas a red)
// Corre con: npm test -- --testPathPattern=configuracionService
// ============================================================

import { validarConfiguracionCliente } from '../services/configuracionService';

describe('validarConfiguracionCliente', () => {

  const configValida = {
    empresa_nombre:           'ARCOP Consultores SpA',
    empresa_rut:              '11.111.111-1',
    dpo_email:                'dpo@arcop.cl',
    empresa_email:            'contacto@arcop.cl',
    portal_color:             '#2563eb',
    portal_color_secundario:  '#1e40af',
    dias_respuesta:           '15',
    dias_alerta:              '3',
  };

  test('acepta config completamente válida', () => {
    const { valido, errores } = validarConfiguracionCliente(configValida);
    expect(valido).toBe(true);
    expect(errores).toHaveLength(0);
  });

  // Campos obligatorios
  test.each([
    ['empresa_nombre', 'nombre de la empresa'],
    ['empresa_rut',    'RUT'],
    ['dpo_email',      'email del DPO'],
  ])('rechaza si falta %s', (campo, descripcion) => {
    const config = { ...configValida, [campo]: '' };
    const { valido, errores } = validarConfiguracionCliente(config);
    expect(valido).toBe(false);
    expect(errores.some(e => e.toLowerCase().includes(descripcion.toLowerCase()))).toBe(true);
  });

  // Emails inválidos
  test.each([
    ['dpo_email',      'no-es-un-email'],
    ['empresa_email',  'tampoco-es-email'],
    ['email_cc',       'mal@formato'],
  ])('rechaza email inválido en campo %s', (campo, email) => {
    const config = { ...configValida, [campo]: email };
    const { valido } = validarConfiguracionCliente(config);
    expect(valido).toBe(false);
  });

  test('acepta email_cc vacío (es opcional)', () => {
    const config = { ...configValida, email_cc: '' };
    const { valido } = validarConfiguracionCliente(config);
    expect(valido).toBe(true);
  });

  // Colores hex
  test.each([
    '#2563eb',   // 6 dígitos
    '#fff',      // 3 dígitos
    '#FFFFFF',   // mayúsculas
  ])('acepta color hex válido: %s', (color) => {
    const config = { ...configValida, portal_color: color };
    const { valido } = validarConfiguracionCliente(config);
    expect(valido).toBe(true);
  });

  test.each([
    '2563eb',    // sin #
    '#ZZZZZZ',  // caracteres inválidos
    'azul',     // no es hex
  ])('rechaza color hex inválido: %s', (color) => {
    const config = { ...configValida, portal_color: color };
    const { valido } = validarConfiguracionCliente(config);
    expect(valido).toBe(false);
  });

  // Días
  test('rechaza dias_respuesta = 0', () => {
    const { valido } = validarConfiguracionCliente({ ...configValida, dias_respuesta: '0' });
    expect(valido).toBe(false);
  });

  test('rechaza dias_respuesta negativo', () => {
    const { valido } = validarConfiguracionCliente({ ...configValida, dias_respuesta: '-1' });
    expect(valido).toBe(false);
  });

  test('rechaza dias_alerta = 0', () => {
    const { valido } = validarConfiguracionCliente({ ...configValida, dias_alerta: '0' });
    expect(valido).toBe(false);
  });

  test('acepta dias_respuesta = 15 (valor legal)', () => {
    const { valido } = validarConfiguracionCliente({ ...configValida, dias_respuesta: '15' });
    expect(valido).toBe(true);
  });

  // Retorna todos los errores juntos
  test('reporta múltiples errores a la vez', () => {
    const config = {
      empresa_nombre: '',
      empresa_rut:    '',
      dpo_email:      '',
    };
    const { valido, errores } = validarConfiguracionCliente(config);
    expect(valido).toBe(false);
    expect(errores.length).toBeGreaterThanOrEqual(3);
  });
});