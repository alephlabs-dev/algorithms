import { test, expect } from '@playwright/test';

// UX.md: on phones and tablets every visible button, link and form control is at least 44×44 px.
// The hit area counts, not just the visible box: an absolutely positioned ::before/::after can grow it.
// Exempt (UX.md): links inside running text, i.e. inside a <p>.
const MIN = 44;
const routes = [
  '/',
  '/sorting/insertion-sort',
  '/sorting/race',
  '/pathfinding',
  '/graphs',
  '/fourier',
  '/structures',
  '/dynamic-programming',
  '/backtracking',
];
const CONTROLS = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  '[role="button"]',
  '[role="link"]',
  '[role="radio"]',
  '[role="checkbox"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="slider"]',
  '[role="option"]',
].join(',');

for (const route of routes) {
  test(`tap targets are at least ${MIN}×${MIN} on ${route}`, async ({ page }, info) => {
    test.skip(!['iphone', 'ipad', 'ipad-landscape'].includes(info.project.name), 'phones and tablets only');
    await page.addInitScript(() => {
      for (const key of ['tour-done', 'tour-done-pathfinding', 'tour-done-graphs', 'tour-done-fourier', 'tour-done-structures', 'tour-done-dp', 'tour-done-backtracking'])
        localStorage.setItem(key, 'true');
    });
    await page.goto(route);
    await page.waitForLoadState('networkidle');

    const small = await page.evaluate(
      ({ selector, min }) =>
        [...document.querySelectorAll<HTMLElement>(selector)]
          .filter((el) => el.checkVisibility({ opacityProperty: true, visibilityProperty: true }))
          // Links in running text are exempt: they can't grow without breaking the line spacing.
          .filter((el) => !(el.tagName === 'A' && el.closest('p')))
          .map((el) => {
            const rect = el.getBoundingClientRect();
            let width = rect.width;
            let height = rect.height;
            for (const pseudo of ['::before', '::after']) {
              const style = getComputedStyle(el, pseudo);
              if (style.content === 'none' || style.position !== 'absolute') continue;
              width = Math.max(width, parseFloat(style.width) || 0);
              height = Math.max(height, parseFloat(style.height) || 0);
            }
            return { el, box: { width, height } };
          })
          // Visually hidden helpers (sr-only) are 1px: not something anyone taps.
          .filter(({ box }) => box.width > 1 && box.height > 1)
          .filter(({ box }) => box.width < min - 0.5 || box.height < min - 0.5)
          .map(({ el, box }) => {
            const name = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
            return `${el.tagName.toLowerCase()}${el.getAttribute('role') ? `[${el.getAttribute('role')}]` : ''} "${name}" ${Math.round(box.width)}×${Math.round(box.height)}`;
          }),
      { selector: CONTROLS, min: MIN },
    );
    expect(small, `controls smaller than ${MIN}×${MIN}`).toEqual([]);
  });
}
