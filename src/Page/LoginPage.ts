import type { Page } from 'playwright';

export default class LoginPage {
  private page: Page;
  private usernameSelector = '#user-name';
  private passwordSelector = '#password';
  private loginButton = '#login-button';

  constructor(page: Page) {
    this.page = page;
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url);
  }

  async fillUsername(username: string): Promise<void> {
    await this.page.fill(this.usernameSelector, username);
  }

  async fillPassword(password: string): Promise<void> {
    await this.page.fill(this.passwordSelector, password);
  }

  async clickLogin(): Promise<void> {
    await this.page.click(this.loginButton);
  }

  async login(username: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickLogin();
  }
}
