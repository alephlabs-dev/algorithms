import { test, expect, type Page } from '@playwright/test';
import { gotoApp } from './goto';
import { SMALLEST } from './settings';

// Runs on every device project. The algorithm picker on phones and tablets (UX.md rule 11, #195): a field
// that opens a drawer with the same grouped list as the desktop popover. No module shows its algorithms
// inline as segments.

const modules: { route: string; tourKey: string; tour: string | null }[] = [
  { route: '/sorting/insertion-sort', tourKey: 'tour-done', tour: 'Pick an algorithm' },
  { route: '/graphs', tourKey: 'tour-done-graphs', tour: 'Pick an algorithm' },
  { route: '/pathfinding', tourKey: 'tour-done-pathfinding', tour: 'Pick a search' },
  { route: '/structures', tourKey: 'tour-done-structures', tour: 'Pick a structure' },
  { route: '/fourier', tourKey: 'tour-done-fourier', tour: 'Pick a series' },
  { route: '/dynamic-programming', tourKey: 'tour-done-dp', tour: 'Pick a problem' },
  { route: '/backtracking', tourKey: 'tour-done-backtracking', tour: null },
  { route: '/mazes', tourKey: 'tour-done-mazes', tour: null },
];
const languages = [
  { prefix: '', name: 'Algorithm', lang: 'en' },
  { prefix: '/es', name: 'Algoritmo', lang: 'es' },
] as const;

/** The phone and tablet bar is on screen (below lg). */
const phoneBar = (page: Page) => page.evaluate(() => !matchMedia('(min-width: 1024px)').matches);

for (const m of modules) {
  for (const l of languages) {
    test(`${l.prefix}${m.route} picks the algorithm from a drawer`, async ({ page }, testInfo) => {
      await page.setViewportSize(SMALLEST[testInfo.project.name]);
      await page.addInitScript((key) => localStorage.setItem(key, 'true'), m.tourKey);
      await gotoApp(page, `${l.prefix}${m.route}`);
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

  const tour = m.tour;
  if (!tour) continue;
  test(`the tour's first step on ${m.route} lights the picker on screen`, async ({ page }) => {
    await gotoApp(page, m.route);
    await expect(page.getByRole('dialog', { name: tour })).toBeVisible();
    const picker = page.locator('[data-tour="picker"]:visible');
    const light = page.locator('[role="dialog"][aria-modal="true"]').locator('xpath=preceding-sibling::div[1]');
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
