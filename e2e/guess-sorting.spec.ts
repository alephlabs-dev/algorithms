import { test, expect } from '@playwright/test';

// Runs on every device project. Guess mode in sorting: turn it on, play until it asks, answer, and the score counts it.
test('sorting guess mode asks, takes an answer and keeps score', async ({ page }) => {
  // Skip the first-visit tour, which would cover the stage.
  await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
  await page.goto('/sorting/insertion-sort?size=10&speed=16x');

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

test('sorting guess mode is unavailable with more than 20 items', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
  await page.goto('/sorting/insertion-sort?size=40');

  const toggle = page.getByRole('button', { name: /Guess mode/ });
  await expect(toggle).toHaveAttribute('aria-disabled', 'true');
  await expect(toggle).toHaveAccessibleName(/Guess works with 10 or 20 items/);
});
