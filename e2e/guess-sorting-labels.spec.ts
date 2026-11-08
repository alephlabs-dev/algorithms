import { test, expect } from '@playwright/test';
import { gotoApp } from './goto';

// Runs on every device project. With Guess on, every bar's value is on screen (and in the stage's description),
// so a question about one value can be answered by comparing it with its neighbours.
for (const size of [10, 20]) {
  test(`guess mode shows every bar's value with ${size} items`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
    await gotoApp(page, `/sorting/insertion-sort?size=${size}`);
    const stage = page.locator('[data-tour="bars"] canvas');
    await expect(stage).not.toHaveAccessibleName(/Values left to right/);

    await page.getByRole('button', { name: /Guess mode/ }).click();
    await expect(stage).toHaveAccessibleName(/Values left to right: /);
    const name = (await stage.getAttribute('aria-label')) ?? '';
    const values = name.split('Values left to right: ')[1].split('.')[0].split(', ');
    expect(values).toHaveLength(size);
    for (const v of values) expect(v).toMatch(/^\d+$/);
  });
}
