import path from 'node:path';
import { test, expect } from '@playwright/test';
import { createServer } from 'vite';

// The step sentence above the stage is always two lines tall, so the stage never moves (#111), and cuts
// what doesn't fit (#113). So every sentence must fit in two lines in the caption of its module's page, at
// every size we design for, in both languages: this generates the sentences of representative runs of every
// module (src/utils/stepSentences.ts) and measures each one in the real caption. On wide screens the legend
// sits beside the caption, so the caption must also never be narrower than on a 393px phone (#115).

const MAX_LINES = 2;
/** The caption's text width on a 393px phone: 393 − 2×16 page padding + 12 (its -ml-3) − 2×12 padding − 16 icon − 8 gap. */
const PHONE_TEXT_WIDTH = 325;
type Lang = 'en' | 'es';
/** One page per module, whose caption says that module's sentences; sudoku's legend differs from n-queens'. */
const PAGES: { module: string; url: string }[] = [
  { module: 'sorting', url: '/sorting/insertion-sort' },
  { module: 'pathfinding', url: '/pathfinding' },
  { module: 'graphs', url: '/graphs' },
  { module: 'dp', url: '/dynamic-programming' },
  { module: 'structures', url: '/structures' },
  { module: 'backtracking', url: '/backtracking/n-queens' },
  { module: 'backtracking', url: '/backtracking/sudoku' },
  { module: 'fourier', url: '/fourier' },
];
const TOUR_KEYS = ['tour-done', 'tour-done-pathfinding', 'tour-done-graphs', 'tour-done-fourier', 'tour-done-structures', 'tour-done-dp', 'tour-done-backtracking'];
/** As src/utils/stepSentences.ts returns them (it isn't imported: this project doesn't typecheck src). */
type StepSentence = { sentence: string; run: string };

// src/i18n.ts reads the language from here when it loads.
declare global {
  var __LANG__: Lang | undefined;
}

/** The sentences as a page in `lang` says them: the language is fixed when `@/i18n` loads, so each gets a fresh load. */
const sentencesIn = async (lang: Lang): Promise<StepSentence[]> => {
  const root = path.resolve(import.meta.dirname, '..');
  globalThis.__LANG__ = lang;
  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, ws: false },
    resolve: { alias: { '@': path.join(root, 'src') } },
  });
  try {
    const { stepSentences } = (await server.ssrLoadModule('/src/utils/stepSentences.ts')) as { stepSentences: () => StepSentence[] };
    return stepSentences();
  } finally {
    await server.close();
    globalThis.__LANG__ = undefined;
  }
};

for (const lang of ['en', 'es'] as Lang[]) {
  test(`every step sentence fits in two lines in its module's caption (${lang})`, async ({ page }) => {
    test.setTimeout(300_000);

    const sentences = await sentencesIn(lang);
    expect(sentences.length).toBeGreaterThan(1000);

    await page.addInitScript((keys) => keys.forEach((key) => localStorage.setItem(key, 'true')), TOUR_KEYS);
    const tooLong: string[] = [];
    for (const { module, url } of PAGES) {
      const own = sentences.filter((s) => s.run.split(' ')[0] === module);
      expect(own.length, `${module} has sentences`).toBeGreaterThan(0);
      await page.goto(lang === 'en' ? url : `/es${url}`);
      await page.evaluate(() => document.fonts.ready);

      const { width, lines } = await page.locator('[data-tour="narration"]:visible').evaluate((caption, texts) => {
        // The room the text gets: the caption less its padding, its icon and the gap between them.
        const style = getComputedStyle(caption);
        const icon = caption.querySelector('svg')!.getBoundingClientRect().width;
        const width = caption.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - icon - parseFloat(style.columnGap);
        // A copy of the caption's text, that wide and in the same font, without the two-line cut.
        const probe = caption.querySelector('span')!.cloneNode() as HTMLElement;
        probe.classList.remove('line-clamp-2', 'min-h-[2lh]');
        Object.assign(probe.style, { position: 'absolute', left: '0', top: '0', visibility: 'hidden', width: `${width}px` });
        caption.append(probe);
        const lineHeight = parseFloat(getComputedStyle(probe).lineHeight);
        const lines = texts.map((text) => {
          probe.textContent = text;
          return Math.round(probe.getBoundingClientRect().height / lineHeight);
        });
        probe.remove();
        return { width, lines };
      }, own.map((s) => s.sentence));

      expect(width, `the caption on ${url} is narrower than on a phone`).toBeGreaterThanOrEqual(PHONE_TEXT_WIDTH);
      own.forEach((s, k) => {
        if (lines[k] > MAX_LINES) tooLong.push(`${lines[k]} lines at ${Math.round(width)}px on ${url} · ${s.run} · ${s.sentence}`);
      });
    }
    expect(tooLong, `${tooLong.length} step sentences take more than ${MAX_LINES} lines`).toEqual([]);
  });
}
