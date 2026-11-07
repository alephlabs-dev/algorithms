import { test, expect } from '@playwright/test';

// Runs on every device project. The Spanish Fourier page: names, steps and the circles control.
test('Fourier in Spanish builds the wave and explains it in Spanish', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-fourier', 'true'));
  await page.goto('/es/fourier/square-wave');

  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { level: 1, name: 'Onda cuadrada' })).toBeAttached();
  await expect(
    page.getByText(/^\d+ círculos en cadena, .* Presiona play: arman la onda cuadrada\.$/).filter({ visible: true }).first(),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Paso siguiente' }).click();
  await expect(page.getByText(/^A \d+°, los círculos suman /).filter({ visible: true }).first()).toBeVisible();
  expect(errors).toEqual([]);
});
