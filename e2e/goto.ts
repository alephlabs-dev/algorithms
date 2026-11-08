import { expect, type Page } from '@playwright/test';

/**
 * Opens a page and waits until the app has rendered it. Pages arrive
 * prerendered, and React replaces that HTML a moment after load; an element
 * found before then is about to be thrown away (#116). Use this instead of
 * `page.goto`.
 */
export const gotoApp = async (page: Page, url: string) => {
  // eslint-disable-next-line no-restricted-syntax -- the one place that may call it
  await page.goto(url);
  await expect(page.locator('html[data-ready]')).toBeAttached();
};
