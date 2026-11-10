import { test, expect, type Page } from '@playwright/test';
import { gotoApp } from './goto';

// #116, #140: pages arrive prerendered and React hydrates that HTML a moment
// after load. A tap in between must not be lost. Here React's first render is
// held back on purpose, so the gap is wide on every run.

/** Holds back React's first scheduled render (React schedules work through MessageChannel). */
const delayFirstRender = (page: Page) =>
  page.addInitScript(() => {
    const post = MessagePort.prototype.postMessage;
    let delayed = false;
    MessagePort.prototype.postMessage = function (this: MessagePort, ...args: Parameters<typeof post>) {
      if (delayed) return post.apply(this, args);
      delayed = true;
      setTimeout(() => post.apply(this, args), 1500);
    } as typeof post;
  });

test('an explanation opens even when the app renders late', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
  await delayFirstRender(page);
  await gotoApp(page, '/sorting/insertion-sort');

  const how = page.locator('#about details').filter({ has: page.getByRole('heading', { level: 2, name: 'How Insertion Sort works' }) });
  await how.scrollIntoViewIfNeeded();
  await how.locator('summary').click();
  await expect(how).toHaveJSProperty('open', true);
  await expect(how.locator(':scope > div')).toBeVisible();
});
