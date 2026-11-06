import { test, expect, type Page } from '@playwright/test';
import { hasSettingsPanel } from './settings';

// Runs on every device project. Where settings live (UX.md rule 8): a non-modal sheet on phones and
// upright tablets that leaves the run in view, a fixed side panel on iPad landscape and desktop.

const stage = (page: Page) => page.locator('[data-tour="bars"]').filter({ visible: true }).first();
const position = async (page: Page) =>
  Number(await page.getByRole('slider', { name: 'Progress', includeHidden: true }).first().getAttribute('aria-valuenow'));

test('settings open in a sheet that leaves the stage in view and the run playing', async ({ page }, testInfo) => {
  test.skip(hasSettingsPanel(testInfo), 'iPad landscape and desktop have the side panel');
  await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
  await page.goto('/sorting/insertion-sort?size=40');

  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: /^Settings:/ }).click();

  // Non-modal: no dialog, and the whole stage sits above a sheet at most half the screen tall.
  const sheet = page.getByRole('region', { name: 'Settings' });
  await expect(sheet).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(sheet.getByRole('radiogroup', { name: 'Speed' })).toBeVisible();
  const viewport = page.viewportSize()!;
  const sheetBox = (await sheet.boundingBox())!;
  const stageBox = (await stage(page).boundingBox())!;
  expect(sheetBox.height).toBeLessThanOrEqual(viewport.height / 2 + 1);
  expect(stageBox.height).toBeGreaterThan(100);
  expect(stageBox.y + stageBox.height).toBeLessThanOrEqual(sheetBox.y + 1);

  // The run keeps playing behind it.
  const before = await position(page);
  await expect.poll(() => position(page)).toBeGreaterThan(before);

  // Only one sheet at a time: the pseudocode replaces the settings.
  await page.getByRole('button', { name: /Show pseudocode$/ }).click();
  // (By id: the explanations below the stage have a "Pseudocode" section too.)
  const code = page.locator('#sheet-code');
  await expect(code).toBeVisible();
  await expect(sheet).toBeHidden();

  // Its ✕ closes it and the dock comes back.
  await code.getByRole('button', { name: 'Close' }).click();
  await expect(code).toBeHidden();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
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

test('iPad landscape and desktop keep the settings in a side panel beside the stage', async ({ page }, testInfo) => {
  test.skip(!hasSettingsPanel(testInfo), 'phones and upright tablets use the sheet');
  await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
  await page.goto('/sorting/insertion-sort');

  const panel = page.getByRole('region', { name: 'Settings' });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('slider', { name: 'Array size' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Settings:/ })).toHaveCount(0);

  // Beside the stage, not over it.
  const panelBox = (await panel.boundingBox())!;
  const stageBox = (await stage(page).boundingBox())!;
  expect(stageBox.x + stageBox.width).toBeLessThanOrEqual(panelBox.x);

  // Desktop: the pseudocode card shares the column, under the panel.
  if (testInfo.project.name === 'desktop') {
    const card = page.getByRole('region', { name: 'Current step' });
    await expect(card).toBeVisible();
    const cardBox = (await card.boundingBox())!;
    expect(cardBox.y).toBeGreaterThanOrEqual(panelBox.y + panelBox.height);
  }
});
