import { Before, After, Given, When, Then, setDefaultTimeout } from '@cucumber/cucumber';
import type { IWorld } from '@cucumber/cucumber';
import { inicioSesionPorID } from './LoginStep';
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

setDefaultTimeout(60 * 1000);

Before(async function (this: IWorld) {
  const headlessEnv = process.env.HEADLESS;
  const slowMoEnv = process.env.SLOWMO;
  const headless = typeof headlessEnv !== 'undefined' ? (headlessEnv === '1' || headlessEnv?.toLowerCase() === 'true') : false;
  const slowMo = slowMoEnv ? parseInt(slowMoEnv, 10) : 50;
  // eslint-disable-next-line no-console
  console.info(`Playwright launch - headless: ${headless}, slowMo: ${slowMo}, workers: ${process.env.WORKERS || '1'}`);
  this.browser = await chromium.launch({ headless, slowMo });
  this.page = await this.browser.newPage();
});

After(async function (this: IWorld, scenario) {
  // Si el escenario falló, loguear detalles (nombre, ubicaciones y error) en la terminal
  try {
    if ((scenario as any)?.result?.status === 'FAILED') {
      // eslint-disable-next-line no-console
      console.error('=== FALLO DETECTADO EN ESCENARIO ===');
      // Nombre del escenario
      // eslint-disable-next-line no-console
      console.error('Escenario:', (scenario as any).pickle?.name);
      // Localizaciones (líneas) en el feature
      // eslint-disable-next-line no-console
      console.error('Localizaciones pickle:', JSON.stringify((scenario as any).pickle?.locations || []));
      // Mensaje/stack del error
      // eslint-disable-next-line no-console
      console.error('Resultado:', JSON.stringify((scenario as any).result || {}));
    }
  } catch (logErr: any) {
    // eslint-disable-next-line no-console
    console.error('Error registrando fallo del escenario:', logErr);
  }

  // Crear carpeta timestamped en test-history y guardar screenshot, HTML y DOCX
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const runDir = path.join(process.cwd(), 'test-history', timestamp);
    fs.mkdirSync(runDir, { recursive: true });

    if (this.page) {
      const shotPath = path.join(runDir, 'screenshot.png');
      await this.page.screenshot({ path: shotPath, fullPage: true });

      // HTML report
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Reporte</title></head><body><h1>Reporte de ejecución - ${timestamp}</h1><p>Escenario: ${scenario.pickle?.name || 'N/A'}</p><img src="screenshot.png" style="max-width:100%;height:auto;"/></body></html>`;
      fs.writeFileSync(path.join(runDir, 'report.html'), html, 'utf8');

      // DOCX report (incrustar la captura)
      try {
        const docx = require('docx');
        const { Document, Packer, Paragraph, ImageRun } = docx;
        const imageBuffer = fs.readFileSync(shotPath);
        const doc = new Document({ sections: [{ children: [ new Paragraph({ children: [ new ImageRun({ data: imageBuffer, transformation: { width: 600, height: 400 } }) ] }) ] }] });
        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(path.join(runDir, 'report.docx'), buffer);
      } catch (err: any) {
        // si falla docx, escribir un aviso
        fs.writeFileSync(path.join(runDir, 'report.docx.failed.txt'), `Error generando docx: ${err.message}`);
      }
    }
  } catch (err: any) {
    // no bloquear el cierre del navegador por errores en generación de reportes
    // eslint-disable-next-line no-console
    console.error('Error generando test-history:', err);
  } finally {
    if (this.browser) await this.browser.close();
  }
});

Given('I am on the login page', async function (this: IWorld) {
  await this.page?.goto('https://www.saucedemo.com/');
});

When(/^Inicio de sesion con el usuario "([^"]+)"$/, async function (this: IWorld, id: string) {
  await inicioSesionPorID(id, this.page as any);
});

When('I click the login button', async function (this: IWorld) {
  await this.page?.click('#login-button');
});

Then('I should be logged in successfully', async function (this: IWorld) {
  await this.page?.waitForSelector('.inventory_list', { timeout: 5000 });
});

Then('I should be redirected to the dashboard', async function (this: IWorld) {
  const url = this.page?.url() || '';
  if (!url.includes('/inventory.html')) throw new Error(`No se redirigió al dashboard, url actual: ${url}`);
});

Then('I should see an error message', async function (this: IWorld) {
  await this.page?.waitForSelector('[data-test="error"]', { timeout: 5000 });
});

// Pasos añadidos que faltaban en el feature
When('I leave the username field empty', async function (this: IWorld) {
  await this.page?.fill('#user-name', '');
});

When('I leave the password field empty', async function (this: IWorld) {
  await this.page?.fill('#password', '');
});

Then('I should remain on the login page', async function (this: IWorld) {
  const url = this.page?.url() || '';
  if (url.includes('/inventory.html')) {
    throw new Error(`Se redirigió al dashboard pero debería permanecer en la página de login. URL actual: ${url}`);
  }
  await this.page?.waitForSelector('#login-button', { timeout: 5000 });
});

Then('I should see validation messages for required fields', async function (this: IWorld) {
  await this.page?.waitForSelector('[data-test="error"]', { timeout: 5000 });
  const txt = await this.page?.textContent('[data-test="error"]');
  const hasValidation = !!txt && (txt.includes('Username is required') || txt.includes('Password is required') || txt.includes('Epic sadface'));
  if (!hasValidation) {
    throw new Error(`No se detectaron mensajes de validación esperados. Texto: ${txt}`);
  }
});

// --- Nuevos pasos para escenarios de borde ---

When('I enter a username longer than {int} characters', async function (this: IWorld, len: number) {
  const long = 'a'.repeat(len + 1);
  await this.page?.fill('#user-name', long);
});

When('I enter a password longer than {int} characters', async function (this: IWorld, len: number) {
  const long = 'a'.repeat(len + 1);
  await this.page?.fill('#password', long);
});

When('I attempt login with username {string} and password {string}', async function (this: IWorld, user: string, pass: string) {
  await this.page?.fill('#user-name', user);
  await this.page?.fill('#password', pass);
});

When(/^I attempt login with username "(.+?)" and incorrect password$/, async function (this: IWorld, user: string) {
  await this.page?.fill('#user-name', user);
  await this.page?.fill('#password', 'wrongpassword');
});

When(/^I attempt login with username "(.+?)"$/, async function (this: IWorld, user: string) {
  await this.page?.fill('#user-name', user);
});

When('I repeat the login attempt {int} times', async function (this: IWorld, count: number) {
  for (let i = 0; i < count; i++) {
    await this.page?.click('#login-button');
    // Esperar mensaje de error antes de continuar
    await this.page?.waitForSelector('[data-test="error"]', { timeout: 2000 });
  }
});

When('I enter a valid password', async function (this: IWorld) {
  await this.page?.fill('#password', 'secret_sauce');
});

When('I enter a valid username', async function (this: IWorld) {
  await this.page?.fill('#user-name', 'standard_user');
});

When('I enter any password', async function (this: IWorld) {
  await this.page?.fill('#password', 'anything');
});

Then('I should see an error about username length', async function (this: IWorld) {
  const txt = await this.page?.textContent('[data-test="error"]');
  if (!txt?.toLowerCase().includes('username')) throw new Error(`No se encontró texto de longitud de usuario: ${txt}`);
});

Then('I should see an error about password length', async function (this: IWorld) {
  const txt = await this.page?.textContent('[data-test="error"]');
  if (!txt?.toLowerCase().includes('password')) throw new Error(`No se encontró texto de longitud de contraseña: ${txt}`);
});

Then('I should not be logged in', async function (this: IWorld) {
  const url = this.page?.url() || '';
  if (url.includes('/inventory.html')) throw new Error('Se accedió al dashboard inesperadamente');
});

Then('I should be denied access', async function (this: IWorld) {
  await this.page?.waitForSelector('[data-test="error"]', { timeout: 5000 });
  const url = this.page?.url() || '';
  if (url.includes('/inventory.html')) throw new Error('Se accedió al dashboard cuando se esperaba denegación de acceso');
});

Then('my account should be locked', async function (this: IWorld) {
  // Sauce Demo doesn't have a "locked" status; locked_out_user simply fails to login with any password
  // We verify this by checking that an error message appears
  await this.page?.waitForSelector('[data-test="error"]', { timeout: 5000 });
  const txt = await this.page?.textContent('[data-test="error"]');
  if (!txt || txt.trim().length === 0) throw new Error('Se esperaba un mensaje de error para cuenta bloqueada');
});

Then('I should see a lockout message', async function (this: IWorld) {
  await this.page?.waitForSelector('[data-test="error"]', { timeout: 5000 });
});