import { test, expect, type Locator, type Page } from '@playwright/test';
import { gotoApp } from './goto';
import { hasSettingsPanel, openSettings, SMALLEST } from './settings';

// Runs on every device project. Every select opens our own list, never the OS one (UX.md rule 11, #195):
// beside the stage (iPad landscape, desktop) a popover; inside the settings sheet (phones, iPad portrait)
// the sheet slides to the list in place, with "‹ Back" and ✕, never a second sheet.

const TOUR_KEYS = ['tour-done', 'tour-done-fourier'];

const open = async (page: Page, path: string) => {
  const project = test.info().project.name;
  await page.setViewportSize(SMALLEST[project]);
  await page.addInitScript((keys) => keys.forEach((k) => localStorage.setItem(k, 'true')), TOUR_KEYS);
  await gotoApp(page, path);
};

/** The list fits its container without scrolling and lies on screen (UX.md rule 14). */
const expectFits = async (list: Locator) => {
  const fit = await list.evaluate((el) => {
    // The nearest container that could scroll: the sheet or the popover.
    let box: Element | null = el;
    while (box && !['auto', 'scroll'].includes(getComputedStyle(box).overflowY)) box = box.parentElement;
    const target = box ?? el;
    const rect = el.getBoundingClientRect();
    return {
      scroll: target.scrollHeight,
      client: target.clientHeight,
      top: Math.round(rect.top),
      bottom: Math.round(rect.bottom),
      screen: window.innerHeight,
    };
  });
  expect(fit.scroll, `list overflows by ${fit.scroll - fit.client}px`).toBeLessThanOrEqual(fit.client);
  expect(fit.top).toBeGreaterThanOrEqual(0);
  expect(fit.bottom).toBeLessThanOrEqual(fit.screen);
};

test('no native select anywhere', async ({ page }) => {
  for (const path of ['/sorting/insertion-sort', '/fourier/epicycles', '/pathfinding', '/structures']) {
    await open(page, path);
    await expect(page.locator('select')).toHaveCount(0);
  }
});

test('inside the settings sheet, Input slides to its list and back', async ({ page }, testInfo) => {
  test.skip(hasSettingsPanel(testInfo), 'phones and iPad portrait: settings in a sheet');
  await open(page, '/sorting/insertion-sort');
  await openSettings(page, testInfo);
  const sheet = page.getByRole('dialog', { name: 'Settings' });
  const field = sheet.getByRole('button', { name: /^Input:/ });
  await expect(field).toHaveAccessibleName('Input: Random');

  // Tapping the field slides to the list, with Back and ✕; no second sheet.
  await field.click();
  const list = sheet.getByRole('listbox', { name: 'Input' });
  await expect(list).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Back' })).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Close' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  // Each order says what it's for.
  await expect(list.getByRole('option', { name: /^Reversed/ })).toContainText('Largest first');
  await expectFits(list);

  // Back returns without changing anything.
  await sheet.getByRole('button', { name: 'Back' }).click();
  await expect(list).toBeHidden();
  await expect(field).toBeVisible();
  await expect(field).toHaveAccessibleName('Input: Random');

  // Picking applies the value and slides back on its own.
  await field.click();
  await list.getByRole('option', { name: /^Reversed/ }).click();
  await expect(list).toBeHidden();
  await expect(field).toHaveAccessibleName('Input: Reversed');
  await expect(sheet).toBeVisible();

  // ✕ closes the whole sheet, even from the list.
  await field.click();
  await expect(list).toBeVisible();
  // Every visit starts on the option picked.
  await expect(list.getByRole('option', { selected: true })).toBeFocused();
  await expect(list.getByRole('option', { selected: true })).toHaveAccessibleName(/^Reversed/);
  await sheet.getByRole('button', { name: 'Close' }).click();
  await expect(sheet).toBeHidden();
});

test('beside the stage, Input opens a popover list that works by keyboard', async ({ page }, testInfo) => {
  test.skip(!hasSettingsPanel(testInfo), 'iPad landscape and desktop: settings beside the stage');
  await open(page, '/sorting/insertion-sort');
  await openSettings(page, testInfo);
  const field = page.getByRole('button', { name: /^Input:/ });
  await expect(field).toHaveAttribute('aria-haspopup', 'listbox');

  await field.click();
  const list = page.getByRole('listbox', { name: 'Input' });
  await expect(list).toBeVisible();
  // Like any dropdown: under the field, where it fits.
  const [fieldBox, listBox] = [(await field.boundingBox())!, (await list.boundingBox())!];
  expect(listBox.y).toBeGreaterThan(fieldBox.y + fieldBox.height);
  await expect(list.getByRole('option', { name: /^Reversed/ })).toContainText('Largest first');
  await expectFits(list);
  // Focus starts on the option picked.
  await expect(list.getByRole('option', { selected: true })).toBeFocused();
  // Touch screens get rows of at least 44px, wide or not.
  if (testInfo.project.name === 'ipad-landscape') {
    const heights = await list.getByRole('option').evaluateAll((os) => os.map((o) => o.getBoundingClientRect().height));
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
  }

  // Picking closes it and applies the value.
  await list.getByRole('option', { name: /^Sorted/ }).click();
  await expect(list).toBeHidden();
  await expect(field).toHaveAccessibleName('Input: Sorted');

  // Keyboard: arrows move, Enter picks, Escape closes without a change.
  await field.focus();
  await page.keyboard.press('Enter');
  await expect(list).toBeVisible();
  await page.keyboard.press('ArrowUp');
  await expect(list.getByRole('option', { name: /^Reversed/ })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(list).toBeHidden();
  await expect(field).toHaveAccessibleName('Input: Reversed');
  await expect(field).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(list).toBeVisible();
  await page.keyboard.press('Home');
  await expect(list.getByRole('option').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(list).toBeHidden();
  await expect(field).toHaveAccessibleName('Input: Reversed');
});

for (const path of ['/fourier/epicycles', '/es/fourier/epicycles']) {
  test(`${path}: Drawing lists every drawing with its thumbnail, fitting without scroll`, async ({ page }, testInfo) => {
    await open(page, path);
    if (hasSettingsPanel(testInfo)) {
      await expect(page.locator('[data-settings]').filter({ visible: true })).toBeVisible();
    } else {
      await page.getByRole('button', { name: /^(Settings|Ajustes):/ }).click();
    }
    const field = page.getByRole('button', { name: /^(Drawing|Dibujo):/ });
    await field.click();
    const list = page.getByRole('listbox', { name: /^(Drawing|Dibujo)$/ });
    await expect(list).toBeVisible();
    // 14 drawings in three groups, then drawing your own.
    await expect(list.getByRole('option')).toHaveCount(15);
    await expect(list.getByRole('group')).toHaveCount(3);
    expect(await list.getByRole('option').evaluateAll((os) => os.every((o) => o.querySelector('svg')))).toBe(true);
    await expectFits(list);

    await list.getByRole('option').nth(1).click();
    await expect(list).toBeHidden();
    await expect(field).toHaveAccessibleName(/: (Star|Estrella)$/);
  });
}
