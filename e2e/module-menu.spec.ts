import { test, expect } from '@playwright/test';
import { gotoApp } from './goto';

// Runs on every device project. The list of modules (a popover on desktop, a sheet on phones and tablets).
test('the module list has no empty "Coming soon" section while every module is open', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
  await gotoApp(page, '/sorting');

  await page.getByRole('button', { name: 'Module: Sorting. Change' }).filter({ visible: true }).first().click();
  const list = page.getByRole('navigation', { name: 'Modules' });
  await expect(list).toBeVisible();
  await expect(list.getByRole('button', { name: /Pathfinding/ })).toBeVisible();
  await expect(list).not.toContainText('Coming soon');
});
