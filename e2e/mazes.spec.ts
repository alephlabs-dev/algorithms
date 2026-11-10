import { test, expect, type Page } from '@playwright/test';
import { gotoApp } from './goto';
import { hasSettingsPanel, openSettings } from './settings';

// Runs on every device project. The Mazes module: watch DFS carve a maze, change its size,
// draw a new one, and reopen the link to get the exact same maze back.

/** The step sentence on screen (phones and wide screens each render their own caption). */
const caption = (page: Page) => page.locator('[data-tour="narration"]:visible');
const stats = (page: Page) => page.locator('[data-tour="stats"]:visible');

/** Plays the run to its last frame, where the dead-end cells are counted. */
const playToEnd = async (page: Page, play: string, done: RegExp) => {
  await page.getByRole('button', { name: play, exact: true }).click();
  await expect(caption(page)).toContainText(done, { timeout: 20_000 });
};

test('mazes: carve a maze, resize it, draw a new one and reopen its link', async ({ page, context }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-mazes', 'true'));
  await gotoApp(page, '/mazes?size=small&seed=abc&speed=8x');

  await expect(page.getByRole('heading', { level: 1, name: 'Maze generation' })).toBeAttached();
  await expect(caption(page)).toContainText('Press play to carve a maze.');
  await page.getByRole('button', { name: 'Next step' }).click();
  await expect(caption(page)).toContainText(/^Start at row \d+, column \d+/);

  await playToEnd(page, 'Play', /^Done: a perfect maze with \d+ dead-end cells?/);
  await expect(stats(page)).toHaveText(/^\d+ steps · \d+ dead-end cells?$/);

  // The size is the only setting; the seed stays.
  await openSettings(page, testInfo);
  await page.getByRole('radiogroup', { name: 'Maze size' }).getByRole('radio', { name: 'Medium' }).click();
  await expect(page).toHaveURL(/size=medium&seed=abc/);
  if (!hasSettingsPanel(testInfo)) await page.keyboard.press('Escape');

  // New maze: another seed, the same size.
  await page.getByRole('button', { name: 'New maze' }).click();
  await expect(page).toHaveURL(/size=medium&seed=(?!abc&)[0-9a-z]+/);

  // The link reopens the exact same maze, decision for decision.
  const link = page.url();
  await page.getByRole('button', { name: 'Next step' }).click();
  const firstStep = await caption(page).textContent();
  await playToEnd(page, 'Play', /^Done:/);
  const finished = await stats(page).textContent();

  const reopened = await context.newPage();
  await gotoApp(reopened, link);
  await reopened.getByRole('button', { name: 'Next step' }).click();
  await expect(caption(reopened)).toHaveText(firstStep!);
  await playToEnd(reopened, 'Play', /^Done:/);
  await expect(stats(reopened)).toHaveText(finished!);
  expect(errors).toEqual([]);
});

/** Picks an algorithm: a segment on phones and tablets, the pill's list on wide screens. */
const pickAlgorithm = async (page: Page, short: string, title: string) => {
  const segments = page.getByRole('radiogroup', { name: 'Algorithm', exact: true });
  if (await segments.isVisible()) await segments.getByRole('radio', { name: short }).click();
  else {
    await page.getByRole('button', { name: /^Algorithm: / }).click();
    await page.getByRole('button', { name: title }).click();
  }
};

test('mazes: switch to Prim on the same seed and reopen its link', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-mazes', 'true'));
  await gotoApp(page, '/mazes?size=small&seed=abc&speed=8x');

  await pickAlgorithm(page, 'Prim', "Randomized Prim's Algorithm");
  await expect(page).toHaveURL(/\/mazes\/prim\?size=small&seed=abc/);
  await expect(page.getByRole('heading', { level: 1, name: "Randomized Prim's Algorithm" })).toBeAttached();
  // Prim's legend names the frontier (phones hide the legend, but it's on the page).
  await expect(page.locator('[data-tour="legend"]').first()).toContainText('Frontier');

  // The start and its frontier, then one pick per frame.
  await page.getByRole('button', { name: 'Next step' }).click();
  await expect(caption(page)).toContainText(/^Start at row \d+, column \d+: carve it and put its \d+ neighbours on the frontier\./);
  await page.getByRole('button', { name: 'Next step' }).click();
  await expect(caption(page)).toContainText(/^Pick row \d+, column \d+, carve in from /);
  await playToEnd(page, 'Play', /^Done: a perfect maze with \d+ dead-end cells?/);
  const finished = await stats(page).textContent();

  const reopened = await context.newPage();
  await gotoApp(reopened, page.url());
  await playToEnd(reopened, 'Play', /^Done:/);
  await expect(stats(reopened)).toHaveText(finished!);
  expect(errors).toEqual([]);
});

test('mazes: switch to Kruskal, which stops as soon as every cell is joined', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-mazes', 'true'));
  await gotoApp(page, '/mazes/prim?size=small&seed=abc&speed=8x');

  await pickAlgorithm(page, 'Kruskal', "Randomized Kruskal's Algorithm");
  await expect(page).toHaveURL(/\/mazes\/kruskal\?size=small&seed=abc/);
  await expect(page.getByRole('heading', { level: 1, name: "Randomized Kruskal's Algorithm" })).toBeAttached();
  // Kruskal's legend tells a carved wall from a skipped one, and has no start cell.
  const legend = page.locator('[data-tour="legend"]').first();
  await expect(legend).toContainText('Wall carved');
  await expect(legend).toContainText('Wall skipped');
  await expect(legend).not.toContainText('Start');

  // Every cell its own region, then one wall tested per frame.
  await page.getByRole('button', { name: 'Next step' }).click();
  await expect(caption(page)).toContainText(/^Carve every cell, each its own region: \d+ regions\./);
  await page.getByRole('button', { name: 'Next step' }).click();
  await expect(caption(page)).toContainText(/^The wall at row \d+, column \d+ (splits two regions|is inside one region)/);
  await playToEnd(page, 'Play', /^Done: a perfect maze with \d+ dead-end cells?/);
  const finished = await stats(page).textContent();
  // The last wall it tests is the one that joins every cell.
  await page.getByRole('button', { name: 'Previous step', exact: true }).click();
  await expect(caption(page)).toContainText(/splits the last two regions: carve it\. Every cell is joined\./);

  const reopened = await context.newPage();
  await gotoApp(reopened, page.url());
  await playToEnd(reopened, 'Play', /^Done:/);
  await expect(stats(reopened)).toHaveText(finished!);
  expect(errors).toEqual([]);
});

test('mazes in Spanish carve and explain each step in Spanish', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-mazes', 'true'));
  await gotoApp(page, '/es/mazes?size=small&speed=8x');

  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { level: 1, name: 'Generación de laberintos' })).toBeAttached();
  await expect(caption(page)).toContainText('Presiona play para excavar un laberinto.');
  await page.getByRole('button', { name: 'Paso siguiente' }).click();
  await expect(caption(page)).toContainText(/^Empieza en la fila \d+, columna \d+/);
  await playToEnd(page, 'Reproducir', /^Listo: un laberinto perfecto con \d+ celdas? sin salida/);
  await expect(stats(page)).toHaveText(/^\d+ pasos · \d+ sin salida$/);
  await expect(page).toHaveURL(/\/es\/mazes\?size=small&seed=[0-9a-z]+/);
  expect(errors).toEqual([]);
});

test('the mazes tour carves a third of the maze before it explains the colors', async ({ page }) => {
  await gotoApp(page, '/mazes?size=small&seed=abc');
  await expect(page.getByRole('dialog', { name: 'The grid' })).toBeVisible();
  await expect(stats(page)).toHaveText(/^0 steps$/);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'What the colors mean' })).toBeVisible();
  // Stack cells on the grid, so the step has something to point at.
  await expect(stats(page)).not.toHaveText(/^0 steps$/);
});
