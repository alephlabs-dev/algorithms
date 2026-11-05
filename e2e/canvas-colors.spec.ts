import { test, expect } from '@playwright/test';

// The canvas reads theme colors from CSS variables, which the production build minifies
// (#ffd700 can become "gold"). The sorted section must still come out yellow, not black.
test('sorted section bars keep the theme color in the production build', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/sorting/insertion-sort?size=10');

  // Insertion's first step lights the first two bars as the sorted section.
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  const canvas = page.locator('[data-tour="bars"] canvas');
  await expect(canvas).toBeVisible();

  // Wait for the color to ease in, then read the middle of the first bar's bottom edge.
  await expect
    .poll(
      () =>
        canvas.evaluate((el: HTMLCanvasElement) => {
          const ctx = el.getContext('2d')!;
          const x = Math.floor(el.width / 40);
          const y = el.height - 4;
          return Array.from(ctx.getImageData(x, y, 1, 1).data.slice(0, 3));
        }),
      { timeout: 5000 },
    )
    .toEqual([255, 215, 0]);
});
