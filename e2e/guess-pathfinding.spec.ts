import { test, expect } from '@playwright/test';
import { gotoApp } from './goto';
import { openGrid } from './grids';

// Runs on every device project. Guess mode in pathfinding: which lettered cell the search visits next.
test('BFS guess mode marks four cells, takes a tap on one and keeps score', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-pathfinding', 'true'));
  const { rows, cols, start, query } = openGrid(testInfo);
  await gotoApp(page, `/pathfinding/breadth-first-search?${query}&speed=8x`);

  const toggle = page.getByRole('button', { name: /Guess mode/ });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  const stage = page.locator('[data-tour="bars"]');
  const before = await stage.boundingBox();
  const play = page.getByRole('button', { name: 'Play', exact: true });
  await play.click();

  const question = page.getByRole('dialog', { name: 'Your guess' });
  await expect(question).toContainText('Which cell will the search visit next?');
  if (testInfo.project.name === 'iphone') {
    // Phones: the question takes the dock's place, and the stage keeps its size.
    await expect(play).toBeHidden();
    expect((await stage.boundingBox())?.height).toBe(before?.height);
  }
  for (const letter of ['A', 'B', 'C', 'D'])
    await expect(question.getByRole('button', { name: letter, exact: true })).toBeVisible();
  const grid = page.getByRole('img', { name: /Marked cells: A: row \d+, column \d+;/ });
  await expect(grid).toBeVisible();

  // D is the start's right-hand neighbour, still one step away; tap it on the grid itself.
  const box = (await grid.boundingBox())!;
  const size = Math.max(4, Math.floor(Math.min(box.width / cols, box.height / rows)));
  const left = Math.floor((box.width - size * cols) / 2);
  const top = Math.floor((box.height - size * rows) / 2);
  const d = start + 1;
  await page.mouse.click(box.x + left + ((d % cols) + 0.5) * size, box.y + top + (Math.floor(d / cols) + 0.5) * size);

  const status = page.getByRole('status', { name: 'How it went' });
  await expect(status).toContainText('Right. BFS takes the nearest ring first. D is 1 step from the start; A, B and C are 2.');
  await expect(toggle).toHaveAccessibleName(/1 right out of 1\b/);
  // Answered: the dock is back, playing on.
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

// Guess mode plays where cells are big enough for its letters on screen (14px on sharp screens, 16px
// otherwise), whatever the grid size. Phones keep the whole stage: the question takes the dock's place.
const tooSmall: Record<string, string | null> = {
  // 393 × 659, 3×: the medium grid's cells are 10px.
  iphone: 'medium',
  // Both iPads (2×) still have 15px cells or more on the big grid.
  ipad: null,
  'ipad-landscape': null,
  // 1×: the big grid's cells are 13px.
  desktop: 'large',
};

test('where cells are too small, one tap switches to the small grid with guess mode on', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-pathfinding', 'true'));
  const grid = tooSmall[testInfo.project.name];
  const toggle = page.getByRole('button', { name: /Guess mode/ });

  if (grid === null) {
    // The big grid plays here.
    await gotoApp(page, '/pathfinding/breadth-first-search?grid=large');
    await expect(toggle).toHaveAccessibleName(/Guess mode: it stops to ask/);
    expect(errors).toEqual([]);
    return;
  }

  await gotoApp(page, `/pathfinding/breadth-first-search?grid=${grid}`);
  await expect(toggle).toHaveAccessibleName('Guess mode unavailable: Guess needs bigger cells: pick a smaller grid');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  // Touch screens don't show the title: tapping the toggle shows the reason, and the way out.
  await toggle.click();
  await expect(page.getByText('Guess needs bigger cells: pick a smaller grid.')).toBeVisible();
  await page.getByRole('button', { name: 'Switch to the small grid' }).click();

  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/grid=small/);
  expect(errors).toEqual([]);
});

test('the pathfinding tour ends on the guessing game', async ({ page }) => {
  await gotoApp(page, '/pathfinding/breadth-first-search');
  const step = page.getByRole('dialog', { name: 'A guessing game' });
  for (let k = 0; k < 10 && !(await step.isVisible()); k++) {
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await expect(step).toContainText('which of four lettered cells the search visits next');
});
