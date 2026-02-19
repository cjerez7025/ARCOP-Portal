# 🧪 Tests — Portal ARCOP

## Stack de testing

| Herramienta | Rol |
|---|---|
| **Jest 27** | Runner + assertions (incluido en react-scripts) |
| **@testing-library/react** | Render de componentes (incluido) |
| **@testing-library/jest-dom** | Matchers DOM como `toBeInTheDocument()` |

No necesitas instalar nada extra. Todo viene con `react-scripts`.

---

## Estructura de archivos

```
src/
├── __tests__/                         ← Todos los tests aquí
│   ├── utils.test.js                  ← Lógica pura (RUT, fechas, validators)
│   ├── sheetsAdapter.test.js          ← Adapter con fetch mockeado
│   ├── flujoService.test.js           ← Servicio de flujos (con adapter mock)
│   ├── formularioService.test.js      ← Servicio de formularios (con adapter mock)
│   └── configuracionService.test.js   ← validarConfiguracionCliente
└── setupTests.js                      ← Configuración global de Jest
```

---

## Comandos

```bash
# Correr todos los tests (modo watch interactivo)
npm test

# Correr UNA VEZ y salir (útil para CI)
npm test -- --watchAll=false

# Correr un archivo específico
npm test -- --testPathPattern=utils
npm test -- --testPathPattern=flujoService
npm test -- --testPathPattern=sheetsAdapter

# Ver cobertura de código
npm test -- --watchAll=false --coverage

# Correr tests que fallen (sin watch)
npm test -- --watchAll=false --bail
```

---

## Qué testa cada archivo

### `utils.test.js` — Lógica pura (más rápido, sin mocks)
- `validarRUT`: RUTs válidos e inválidos incluyendo DV=K
- `formatearRUT`: Formato `XX.XXX.XXX-X`
- `validarEmail`: Emails válidos e inválidos
- `validarTelefonoChileno`: Móvil, fijo, con/sin prefijo `+56`
- `calcularFechaLimite`: 15 días hábiles, nunca en fin de semana
- `calcularDiasEntre`: Diferencia entre fechas
- `generarNumeroSolicitud`: Formato `SOL-YYYY-NNNNN`, unicidad

### `sheetsAdapter.test.js` — Capa de red (fetch mockeado)
- `getConfig` / `saveConfig`: GET y POST correctos
- `getFormularioConfig`: Parseo JSON, null si falta, null si inválido
- `saveFormularioConfig`: No pisa otros campos al guardar
- `getFlujoConfig` / `saveFlujoConfig`: Misma lógica
- Sin API_URL: lanza error descriptivo

### `flujoService.test.js` — Reglas de negocio de flujos
- Los 5 derechos ARCOP están presentes
- Cada flujo tiene estado inicial y final
- Estados de ley tienen artículo definido
- `obtenerFlujoConfig`: defaults, merge, fallback en error
- `crearEstadoCustom` / `crearTransicion` / `crearCampoRequerido`: factories
- Integridad: destinos de transiciones existen, sin ciclos A→A

### `formularioService.test.js` — Reglas de formularios dinámicos
- Campos únicos por derecho
- Campos obligatorios de ley son protegidos
- `obtenerFormularioConfig`: defaults, merge, fallback
- `restaurarDerechoADefault`: campos obligatorios presentes
- `crearCampoCustom`: factory, IDs únicos

### `configuracionService.test.js` — Validaciones del formulario
- Campos obligatorios: empresa_nombre, empresa_rut, dpo_email
- Emails válidos e inválidos en todos los campos email
- Colores hex: `#RGB` y `#RRGGBB`
- Días: rechaza 0 y negativos
- Reporta múltiples errores a la vez

---

## Patrones usados

### Mockear el adapter (sin red)
```javascript
jest.mock('../adapters', () => ({
  __esModule: true,
  default: {
    getFlujoConfig:  jest.fn(),
    saveFlujoConfig: jest.fn(),
  },
}));

// En cada test:
adapter.getFlujoConfig.mockResolvedValueOnce({ status: 'success', data: null });
```

### Mockear fetch (para tests del adapter)
```javascript
const mockFetch = jest.fn();
global.fetch = mockFetch;

mockFetch.mockReturnValueOnce(Promise.resolve({
  text: () => Promise.resolve(JSON.stringify({ status: 'success', data: {} })),
  json: () => Promise.resolve({ status: 'success', data: {} }),
}));
```

### test.each para múltiples inputs
```javascript
const casos = ['11.111.111-1', '7.777.777-K'];
test.each(casos)('acepta RUT válido: %s', rut => {
  expect(validarRUT(rut)).toBe(true);
});
```

---

## Cómo agregar tests nuevos

1. Crea `src/__tests__/miArchivo.test.js`
2. Si el archivo importa el adapter, agregar `jest.mock('../adapters', ...)` al inicio
3. Si el archivo usa `fetch`, agregar `global.fetch = jest.fn()` antes del import
4. Usar `beforeEach(() => jest.clearAllMocks())` para limpiar entre tests

---

## Cobertura actual (estimada)

| Módulo | Cobertura |
|---|---|
| `src/utils/utils.js` | ~90% |
| `src/adapters/sheetsAdapter.js` | ~85% |
| `src/services/flujoService.js` | ~75% |
| `src/services/formularioService.js` | ~75% |
| `src/services/configuracionService.js` | ~60% (validarConfiguracionCliente) |

---

## Próximos tests a agregar

- `useFlujoConfig.test.js` — hook con `renderHook` de @testing-library
- `useFormularioConfig.test.js` — CRUD de campos
- `TabFlujos.test.js` — render y selección de derecho
- `FormularioSolicitud.test.js` — submit y validaciones visuales