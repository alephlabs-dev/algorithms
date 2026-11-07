import { test, expect } from '@playwright/test';

// Runs on every device project. The Spanish N-Queens page: names, steps and the choices strip.
test('N-Queens in Spanish places queens and explains each step in Spanish', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-backtracking', 'true'));
  await page.goto('/es/backtracking/n-queens?n=6');

  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { level: 1, name: 'N reinas' })).toBeAttached();
  await expect(
    page.getByText('6 reinas en un tablero de 6×6, una por fila. Presiona play: cada fila prueba desde la izquierda.').filter({ visible: true }).first(),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Paso siguiente' }).click();
  await expect(
    page.getByText('Fila 1, columna 1 es segura, así que va una reina ahí. Sigue la fila 2.').filter({ visible: true }).first(),
  ).toBeVisible();
  // The choice stands in the strip: row 1's queen is in column 1.
  await expect(page.getByRole('listitem', { name: 'Fila 1: columna 1' })).toBeVisible();
  await expect(page).toHaveURL(/\/es\/backtracking\/n-queens\?n=6/);
  expect(errors).toEqual([]);
});

// Runs on every device project. The Spanish Sudoku page: the first step names the rule the digit breaks.
test('Sudoku in Spanish fills the grid and explains each step in Spanish', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-backtracking', 'true'));
  await page.goto('/es/backtracking/sudoku?puzzle=easy');

  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { level: 1, name: 'Sudoku' })).toBeAttached();
  await expect(
    page.getByText('51 casillas vacías. Presiona play: fila por fila, cada una prueba los dígitos del 1 al 9.').filter({ visible: true }).first(),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Paso siguiente' }).click();
  await expect(
    page.getByText('Fila 1, columna 3: el 1 ya está en su fila. Un conflicto: se salta.').filter({ visible: true }).first(),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/es\/backtracking\/sudoku\?puzzle=easy/);
  expect(errors).toEqual([]);
});

// Runs on every device project. Fewest options first: the first try in a cell says why that cell goes next.
test('Sudoku with fewest options first explains why each cell goes next, in Spanish', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-backtracking', 'true'));
  await page.goto('/es/backtracking/sudoku?puzzle=hard&order=mrv');

  await expect(
    page.getByText('51 casillas vacías. Presiona play: primero la que admite menos dígitos, probando del 1 al 9.').filter({ visible: true }).first(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Paso siguiente' }).click();
  await expect(
    page.getByText(/^Fila \d, columna \d \(menos opciones: 1\): /).filter({ visible: true }).first(),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/es\/backtracking\/sudoku\?puzzle=hard&order=mrv/);
  expect(errors).toEqual([]);
});
