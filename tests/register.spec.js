const { test, expect } = require("@playwright/test");
const { RegisterPage } = require("../pages/RegisterPage");
const {
  createValidUser,
  invalidEmailFormat,
  tooShortPassword,
  passwordWithoutComplexity,
  mismatchedPasswords,
  nameWithInvalidCharacters,
  lastNameWithInvalidCharacters,
} = require("../fixtures/users");

test.describe("Registro de usuario Prometeo", () => {
  let registerPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.blockRegisterApi();
    await registerPage.goto();
  });

  test.describe(
    "Carga correcta de la pantalla de registro",
    { tag: "@smoke" },
    () => {
      test("Verificar carga correcta de la pantalla de registro", async () => {
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
    },
  );

  test.describe(
    "Verificación de campos obligatorios",
    { tag: "@regression" },
    () => {
      test("Verificar mensajes de error al intentar enviar formulario vacío", async () => {
        await registerPage.submit();

        await expect(
          registerPage.errorFor(registerPage.firstNameInput),
        ).toHaveText(registerPage.firstNameRequiredMessage());
        await expect(
          registerPage.errorFor(registerPage.lastNameInput),
        ).toHaveText(registerPage.lastNameRequiredMessage());
        await expect(
          registerPage.errorFor(registerPage.companyInput),
        ).toHaveText(registerPage.companyRequiredMessage());
        await expect(registerPage.errorFor(registerPage.emailInput)).toHaveText(
          registerPage.emailRequiredMessage(),
        );
        await expect(
          registerPage.errorFor(registerPage.passwordInput),
        ).toHaveText(registerPage.passwordRequiredMessage());
        await expect(
          registerPage.errorFor(registerPage.confirmPasswordInput),
        ).toHaveText(registerPage.confirmPasswordRequiredMessage());
        await expect(registerPage.termsError).toHaveText(
          registerPage.termsRequiredMessage(),
        );
      });

      test("Intentar registrar usuario sin aceptar los términos y condiciones", async () => {
        const user = createValidUser();

        await registerPage.fillDetails(user);
        await registerPage.submit();

        await expect(registerPage.termsError).toHaveText(
          registerPage.termsRequiredMessage(),
        );
        await expect(
          registerPage.errorFor(registerPage.firstNameInput),
        ).toBeHidden();
        await expect(registerPage.page).toHaveURL(/register-account/);
      });

      test("Intentar registrar usuario con números y símbolos en nombre y apellido", async () => {
        const user = createValidUser({
          firstName: nameWithInvalidCharacters,
          lastName: lastNameWithInvalidCharacters,
        });

        await registerPage.registerWith(user);

        await expect(
          registerPage.errorFor(registerPage.firstNameInput),
        ).toBeVisible();
        await expect(
          registerPage.errorFor(registerPage.lastNameInput),
        ).toBeVisible();
      });
    },
  );

  test.describe("Registro exitoso con datos válidos", { tag: "@smoke" }, () => {
    test("Verificar registro de un usuario nuevo y que navega a la pantalla de éxito", async () => {
      const user = createValidUser();

      await registerPage.mockSuccessfulFlow(user);
      await registerPage.registerWith(user);

      await expect(registerPage.successMessage).toBeVisible();
      await expect(registerPage.submitButton).toBeHidden();
    });
  });

  test.describe("Email con formato inválido", { tag: "@smoke" }, () => {
    test("Intentar registrar usuario con email inválido", async () => {
      await registerPage.typeInto(registerPage.emailInput, invalidEmailFormat);

      const validity = await registerPage.emailValidity();
      expect(validity.valid).toBe(false);
      expect(validity.message.length).toBeGreaterThan(0);

      await registerPage.submit();
      await expect(registerPage.page).toHaveURL(/register-account/);
    });

    test("Intentar registrar usuario con un email ya existente", async () => {
      const user = createValidUser();

      await registerPage.mockValidateEmail(false);
      await registerPage.registerWith(user);

      await expect(
        registerPage.errorFor(registerPage.emailInput),
      ).toBeVisible();
    });
  });

  test.describe(
    "Password inválida o incompleta",
    { tag: "@regression" },
    () => {
      test("Intentar registrar usuario con contraseña demasiado corta", async () => {
        await registerPage.submitPasswords(tooShortPassword, tooShortPassword);

        await expect(
          registerPage.errorFor(registerPage.passwordInput),
        ).toHaveText(registerPage.passwordTooShortMessage());
      });

      test("Intentar registrar usuario con contraseña sin la complejidad requerida", async () => {
        await registerPage.submitPasswords(
          passwordWithoutComplexity,
          passwordWithoutComplexity,
        );

        await expect(
          registerPage.errorFor(registerPage.passwordInput),
        ).toHaveText(registerPage.passwordComplexityMessage());
      });
    },
  );

  test.describe(
    "Confirmación de password diferente",
    { tag: "@regression" },
    () => {
      test("Intentar registrar usuario con confirmación de contraseña que no coincide", async () => {
        const tracker = await registerPage.trackRegisterCalls();

        await registerPage.submitPasswords(
          mismatchedPasswords.password,
          mismatchedPasswords.confirmPassword,
        );

        await expect(
          registerPage.errorFor(registerPage.confirmPasswordInput),
        ).toBeVisible();
        expect(tracker.count).toBe(0);
      });
    },
  );

  test.describe(
    "Comportamiento del botón de submit",
    { tag: "@regression" },
    () => {
      test("Intentar enviar formulario con datos inválidos y verificar que no navegue", async () => {
        await expect(registerPage.submitButton).toBeEnabled();

        await registerPage.submit();

        await expect(
          registerPage.errorFor(registerPage.firstNameInput),
        ).toBeVisible();
        await expect(registerPage.page).toHaveURL(/register-account/);
        await expect(registerPage.submitButton).toBeEnabled();
      });
    },
  );

  test.describe(
    "Mensajes de error visibles para el usuario",
    { tag: "@regression" },
    () => {
      test("Intentar registrar usuario cuando el servidor responde con error", async () => {
        const user = createValidUser();

        await registerPage.mockValidateEmail(true);
        await registerPage.mockFailedRegister();
        await registerPage.registerWith(user);

        await expect(registerPage.serverErrorMessage).toBeVisible();
        await expect(registerPage.page).toHaveURL(/register-account/);
      });

      test("Verificar que los mensajes de error son visibles simultáneamente ante múltiples campos inválidos", async () => {
        await registerPage.submitPasswords(tooShortPassword, tooShortPassword);

        await expect(
          registerPage.errorFor(registerPage.firstNameInput),
        ).toBeVisible();
        await expect(
          registerPage.errorFor(registerPage.lastNameInput),
        ).toBeVisible();
        await expect(
          registerPage.errorFor(registerPage.emailInput),
        ).toBeVisible();
        await expect(
          registerPage.errorFor(registerPage.passwordInput),
        ).toBeVisible();
        await expect(
          registerPage.errorFor(registerPage.confirmPasswordInput),
        ).toBeVisible();
        await expect(registerPage.termsError).toBeVisible();
      });
    },
  );
});
