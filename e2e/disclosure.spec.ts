import { test, expect, type Locator, type Page } from '@playwright/test';
import { gotoApp } from './goto';

// Runs on every device project. The explanation under the stage is a set of
// disclosures (UX.md rule 9, #96): closed on entry, opened with a tap, a click
// or Enter, several open at once, and opening one never scrolls the page.

const scrollY = (page: Page) => page.evaluate(() => window.scrollY);

const disclosure = (page: Page, name: string) =>
  page.locator('#about').getByRole('heading', { level: 2 }).getByRole('button', { name });

/** The panel a disclosure's button controls, found through `aria-controls`. */
const panelOf = async (page: Page, button: Locator) =>
  page.locator(`[id="${await button.getAttribute('aria-controls')}"]`);

const press = (button: Locator, hasTouch: boolean) => (hasTouch ? button.tap() : button.click());

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('tour-done', 'true');
    localStorage.setItem('tour-done-backtracking', 'true');
  });
});

test('explanations start closed and open in place', async ({ page, hasTouch }) => {
  await gotoApp(page, '/sorting/insertion-sort');

  const how = disclosure(page, 'How Insertion Sort works');
  const howPanel = await panelOf(page, how);
  await expect(how).toHaveAttribute('aria-expanded', 'false');
  await expect(howPanel).toBeHidden();
  // The summary isn't an explanation: it's always open.
  await expect(page.locator('#about').getByRole('table')).toBeVisible();

  await how.scrollIntoViewIfNeeded();
  const before = await scrollY(page);
  await press(how, hasTouch);
  await expect(how).toHaveAttribute('aria-expanded', 'true');
  await expect(howPanel).toBeVisible();
  expect(await scrollY(page), 'page scroll after opening').toBe(before);

  // Enter opens a second one, and the first stays open.
  const code = disclosure(page, 'Pseudocode');
  const codePanel = await panelOf(page, code);
  await code.scrollIntoViewIfNeeded();
  const beforeEnter = await scrollY(page);
  await code.focus();
  await page.keyboard.press('Enter');
  await expect(code).toHaveAttribute('aria-expanded', 'true');
  await expect(codePanel).toBeVisible();
  await expect(howPanel).toBeVisible();
  expect(await scrollY(page), 'page scroll after Enter').toBe(beforeEnter);

  await page.keyboard.press('Enter');
  await expect(code).toHaveAttribute('aria-expanded', 'false');
  await expect(codePanel).toBeHidden();
  expect(await scrollY(page), 'page scroll after closing').toBe(beforeEnter);
});

test('the scroll hint opens the explanation it names', async ({ page }) => {
  await gotoApp(page, '/sorting/insertion-sort');

  await page.getByRole('main').getByRole('button', { name: 'How Insertion Sort works' }).click();

  const how = disclosure(page, 'How Insertion Sort works');
  await expect(how).toHaveAttribute('aria-expanded', 'true');
  await expect(await panelOf(page, how)).toBeInViewport();
});

for (const [path, name] of [
  ['/backtracking/n-queens', 'How the N-Queens solver works'],
  ['/es/backtracking/sudoku', 'Cómo se resuelve un sudoku'],
]) {
  test(`the scroll hint on ${path} names and opens its first explanation`, async ({ page }) => {
    await gotoApp(page, path);

    await page.getByRole('main').getByRole('button', { name, exact: true }).click();

    const how = disclosure(page, name);
    await expect(how).toHaveAttribute('aria-expanded', 'true');
    await expect(await panelOf(page, how)).toBeInViewport();
  });
}

test('the scroll hint on a module start page only scrolls', async ({ page }) => {
  await gotoApp(page, '/es/backtracking');

  await page.getByRole('main').getByRole('button', { name: 'Sobre el backtracking', exact: true }).click();

  const why = disclosure(page, '¿Por qué deshacer elecciones?');
  await expect(why).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#about')).toBeInViewport();
});

test('a new page starts with its explanations closed', async ({ page, hasTouch }) => {
  await gotoApp(page, '/sorting/insertion-sort');

  const how = disclosure(page, 'How Insertion Sort works');
  await how.scrollIntoViewIfNeeded();
  await press(how, hasTouch);
  await expect(how).toHaveAttribute('aria-expanded', 'true');

  await page.locator('#about').getByRole('link', { name: 'Selection Sort' }).click();
  await expect(page).toHaveURL(/\/sorting\/selection-sort\b/);
  await expect(disclosure(page, 'How Selection Sort works')).toHaveAttribute('aria-expanded', 'false');
});
