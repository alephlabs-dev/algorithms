import { expect, type Page, type TestInfo } from '@playwright/test';

/** iPad landscape and desktop show the settings in a fixed side panel; phones and upright tablets in a sheet. */
export const hasSettingsPanel = (testInfo: TestInfo) => ['ipad-landscape', 'desktop'].includes(testInfo.project.name);

/** Brings the settings on screen: opens the sheet where there is one, else they're already in the panel. */
export const openSettings = async (page: Page, testInfo: TestInfo) => {
  if (!hasSettingsPanel(testInfo)) await page.getByRole('button', { name: /^Settings:/ }).click();
  await expect(page.getByRole('region', { name: 'Settings' })).toBeVisible();
};
