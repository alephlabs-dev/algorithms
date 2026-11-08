import { test, expect, type Locator, type Page } from '@playwright/test';

// Runs on every device project. A page link switches pages in the app and puts the new
// page at the top: at once when the learner asked for reduced motion, gliding otherwise (#90).

/** Scrolls the landing down to its last module and returns that module's link. */
const scrolledToLastModule = async (page: Page) => {
  await page.goto('/');
  // Module cards are the links with a heading inside.
  const link = page.locator('a[href]').filter({ has: page.locator('h3') }).last();
  await link.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => window.scrollY), 'scrolled down before the click').toBeGreaterThan(0);
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

test('with reduced motion, a page link puts the new page at the top at once', async ({ page }) => {
  const link = await scrolledToLastModule(page);
  const path = new URL(await link.evaluate((a: HTMLAnchorElement) => a.href)).pathname;

  expect(await scrollYOneFrameAfterClick(link), 'scrollY one frame after the click').toBe(0);
  await expect(page).toHaveURL((url) => url.pathname === path);
});

test.describe('without reduced motion', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('a page link still glides to the top', async ({ page }) => {
    const link = await scrolledToLastModule(page);

    expect(await scrollYOneFrameAfterClick(link), 'scrollY one frame after the click').toBeGreaterThan(0);
    await expect.poll(() => page.evaluate(() => window.scrollY), { message: 'scrollY after the glide' }).toBe(0);
  });
});

test('a modified click leaves the current page alone', async ({ page }) => {
  const link = await scrolledToLastModule(page);
  const before = { url: page.url(), scrollY: await page.evaluate(() => window.scrollY) };

  // A ⌘/Ctrl-click is the browser's to handle (a new tab), so the app must not take it over.
  // The window listener runs after the app's and cancels the new tab, so the test stays on this page.
  const handledByApp = await link.evaluate(
    (a: HTMLAnchorElement) =>
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
        a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true, ctrlKey: true }));
      }),
  );

  expect(handledByApp, 'the app took over the modified click').toBe(false);
  expect(page.url()).toBe(before.url);
  expect(await page.evaluate(() => window.scrollY)).toBe(before.scrollY);
});
