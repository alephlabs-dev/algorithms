import { test, expect, type Locator, type Page } from '@playwright/test';
import { gotoApp } from './goto';

// Runs on every device project. A page link switches pages in the app and puts the new
// page at the top: at once when the learner asked for reduced motion, gliding otherwise (#90).

const scrollY = (page: Page) => page.evaluate(() => window.scrollY);

/** Opens the landing, scrolls down to its last module and returns that module's link. */
const scrollToLastModuleLink = async (page: Page) => {
  await gotoApp(page, '/');
  // Module cards are the links with a heading inside.
  const link = page.locator('a[href]').filter({ has: page.locator('h3') }).last();
  await link.scrollIntoViewIfNeeded();
  expect(await scrollY(page), 'scrolled down before the click').toBeGreaterThan(0);
  return link;
};

/** Clicks the link from inside the page and returns window.scrollY one frame later. */
const scrollYOneFrameAfterClick = (link: Locator) =>
  link.evaluate(
    (a: HTMLAnchorElement) =>
      new Promise<number>((resolve) => {
        a.click();
        requestAnimationFrame(() => resolve(window.scrollY));
      }),
  );

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('a page link puts the new page at the top at once', async ({ page }) => {
    const link = await scrollToLastModuleLink(page);
    const path = new URL(await link.evaluate((a: HTMLAnchorElement) => a.href)).pathname;

    expect(await scrollYOneFrameAfterClick(link), 'scrollY one frame after the click').toBe(0);
    await expect(page).toHaveURL((url) => url.pathname === path);
  });
});

test.describe('without reduced motion', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('a page link still glides to the top', async ({ page }) => {
    const link = await scrollToLastModuleLink(page);

    expect(await scrollYOneFrameAfterClick(link), 'scrollY one frame after the click').toBeGreaterThan(0);
    await expect.poll(() => scrollY(page), { message: 'scrollY after the glide' }).toBe(0);
  });
});

for (const modifier of ['metaKey', 'ctrlKey', 'shiftKey'] as const) {
  test(`a click with ${modifier} leaves the current page alone`, async ({ page }) => {
    const link = await scrollToLastModuleLink(page);
    const before = { url: page.url(), scrollY: await scrollY(page) };

    // A modified click is the browser's to handle (a new tab or window), so the app must not take it over.
    // The window listener runs after the app's and cancels the new tab, so the test stays on this page.
    const handledByApp = await link.evaluate(
      (a: HTMLAnchorElement, modifier) =>
        new Promise<boolean>((resolve) => {
          window.addEventListener(
            'click',
            (event) => {
              const taken = event.defaultPrevented;
              event.preventDefault();
              requestAnimationFrame(() => resolve(taken));
            },
            { once: true },
          );
          a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, [modifier]: true }));
        }),
      modifier,
    );

    expect(handledByApp, 'the app took over the modified click').toBe(false);
    expect(page.url()).toBe(before.url);
    expect(await scrollY(page)).toBe(before.scrollY);
  });
}
