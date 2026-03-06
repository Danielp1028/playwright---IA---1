import type { Page } from 'playwright';

export default class LoginPage {
  private page: Page;
  private usernameSelector = '#user-name';
  private passwordSelector = '#password';
  private loginButton = '#login-button';
  private errorSelector = '[data-test="error"]';
  private inventorySelector = '.inventory_list';

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

  // --- Nuevos métodos para escenarios de borde ---

  // Login con username excesivamente largo
  async loginWithLongUsername(length: number): Promise<void> {
    const longUsername = 'a'.repeat(length + 1);
    await this.fillUsername(longUsername);
    await this.fillPassword('secret_sauce'); // Contraseña válida
    await this.clickLogin();
  }

  // Login con password excesivamente largo
  async loginWithLongPassword(length: number): Promise<void> {
    const longPassword = 'a'.repeat(length + 1);
    await this.fillUsername('standard_user'); // Username válido
    await this.fillPassword(longPassword);
    await this.clickLogin();
  }

  // Login con intento de SQL injection
  async loginWithSQLInjection(): Promise<void> {
    await this.fillUsername("' OR '1'='1"); // Payload de SQL injection
    await this.fillPassword('anything');
    await this.clickLogin();
  }

  // Intentar login múltiples veces (para bloqueo de cuenta)
  async attemptLoginMultipleTimes(username: string, password: string, times: number): Promise<void> {
    for (let i = 0; i < times; i++) {
      await this.fillUsername(username);
      await this.fillPassword(password);
      await this.clickLogin();
      // Esperar error antes de siguiente intento
      await this.page.waitForSelector(this.errorSelector, { timeout: 2000 });
    }
  }

  // Login con campos vacíos
  async loginWithEmptyFields(): Promise<void> {
    await this.fillUsername('');
    await this.fillPassword('');
    await this.clickLogin();
  }

  // Login con credenciales inválidas
  async loginWithInvalidCredentials(username: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  // --- Métodos de verificación ---

  // Verificar si está logueado (redirigido al dashboard)
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.page.waitForSelector(this.inventorySelector, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  // Verificar si hay error visible
  async isErrorVisible(): Promise<boolean> {
    try {
      await this.page.waitForSelector(this.errorSelector, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  // Obtener mensaje de error
  async getErrorMessage(): Promise<string | null> {
    try {
      return await this.page.textContent(this.errorSelector);
    } catch {
      return null;
    }
  }

  // Verificar si está en la página de login
  async isOnLoginPage(): Promise<boolean> {
    const url = this.page.url();
    return url === 'https://www.saucedemo.com/' || url.includes('/'); // Ajusta si es necesario
  }

  // Verificar si la cuenta está bloqueada (mensaje de locked)
  async isAccountLocked(): Promise<boolean> {
    const errorText = await this.getErrorMessage();
    return errorText?.toLowerCase().includes('locked') || false;
  }
}
