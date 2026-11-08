import { test, expect } from '@playwright/test';
import { gotoApp } from './goto';
import { openSettings } from './settings';

// Runs on every device project. Array size is a stepped slider: it snaps to the sizes,
// shows the current one beside it, changes the array live, and keeps the phone and numbers limits.
test('array size slider steps through the sizes and keeps the limits', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
  await gotoApp(page, '/sorting/insertion-sort?size=10');

  await openSettings(page, testInfo);
  const size = page.getByRole('slider', { name: 'Array size' });
  await expect(size).toHaveAttribute('aria-valuetext', '10 items');

  // One step at a time, live: the array (and the link) follow each step.
  await size.focus();
  await size.press('ArrowRight');
  await expect(size).toHaveAttribute('aria-valuetext', '20 items');
  await expect(page).toHaveURL(/size=20/);
  await expect(page.locator('output').filter({ hasText: /^20$/, visible: true })).toBeVisible();

  // Phones stop at 200 bars.
  await size.press('End');
  const max = testInfo.project.name === 'iphone' ? '200' : '400';
  await expect(size).toHaveAttribute('aria-valuetext', `${max} items`);
  await expect(page).toHaveURL(new RegExp(`size=${max}`));

  // Numbers mode only fits 20 tiles (10 on a phone): the slider stops there.
  await page.getByRole('radio', { name: /Numbers/ }).click();
  if (testInfo.project.name === 'iphone') {
    // Only one size fits: the slider shows it, disabled.
    await expect(size).toHaveAttribute('aria-valuetext', '10 items');
    await expect(size).toHaveAttribute('aria-disabled', 'true');
  } else {
    await expect(size).toHaveAttribute('aria-valuetext', '20 items');
    await size.focus();
    await size.press('End');
    await expect(size).toHaveAttribute('aria-valuetext', '20 items');
    await size.press('Home');
    await expect(size).toHaveAttribute('aria-valuetext', '10 items');
  }
});
