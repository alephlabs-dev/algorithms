import { test, expect, type Page } from '@playwright/test';
import { gotoApp } from './goto';
import AxeBuilder from '@axe-core/playwright';
import { HOME, modulePages, moduleRoute, routePath, type ModuleId, type Route } from '../src/routes.ts';

// The landing page, every module's start page, and every race page, from the
// route registry: a new module or race page gets its smoke test for free.
// Algorithm pages share their start page's layout, so they're left out.
const modules = Object.keys(modulePages) as ModuleId[];
const routes: Route[] = [
  HOME,
  ...modules.map((module) => moduleRoute(module, 'start')),
  ...modules.filter((module) => modulePages[module].race).map((module) => moduleRoute(module, 'race')),
];

// Runs on every device project (iPhone, iPad portrait/landscape, desktop).
// Checks: no JS errors, no horizontal scroll, zoom allowed, no serious accessibility violations.
const expectLoadsCleanly = async (page: Page, url: string) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  // Vercel serves /_vercel/* (Analytics) only in deployments; vite preview returns 404.
  await page.route('**/_vercel/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }),
  );

  await gotoApp(page, url);
  await page.waitForLoadState('networkidle');

  expect(errors, 'console / page errors').toEqual([]);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(0);

  // Zoom stays allowed (UX.md rule 12): no maximum-scale or user-scalable=no.
  const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(viewport, 'viewport meta').not.toMatch(/maximum-scale|user-scalable\s*=\s*(no|0)/i);

  const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = a11y.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
};

for (const route of routes) {
  const path = routePath(route);
  test(`smoke ${path}`, async ({ page }) => {
    await expectLoadsCleanly(page, path);
  });
}
