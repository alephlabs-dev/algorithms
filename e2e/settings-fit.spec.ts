import { test, expect } from '@playwright/test';
import { gotoApp } from './goto';
import { hasSettingsPanel, SMALLEST } from './settings';

// Runs on every device project. UX.md rule 14: controls never scroll. At the smallest size of
// each layout, every module page's settings fit their container (marked data-settings) on screen.

const PAGES = [
  '/sorting/insertion-sort',
  '/sorting/race',
  '/pathfinding',
  '/pathfinding/race',
  '/graphs',
  '/graphs/race',
  '/fourier',
  '/fourier/epicycles',
  '/structures',
  '/structures/race',
  '/dynamic-programming',
  '/dynamic-programming/knapsack',
  '/dynamic-programming/race',
  '/backtracking',
  '/backtracking/sudoku',
  '/mazes',
  '/mazes/race',
  // Spanish runs longer.
  '/es/sorting/insertion-sort',
  '/es/pathfinding',
  '/es/fourier/epicycles',
  '/es/mazes',
];

const TOUR_KEYS = ['tour-done', ...['pathfinding', 'graphs', 'fourier', 'structures', 'dp', 'backtracking', 'mazes'].map((m) => `tour-done-${m}`)];

for (const path of PAGES) {
  test(`settings fit without scrolling on ${path}`, async ({ page }, testInfo) => {
    await page.setViewportSize(SMALLEST[testInfo.project.name]);
    await page.addInitScript((keys) => keys.forEach((k) => localStorage.setItem(k, 'true')), TOUR_KEYS);
    await gotoApp(page, path);

    if (!hasSettingsPanel(testInfo)) await page.getByRole('button', { name: /^(Settings|Ajustes):/ }).click();
    const settings = page.locator('[data-settings]').filter({ visible: true });
    await expect(settings).toHaveCount(1);
    // Let a sheet finish sliding in.
    await page.waitForTimeout(500);

    const fit = await settings.evaluate((el) => {
      const box = el.getBoundingClientRect();
      return {
        scroll: el.scrollHeight,
        client: el.clientHeight,
        top: Math.round(box.top),
        bottom: Math.round(box.bottom),
        screen: window.innerHeight,
      };
    });
    expect(fit.scroll, `settings overflow by ${fit.scroll - fit.client}px`).toBeLessThanOrEqual(fit.client);
    expect(fit.top).toBeGreaterThanOrEqual(0);
    expect(fit.bottom).toBeLessThanOrEqual(fit.screen);
  });
}
