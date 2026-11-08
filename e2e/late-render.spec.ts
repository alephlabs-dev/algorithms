import { test, expect, type Page } from '@playwright/test';
import { gotoApp } from './goto';

// #116: pages arrive prerendered, and React replaces that HTML with its own
// render a moment after load. A test that grabs an element in between holds a
// node that is about to be thrown away. Here React's first render is held back
// on purpose, so the gap is wide on every run.

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

  const how = page.locator('#about').getByRole('heading', { level: 2 }).getByRole('button', { name: 'How Insertion Sort works' });
  const panel = page.locator(`[id="${await how.getAttribute('aria-controls')}"]`);
  await how.scrollIntoViewIfNeeded();
  await how.click();
  await expect(how).toHaveAttribute('aria-expanded', 'true');
  await expect(panel).toBeVisible();
});
