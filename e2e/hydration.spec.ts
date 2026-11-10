import { test, expect, type Page } from '@playwright/test';
import { gotoApp } from './goto';

// Runs on every device project. Pages arrive prerendered and React hydrates
// that HTML in place instead of replacing it (#140): a tap that lands before
// the app's JavaScript has loaded is never lost, and nothing is thrown away.

type Held = { held?: Element; article?: Element };

/** Console and page errors and warnings, from the moment it's called. */
const errorsOn = async (page: Page) => {
  // Vercel serves /_vercel/* (Analytics) only in deployments; vite preview returns 404.
  await page.route('**/_vercel/**', (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') errors.push(`${message.type()}: ${message.text()} ${message.location().url}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
};

test('a tap before the app loads stays open, on the same node', async ({ page, hasTouch }) => {
  await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
  const errors = await errorsOn(page);

  // Hold the app's JavaScript back until the tap is done.
  let release = () => {};
  const released = new Promise<void>((resolve) => (release = resolve));
  await page.route(/\/assets\/.*\.js$/, async (route) => {
    await released;
    await route.continue();
  });

  // eslint-disable-next-line no-restricted-syntax -- the point is to act before the app is live
  await page.goto('/sorting/insertion-sort', { waitUntil: 'commit' });
  const how = page.locator('#about details').filter({ has: page.getByRole('heading', { level: 2, name: 'How Insertion Sort works' }) });
  await expect(how).toBeAttached();
  await how.evaluate((el) => {
    const w = window as unknown as Held;
    w.held = el;
    w.article = document.getElementById('about')!;
  });

  await how.scrollIntoViewIfNeeded();
  const summary = how.locator('summary');
  await (hasTouch ? summary.tap() : summary.click());
  await expect(how).toHaveJSProperty('open', true);
  await expect(page.locator('html[data-ready]'), 'the app is still held back').not.toBeAttached();

  release();
  await expect(page.locator('html[data-ready]')).toBeAttached();
  await expect(page.locator('#stage main')).toBeVisible();

  await expect(how).toHaveJSProperty('open', true);
  await expect(how.locator(':scope > div')).toBeVisible();
  const kept = await how.evaluate((el) => {
    const w = window as unknown as Held;
    return { details: el === w.held, article: document.getElementById('about') === w.article };
  });
  expect(kept, 'the prerendered nodes are the live ones').toEqual({ details: true, article: true });
  expect(errors).toEqual([]);
});

for (const path of ['/', '/sorting', '/sorting/insertion-sort', '/sorting/race', '/es/pathfinding/a-star']) {
  test(`${path} hydrates without errors and keeps the prerendered ids`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
    const errors = await errorsOn(page);
    const prerendered = await (await page.request.get(path)).text();

    await gotoApp(page, path);

    expect(errors).toEqual([]);
    // Every id outside the stage (including React's useId ids) is the one the prerender wrote.
    const ids = await page.evaluate((html) => {
      const idsIn = (root: Element) =>
        [...root.querySelectorAll('[id]')].filter((el) => !el.parentElement?.closest('#stage')).map((el) => el.id);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return { prerendered: idsIn(doc.getElementById('root')!), live: idsIn(document.getElementById('root')!) };
    }, prerendered);
    expect(ids.prerendered.length).toBeGreaterThan(0);
    expect(ids.live).toEqual(ids.prerendered);
  });
}
