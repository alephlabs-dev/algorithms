import { test, expect } from '@playwright/test';

// Runs on every device project. The Spanish data structures page: names, steps and the operation bar.
test('data structures in Spanish build the tree and explain each step in Spanish', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-structures', 'true'));
  await page.goto('/es/structures/avl-tree');

  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { level: 1, name: 'Árbol AVL' })).toBeAttached();
  await expect(page.getByRole('heading', { level: 2, name: 'Cómo funciona el árbol AVL' })).toBeAttached();

  await page.getByRole('button', { name: 'Paso siguiente' }).click();
  await expect(
    page.getByText(/^Inserta \d+: el árbol está vacío, así que se vuelve la raíz\.$/).filter({ visible: true }).first(),
  ).toBeVisible();

  const bar = page.getByRole('form', { name: 'Operaciones' });
  await expect(bar.getByRole('button', { name: 'Insertar' })).toBeVisible();
  await expect(bar.getByRole('button', { name: 'Buscar' })).toBeVisible();
  await expect(bar.getByRole('button', { name: 'Borrar' })).toBeVisible();
  expect(errors).toEqual([]);
});
