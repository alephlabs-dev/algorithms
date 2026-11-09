// Records the README's media from the production build: one looping GIF per module
// (docs/readme/<module>.gif) and the hero video (docs/readme/hero.mp4, git-ignored).
// Run it with `make readme-media` after a UI change. Needs ffmpeg.
//
// Each clip opens a fixed link, so the run is the same every time, and the README
// links to that same run. Adding a module means adding one entry to CLIPS.
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, renameSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE_URL = process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? 4173}`;
const OUT = "docs/readme";
/** The hero is uploaded to GitHub by hand (a video in the repo would only show as a link), so it stays out of git. */
const HERO_OUT = "docs/readme/hero.mp4";
const VIEWPORT = { width: 1280, height: 800 };

/**
 * One clip per module. `path` is also the link under the GIF in the README.
 * `seconds` is how long to record after pressing play; `stage` is what the GIF crops to.
 */
export const CLIPS = [
  { module: "sorting", path: "/sorting/race?size=40&input=random&mode=bars&seed=1t56tk2&race=insertion,bubble,quick,merge&speed=4x", seconds: 7, stage: 'section[aria-label$="Sort"]' },
  { module: "pathfinding", path: "/pathfinding/race?grid=medium&cells=VVVVVVVVVVUFBAAEQAAABBQRVVERVVURUQQEBEAABAREURVRURURURVFAERAQAREQBQREVURURURUUAEQEAEQEBAEREVURFRFRVFREQERERAABQREREVURFRVUQEBAREQEBAEVFRFRVRVRVFBARABEQAQBRRUVURERUVUQAEAEAEAARAVVVVVVVVVVUB&from=7h&to=83&race=bfs,dijkstra,astar,greedy&speed=4x", seconds: 8 },
  { module: "graphs", path: "/graphs/dijkstra?graph=ArQLAAA12DVJTsFZa3vNexWmRLaYxmPG1ds2EQACAgoICAgHBQYIBAkHAQEDAgQCAQMCBwYFAQMFBAYHBgoGAgkIBAQDCAQHBwQABAECBg&nodes=medium&layout=random&speed=2x", seconds: 7 },
  { module: "structures", path: "/structures/avl-tree?ops=i50.i30.i20.i70.i80.i75.i40.i35.i45.i10.i60.i90&values=medium&order=example&speed=4x", seconds: 7 },
  { module: "dp", path: "/dynamic-programming/edit-distance?a=KITTEN&b=SITTING&speed=4x", seconds: 7 },
  { module: "backtracking", path: "/backtracking/n-queens?speed=4x", seconds: 7, stage: '[data-tour="bars"], [data-tour="choices"]' },
  { module: "fourier", path: "/fourier/epicycles?circles=50&shape=heart&speed=2x", seconds: 7 },
];

/** The hero: a few modules, full window, one after another. */
const HERO = ["sorting", "pathfinding", "graphs", "fourier", "backtracking"];
const HERO_SECONDS = 5;

const TOUR_KEYS = ["tour-done", ...CLIPS.map((c) => `tour-done-${c.module}`)];

const ffmpeg = (...args) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });

/** Records one clip: opens the link, presses play, and returns the video plus where play started and the stage's box. */
const record = async (browser, dir, clip, seconds) => {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    locale: "en-US",
    colorScheme: "dark",
    recordVideo: { dir, size: VIEWPORT },
  });
  await context.addInitScript((keys) => keys.forEach((k) => localStorage.setItem(k, "true")), TOUR_KEYS);
  const opened = Date.now();
  const page = await context.newPage();
  await page.goto(BASE_URL + clip.path);
  await page.locator("html[data-ready]").waitFor({ state: "attached" });
  await page.waitForTimeout(600);
  const stage = await unionBox(page, clip.stage ?? '[data-tour="bars"]');
  const start = (Date.now() - opened) / 1000;
  await page.keyboard.press("Space");
  await page.waitForTimeout(seconds * 1000);
  const video = page.video();
  await context.close();
  return { file: await video.path(), start, stage };
};

/** The box around every visible element that matches. */
const unionBox = async (page, selector) => {
  const boxes = [];
  for (const el of await page.locator(`${selector} >> visible=true`).all()) boxes.push(await el.boundingBox());
  if (!boxes.length) throw new Error(`Nothing to crop to: ${selector}`);
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  const right = Math.max(...boxes.map((b) => b.x + b.width));
  const bottom = Math.max(...boxes.map((b) => b.y + b.height));
  return { x, y, width: right - x, height: bottom - y };
};

const even = (n) => Math.round(n / 2) * 2;

const main = async () => {
  mkdirSync(OUT, { recursive: true });
  const tmp = mkdtempSync(join(tmpdir(), "readme-media-"));
  const browser = await chromium.launch();
  try {
    for (const clip of CLIPS) {
      const { file, start, stage } = await record(browser, tmp, clip, clip.seconds);
      // Little room on top: the legend sits right above the stage and would show cut in half.
      const pad = 16;
      const top = 4;
      const x = Math.max(0, stage.x - pad);
      const y = Math.max(0, stage.y - top);
      const w = even(Math.min(VIEWPORT.width - x, stage.width + 2 * pad));
      const h = even(Math.min(VIEWPORT.height - y, stage.height + top + pad));
      const filters = `crop=${w}:${h}:${x}:${y},fps=12,scale=600:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`;
      ffmpeg("-ss", String(start), "-t", String(clip.seconds), "-i", file, "-vf", filters, "-loop", "0", join(OUT, `${clip.module}.gif`));
      console.log(`${clip.module}.gif`);
    }

    const parts = [];
    for (const module of HERO) {
      const clip = CLIPS.find((c) => c.module === module);
      const { file, start } = await record(browser, tmp, clip, HERO_SECONDS);
      const part = join(tmp, `hero-${module}.mp4`);
      ffmpeg("-ss", String(start), "-t", String(HERO_SECONDS), "-i", file, "-vf", "fps=30", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", part);
      parts.push(part);
    }
    const inputs = parts.flatMap((p) => ["-i", p]);
    const concat = `${parts.map((_, i) => `[${i}:v]`).join("")}concat=n=${parts.length}:v=1:a=0[v]`;
    const hero = join(tmp, "hero.mp4");
    ffmpeg(...inputs, "-filter_complex", concat, "-map", "[v]", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "22", "-movflags", "+faststart", hero);
    renameSync(hero, HERO_OUT);
    console.log("hero.mp4");
  } finally {
    await browser.close();
    rmSync(tmp, { recursive: true, force: true });
  }
};

await main();
