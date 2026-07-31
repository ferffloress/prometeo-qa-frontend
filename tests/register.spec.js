const { test, expect } = require("@playwright/test");
const { RegisterPage } = require("../pages/RegisterPage");
const {
  createValidUser,
  invalidEmailFormat,
  tooShortPassword,
  passwordWithoutComplexity,
  mismatchedPasswords,
} = require("../fixtures/users");

test.describe("Registro exitoso", () => {
  test.beforeEach(async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.blockRegisterApi();
  });

  test("Verificar carga correcta de la pantalla de registro", async ({
    page,
  }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await expect(registerPage.heading).toBeVisible();
    await expect(registerPage.firstNameInput).toBeVisible();
    await expect(registerPage.lastNameInput).toBeVisible();
    await expect(registerPage.companyInput).toBeVisible();
    await expect(registerPage.emailInput).toBeVisible();
    await expect(registerPage.passwordInput).toBeVisible();
    await expect(registerPage.confirmPasswordInput).toBeVisible();
    await expect(registerPage.termsCheckbox).toBeVisible();
    await expect(registerPage.submitButton).toBeVisible();
    await expect(registerPage.submitButton).toBeEnabled();
  });

  test.describe("Comportamiento del botón de submit", () => {
    test("Verificar registro de un usuario nuevo y que navega a la pantalla de éxito", async ({
      page,
    }) => {
      const registerPage = new RegisterPage(page);
      const user = createValidUser();

      await registerPage.mockSuccessfulFlow(user);
      await registerPage.goto();

      await registerPage.registerWith(user);

      await expect(registerPage.successMessage).toBeVisible();
      await expect(registerPage.submitButton).toBeHidden();
    });

    test("Intentar enviar formulario con datos inválidos y verificar que no navegue", async ({
      page,
    }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();

      await expect(registerPage.submitButton).toBeEnabled();

      await registerPage.submit();

      await expect(
        registerPage.errorFor(registerPage.firstNameInput),
      ).toBeVisible();
      await expect(page).toHaveURL(/register-account/);
      await expect(registerPage.submitButton).toBeEnabled();
    });
  });

  test("Intentar registrar usuario cuando el servidor responde con error", async ({
    page,
  }) => {
    const registerPage = new RegisterPage(page);
    const user = createValidUser();

    await registerPage.mockValidateEmail(true);
    await registerPage.mockFailedRegister();
    await registerPage.goto();

    await registerPage.registerWith(user);

    await expect(registerPage.serverErrorMessage).toBeVisible();
    await expect(page).toHaveURL(/register-account/);
  });

  test("Intentar enviar formulario vacío para mostrar mensajes de error", async ({
    page,
  }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.submit();

    await expect(registerPage.errorFor(registerPage.firstNameInput)).toHaveText(
      registerPage.firstNameRequiredMessage(),
    );
    await expect(registerPage.errorFor(registerPage.lastNameInput)).toHaveText(
      registerPage.lastNameRequiredMessage(),
    );
    await expect(registerPage.errorFor(registerPage.emailInput)).toHaveText(
      registerPage.emailRequiredMessage(),
    );
    await expect(registerPage.errorFor(registerPage.passwordInput)).toHaveText(
      registerPage.passwordRequiredMessage(),
    );
    await expect(
      registerPage.errorFor(registerPage.confirmPasswordInput),
    ).toHaveText(registerPage.confirmPasswordRequiredMessage());
    await expect(registerPage.termsError).toHaveText(
      registerPage.termsRequiredMessage(),
    );
  });

  // BUG: el campo Company muestra el texto de error de "Last Name" en vez del
  // suyo propio. Test separado y marcado como fixme para dejarlo documentado
  // sin romper la suite general.
  test.fixme("Intentar enviar formulario vacío y detectar bug en mensaje de error de Company", async ({
    page,
  }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.submit();

    await expect(registerPage.errorFor(registerPage.companyInput)).toHaveText(
      registerPage.companyRequiredMessage(),
    );
  });

  test("Intentar registrar usuario sin aceptar los términos y condiciones", async ({
    page,
  }) => {
    const registerPage = new RegisterPage(page);
    const user = createValidUser();
    await registerPage.goto();

    await registerPage.fillDetails(user);
    await registerPage.submit();

    await expect(registerPage.termsError).toHaveText(
      registerPage.termsRequiredMessage(),
    );
    await expect(
      registerPage.errorFor(registerPage.firstNameInput),
    ).toBeHidden();
    await expect(page).toHaveURL(/register-account/);
  });

  test("Intentar registrar usuario con email inválido", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.typeInto(registerPage.emailInput, invalidEmailFormat);

    const validity = await registerPage.emailValidity();
    expect(validity.valid).toBe(false);
    expect(validity.message.length).toBeGreaterThan(0);

    // Confirmamos que el submit no navega ni avanza, porque el browser
    // bloquea el envío del form por la validación nativa del input email.
    await registerPage.submit();
    await expect(page).toHaveURL(/register-account/); // seguimos en la misma pantalla
  });

  // BUG: cuando /validate responde valid_email:false (ej. email ya registrado),
  // el formulario lo ignora por completo: no muestra ningún error en el campo
  // de email y el registro avanza igual hasta la pantalla de éxito.
  test.fixme("Intentar registrar usuario con un email ya existente", async ({
    page,
  }) => {
    const registerPage = new RegisterPage(page);
    const user = createValidUser();

    await registerPage.mockValidateEmail(false);
    await registerPage.goto();

    await registerPage.registerWith(user);

    await expect(registerPage.errorFor(registerPage.emailInput)).toBeVisible();
  });

  test.describe("Contraseñas inválidas o incompletas", () => {
    test("Intentar registrar usuario con contraseña demasiado corta", async ({
      page,
    }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();

      await registerPage.submitPasswords(tooShortPassword, tooShortPassword);

      await expect(
        registerPage.errorFor(registerPage.passwordInput),
      ).toHaveText(registerPage.passwordTooShortMessage());
    });

    test("Intentar registrar usuario con contraseña sin la complejidad requerida", async ({
      page,
    }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();

      await registerPage.submitPasswords(
        passwordWithoutComplexity,
        passwordWithoutComplexity,
      );

      await expect(
        registerPage.errorFor(registerPage.passwordInput),
      ).toHaveText(registerPage.passwordComplexityMessage());
    });
  });

  test("Intentar registrar usuario con confirmación de contraseña que no coincide", async ({
    page,
  }) => {
    const registerPage = new RegisterPage(page);
    const tracker = await registerPage.trackRegisterCalls();
    await registerPage.goto();

    await registerPage.submitPasswords(
      mismatchedPasswords.password,
      mismatchedPasswords.confirmPassword,
    );

    await expect(
      registerPage.errorFor(registerPage.confirmPasswordInput),
    ).toBeVisible();
    expect(tracker.count).toBe(0);
  });
});
