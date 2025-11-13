import { Before, After, Given, When, Then, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

setDefaultTimeout(60 * 1000);

Before(async function () {
  this.browser = await chromium.launch({ headless: false, slowMo: 50 });
  this.page = await this.browser.newPage();
});

After(async function (scenario) {
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

Given('I am on the login page', async function () {
  await this.page.goto('https://www.saucedemo.com/');
});

When(/^Inicio de sesion con el usuario "([^"]+)"$/, async function (id: string) {
  const usersPath = path.join(process.cwd(), 'src', 'data', 'users.json');
  const raw = fs.readFileSync(usersPath, 'utf8');
  const users = JSON.parse(raw) as Array<{ ID: string; Environment: string; User: string; Password: string }>;
  const normalizedId = id.replace(/^ID\s*/i, '');
  const userObj = users.find(u => u.ID === normalizedId);
  if (!userObj) throw new Error(`Usuario con ID ${id} no encontrado en users.json`);

  await this.page.goto(userObj.Environment);
  await this.page.fill('#user-name', userObj.User);
  await this.page.fill('#password', userObj.Password);
});

When('I click the login button', async function () {
  await this.page.click('#login-button');
});

Then('I should be logged in successfully', async function () {
  await this.page.waitForSelector('.inventory_list', { timeout: 5000 });
});

Then('I should be redirected to the dashboard', async function () {
  const url = this.page.url();
  if (!url.includes('/inventory.html')) throw new Error(`No se redirigió al dashboard, url actual: ${url}`);
});

Then('I should see an error message', async function () {
  await this.page.waitForSelector('[data-test="error"]', { timeout: 5000 });
});
