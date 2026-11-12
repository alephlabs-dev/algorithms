import { test, expect, type Page } from '@playwright/test';

// Runs on every device project. The landing header's links stay put while the
// app goes live: the theme and language buttons, which come in after hydration,
// fill space the prerendered page already kept for them (#182).

const boxes = (page: Page, names: string[]) =>
  Promise.all(
    names.map(async (name) => {
      const box = await page.locator('header').first().getByRole('link', { name, exact: true }).boundingBox();
      expect(box, `${name} link has a box`).not.toBeNull();
      return box;
    }),
  );

for (const { path, modules } of [
  { path: '/', modules: 'Modules' },
  { path: '/es', modules: 'Módulos' },
]) {
  test(`landing header links keep their place through hydration (${path})`, async ({ page }) => {
    // Hold the app's JavaScript back, so the prerendered page can be measured first.
    let release = () => {};
    const released = new Promise<void>((resolve) => (release = resolve));
    await page.route(/\/assets\/.*\.js$/, async (route) => {
      await released;
      await route.continue();
    });

    // eslint-disable-next-line no-restricted-syntax -- the point is to measure before the app is live
    await page.goto(path, { waitUntil: 'commit' });
    const header = page.locator('header').first();
    await expect(header.getByRole('link', { name: 'GitHub', exact: true })).toBeVisible();
    // The header's fonts, so the first measure isn't in a fallback font. Not `document.fonts.ready`:
    // WebKit holds it until the page has loaded, and the page's scripts are held back.
    await page.evaluate(() =>
      Promise.all(['15px "Instrument Sans Variable"', '12px "JetBrains Mono Variable"'].map((f) => document.fonts.load(f))).then(() => true),
    );
    const names = [modules, 'GitHub'];
    const before = await boxes(page, names);
    await expect(page.locator('html[data-ready]'), 'the app is still held back').not.toBeAttached();

    release();
    await expect(page.locator('html[data-ready]')).toBeAttached();
    await expect(header.getByRole('button', { name: /theme|tema/ })).toBeVisible();

    expect(await boxes(page, names)).toEqual(before);
  });
}
