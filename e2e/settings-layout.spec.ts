import { test, expect, type Page } from '@playwright/test';
import { hasSettingsPanel } from './settings';

// Runs on every device project. Where settings live (UX.md rule 8): a modal sheet over the stage on
// phones and upright tablets (the stage stays put and keeps playing), beside the stage on wide screens.

const stage = (page: Page) => page.locator('[data-tour="bars"]').filter({ visible: true }).first();
// Where the stage sits. Its top edge follows the step sentence above it (one or two lines as the run
// plays), so the sheet's effect shows on the sides and the bottom edge.
const stagePlace = async (page: Page) => {
  const box = (await stage(page).boundingBox())!;
  return { x: box.x, width: box.width, bottom: box.y + box.height };
};
// The dock is hidden from assistive tech while the modal sheet is open, so read it including hidden.
const position = async (page: Page) =>
  Number(await page.getByRole('slider', { name: 'Progress', includeHidden: true }).first().getAttribute('aria-valuenow'));

test('settings open in a modal sheet over a stage that stays put and keeps playing', async ({ page }, testInfo) => {
  test.skip(hasSettingsPanel(testInfo), 'iPad landscape and desktop keep the settings beside the stage');
  await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
  await page.goto('/sorting/insertion-sort?size=40');

  await page.getByRole('button', { name: 'Play', exact: true }).click();
  const stageBefore = await stagePlace(page);
  await page.getByRole('button', { name: /^Settings:/ }).click();

  const sheet = page.getByRole('dialog', { name: 'Settings' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Close' })).toBeVisible();
  // Speed stays in the dock, out of the sheet.
  await expect(sheet.getByRole('radiogroup', { name: 'Speed' })).toHaveCount(0);

  // The stage doesn't move or resize, and the run keeps playing under the sheet.
  await page.waitForTimeout(500);
  expect(await stagePlace(page)).toEqual(stageBefore);
  const before = await position(page);
  await expect.poll(() => position(page)).toBeGreaterThan(before);

  // Escape closes it; playback carries on.
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();

  // So does a tap on the backdrop, above the sheet.
  await page.getByRole('button', { name: /^Settings:/ }).click();
  await expect(sheet).toBeVisible();
  await page.mouse.click(20, 20);
  await expect(sheet).toBeHidden();
  expect(await stagePlace(page)).toEqual(stageBefore);

  // The pseudocode keeps its own sheet, closed by its ✕.
  await page.getByRole('button', { name: /Show pseudocode$/ }).click();
  // (By id: the explanations below the stage have a "Pseudocode" section too.)
  const code = page.locator('#sheet-code');
  await expect(code).toBeVisible();
  await code.getByRole('button', { name: 'Close' }).click();
  await expect(code).toBeHidden();
});

test('picking a module closes the module list', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
  await page.goto('/sorting');

  await page.getByRole('button', { name: 'Module: Sorting. Change' }).filter({ visible: true }).first().click();
  const list = page.getByRole('navigation', { name: 'Modules' });
  await expect(list).toBeVisible();
  // A modal sheet always has a visible way out.
  if (!hasSettingsPanel(testInfo)) await expect(page.getByRole('dialog').getByRole('button', { name: 'Close' })).toBeVisible();

  await list.getByRole('button', { name: /Pathfinding/ }).click();
  await expect(page).toHaveURL(/\/pathfinding/);
  await expect(list).toBeHidden();
});

test('iPad landscape and desktop: a side panel with Settings and Pseudocode tabs beside the stage', async ({ page }, testInfo) => {
  test.skip(!hasSettingsPanel(testInfo), 'phones and upright tablets use the sheet');
  await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
  await page.goto('/sorting/insertion-sort');

  // Settings is the default tab.
  const tabs = page.getByRole('radiogroup', { name: 'Side panel' });
  await expect(tabs.getByRole('radio', { name: 'Settings' })).toBeChecked();
  const panel = page.getByRole('region', { name: 'Settings' });
  await expect(panel.getByRole('slider', { name: 'Array size' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Settings:/ })).toHaveCount(0);

  // Beside the stage, not over it.
  const panelBox = (await panel.boundingBox())!;
  const stageBox = (await stage(page).boundingBox())!;
  expect(stageBox.x + stageBox.width).toBeLessThanOrEqual(panelBox.x);

  // The other tab shows the pseudocode in the same place.
  await tabs.getByRole('radio', { name: 'Pseudocode' }).click();
  const card = page.getByRole('region', { name: 'Current step' });
  await expect(card).toBeVisible();
  await expect(panel).toBeHidden();
  expect((await card.boundingBox())!.x).toBeGreaterThanOrEqual(stageBox.x + stageBox.width);

  // The tab is kept for the session, across pages and reloads.
  await page.reload();
  await expect(page.getByRole('radiogroup', { name: 'Side panel' }).getByRole('radio', { name: 'Pseudocode' })).toBeChecked();
  await expect(page.getByRole('region', { name: 'Current step' })).toBeVisible();

  // Tapping the step sentence also opens it.
  await tabs.getByRole('radio', { name: 'Settings' }).click();
  await page.getByRole('button', { name: /Show pseudocode$/ }).click();
  await expect(tabs.getByRole('radio', { name: 'Pseudocode' })).toBeChecked();
});

test('iPad landscape and desktop: the legend shows once while the Pseudocode tab is open', async ({ page }, testInfo) => {
  test.skip(!hasSettingsPanel(testInfo), 'phones and upright tablets use the sheet');
  await page.addInitScript(() => localStorage.setItem('tour-done-pathfinding', 'true'));
  await page.goto('/pathfinding');

  await page.getByRole('radiogroup', { name: 'Side panel' }).getByRole('radio', { name: 'Pseudocode' }).click();
  const card = page.getByRole('region', { name: 'Current step' });
  await expect(card).toBeVisible();
  // Once, above the stage, where it also shows on upright tablets and with the Settings tab open.
  await expect(page.getByRole('list', { name: /legend/i }).filter({ visible: true })).toHaveCount(1);
  await expect(card.getByRole('list', { name: /legend/i })).toHaveCount(0);
});
