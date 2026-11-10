import { expect, type Page } from '@playwright/test';

/**
 * Opens a page and waits until the app is live. Pages arrive prerendered and
 * React hydrates that HTML in place (#140), but the stage only mounts after
 * that, and the page's controls only respond once it has (#116). Use this
 * instead of `page.goto`.
 */
export const gotoApp = async (page: Page, url: string) => {
  // eslint-disable-next-line no-restricted-syntax -- the one place that may call it
  await page.goto(url);
  await expect(page.locator('html[data-ready]')).toBeAttached();
};
