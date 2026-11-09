import type { TestInfo } from '@playwright/test';

/**
 * A small pathfinding grid with no walls, the same on every run, so guess mode always has
 * something to ask. Phones and iPad portrait get an upright 13 × 11 grid, wider screens
 * 11 × 21; start and target sit on the middle row, as on a new grid.
 */
export const openGrid = (testInfo: TestInfo) => {
  const narrow = ['iphone', 'ipad'].includes(testInfo.project.name);
  const [rows, cols] = narrow ? [13, 11] : [11, 21];
  const mid = Math.floor(rows / 2);
  const inset = Math.max(1, Math.floor(cols / 6));
  const start = mid * cols + inset;
  const end = mid * cols + cols - 1 - inset;
  const cells = Buffer.alloc(Math.ceil((rows * cols) / 4)).toString('base64url');
  return { rows, cols, start, query: `grid=small&cells=${cells}&from=${start.toString(36)}&to=${end.toString(36)}` };
};
