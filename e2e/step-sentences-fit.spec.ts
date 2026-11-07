import path from 'node:path';
import { test, expect } from '@playwright/test';
import { createServer } from 'vite';

// The step sentence above the stage is always two lines tall, so the stage never moves (#111), and cuts
// what doesn't fit (#113). So every sentence must fit in two lines on the narrowest screen we design
// for, 393px, in both languages: this generates the sentences of representative runs of every module
// (src/utils/stepSentences.ts) and measures each one in the real caption.

const MAX_LINES = 2;
const PAGES = { en: '/sorting', es: '/es/sorting' } as const;
type Lang = keyof typeof PAGES;
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

for (const lang of Object.keys(PAGES) as Lang[]) {
  test(`every step sentence fits in two lines at 393px (${lang})`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'iphone', 'measured at 393px, the iPhone project');
    test.setTimeout(120_000);
    expect(page.viewportSize()?.width).toBe(393);

    const sentences = await sentencesIn(lang);
    expect(sentences.length).toBeGreaterThan(1000);

    await page.addInitScript(() => localStorage.setItem('tour-done', 'true'));
    await page.goto(PAGES[lang]);
    await page.evaluate(() => document.fonts.ready);

    const lines = await page.locator('[data-tour="narration"] > span').evaluate((caption, texts) => {
      // A copy of the caption's text, as wide as it and in the same font, without the two-line cut.
      const probe = caption.cloneNode() as HTMLElement;
      probe.classList.remove('line-clamp-2', 'min-h-[2lh]');
      Object.assign(probe.style, { position: 'absolute', left: '0', top: '0', visibility: 'hidden', width: `${caption.getBoundingClientRect().width}px` });
      caption.parentElement!.append(probe);
      const lineHeight = parseFloat(getComputedStyle(probe).lineHeight);
      const counts = texts.map((text) => {
        probe.textContent = text;
        return Math.round(probe.getBoundingClientRect().height / lineHeight);
      });
      probe.remove();
      return counts;
    }, sentences.map((s) => s.sentence));

    const tooLong = sentences
      .map((s, k) => ({ ...s, lines: lines[k] }))
      .filter((s) => s.lines > MAX_LINES)
      .map((s) => `${s.lines} lines · ${s.run} · ${s.sentence}`);
    expect(tooLong, `${tooLong.length} step sentences take more than ${MAX_LINES} lines at 393px`).toEqual([]);
  });
}
