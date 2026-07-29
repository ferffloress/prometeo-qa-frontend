# Playwright - Registro de usuario

## Estructura

- tests/register.spec.js: prueba principal del flujo de registro.
- pages/RegisterPage.js: page object con los pasos del formulario.
- fixtures/users.js: datos del usuario para generar un registro único.
- playwright.config.js: configuración de Playwright.

## Ejecución

```bash
npx playwright test tests/register.spec.js
```

## Notas

El flujo usa la demo pública de Automation Exercise para validar el registro de usuario.
