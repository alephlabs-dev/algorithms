import { test, expect } from '@playwright/test';
import { gotoApp } from './goto';
import { openSettings } from './settings';

// Runs on every device project. Guess mode in sorting: turn it on, play until it asks, answer, and the score counts it.
test('sorting guess mode asks, takes an answer and keeps score', async ({ page }) => {
  // Skip the first-visit tour, which would cover the stage.
  await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
  await gotoApp(page, '/sorting/insertion-sort?size=10&speed=8x');

  const toggle = page.getByRole('button', { name: /Guess mode/ });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Play', exact: true }).click();

  const question = page.getByRole('dialog', { name: 'Your guess' });
  await expect(question).toBeVisible();
  await expect(question).toContainText('How many places does it move left?');
  await question.getByRole('button').first().click();

  await expect(page.getByRole('status', { name: 'How it went' })).toBeVisible();
  await expect(toggle).toHaveAccessibleName(/out of 1\b/);
});

test('sorting guess mode goes quiet with more than 20 items, and a tap says why', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
  await gotoApp(page, '/sorting/insertion-sort?size=10&speed=8x');

  const toggle = page.getByRole('button', { name: /Guess mode/ });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');

  // Switch to 40 items while guess mode is on.
  await openSettings(page, testInfo);
  const size = page.getByRole('slider', { name: 'Array size' });
  await size.focus();
  await size.press('ArrowRight');
  await size.press('ArrowRight');
  await expect(size).toHaveAttribute('aria-valuetext', '40 items');
  await page.keyboard.press('Escape');

  await expect(toggle).toHaveAccessibleName(/Guess mode unavailable: Guess works with 10 or 20 items/);
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');

  // Playing through asks nothing.
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Replay', exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('dialog', { name: 'Your guess' })).toHaveCount(0);

  // Touch screens don't show the title: tapping the toggle shows the reason.
  await toggle.click();
  await expect(page.getByText('Guess works with 10 or 20 items.')).toBeVisible();
  expect(errors).toEqual([]);
});
