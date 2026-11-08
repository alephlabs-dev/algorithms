import { test, expect, type TestInfo } from '@playwright/test';
import { gotoApp } from './goto';

/**
 * A small grid with no walls, the same on every run. Phones and iPad portrait get an upright
 * 13 × 11 grid, wider screens 11 × 21; start and target sit on the middle row, as on a new grid.
 */
const openGrid = (testInfo: TestInfo) => {
  const narrow = ['iphone', 'ipad'].includes(testInfo.project.name);
  const [rows, cols] = narrow ? [13, 11] : [11, 21];
  const mid = Math.floor(rows / 2);
  const inset = Math.max(1, Math.floor(cols / 6));
  const start = mid * cols + inset;
  const end = mid * cols + cols - 1 - inset;
  const cells = Buffer.alloc(Math.ceil((rows * cols) / 4)).toString('base64url');
  return { rows, cols, start, query: `grid=small&cells=${cells}&from=${start.toString(36)}&to=${end.toString(36)}` };
};

// Runs on every device project. Guess mode in pathfinding: which lettered cell the search visits next.
test('BFS guess mode marks four cells, takes a tap on one and keeps score', async ({ page }, testInfo) => {
  // Playwright's iPhone is 393 × 659 (Safari's bars taken out): even the small grid's cells are under 16px
  // there with the guess panel open. The next test checks what it says instead.
  test.skip(testInfo.project.name === 'iphone', "the iPhone project's stage is too short for 16px cells");
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-pathfinding', 'true'));
  const { rows, cols, start, query } = openGrid(testInfo);
  await gotoApp(page, `/pathfinding/breadth-first-search?${query}&speed=8x`);

  const toggle = page.getByRole('button', { name: /Guess mode/ });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Play', exact: true }).click();

  const question = page.getByRole('dialog', { name: 'Your guess' });
  await expect(question).toContainText('Which cell will the search visit next?');
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
  expect(errors).toEqual([]);
});

// Guess mode plays where cells are at least 16px on screen with its panel open, whatever the grid size.
const cellRoom: Record<string, { grid: string; why: string | null }> = {
  iphone: { grid: 'small', why: 'Guess needs bigger cells than fit on this screen' },
  // The big grid still has 21px cells on an upright iPad.
  ipad: { grid: 'large', why: null },
  'ipad-landscape': { grid: 'large', why: 'Guess needs bigger cells: pick a smaller grid' },
  desktop: { grid: 'large', why: 'Guess needs bigger cells: pick a smaller grid' },
};

test('guess mode plays by cell size on screen, and says what to try when cells are too small', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-pathfinding', 'true'));
  const { grid, why } = cellRoom[testInfo.project.name];
  await gotoApp(page, `/pathfinding/breadth-first-search?grid=${grid}`);

  const toggle = page.getByRole('button', { name: /Guess mode/ });
  if (why === null) {
    await expect(toggle).toHaveAccessibleName(/Guess mode: it stops to ask/);
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  } else {
    await expect(toggle).toHaveAccessibleName(`Guess mode unavailable: ${why}`);
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    // Touch screens don't show the title: tapping the toggle shows the reason.
    await toggle.click();
    await expect(page.getByText(`${why}.`)).toBeVisible();
  }
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
