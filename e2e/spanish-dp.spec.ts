import { test, expect } from '@playwright/test';

// Runs on every device project. The Spanish dynamic programming page: names, steps and the words bar.
test('dynamic programming in Spanish fills the table and explains each step in Spanish', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-dp', 'true'));
  await page.goto('/es/dynamic-programming/edit-distance');

  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { level: 1, name: 'Distancia de edición' })).toBeAttached();
  await expect(page.getByText(/^¿Cuántas ediciones llevan de una palabra a la otra\?/).filter({ visible: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Paso siguiente' }).click();
  await expect(page.getByText(/^Primero la fila y la columna ε/).filter({ visible: true }).first()).toBeVisible();

  await expect(page.getByRole('form', { name: 'Palabras' }).getByRole('button', { name: 'Comparar' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('dynamic programming keeps Ñ and accents in the words you type', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tour-done-dp', 'true'));
  await page.goto('/es/dynamic-programming/edit-distance');

  const words = page.getByRole('form', { name: 'Palabras' });
  await words.getByLabel('Palabra 1').fill('año');
  await words.getByLabel('Palabra 2').fill('cañón');
  await words.getByRole('button', { name: 'Comparar' }).click();

  await expect(page).toHaveURL(/a=A%C3%91O/);
  await expect(page).toHaveURL(/b=CA%C3%91%C3%93N/);
  await expect(words.getByLabel('Palabra 1')).toHaveValue('AÑO');
});
