import { expect, type Page } from '@playwright/test';

/** The Guess segment of the view switch on screen ("Guess, new" until Guess is first tried). */
export const guessSegment = (page: Page) => page.getByRole('radio', { name: /^Guess\b/ });

/** Switches to the guess view. */
export const pickGuess = async (page: Page) => {
  const guess = guessSegment(page);
  await guess.click();
  await expect(guess).toHaveAttribute('aria-checked', 'true');
};

/** The score guess mode shows ("1/1", read out as "Score: 1 right out of 1"). */
export const guessScore = (page: Page) => page.getByRole('img', { name: /^Score: / }).first();

/** The note that takes the dock's place while the guess view can't play the run on stage. */
export const unavailableNote = (page: Page, reason: string) => page.locator('p').filter({ hasText: reason });

/** The step sentence over the stage. */
export const stepCaption = (page: Page) => page.locator('[data-tour="narration"]').filter({ visible: true });
