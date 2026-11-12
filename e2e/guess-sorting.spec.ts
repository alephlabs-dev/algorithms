import { test, expect } from '@playwright/test';
import { gotoApp } from './goto';
import { guessScore, pickGuess, stepCaption, unavailableNote } from './guess';
import { openSettings } from './settings';

// Runs on every device project. Guess mode in sorting: pick Guess, play until it asks, answer, and the score counts it.
test('sorting guess mode asks, takes an answer and keeps score', async ({ page }, testInfo) => {
  // Skip the first-visit tour, which would cover the stage.
  await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
  await gotoApp(page, '/sorting/insertion-sort?size=10&speed=8x');

  await pickGuess(page);
  if (testInfo.project.name === 'iphone') {
    // Phones: the score sits in the dock's row of buttons, in sight before and between questions.
    await expect(page.getByRole('img', { name: 'Score: 0 right out of 0' })).toBeVisible();
  }

  await page.getByRole('button', { name: 'Play', exact: true }).click();

  const question = page.getByRole('dialog', { name: 'Your guess' });
  await expect(question).toBeVisible();
  await expect(question).toContainText('How many places does it move left?');
  await question.getByRole('button').first().click();

  await expect(page.getByRole('status', { name: 'How it went' })).toBeVisible();
  await expect(guessScore(page)).toHaveAccessibleName(/out of 1$/);
  await expect(guessScore(page)).toHaveText(/\/1$/);
  if (testInfo.project.name === 'iphone') {
    // Answered: the score in sight counts it, in the dock or in the next question.
    await expect(page.getByRole('img', { name: /^Score: \d right out of 1$/ }).last()).toBeVisible();
  }
});

test('with more than 20 items the guess view says why it can\'t play, and doesn\'t', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
  await gotoApp(page, '/sorting/insertion-sort?size=10&speed=8x');

  await pickGuess(page);

  // Switch to 40 items in the guess view.
  await openSettings(page, testInfo);
  const size = page.getByRole('slider', { name: 'Array size' });
  await size.focus();
  await size.press('ArrowRight');
  await size.press('ArrowRight');
  await expect(size).toHaveAttribute('aria-valuetext', '40 items');
  await page.keyboard.press('Escape');

  // The reason takes the dock's place: nothing plays, so nothing is asked.
  const play = page.getByRole('button', { name: 'Play', exact: true });
  await expect(unavailableNote(page, 'Guess works with 10 or 20 items.')).toBeVisible();
  // The step says why too, instead of "Press play" (UX.md rule 5).
  await expect(stepCaption(page)).toHaveText('Guess works with 10 or 20 items.');
  await expect(play).toBeHidden();
  await expect(page.getByRole('dialog', { name: 'Your guess' })).toHaveCount(0);

  // Visualize plays it.
  await page.getByRole('radio', { name: 'Visualize' }).click();
  await expect(unavailableNote(page, 'Guess works with 10 or 20 items.')).toBeHidden();
  await expect(stepCaption(page)).not.toHaveText('Guess works with 10 or 20 items.');
  await play.click();
  await expect(page.getByRole('button', { name: 'Replay', exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('dialog', { name: 'Your guess' })).toHaveCount(0);
  expect(errors).toEqual([]);
});
