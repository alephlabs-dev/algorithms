import { test, expect } from '@playwright/test';
import { gotoApp } from './goto';

// Runs on every device project. The landing header: one row at every size, and its
// "Modules" link takes you to the module list further down the page (#85).
for (const { path, modules } of [
  { path: '/', modules: 'Modules' },
  { path: '/es', modules: 'Módulos' },
]) {
  test(`landing header fits on one row and links to the modules (${path})`, async ({ page }) => {
    await gotoApp(page, path);

    const header = page.locator('header').first();
    const items = header.locator('a, button');
    await expect(items.first()).toBeVisible();

    // Every item in the header shares one vertical center, so none dropped to a second row.
    const centers = await items.evaluateAll((els) =>
      els
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.height > 0)
        .map((r) => r.top + r.height / 2),
    );
    expect(centers.length, 'visible header items').toBeGreaterThanOrEqual(5);
    expect(Math.max(...centers) - Math.min(...centers), 'spread of item centers in px').toBeLessThanOrEqual(4);

    const list = page.getByRole('heading', { level: 2, name: modules });
    await header.getByRole('link', { name: modules, exact: true }).click();
    await expect(page).toHaveURL(/#modules$/);
    // The list's heading lands at the top of the screen, whole, with a small margin above it.
    await expect(list).toBeInViewport({ ratio: 1 });
    const top = await list.evaluate((el) => el.getBoundingClientRect().top);
    expect(top, 'heading distance from the top in px').toBeGreaterThan(0);
    expect(top, 'heading distance from the top in px').toBeLessThanOrEqual(48);
  });
}
