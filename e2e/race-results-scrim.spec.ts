import { test, expect, type Page } from '@playwright/test';

// The race results veil hides the lanes and takes their taps, so it's a backdrop: its fill is
// the --color-scrim token (UX.md rule 13), in both themes, on every module's race page.

/** The color --color-scrim resolves to, read the same way the browser reads the veil's. */
const resolvedScrim = (page: Page) =>
  page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.backgroundColor = 'var(--color-scrim)';
    document.body.append(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  });

const races = [
  '/sorting/race?size=10&speed=8x&race=insertion,quick',
  '/pathfinding/race?speed=8x',
];

for (const theme of ['light', 'dark'] as const) {
  for (const url of races) {
    test(`race results veil uses the scrim token (${theme}, ${url.split('?')[0]})`, async ({ page }, info) => {
      // The color comes from the theme, not the device: one project is enough.
      test.skip(info.project.name !== 'desktop', 'desktop only');
      // The app picks its theme from localStorage, not the system setting.
      await page.addInitScript((t) => {
        localStorage.setItem('tour-done', 'true');
        localStorage.setItem('theme', t);
      }, theme);
      await page.goto(url);
      // Dark is the default and has no attribute; light sets data-theme="light".
      if (theme === 'light') await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      else await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'light');
      await page.getByRole('button', { name: 'Play', exact: true }).click();

      const card = page.getByRole('status', { name: 'Race results' });
      await expect(card).toBeVisible({ timeout: 30_000 });
      const veil = card.locator('..');
      const scrim = await resolvedScrim(page);
      expect(scrim).not.toBe('rgba(0, 0, 0, 0)');
      expect(await veil.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(scrim);
    });
  }
}
