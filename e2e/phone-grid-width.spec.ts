import { test, expect, type Locator, type Page } from '@playwright/test';
import { gotoApp } from './goto';
import { skipTours } from './modules';

// Phones only (#198). A grid stage spans the stage's width, also when the stage is as short
// as in real iPhone Safari with its bars showing, at every grid size.

// eslint-disable-next-line no-empty-pattern -- Playwright needs the fixtures argument to reach testInfo
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'iphone', 'phones only');
});

/** Safari with its bars (393 × 660) and DevTools' full iPhone screen (393 × 852). */
const VIEWPORTS = [
  { width: 393, height: 660 },
  { width: 393, height: 852 },
];

const pages = [
  { module: 'pathfinding', url: (size: string) => `/pathfinding?grid=${size}` },
  { module: 'mazes', url: (size: string) => `/mazes?size=${size}&seed=abc` },
];

const canvas = (page: Page) => page.locator('[data-tour="bars"] canvas');

/** The columns the stage's label names ("… a 7 by 11 grid"). */
const columnsOf = async (grid: Locator) => {
  const [, cols] = (await grid.getAttribute('aria-label'))!.match(/(\d+) (?:by|por) (\d+)/)!.slice(1).map(Number);
  return cols;
};

/**
 * How wide the painted grid is in CSS pixels, from its leftmost to its rightmost painted pixel
 * (every fourth pixel row is plenty: a cell is many rows tall).
 */
const paintedWidth = (grid: Locator) =>
  grid.evaluate((el: HTMLCanvasElement) => {
    const { data, width, height } = el.getContext('2d')!.getImageData(0, 0, el.width, el.height);
    let left = width;
    let right = -1;
    for (let y = 0; y < height; y += 4)
      for (let x = 0; x < width; x++)
        if (data[(y * width + x) * 4 + 3] > 0) {
          left = Math.min(left, x);
          right = Math.max(right, x);
        }
    return right < left ? 0 : (right - left + 1) / (el.width / el.getBoundingClientRect().width);
  });

/** Opens a page at a viewport with the tours done, collecting page errors. */
const open = async (page: Page, viewport: (typeof VIEWPORTS)[number], url: string) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize(viewport);
  await skipTours(page);
  await gotoApp(page, url);
  return errors;
};

for (const viewport of VIEWPORTS)
  for (const { module, url } of pages)
    for (const size of ['small', 'medium', 'large'])
      test(`${module} ${size} spans the stage's width at ${viewport.width}×${viewport.height}`, async ({ page }) => {
        const errors = await open(page, viewport, url(size));
        const grid = canvas(page);
        const stage = (await grid.boundingBox())!.width;
        // The grid is laid out again once the stage is measured, and its colors ease in.
        await expect
          .poll(async () => stage - (await paintedWidth(grid)) < stage / (await columnsOf(grid)), { timeout: 5000 })
          .toBe(true);
        expect(errors).toEqual([]);
      });

test('a pathfinding link from the old 13 × 11 phone grid still opens it', async ({ page }) => {
  // No walls; start and target on its middle row.
  const cells = Buffer.alloc(Math.ceil((13 * 11) / 4)).toString('base64url');
  const errors = await open(
    page,
    VIEWPORTS[0],
    `/pathfinding?grid=small&cells=${cells}&from=${(67).toString(36)}&to=${(75).toString(36)}&speed=8x`,
  );
  await expect(canvas(page)).toHaveAttribute('aria-label', /on a 13 by 11 grid/);
  await expect.poll(() => paintedWidth(canvas(page))).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('[data-tour="narration"]:visible')).toContainText(/found|Found/, { timeout: 20_000 });
  expect(errors).toEqual([]);
});

test("a mazes link from before carves a whole maze at this stage's shape", async ({ page }) => {
  const errors = await open(page, VIEWPORTS[0], '/mazes?size=small&seed=abc&speed=8x');
  await expect.poll(() => paintedWidth(canvas(page))).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('[data-tour="narration"]:visible')).toContainText(/^Done: a perfect maze/, { timeout: 20_000 });
  expect(errors).toEqual([]);
});
