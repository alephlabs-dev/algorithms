import { test, expect, type Page } from '@playwright/test';
import { gotoApp } from './goto';
import { openSettings } from './settings';

// Runs on every device project. #149: a maze carved in Mazes opens in pathfinding, to be solved.

const caption = (page: Page) => page.locator('[data-tour="narration"]:visible');

test('mazes: solve the maze on stage in pathfinding, then play the search to a path', async ({ page, context }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    localStorage.setItem('tour-done-mazes', 'true');
    localStorage.setItem('tour-done-pathfinding', 'true');
  });
  await gotoApp(page, '/mazes/prim?size=small&seed=abc&speed=8x');

  await openSettings(page, testInfo);
  const solve = page.getByRole('link', { name: 'Find a path' });
  // A real link: the pathfinding page with the maze in its query.
  const href = await solve.getAttribute('href');
  expect(href).toMatch(/^\/pathfinding\/a-star\?grid=small&cells=[\w-]+(&rows=\d+)?&from=\w+&to=\w+/);
  await solve.click();

  await expect(page).toHaveURL(/\/pathfinding\/a-star\?grid=small&cells=/);
  // Pathfinding opened the link's grid: its own link carries the same one (and adds its racers).
  const grid = (url: string) => ['grid', 'cells', 'rows', 'from', 'to'].map((key) => new URL(url, page.url()).searchParams.get(key));
  expect(grid(page.url())).toEqual(grid(href!));
  await expect(page.getByRole('heading', { level: 1, name: 'A* Search' })).toBeAttached();
  // The settings sheet went with the page it was opened on.
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeHidden();

  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(caption(page)).toContainText(/^Found a path of \d+ steps/, { timeout: 20_000 });

  // The link opens the same maze in a new tab: the same path, after looking at as many cells.
  const found = await caption(page).textContent();
  const opened = await context.newPage();
  await gotoApp(opened, href!);
  await opened.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(caption(opened)).toHaveText(found!, { timeout: 20_000 });
  expect(errors).toEqual([]);
});
