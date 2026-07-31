const { expect } = require("@playwright/test");

// Endpoints mockeados para el flujo de registro y validación de email
const REGISTER_PATH = "/register-account";
const REGISTER_API = "**/api/dashboard/register/";
const VALIDATE_EMAIL_API = "**/api/dashboard/register/*/validate";

const BLOCKED_REGISTER_RESPONSE = {
  status: 400,
  contentType: "application/json",
  body: JSON.stringify({ error: "blocked by test safety net" }),
};

class RegisterPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Create your account" });
    this.firstNameInput = page.locator("input#firstName");
    this.lastNameInput = page.locator("input#lastName");
    this.companyInput = page.locator("input#company");
    this.emailInput = page.locator("input#email");
    this.passwordInput = page.locator("input#password");
    this.confirmPasswordInput = page.locator("input#confirmPassword");
    this.termsCheckbox = page.locator('input[type="checkbox"]');
    this.termsError = page.locator('p[class*="error-text"]');
    this.submitButton = page.getByRole("button", { name: "Start" });
    this.successMessage = page.getByText("Thank you for signing up!");
    this.serverErrorMessage = page.getByText(this.serverErrorMessageText());
  }

  async goto() {
    await this.page.goto(REGISTER_PATH);
    await this.heading.waitFor();
  }

  async typeInto(locator, value) {
    await locator.click();
    await locator.pressSequentially(value, { delay: 10 });
    await expect(locator).toHaveValue(value);
  }

  async acceptTerms() {
    await this.termsCheckbox.check({ force: true });
  }

  async submit() {
    await this.submitButton.click();
  }

  async fillDetails(user) {
    await this.typeInto(this.firstNameInput, user.firstName);
    await this.typeInto(this.lastNameInput, user.lastName);
    await this.typeInto(this.companyInput, user.company);
    await this.typeInto(this.emailInput, user.email);
    await this.typeInto(this.passwordInput, user.password);
    await this.typeInto(
      this.confirmPasswordInput,
      user.confirmPassword ?? user.password,
    );
  }

  async registerWith(user) {
    await this.fillDetails(user);
    await this.acceptTerms();
    await this.submit();
  }

  async submitPasswords(password, confirmPassword) {
    await this.typeInto(this.passwordInput, password);
    await this.typeInto(this.confirmPasswordInput, confirmPassword);
    await this.submit();
  }

  errorFor(fieldLocator) {
    return fieldLocator
      .locator('xpath=ancestor::div[contains(@class,"form-group")][1]')
      .locator('span[class*="form-message--error"]');
  }

  // Único lugar con el texto de cada mensaje de error: si el sitio cambia la
  // copia, se actualiza acá y los tests no se tocan.
  firstNameRequiredMessage() {
    return "Name is required";
  }

  lastNameRequiredMessage() {
    return "Last Name is required";
  }

  companyRequiredMessage() {
    return "Company Name is required";
  }

  emailRequiredMessage() {
    return "Corporate Email is required";
  }

  passwordRequiredMessage() {
    return "Password is required";
  }

  confirmPasswordRequiredMessage() {
    return "Repeat Password is required";
  }

  termsRequiredMessage() {
    return "Terms of use and privacy conditions is required";
  }

  passwordTooShortMessage() {
    return "Password must be at least 8 char long";
  }

  passwordComplexityMessage() {
    return "Your password must Contain Characters in Uppercase, Lowercase, Number and One Special Case Character";
  }

  serverErrorMessageText() {
    return "An error has occurred, please try again";
  }

  async emailValidity() {
    return this.emailInput.evaluate((el) => ({
      valid: el.checkValidity(),
      message: el.validationMessage,
    }));
  }

  // Bloquea la API de registro para que ningún test dispare un registro real por error
  blockRegisterApi() {
    return this.page.route(REGISTER_API, (route) =>
      route.fulfill(BLOCKED_REGISTER_RESPONSE),
    );
  }

  mockValidateEmail(valid = true) {
    return this.page.route(VALIDATE_EMAIL_API, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ valid_email: valid }),
      }),
    );
  }

  mockSuccessfulRegister(user) {
    return this.page.route(REGISTER_API, (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          terms_conditions: true,
          company_name: user.company,
          solutions: [],
        }),
      }),
    );
  }

  // Mockea el flujo completo (validate + register) para simular un registro
  // exitoso sin depender del backend real.
  async mockSuccessfulFlow(user) {
    await this.mockValidateEmail(true);
    await this.mockSuccessfulRegister(user);
  }

  mockFailedRegister(status = 500) {
    return this.page.route(REGISTER_API, (route) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      }),
    );
  }

  // Bloquea el registro y cuenta cuántas veces se intentó llamar a la API,
  // útil para verificar casos de doble submit o llamadas no deseadas
  async trackRegisterCalls() {
    const tracker = { count: 0 };
    await this.page.route(REGISTER_API, async (route) => {
      tracker.count += 1;
      await route.fulfill(BLOCKED_REGISTER_RESPONSE);
    });
    return tracker;
  }
}

module.exports = { RegisterPage, REGISTER_PATH };
