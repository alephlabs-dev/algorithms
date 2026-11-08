import { test, expect } from '@playwright/test';
import { gotoApp } from './goto';

// Runs on every device project. The Spanish pathfinding page: Spanish names, steps and tools.
test('pathfinding in Spanish names its searches and explains each step in Spanish', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-pathfinding', 'true'));
  await gotoApp(page, '/es/pathfinding/breadth-first-search');

  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { level: 1, name: 'Búsqueda en anchura' })).toBeAttached();
  await expect(page.getByText(/^Presiona play para buscar/).filter({ visible: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Paso siguiente' }).click();
  await expect(page.getByText('Pon el inicio en la cola.').filter({ visible: true }).first()).toBeVisible();
  await expect(page).toHaveURL(/\/es\/pathfinding\/breadth-first-search/);
  expect(errors).toEqual([]);
});
