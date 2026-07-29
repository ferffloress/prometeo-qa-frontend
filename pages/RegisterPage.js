class RegisterPage {
  constructor(page) {
    this.page = page;
  }

  async gotoHome() {
    await this.page.goto("https://www.automationexercise.com/");
    await this.page.waitForLoadState("networkidle");
  }

  async openSignupForm() {
    await this.page
      .getByRole("link", { name: /signup\/login/i })
      .first()
      .click();
    await this.page.getByText("New User Signup!").waitFor();
  }

  async submitSignup(name, email) {
    await this.page.locator('input[data-qa="signup-name"]').fill(name);
    await this.page.locator('input[data-qa="signup-email"]').fill(email);
    await this.page.locator('button[data-qa="signup-button"]').click();
    await this.page.getByText("Enter Account Information").waitFor();
  }

  async fillAccountDetails(user) {
    await this.page.locator("input#id_gender1").check({ force: true });
    await this.page.locator('input[data-qa="password"]').fill(user.password);
    await this.page.locator('select[data-qa="days"]').selectOption(user.day);
    await this.page
      .locator('select[data-qa="months"]')
      .selectOption(user.month);
    await this.page.locator('select[data-qa="years"]').selectOption(user.year);

    await this.page.getByLabel("Sign up for our newsletter!").check();
    await this.page
      .getByLabel("Receive special offers from our partners!")
      .check();

    await this.page.locator('input[data-qa="first_name"]').fill(user.firstName);
    await this.page.locator('input[data-qa="last_name"]').fill(user.lastName);
    await this.page.locator('input[data-qa="company"]').fill(user.company);
    await this.page.locator('input[data-qa="address"]').fill(user.address);
    await this.page
      .locator('select[data-qa="country"]')
      .selectOption(user.country);
    await this.page.locator('input[data-qa="state"]').fill(user.state);
    await this.page.locator('input[data-qa="city"]').fill(user.city);
    await this.page.locator('input[data-qa="zipcode"]').fill(user.zipcode);
    await this.page
      .locator('input[data-qa="mobile_number"]')
      .fill(user.mobileNumber);
  }

  async completeRegistration() {
    await this.page.locator('button[data-qa="create-account"]').click();
  }
}

module.exports = { RegisterPage };
