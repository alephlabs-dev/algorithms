import { test, expect } from '@playwright/test';
import { gotoApp } from './goto';

// Three or four sorting racers sit in a 2×2 grid on every screen, so lanes stay tall enough on phones.
test('four sorting racers sit two by two', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
  await gotoApp(page, '/sorting/race?size=20&race=insertion,quick,merge,heap');
  // Each lane's name heads its card (the settings panel has h3s too).
  const lanes = page.getByRole('main').locator('section > header').getByRole('heading', { level: 3 });
  await expect(lanes).toHaveCount(4);
  const [a, b, c, d] = await Promise.all([0, 1, 2, 3].map(async (k) => (await lanes.nth(k).boundingBox())!));
  expect(Math.abs(a.y - b.y)).toBeLessThan(2);
  expect(Math.abs(c.y - d.y)).toBeLessThan(2);
  expect(c.y).toBeGreaterThan(a.y);
});

test('three sorting racers: two on top, the third across the bottom', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
  await gotoApp(page, '/sorting/race?size=20&race=insertion,quick,merge');
  // Each lane's name heads its card (the settings panel has h3s too).
  const lanes = page.getByRole('main').locator('section > header').getByRole('heading', { level: 3 });
  await expect(lanes).toHaveCount(3);
  const [a, b, c] = await Promise.all([0, 1, 2].map(async (k) => (await lanes.nth(k).boundingBox())!));
  expect(Math.abs(a.y - b.y)).toBeLessThan(2);
  expect(c.y).toBeGreaterThan(a.y);
});
