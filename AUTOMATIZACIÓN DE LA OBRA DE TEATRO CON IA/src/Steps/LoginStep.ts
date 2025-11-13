import * as fs from 'fs';
import * as path from 'path';
import type { Page } from 'playwright';

interface User {
  ID: string;
  Environment: string;
  User: string;
  Password: string;
}

export async function inicioSesionPorID(id: string, page: Page): Promise<void> {
  const usersPath = path.join(process.cwd(), 'src', 'data', 'users.json');
  const raw = fs.readFileSync(usersPath, 'utf8');
  const users = JSON.parse(raw) as User[];
  const normalizedId = id.replace(/^ID\s*/i, '');
  const userObj = users.find(u => u.ID === normalizedId);
  if (!userObj) throw new Error(`Usuario con ID ${id} no encontrado en users.json`);

  await page.goto(userObj.Environment);
  await page.fill('#user-name', userObj.User);
  await page.fill('#password', userObj.Password);
}
