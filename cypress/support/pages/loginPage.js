export class Login {
  elements = {
    usernameInput: () => cy.get('input[name="user-name"]'),
    passwordInput: () => cy.get('input[name="password"]'),
    loginButton: () => cy.get('input[type="submit"]'),
  };

  // ==== Methods ====

  typeUsername(username) {
    this.elements.usernameInput().type(username);
  }

  typePassword(password) {
    this.elements.passwordInput().type(password);
  }

  clickLogin() {
    this.elements.loginButton().click();
  }
}

export const login = new Login();
