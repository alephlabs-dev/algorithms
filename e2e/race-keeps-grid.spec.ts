import { test, expect, type Page } from '@playwright/test';
import { gotoApp } from './goto';

// Runs on every device project. #178: walls drawn on a grid a race shrinks are still there after it.

const cellsIn = (url: string) => new URL(url).searchParams.get('cells');
const viewSwitch = (page: Page) => page.locator('[data-tour="race"]:visible');

test('pathfinding: walls drawn on a large grid survive a race and back', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-pathfinding', 'true'));
  await gotoApp(page, '/pathfinding/a-star?grid=large');
  await expect(page).toHaveURL(/cells=/);
  const laidOut = cellsIn(page.url());

  // Draw: a drag across the middle of the grid paints (or erases) walls on its way.
  const grid = page.getByRole('img', { name: /Drag to draw walls/ });
  const box = (await grid.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.25);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.25, { steps: 10 });
  await page.mouse.up();
  await expect.poll(() => cellsIn(page.url())).not.toBe(laidOut);
  const drawn = cellsIn(page.url());

  // Every device caps a large grid in a race.
  await viewSwitch(page).getByRole('radio', { name: 'Race' }).click();
  await expect(page).toHaveURL(/\/pathfinding\/race\?grid=(small|medium)&/);
  await viewSwitch(page).getByRole('radio', { name: 'Visualize' }).click();
  await expect(page).toHaveURL(/\/pathfinding\/a-star\?grid=large&/);
  expect(cellsIn(page.url())).toBe(drawn);
  expect(errors).toEqual([]);
});
