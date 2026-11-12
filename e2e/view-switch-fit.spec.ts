import { test, expect } from '@playwright/test';
import { gotoApp } from './goto';
import { algorithmPageOf, isModuleTranslated, MODULES, routePath, skipTours } from './modules';

// #196, #197: on a 360px phone the view switch (Visualize / Race / Guess) shows every label whole, in
// English and Spanish, each segment a full tap target; what sits beside it gives way, never the switch.
const MIN = 44;

for (const module of MODULES) {
  for (const lang of ['en', 'es'] as const) {
    test(`${module}'s view switch fits whole at 360px, in ${lang === 'en' ? 'English' : 'Spanish'}`, async ({ page }, info) => {
      test.skip(info.project.name !== 'iphone', 'the narrowest phone, once');
      test.skip(lang === 'es' && !isModuleTranslated(module), 'not translated');
      await page.setViewportSize({ width: 360, height: 780 });
      await skipTours(page);
      const path = routePath(algorithmPageOf(module));
      await gotoApp(page, lang === 'es' ? `/es${path}` : path);

      const segments = page.getByRole('radiogroup', { name: lang === 'en' ? 'View' : 'Vista' }).filter({ visible: true }).getByRole('radio');
      if ((await segments.count()) === 0) return; // A module with one view names itself instead.

      const problems = await segments.evaluateAll(
        (els, min) =>
          els.flatMap((el) => {
            const rect = el.getBoundingClientRect();
            const after = getComputedStyle(el, '::after');
            const grows = after.content !== 'none' && after.position === 'absolute';
            const width = Math.max(rect.width, grows ? parseFloat(after.width) || 0 : 0);
            const height = Math.max(rect.height, grows ? parseFloat(after.height) || 0 : 0);
            const name = el.textContent?.trim();
            return [
              ...(el.scrollWidth > el.clientWidth ? [`"${name}" is cut: ${el.scrollWidth}px of text in ${el.clientWidth}px`] : []),
              ...(rect.left < 0 || rect.right > window.innerWidth ? [`"${name}" runs off the screen`] : []),
              ...(width < min - 0.5 || height < min - 0.5 ? [`"${name}" is ${Math.round(width)}×${Math.round(height)}`] : []),
            ];
          }),
        MIN,
      );
      expect(problems).toEqual([]);
      // Nothing in the row overflows the screen either.
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    });
  }
}
