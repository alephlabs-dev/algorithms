import { test, expect, type Page } from '@playwright/test';
import { gotoApp } from './goto';
import { pickGuess } from './guess';
import { openGrid } from './grids';
import { algorithmPageOf, MODULES, routePath, routesOf, skipTours, startOf, type ModuleId } from './modules';

// UX.md: on phones and tablets every visible button, link and form control is at least 44×44 px.
// The hit area counts, not just the visible box: an absolutely positioned ::before/::after can grow it.
// Exempt (UX.md): links inside running text, i.e. inside a <p>.
const MIN = 44;
// The landing page, and each module's start page, one algorithm page and race page, from the manifests.
const pagesOf = (module: ModuleId) => [startOf(module), algorithmPageOf(module), ...routesOf(module).filter((r) => r.page === 'race')];
const routes = ['/', ...MODULES.flatMap(pagesOf).map(routePath)];
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

const TOUCH = ['iphone', 'ipad', 'ipad-landscape'];

/** Every visible control on the page smaller than MIN × MIN, counting a ::before/::after that grows its hit area. */
const smallControls = (page: Page) =>
  page.evaluate(
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

for (const route of routes) {
  test(`tap targets are at least ${MIN}×${MIN} on ${route}`, async ({ page }, info) => {
    test.skip(!TOUCH.includes(info.project.name), 'phones and tablets only');
    await skipTours(page);
    await gotoApp(page, route);
    await page.waitForLoadState('networkidle');
    expect(await smallControls(page), `controls smaller than ${MIN}×${MIN}`).toEqual([]);
  });
}

// Guess mode with a question open: its answer buttons, and whatever else is on screen then.
const guessPages: { name: string; url: (info: Parameters<typeof openGrid>[0]) => string }[] = [
  { name: 'pathfinding', url: (info) => `/pathfinding/breadth-first-search?${openGrid(info).query}&speed=8x` },
  { name: 'sorting', url: () => '/sorting/insertion-sort?size=10&speed=8x' },
  { name: 'N-Queens', url: () => '/backtracking/n-queens?n=4&speed=8x' },
];

for (const { name, url } of guessPages) {
  test(`tap targets are at least ${MIN}×${MIN} with a ${name} guess question open`, async ({ page }, info) => {
    test.skip(!TOUCH.includes(info.project.name), 'phones and tablets only');
    await skipTours(page);
    await gotoApp(page, url(info));
    await pickGuess(page);
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    const question = page.getByRole('dialog', { name: 'Your guess' });
    await expect(question).toBeVisible();
    await expect(question.getByRole('button').first()).toBeVisible();
    expect(await smallControls(page), `controls smaller than ${MIN}×${MIN}`).toEqual([]);
  });
}

// The narrowest phone, in the guess view: the score joins the dock's row of buttons, which shrink to make room.
test(`tap targets are at least ${MIN}×${MIN} in the guess view's dock at 360px`, async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone', 'the narrowest phone, once');
  await page.setViewportSize({ width: 360, height: 780 });
  await skipTours(page);
  await gotoApp(page, '/sorting/insertion-sort?size=10');
  await pickGuess(page);
  await expect(page.getByRole('img', { name: 'Score: 0 right out of 0' })).toBeVisible();
  expect(await smallControls(page), `controls smaller than ${MIN}×${MIN}`).toEqual([]);
});
