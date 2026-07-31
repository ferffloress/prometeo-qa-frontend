function createValidUser(overrides = {}) {
  return {
    firstName: "Juan",
    lastName: "Pérez",
    company: "Prometeo QA",
    email: "playwright.qa.1785422518898@example.com",
    password: "Password123!",
    ...overrides,
  };
}

const invalidEmailFormat = "correo-invalido";

const tooShortPassword = "123";

// Cumple longitud mínima pero le falta un carácter especial.
const passwordWithoutComplexity = "Password123";

const mismatchedPasswords = {
  password: "Password123!",
  confirmPassword: "Different123!",
};

module.exports = {
  createValidUser,
  invalidEmailFormat,
  tooShortPassword,
  passwordWithoutComplexity,
  mismatchedPasswords,
};
