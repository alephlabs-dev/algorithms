import { test, expect } from '@playwright/test';
import { gotoApp } from './goto';

// Runs on every device project. The Spanish graphs page: Spanish names, steps and the structure strip.
test('graphs in Spanish names its algorithms and explains each step in Spanish', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-graphs', 'true'));
  await gotoApp(page, '/es/graphs/breadth-first-search');

  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { level: 1, name: 'Búsqueda en anchura' })).toBeAttached();
  await expect(page.getByText(/^Presiona play\. Arrastra los nodos/).filter({ visible: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Paso siguiente' }).click();
  await expect(page.getByText(/^Empieza en [A-Z]+: agrégalo a la cola\.$/).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByLabel(/^Cola, el frente primero: /)).toBeVisible();
  expect(errors).toEqual([]);
});
