import { test, expect, type Page } from '@playwright/test';
import { gotoApp } from './goto';

// Runs on every device project. Walls the learner draws stay: through a race that shrinks the grid (#178),
// and through a switch of algorithm (#149: opening links in the app mustn't reset what they don't name).

const cellsIn = (url: string) => new URL(url).searchParams.get('cells');
const viewSwitch = (page: Page) => page.locator('[data-tour="race"]:visible');

/** Drags across the grid, painting (or erasing) walls on its way; returns the drawn cells, as the link has them. */
const drawWalls = async (page: Page) => {
  await expect(page).toHaveURL(/cells=/);
  const laidOut = cellsIn(page.url());
  const grid = page.getByRole('img', { name: /Drag to draw walls/ });
  const box = (await grid.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.25);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.25, { steps: 10 });
  await page.mouse.up();
  await expect.poll(() => cellsIn(page.url())).not.toBe(laidOut);
  // The link follows edits a moment later (debounced): wait until it stops changing.
  let drawn = cellsIn(page.url());
  await expect
    .poll(async () => {
      const before = drawn;
      await page.waitForTimeout(300);
      drawn = cellsIn(page.url());
      return drawn === before;
    })
    .toBe(true);
  return drawn;
};

test('pathfinding: walls drawn on a large grid survive a race and back', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-pathfinding', 'true'));
  await gotoApp(page, '/pathfinding/a-star?grid=large');
  const drawn = await drawWalls(page);

  // Every device caps a large grid in a race.
  await viewSwitch(page).getByRole('radio', { name: 'Race' }).click();
  await expect(page).toHaveURL(/\/pathfinding\/race\?grid=(small|medium)&/);
  await viewSwitch(page).getByRole('radio', { name: 'Visualize' }).click();
  await expect(page).toHaveURL(/\/pathfinding\/a-star\?grid=large&/);
  expect(cellsIn(page.url())).toBe(drawn);
  expect(errors).toEqual([]);
});

test('pathfinding: walls drawn survive switching algorithm', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-pathfinding', 'true'));
  await gotoApp(page, '/pathfinding/a-star?grid=small');
  const drawn = await drawWalls(page);

  // The picker: the field's drawer on phones and tablets, the pill's popover on wide screens.
  await page.getByRole('button', { name: /^Algorithm: / }).click();
  await page.getByRole('option', { name: 'Breadth-First Search' }).click();
  await expect(page).toHaveURL(/\/pathfinding\/breadth-first-search\?/);
  expect(cellsIn(page.url())).toBe(drawn);
  // Back, with the browser: the same grid still.
  await page.goBack();
  await expect(page).toHaveURL(/\/pathfinding\/a-star\?/);
  expect(cellsIn(page.url())).toBe(drawn);
  expect(errors).toEqual([]);
});
