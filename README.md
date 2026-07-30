# Playwright - Registro de usuario (Prometeo Dashboard)

## Estructura

- `tests/register.spec.js`: pruebas del flujo de registro en https://dashboard.prometeoapi.com/register-account.
- `pages/RegisterPage.js`: page object con selectores, acciones del formulario, mocks de la API y los mensajes de error esperados (ver más abajo).
- `fixtures/users.js`: generador de datos de usuario válidos (`createValidUser`), con email fijo ya que el registro siempre corre mockeado.
- `playwright.config.js`: configuración de Playwright (`baseURL` apuntando al dashboard de Prometeo).

### Mensajes de error como métodos

Los textos de los mensajes de error (`"Name is required"`, `"Password must be at least 8 char long"`, etc.) no están hardcodeados en los tests: viven como métodos en `RegisterPage` (`firstNameRequiredMessage()`, `passwordComplexityMessage()`, etc.). Si Prometeo cambia una copia, se actualiza en un solo lugar y los tests no se tocan.

## Cobertura

- Carga correcta de la pantalla de registro.
- Validación de campos obligatorios.
- Registro exitoso con datos válidos.
- Email con formato inválido.
- Password inválida o incompleta (longitud y complejidad).
- Confirmación de password diferente.
- Comportamiento del botón de submit.
- Mensajes de error visibles para el usuario.

## Ejecución

```bash
npx playwright test tests/register.spec.js
```

## Notas

- El caso de "registro exitoso" mockea las respuestas del backend (`/api/dashboard/register/*/validate` y `/api/dashboard/register/`) para no crear cuentas reales en producción en cada corrida. Además, `blockRegisterApi()` corre en un `beforeEach` global que corta cualquier POST real a `/api/dashboard/register/` como red de seguridad, incluso si algún test nuevo se olvida de mockear.
- Todas las demás pruebas corren contra la validación real del formulario (cliente y HTML5), sin llegar a crear una cuenta.

## Hallazgos sobre el sitio real

- **Bug**: el campo "Company Name" muestra el mensaje "Last Name is required" en vez de un mensaje propio cuando se lo deja vacío. Está documentado con un test dedicado marcado `test.fixme` (queda en skip hasta que Prometeo lo corrija; en ese momento alcanza con sacarle el `.fixme`).
- **Oportunidad de mejora**: el campo de email usa validación nativa del navegador (`type="email"`) en vez de una validación propia consistente con el resto del formulario. Esto tiene dos efectos: el mensaje de error que ve el usuario depende del navegador/idioma en vez de ser controlado por Prometeo, y si el email tiene formato inválido el navegador bloquea el `submit` antes de que corra cualquier otra validación custom del formulario (por eso, en el test de "mensajes de error visibles", el campo de email se deja vacío en vez de con formato inválido, para poder ver el resto de los mensajes al mismo tiempo).
