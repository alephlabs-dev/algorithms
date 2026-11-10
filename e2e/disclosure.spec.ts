import { test, expect, type Locator, type Page } from '@playwright/test';
import { gotoApp } from './goto';

// Runs on every device project. The explanation under the stage is a set of
// disclosures (UX.md rule 9, #96): closed on entry, opened with a tap, a click
// or Enter, several open at once, and opening one never scrolls the page.

const scrollY = (page: Page) => page.evaluate(() => window.scrollY);

/** A disclosure under the stage (a `<details>`), found by its heading. */
const disclosure = (page: Page, name: string) =>
  page.locator('#about details').filter({ has: page.getByRole('heading', { level: 2, name, exact: true }) });

/** What you tap: the summary, which holds the heading. */
const summaryOf = (details: Locator) => details.locator('summary');

/** The panel the summary shows and hides. */
const panelOf = (details: Locator) => details.locator(':scope > div');

const expectOpen = (details: Locator, open: boolean) => expect(details).toHaveJSProperty('open', open);

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
  const howPanel = panelOf(how);
  await expectOpen(how, false);
  await expect(howPanel).toBeHidden();
  // The summary isn't an explanation: it's always open.
  await expect(page.locator('#about').getByRole('table')).toBeVisible();

  await how.scrollIntoViewIfNeeded();
  const before = await scrollY(page);
  await press(summaryOf(how), hasTouch);
  await expectOpen(how, true);
  await expect(howPanel).toBeVisible();
  expect(await scrollY(page), 'page scroll after opening').toBe(before);

  // Enter opens a second one, and the first stays open.
  const code = disclosure(page, 'Pseudocode');
  const codePanel = panelOf(code);
  await code.scrollIntoViewIfNeeded();
  const beforeEnter = await scrollY(page);
  await summaryOf(code).focus();
  await page.keyboard.press('Enter');
  await expectOpen(code, true);
  await expect(codePanel).toBeVisible();
  await expect(howPanel).toBeVisible();
  expect(await scrollY(page), 'page scroll after Enter').toBe(beforeEnter);

  await page.keyboard.press('Enter');
  await expectOpen(code, false);
  await expect(codePanel).toBeHidden();
  expect(await scrollY(page), 'page scroll after closing').toBe(beforeEnter);
});

test('the scroll hint opens the explanation it names', async ({ page }) => {
  await gotoApp(page, '/sorting/insertion-sort');

  await page.getByRole('main').getByRole('button', { name: 'How Insertion Sort works' }).click();

  const how = disclosure(page, 'How Insertion Sort works');
  await expectOpen(how, true);
  await expect(panelOf(how)).toBeInViewport();
});

for (const [path, name] of [
  ['/backtracking/n-queens', 'How the N-Queens solver works'],
  ['/es/backtracking/sudoku', 'Cómo se resuelve un sudoku'],
]) {
  test(`the scroll hint on ${path} names and opens its first explanation`, async ({ page }) => {
    await gotoApp(page, path);

    await page.getByRole('main').getByRole('button', { name, exact: true }).click();

    const how = disclosure(page, name);
    await expectOpen(how, true);
    await expect(panelOf(how)).toBeInViewport();
  });
}

test('the scroll hint on a module start page only scrolls', async ({ page }) => {
  await gotoApp(page, '/es/backtracking');

  await page.getByRole('main').getByRole('button', { name: 'Sobre el backtracking', exact: true }).click();

  const why = disclosure(page, '¿Por qué deshacer elecciones?');
  await expectOpen(why, false);
  await expect(page.locator('#about')).toBeInViewport();
});

test('a new page starts with its explanations closed', async ({ page, hasTouch }) => {
  await gotoApp(page, '/sorting/insertion-sort');

  const how = disclosure(page, 'How Insertion Sort works');
  await how.scrollIntoViewIfNeeded();
  await press(summaryOf(how), hasTouch);
  await expectOpen(how, true);

  await page.locator('#about').getByRole('link', { name: 'Selection Sort' }).click();
  await expect(page).toHaveURL(/\/sorting\/selection-sort\b/);
  await expectOpen(disclosure(page, 'How Selection Sort works'), false);
});
