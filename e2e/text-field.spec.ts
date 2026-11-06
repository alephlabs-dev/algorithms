import { test, expect, type Locator, type Page } from '@playwright/test';

// Runs on every device project. Text fields are ui/TextField (UX.md rule 12, #98): a label you can see
// above the field, an error linked to it, numbers typed as text, and 16px text on touch screens.

const coarse = (page: Page) => page.evaluate(() => matchMedia('(pointer: coarse)').matches);

const fontSize = (field: Locator) => field.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

/** The text of the elements a field's aria-describedby points at. */
const description = async (page: Page, field: Locator) => {
  const ids = (await field.getAttribute('aria-describedby'))?.split(' ') ?? [];
  const texts = await Promise.all(ids.map((id) => page.locator(`[id="${id}"]`).innerText()));
  return texts.join(' ');
};

test('the structure value is a labelled number field that says what is wrong', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tour-done-structures', 'true'));
  await page.goto('/structures/avl-tree');

  const bar = page.getByRole('form', { name: 'Operations' });
  const field = bar.getByRole('textbox', { name: 'Value' });
  await expect(bar.getByText('Value', { exact: true })).toBeVisible();
  await expect(field).toHaveAttribute('type', 'text');
  await expect(field).toHaveAttribute('inputmode', 'numeric');
  if (await coarse(page)) expect(await fontSize(field), 'font size on touch').toBeGreaterThanOrEqual(16);

  // Not a number: the bar says so, next to the field.
  await field.fill('4a');
  await bar.getByRole('button', { name: 'Insert' }).click();
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  expect(await description(page, field)).toBe('A whole number from 1 to 99');

  // Typing again clears it.
  await field.fill('42');
  await expect(field).not.toHaveAttribute('aria-invalid');
  expect(await description(page, field)).toBe('');

  // Out of range: the field checks it as soon as the learner leaves it.
  await field.fill('120');
  await field.blur();
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  await expect(bar.getByRole('alert')).toHaveText('A whole number from 1 to 99');
});

test('each DP word says on its own when it is missing', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tour-done-dp', 'true'));
  await page.goto('/dynamic-programming/edit-distance');

  const words = page.getByRole('form', { name: 'Words' });
  // A short visible label; screen readers also hear which side of the table the word goes on.
  const first = words.getByRole('textbox', { name: 'First word (down the side)', exact: true });
  const second = words.getByRole('textbox', { name: 'Second word (across the top)', exact: true });
  await expect(first).toBeVisible();
  await expect(second).toBeVisible();
  await expect(words.locator('label', { hasText: 'First word' })).toBeVisible();
  if (await coarse(page)) expect(await fontSize(first), 'font size on touch').toBeGreaterThanOrEqual(16);

  await first.fill('');
  await words.getByRole('button', { name: 'Compare' }).click();
  await expect(first).toHaveAttribute('aria-invalid', 'true');
  expect(await description(page, first)).toBe('Letters only, up to 10');
  await expect(second).not.toHaveAttribute('aria-invalid');
});
