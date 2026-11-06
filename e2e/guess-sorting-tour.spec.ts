import { test, expect, type Page } from '@playwright/test';

// Runs on every device project. How first-time visitors find Guess mode in sorting:
// the tour has a step about it, and the toggle says "New" until Guess is tried.

/** Walks the first-visit tour until the step titled `title`. */
const tourTo = async (page: Page, title: string) => {
  const tour = page.getByRole('dialog', { name: title });
  for (let k = 0; k < 10 && !(await tour.isVisible()); k++) {
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await expect(tour).toBeVisible();
  return tour;
};

/** The tour's light (the cut-out next to the bubble) sits around the Guess toggle on screen. */
const expectLightOnToggle = async (page: Page) => {
  const toggle = page.locator('[data-tour="game"]:visible');
  const light = page.locator('[role="dialog"][aria-modal="true"]').locator('xpath=preceding-sibling::div[1]');
  await expect
    .poll(async () => {
      const t = await toggle.boundingBox();
      const l = await light.boundingBox();
      if (!t || !l) return false;
      return (
        l.x <= t.x && l.y <= t.y && l.x + l.width >= t.x + t.width && l.y + l.height >= t.y + t.height &&
        l.width < t.width + 40 && l.height < t.height + 40
      );
    })
    .toBe(true);
};

test('the sorting tour points at the Guess toggle', async ({ page }) => {
  await page.goto('/sorting/insertion-sort?size=10');
  const step = await tourTo(page, 'A guessing game');
  await expect(step).toContainText('Turn on Guess and playback stops before the key moments to ask what comes next.');
  await expect(step).toContainText('10 or 20 items');
  await expectLightOnToggle(page);
});

test('with 40 items the tour still points at the Guess toggle and says when it plays', async ({ page }) => {
  await page.goto('/sorting/insertion-sort?size=40');
  const step = await tourTo(page, 'A guessing game');
  await expect(step).toContainText('10 or 20 items');
  await expectLightOnToggle(page);
});

test('the sorting Guess toggle says "New" until Guess is tried', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
  await page.goto('/sorting/insertion-sort?size=10');

  const toggle = page.getByRole('button', { name: /Guess mode/ });
  await expect(toggle).toHaveAccessibleName(/^New: Guess mode/);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle).toHaveAccessibleName(/^Guess mode on/);

  // Tried once is enough, even after turning it off and coming back.
  await toggle.click();
  await expect(toggle).toHaveAccessibleName(/^Guess mode:/);
  await page.reload();
  await expect(toggle).toHaveAccessibleName(/^Guess mode:/);
});

test('with 40 items the toggle hides "New" until Guess can actually be tried', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
  await page.goto('/sorting/insertion-sort?size=40');

  const toggle = page.getByRole('button', { name: /Guess mode/ });
  await expect(toggle).toHaveAccessibleName(/^Guess mode unavailable/);
  // Tapping it only says why it's off: that's not trying Guess.
  await toggle.click();
  await expect(page.getByText('Guess works with 10 or 20 items.')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: /^Settings:/ }).click();
  const size = page.getByRole('slider', { name: 'Array size' });
  await size.focus();
  await size.press('Home');
  await expect(size).toHaveAttribute('aria-valuetext', '10 items');
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAccessibleName(/^New: Guess mode/);
});
