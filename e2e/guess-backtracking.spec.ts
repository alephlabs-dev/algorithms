import { test, expect } from '@playwright/test';
import { gotoApp } from './goto';

// Runs on every device project. Guess mode in backtracking: N-Queens asks where the next queen lands; Sudoku doesn't play yet.
test('N-Queens guess mode asks which column the queen lands in, takes an answer and keeps score', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-backtracking', 'true'));
  await gotoApp(page, '/backtracking/n-queens?n=4&speed=8x');

  const toggle = page.getByRole('button', { name: /Guess mode/ });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Play', exact: true }).click();

  // The first question: row 1's queen is in column 1, so columns 1 and 2 of row 2 are attacked.
  const question = page.getByRole('dialog', { name: 'Your guess' });
  await expect(question).toBeVisible();
  await expect(question).toContainText("Which column will row 2's queen land in?");
  await expect(question.getByRole('button', { name: 'Dead end' })).toBeVisible();
  // The strip lights up the row it asks about.
  await expect(page.getByRole('listitem', { name: 'Row 2: no queen yet' })).toHaveClass(/ring-2/);
  await question.getByRole('button', { name: '3', exact: true }).click();

  const status = page.getByRole('status', { name: 'How it went' });
  await expect(status).toContainText('Right: columns 1 and 2 are attacked (by the queen in row 1), so it lands in column 3.');
  await expect(toggle).toHaveAccessibleName(/1 right out of 1\b/);
  expect(errors).toEqual([]);
});

test('Sudoku says guess mode works with N-Queens for now, and asks nothing', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-backtracking', 'true'));
  await gotoApp(page, '/backtracking/sudoku?puzzle=easy&speed=8x');

  const toggle = page.getByRole('button', { name: /Guess mode/ });
  await expect(toggle).toHaveAccessibleName(/Guess mode unavailable: Guess works with N-Queens for now/);
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  // Touch screens don't show the title: tapping the toggle shows the reason.
  await toggle.click();
  await expect(page.getByText('Guess works with N-Queens for now.')).toBeVisible();
  expect(errors).toEqual([]);
});

test('the backtracking tour ends on the guessing game', async ({ page }) => {
  await gotoApp(page, '/backtracking/n-queens?n=4');
  const step = page.getByRole('dialog', { name: 'A guessing game' });
  for (let k = 0; k < 10 && !(await step.isVisible()); k++) {
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await expect(step).toContainText('With N-Queens, turn on Guess');
});
