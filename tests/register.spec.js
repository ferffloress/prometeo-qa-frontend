const { test, expect } = require("@playwright/test");
const { RegisterPage } = require("../pages/RegisterPage");
const { createUser } = require("../fixtures/users");

test("registrar un usuario nuevo", async ({ page }) => {
  const registerPage = new RegisterPage(page);
  const user = createUser();

  await registerPage.gotoHome();
  await registerPage.openSignupForm();
  await registerPage.submitSignup(user.name, user.email);
  await registerPage.fillAccountDetails(user);
  await registerPage.completeRegistration();

  await expect(page.getByText("Account Created!")).toBeVisible();
});
