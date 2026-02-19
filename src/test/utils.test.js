// ============================================================
// src/__tests__/utils.test.js
// Tests de lógica pura — los más rápidos, sin dependencias
// Corre con: npm test -- --testPathPattern=utils
// ============================================================

import {
  validarRUT,
  formatearRUT,
  formatearRUTInput,
  validarEmail,
  validarTelefonoChileno,
  calcularFechaLimite,
  calcularDiasEntre,
  generarNumeroSolicitud,
} from '../utils/utils';

// ── validarRUT ────────────────────────────────────────────
describe('validarRUT', () => {
  // RUTs válidos conocidos
  const validos = [
    '11.111.111-1',
    '7.777.777-K',
    '18.765.432-0',
    '5.126.663-3',
    '111111111',   // sin formato
    '7777777K',    // sin formato con K
  ];

  // RUTs inválidos
  const invalidos = [
    '12.345.678-9', // DV incorrecto
    '1.234.567-K',  // DV incorrecto
    '00.000.000-0', // ceros
    '',
    null,
    undefined,
    'no-es-rut',
    '123',          // demasiado corto
  ];

  test.each(validos)('acepta RUT válido: %s', rut => {
    expect(validarRUT(rut)).toBe(true);
  });

  test.each(invalidos)('rechaza RUT inválido: %s', rut => {
    expect(validarRUT(rut)).toBe(false);
  });
});

// ── formatearRUT ──────────────────────────────────────────
describe('formatearRUT', () => {
  test('formatea RUT limpio a formato estándar', () => {
    expect(formatearRUT('111111111')).toBe('11.111.111-1');
    expect(formatearRUT('7777777K')).toBe('7.777.777-K');
  });

  test('mantiene formato si ya tiene puntos', () => {
    expect(formatearRUT('11.111.111-1')).toBe('11.111.111-1');
  });

  test('retorna vacío para input vacío', () => {
    expect(formatearRUT('')).toBe('');
    expect(formatearRUT(null)).toBe('');
  });
});

// ── validarEmail ──────────────────────────────────────────
describe('validarEmail', () => {
  const validos = [
    'dpo@empresa.cl',
    'nombre.apellido@gmail.com',
    'user+tag@domain.co',
  ];

  const invalidos = [
    'sinArroba',
    '@sinUsuario.cl',
    'sin.dominio@',
    '',
    'espacios en@medio.cl',
  ];

  test.each(validos)('acepta email válido: %s', email => {
    expect(validarEmail(email)).toBe(true);
  });

  test.each(invalidos)('rechaza email inválido: %s', email => {
    expect(validarEmail(email)).toBe(false);
  });
});

// ── validarTelefonoChileno ────────────────────────────────
describe('validarTelefonoChileno', () => {
  const validos = [
    '+56912345678',
    '912345678',
    '56912345678',
    '+56 9 1234 5678',
    '',            // opcional — vacío es válido
    null,
  ];

  const invalidos = [
    '12345678',    // sin prefijo
    '+1912345678', // país incorrecto
    '56123456789', // demasiado largo
  ];

  test.each(validos)('acepta teléfono válido o vacío: %s', tel => {
    expect(validarTelefonoChileno(tel)).toBe(true);
  });

  test.each(invalidos)('rechaza teléfono inválido: %s', tel => {
    expect(validarTelefonoChileno(tel)).toBe(false);
  });
});

// ── calcularFechaLimite ───────────────────────────────────
describe('calcularFechaLimite', () => {
  test('añade exactamente 15 días hábiles', () => {
    // Lunes 5 enero 2026 → después de 15 días hábiles = lunes 26 enero
    const inicio = new Date(2026, 0, 5); // 5 ene 2026
    const limite = calcularFechaLimite(inicio);

    // Contar días hábiles manualmente
    let dias = 0;
    let fecha = new Date(inicio);
    while (dias < 15) {
      fecha.setDate(fecha.getDate() + 1);
      const dow = fecha.getDay();
      if (dow !== 0 && dow !== 6) dias++;
    }

    expect(limite.toDateString()).toBe(fecha.toDateString());
  });

  test('nunca cae en fin de semana', () => {
    // Probar varios lunes de inicio
    [
      new Date(2026, 0, 5),
      new Date(2026, 0, 12),
      new Date(2026, 1, 2),
    ].forEach(inicio => {
      const limite = calcularFechaLimite(inicio);
      const dow = limite.getDay();
      expect(dow).not.toBe(0); // no domingo
      expect(dow).not.toBe(6); // no sábado
    });
  });

  test('usa fecha actual si no se pasa argumento', () => {
    const antes = new Date();
    const limite = calcularFechaLimite();
    const despues = new Date();

    // La fecha límite debe estar en el futuro
    expect(limite.getTime()).toBeGreaterThan(antes.getTime());
    // Y calculada a partir de hoy
    const diasCalc = calcularDiasEntre(despues, limite);
    expect(diasCalc).toBeGreaterThanOrEqual(15);
    expect(diasCalc).toBeLessThanOrEqual(23); // máximo 15 días + 2 fines de semana posibles
  });
});

// ── calcularDiasEntre ─────────────────────────────────────
describe('calcularDiasEntre', () => {
  test('calcula 0 días entre la misma fecha', () => {
    const f = new Date(2026, 0, 15);
    expect(calcularDiasEntre(f, f)).toBe(0);
  });

  test('calcula 7 días entre semana y semana siguiente', () => {
    const f1 = new Date(2026, 0, 5);
    const f2 = new Date(2026, 0, 12);
    expect(calcularDiasEntre(f1, f2)).toBe(7);
  });

  test('el orden de las fechas no importa (valor absoluto)', () => {
    const f1 = new Date(2026, 0, 1);
    const f2 = new Date(2026, 0, 10);
    expect(calcularDiasEntre(f1, f2)).toBe(calcularDiasEntre(f2, f1));
  });
});

// ── generarNumeroSolicitud ────────────────────────────────
describe('generarNumeroSolicitud', () => {
  test('tiene formato SOL-YYYY-NNNNN', () => {
    const num = generarNumeroSolicitud();
    expect(num).toMatch(/^SOL-\d{4}-\d{5}$/);
  });

  test('incluye el año actual', () => {
    const año = new Date().getFullYear().toString();
    expect(generarNumeroSolicitud()).toContain(`SOL-${año}-`);
  });

  test('genera valores únicos', () => {
    const nums = new Set(Array.from({ length: 100 }, () => generarNumeroSolicitud()));
    // Con 100 intentos, muy improbable tener duplicados (1/90000 por par)
    expect(nums.size).toBeGreaterThan(90);
  });
});