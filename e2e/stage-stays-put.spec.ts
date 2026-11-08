import { test, expect } from '@playwright/test';
import { gotoApp } from './goto';

// Runs on every device project. UX.md rule 1: nothing above the stage changes height during playback,
// so the stage doesn't move while a run plays. The step sentence above it is the usual suspect: it
// switches between one and two lines from step to step.

const PAGES = ['/sorting/insertion-sort', '/pathfinding', '/es/sorting/insertion-sort', '/es/pathfinding'];
const STEPS = 40;
// The sentence updates at most every 250ms (Pseudocode.tsx), so each step waits a little longer.
const SENTENCE_UPDATE_MS = 260;

for (const path of PAGES) {
  test(`the stage stays put while stepping through ${path}`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.addInitScript(() => {
      for (const key of ['tour-done', 'tour-done-pathfinding']) localStorage.setItem(key, 'true');
    });
    await gotoApp(page, path);

    const stage = page.locator('[data-tour="bars"]').filter({ visible: true }).first();
    const tops = new Set<number>();
    for (let step = 0; step <= STEPS; step++) {
      tops.add(Math.round((await stage.boundingBox())!.y));
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(SENTENCE_UPDATE_MS);
    }
    expect([...tops], 'the stage top moved while stepping').toHaveLength(1);
  });
}
