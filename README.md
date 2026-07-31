# Playwright - Registro de usuario (Prometeo Dashboard)

Suite de automatización E2E para el flujo de registro de https://dashboard.prometeoapi.com/register-account, hecha con Playwright + JavaScript.

## 🎭 Por qué el registro corre mockeado

El registro exitoso y el error de servidor **no se prueban contra el backend real**. La razón:

- Se probó el formulario real y confirmé que rechaza emails de proveedores gratuitos (gmail, mailinator, etc.) con un mensaje "Mail not allowed", y que un registro exitoso **crea una cuenta real** en Prometeo (pendiente de verificación por email). Correr eso en cada ejecución de test (y encima en cada corrida de CI) generaría cuentas falsas en la base de producción de Prometeo.
- El frontend hace dos llamadas relevantes: `GET /api/dashboard/register/{email}/validate` (valida el email al perder foco) y `POST /api/dashboard/register/` (crea la cuenta al enviar el formulario). Con `page.route()` de Playwright se interceptan esas dos llamadas y les devuelvo una respuesta controlada (éxito, error de servidor, o email ya existente), así se prueba cómo reacciona la UI ante cada respuesta sin tocar el backend real.
- Como red de seguridad adicional, `blockRegisterApi()` corre en un `beforeEach` global y bloquea cualquier POST real a `/register/` con un 400. Los tests que sí necesitan otra respuesta (éxito, error 500, email duplicado) la sobreescriben explícitamente. Esto garantiza que ningún test, ni uno nuevo que alguien agregue, pueda terminar registrando una cuenta real por accidente.
- El resto de los casos (campos obligatorios, formato de email, reglas de password, botón de submit) **sí corren contra la validación real** del sitio (cliente y HTML5), porque esas no requieren red y reflejan el comportamiento real sin riesgo.

## 🛠️ Stack

- [Playwright Test](https://playwright.dev/) (`@playwright/test`) + JavaScript (CommonJS).
- Page Object Model.
- GitHub Actions para CI.

## 📁 Estructura del proyecto

```
tests/register.spec.js   → specs, agrupados en test.describe() por categoría
pages/RegisterPage.js    → page object: selectores, acciones, mocks y mensajes de error
fixtures/users.js        → datos de prueba (usuario válido, valores inválidos)
playwright.config.js     → configuración de Playwright (baseURL al dashboard de Prometeo)
.github/workflows/       → CI: smoke en cada push/PR, regression nightly o manual
```

### 🧩 Decisiones de diseño en el código

- **Mensajes de error como métodos** Cada texto (`"Name is required"`, `passwordComplexityMessage()`, etc.) vive en `RegisterPage`. Si se cambia una copia, se actualiza en un solo lugar.
- **Datos de prueba en `fixtures/users.js`**, no hardcodeados en el spec (`createValidUser()`, `invalidEmailFormat`, `tooShortPassword`, `passwordWithoutComplexity`, `mismatchedPasswords`).
- **`registerPage` y `goto()` en un `beforeEach` único** a nivel de describe raíz, para no repetir `new RegisterPage(page)` ni la navegación al inicio de cada test.
- **`typeInto()` usa `pressSequentially` (teclado real) en vez de `fill()`**, porque los campos de password del sitio tienen el atributo `readonly` (truco anti-autofill) y sólo reaccionan a eventos de teclado reales.
- **Los bugs del sitio se dejan como tests que fallan de verdad**, no se saltean. La idea es que al tratarse de un challenge, el bug se note en el pipeline (rojo) en vez de quedar oculto en un skip. En un entorno productivo un bug de impacto bajo podría saltearse con `fixme` hasta ser arreglado.
- **Tags `@smoke` / `@regression`** a nivel de `test.describe()` por categoría, para poder correr un subconjunto rápido en cada push/PR y dejar la suite completa para un chequeo nocturno o manual.

## 📦 Cómo instalar dependencias

```bash
npm install
npx playwright install --with-deps
```

## ▶️ Cómo ejecutar los tests

```bash
# suite completa
npx playwright test

# solo los tests @smoke (rápidos, mockeados, feedback inmediato)
npm run test:smoke

# solo los tests @regression (más exhaustivos, menor prioridad para un check rápido)
npm run test:regression

# ver el último reporte HTML
npx playwright show-report
```

### 🤖 CI

`.github/workflows/playwright.yml` define dos jobs:

- **smoke**: corre en cada `push` y `pull_request` a `main`/`master`.
- **regression**: corre nightly (cron `0 3 * * *`) o manualmente (`workflow_dispatch`), no en cada push.

Ambos jobs publican el reporte HTML de Playwright como artifact (`playwright-report-smoke` / `playwright-report-regression`).

## ✅ Casos cubiertos

Cada bullet es un `test.describe()` del spec, y debajo los `test()` que contiene — así se ve cómo está organizada la suite, cubriendo los requisitos del challenge.

- **Carga correcta de la pantalla de registro**
  - Verificar carga correcta de la pantalla de registro
- **Validación de campos obligatorios**
  - Verificar mensajes de error al intentar enviar formulario vacío
  - Intentar registrar usuario sin aceptar los términos y condiciones
  - Intentar registrar usuario con números y símbolos en nombre y apellido
- **Registro exitoso con datos válidos**
  - Verificar registro de un usuario nuevo y que navega a la pantalla de éxito
- **Email con formato inválido**
  - Intentar registrar usuario con email inválido
  - Intentar registrar usuario con un email ya existente
- **Password inválida o incompleta**
  - Intentar registrar usuario con contraseña demasiado corta
  - Intentar registrar usuario con contraseña sin la complejidad requerida
- **Confirmación de password diferente**
  - Intentar registrar usuario con confirmación de contraseña que no coincide
- **Comportamiento del botón de submit**
  - Intentar enviar formulario con datos inválidos y verificar que no navegue
- **Mensajes de error visibles para el usuario**
  - Intentar registrar usuario cuando el servidor responde con error
  - Verificar que los mensajes de error son visibles simultáneamente ante múltiples campos inválidos

## 🐛 Hallazgos o mejoras detectadas

- 🐞 **Bug #1**: el campo "Company Name" muestra el mensaje "Last Name is required" en vez de uno propio cuando se lo deja vacío. El test correspondiente afirma el texto correcto (`companyRequiredMessage()`) y por eso falla intencionalmente — documenta el bug.
- 🐞 **Bug #2**: cuando `/api/dashboard/register/{email}/validate` responde `valid_email:false` (por ejemplo, un email ya registrado), el formulario lo ignora por completo: no muestra ningún error en el campo de Corporate Email y el registro avanza igual hasta la pantalla de éxito. El test "Intentar registrar usuario con un email ya existente" también falla intencionalmente por este motivo. **Nota:** esta evidencia se obtuvo mockeando la respuesta de `/validate`, ya que el objetivo de la suite es no crear usuarios reales. Faltaría confirmar contra el backend real si, al avanzar el formulario hasta la pantalla de éxito en este escenario, efectivamente se intenta registrar (y/o duplicar) el usuario en la base de datos, o si el registro real falla silenciosamente en el back a pesar de que el front muestre éxito.
- 🐞 **Bug #3**: los campos "Name" y "Last Name" aceptan números y símbolos (`Juan123!`, `Pérez#$%`) sin mostrar ningún error de validación. El test "Intentar registrar usuario con números y símbolos en nombre y apellido" afirma que debería aparecer un error en cada campo y falla intencionalmente, documentando el bug.
- 💡 **Oportunidad de mejora**: el campo de email usa validación nativa del navegador (`type="email"`) en vez de una validación propia consistente con el resto del formulario. Esto genera dos problemas: el mensaje de error que ve el usuario depende del navegador/idioma en vez de estar controlado por Prometeo, y si el email tiene formato inválido el navegador bloquea el `submit` antes de que corra cualquier otra validación custom del formulario (por eso, en el test de "mensajes de error visibles", el campo de email se deja vacío en vez de con formato inválido, para poder ver el resto de los mensajes al mismo tiempo).
