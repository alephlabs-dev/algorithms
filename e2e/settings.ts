import { expect, type Page, type TestInfo } from '@playwright/test';

/** The smallest size of each layout (UX.md rule 14): settings and option lists must fit there without scrolling. */
export const SMALLEST: Record<string, { width: number; height: number }> = {
  iphone: { width: 393, height: 852 },
  ipad: { width: 834, height: 1194 },
  'ipad-landscape': { width: 1194, height: 834 },
  desktop: { width: 1280, height: 800 },
};

/** iPad landscape and desktop show the settings in a fixed side panel; phones and upright tablets in a sheet. */
export const hasSettingsPanel = (testInfo: TestInfo) => ['ipad-landscape', 'desktop'].includes(testInfo.project.name);

/** Brings the settings on screen: opens the (modal) sheet where there is one, else they're already beside the stage. */
export const openSettings = async (page: Page, testInfo: TestInfo) => {
  if (hasSettingsPanel(testInfo)) {
    await expect(page.getByRole('region', { name: 'Settings' })).toBeVisible();
    return;
  }
  await page.getByRole('button', { name: /^Settings:/ }).click();
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
};
