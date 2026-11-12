import { test, expect } from '@playwright/test';
import { gotoApp } from './goto';
import { isModuleTranslated, MODULES, routePath, routesOf, skipTours } from './modules';
import { hasSettingsPanel, SMALLEST } from './settings';

// Runs on every device project. UX.md rule 14: controls never scroll. At the smallest size of
// each layout, every module page's settings fit their container (marked data-settings) on screen.

// Every page of every module, from the manifests: settings can differ by algorithm (a DP problem, a
// Fourier series or epicycles). Spanish runs longer, so translated modules are checked in Spanish too.
const PAGES = MODULES.flatMap((module) =>
  routesOf(module).flatMap((route) => {
    const path = routePath(route);
    return isModuleTranslated(module) ? [path, `/es${path}`] : [path];
  }),
);

for (const path of PAGES) {
  test(`settings fit without scrolling on ${path}`, async ({ page }, testInfo) => {
    await page.setViewportSize(SMALLEST[testInfo.project.name]);
    await skipTours(page);
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
