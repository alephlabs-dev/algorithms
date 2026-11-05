import { test, expect } from '@playwright/test';

// Runs on every device project. The Spanish sorting page: in Spanish from the first paint,
// steps explained in Spanish, and a way back to the same page in English.
test('sorting in Spanish speaks Spanish and switches back to English', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
  await page.goto('/es/sorting/insertion-sort?size=10&speed=16x');

  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page).toHaveTitle(/Insertion Sort paso a paso/);
  await expect(page.getByRole('heading', { level: 1, name: 'Insertion Sort' })).toBeAttached();
  await expect(page.getByRole('heading', { level: 2, name: 'Cómo funciona Insertion Sort' })).toBeAttached();

  await expect(page.getByText(/^Presiona play/).filter({ visible: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Paso siguiente' }).click();
  await expect(page.getByText(/^((Compara|Mueve|Escribe|Intercambia) \d|Siguiente:)/).filter({ visible: true }).first()).toBeVisible();
  // Moving around keeps the Spanish prefix in the address.
  await expect(page).toHaveURL(/\/es\/sorting\/insertion-sort/);

  // The English link lives in the top bar on desktop and in the modules sheet elsewhere.
  const english = page.getByRole('link', { name: 'English' });
  if (!(await english.isVisible())) await page.getByRole('button', { name: /^Módulo:/ }).click();
  await english.click();
  await expect(page).toHaveURL(/^[^?]*\/sorting\/insertion-sort\?.*size=10/);
  await expect(page).not.toHaveURL(/\/es\//);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(errors).toEqual([]);
});
