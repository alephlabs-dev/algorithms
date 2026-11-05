import { test, expect } from '@playwright/test';

// Runs on every device project. The Spanish dynamic programming page: names, steps and the words bar.
test('dynamic programming in Spanish fills the table and explains each step in Spanish', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-dp', 'true'));
  await page.goto('/es/dynamic-programming/edit-distance');

  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { level: 1, name: 'Distancia de edición' })).toBeAttached();
  await expect(page.getByText(/^¿Cuántas ediciones convierten [A-Z]+ en [A-Z]+\?/).filter({ visible: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Paso siguiente' }).click();
  await expect(page.getByText(/^Primero la fila y la columna ε/).filter({ visible: true }).first()).toBeVisible();

  await expect(page.getByRole('form', { name: 'Palabras' }).getByRole('button', { name: 'Comparar' })).toBeVisible();
  expect(errors).toEqual([]);
});
