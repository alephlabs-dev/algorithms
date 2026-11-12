import { test, expect } from '@playwright/test';
import { gotoApp } from './goto';
import { guessScore, pickGuess, stepCaption, unavailableNote } from './guess';

// Runs on every device project. Guess mode in backtracking: N-Queens asks where the next queen lands; Sudoku doesn't play yet.
test('N-Queens guess mode asks which column the queen lands in, takes an answer and keeps score', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-backtracking', 'true'));
  await gotoApp(page, '/backtracking/n-queens?n=4&speed=8x');

  await pickGuess(page);

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
  await expect(guessScore(page)).toHaveAccessibleName('Score: 1 right out of 1');
  expect(errors).toEqual([]);
});

test('Sudoku says guess mode works with N-Queens for now, and asks nothing', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done-backtracking', 'true'));
  await gotoApp(page, '/backtracking/sudoku?puzzle=easy&speed=8x');

  await pickGuess(page);
  // The reason takes the dock's place: nothing plays, so nothing is asked.
  await expect(unavailableNote(page, 'Guess works with N-Queens for now.')).toBeVisible();
  // The step stays neutral: no "Press play" without a Play, and the reason only once.
  await expect(stepCaption(page)).toHaveText('Guess mode is paused.');
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeHidden();
  await expect(page.getByRole('dialog', { name: 'Your guess' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the backtracking tour ends on the guessing game', async ({ page }) => {
  await gotoApp(page, '/backtracking/n-queens?n=4');
  const step = page.getByRole('dialog', { name: 'A guessing game' });
  for (let k = 0; k < 10 && !(await step.isVisible()); k++) {
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await expect(step).toContainText('With N-Queens, pick Guess');
});
