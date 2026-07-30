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

module.exports = { createValidUser };
