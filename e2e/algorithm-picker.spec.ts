import { test, expect, type Page } from '@playwright/test';
import { gotoApp } from './goto';
import { algorithmsOf, isModuleTranslated, MODULES, routePath, skipTours, startOf } from './modules';
import { SMALLEST } from './settings';

// Runs on every device project. The algorithm picker on phones and tablets (UX.md rule 11, #195): a field
// that opens a drawer with the same grouped list as the desktop popover. No module shows its algorithms
// inline as segments.

// Every module with two algorithms or more, from the manifests.
const modules = MODULES.filter((module) => algorithmsOf(module).length >= 2);
const languages = [
  { prefix: '', name: 'Algorithm', lang: 'en' },
  { prefix: '/es', name: 'Algoritmo', lang: 'es' },
] as const;

/** The phone and tablet bar is on screen (below lg). */
const phoneBar = (page: Page) => page.evaluate(() => !matchMedia('(min-width: 1024px)').matches);

for (const module of modules) {
  const route = routePath(startOf(module));
  for (const l of languages) {
    if (l.lang === 'es' && !isModuleTranslated(module)) continue;
    test(`${l.prefix}${route} picks the algorithm from a drawer`, async ({ page }, testInfo) => {
      await page.setViewportSize(SMALLEST[testInfo.project.name]);
      await skipTours(page);
      await gotoApp(page, `${l.prefix}${route}`);
      await expect(page.locator('html')).toHaveAttribute('lang', l.lang);
      test.skip(!(await phoneBar(page)), 'the phone and tablet bar only');

      await expect(page.getByRole('radiogroup', { name: l.name, exact: true })).toHaveCount(0);
      const field = page.getByRole('button', { name: new RegExp(`^${l.name}:`) });
      await expect(field).toBeVisible();
      const before = await field.getAttribute('aria-label');

      await field.click();
      const drawer = page.getByRole('dialog', { name: l.name, exact: true });
      const list = drawer.getByRole('listbox', { name: l.name, exact: true });
      await expect(list).toBeVisible();
      await expect(list.getByRole('option', { selected: true })).toHaveCount(1);
      await expect(list.getByRole('option', { selected: true })).toBeFocused();

      // The whole list fits the drawer without scrolling (UX.md rule 14).
      await page.waitForTimeout(500);
      const fit = await drawer.locator('[data-sheet-body]').evaluate((el) => {
        const box = el.getBoundingClientRect();
        return { scroll: el.scrollHeight, client: el.clientHeight, top: box.top };
      });
      expect(fit.scroll, `the list overflows by ${fit.scroll - fit.client}px`).toBeLessThanOrEqual(fit.client);
      expect(fit.top).toBeGreaterThanOrEqual(0);

      // Picking another closes the drawer and puts that algorithm on stage.
      await list.getByRole('option', { selected: false }).first().click();
      await expect(drawer).toBeHidden();
      await expect(field).not.toHaveAttribute('aria-label', before!);
    });
  }

  // Every module with a picker has a tour step that lights it, where it is on screen. Steps are found
  // by the control they light, so this holds for any module.
  test(`the tour lights the picker on screen on ${route}`, async ({ page }) => {
    await gotoApp(page, route);
    const bubble = page.locator('[role="dialog"][aria-modal="true"][data-anchor]');
    await expect(bubble).toBeVisible();
    // Step through to the picker's step; a tour that ends without one fails.
    while ((await bubble.getAttribute('data-anchor')) !== 'picker') {
      const next = bubble.getByRole('button', { name: 'Next', exact: true });
      expect(await next.count(), `the ${module} tour has no step on the picker`).toBe(1);
      await next.click();
    }
    const picker = page.locator('[data-tour="picker"]:visible');
    const light = bubble.locator('xpath=preceding-sibling::div[1]');
    await expect
      .poll(async () => {
        const p = await picker.boundingBox();
        const l = await light.boundingBox();
        if (!p || !l) return false;
        return l.x <= p.x && l.y <= p.y && l.x + l.width >= p.x + p.width && l.y + l.height >= p.y + p.height;
      })
      .toBe(true);
  });
}
