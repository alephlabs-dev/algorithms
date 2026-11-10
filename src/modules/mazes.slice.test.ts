import { describe, expect, it } from "vitest";
import { createAppStore } from "@/appStore";
import { routePath } from "@/routes";
import { linkFor, readLocation } from "@/urlState";
import { routeIn } from "./engine";
import { mazesSlice as slice, type MazesState } from "./mazes.slice";
import type { SliceContext } from "./slice";

const single: SliceContext = {
  view: "single",
  isModuleStart: false,
  speedPreset: "1x",
  isMobile: false,
  isPortrait: false,
};
const phone: SliceContext = { ...single, isMobile: true, isPortrait: true };
const apply = (s: MazesState, patch: Partial<MazesState> | null) => ({ ...s, ...patch });
const at = (path: string, search = "", ctx = single) => slice.hydrate(linkFor(readLocation(path, search), "mazes"), ctx);

/** The last frame as a learner sees it: which grid cells are open (not wall). */
const lastFrame = (s: MazesState) => s.run.frameAt(s.run.length - 1);
const isOpen = (s: MazesState, cell: number) => lastFrame(s).states[cell] !== 0;

/**
 * Checks the maze the last frame shows is perfect: maze cells sit on odd rows and columns,
 * every one of them is open and reachable from any other, and the passages between them
 * number cells − 1 (connected with exactly that many links means no loops).
 */
const expectPerfect = (s: MazesState) => {
  const { rows, cols } = s.run;
  const mazeCells: number[] = [];
  let passages = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const cell = r * cols + c;
      const border = r === 0 || c === 0 || r === rows - 1 || c === cols - 1;
      if (border) expect(isOpen(s, cell), `border cell ${r},${c} is wall`).toBe(false);
      else if (r % 2 === 1 && c % 2 === 1) mazeCells.push(cell);
      else if (r % 2 === 0 && c % 2 === 0) expect(isOpen(s, cell), `corner ${r},${c} is wall`).toBe(false);
      else if (isOpen(s, cell)) passages++;
    }
  expect(mazeCells.every((cell) => isOpen(s, cell)), "every maze cell is carved").toBe(true);
  const reached = new Set([mazeCells[0]]);
  const queue = [mazeCells[0]];
  while (queue.length) {
    const cell = queue.shift()!;
    for (const n of [cell - cols, cell + 1, cell + cols, cell - 1]) {
      if (isOpen(s, n) && !reached.has(n)) {
        reached.add(n);
        queue.push(n);
      }
    }
  }
  expect(mazeCells.every((cell) => reached.has(cell)), "every cell is connected").toBe(true);
  expect(passages, "passages = cells − 1").toBe(mazeCells.length - 1);
};

const SEEDS = Array.from({ length: 20 }, (_, k) => (k * 2654435761 + 17) >>> 0);

describe("mazes slice", () => {
  for (const size of ["small", "medium", "large"] as const)
    for (const ctx of [single, phone])
      it(`DFS carves a perfect maze on every ${size} grid (${ctx.isMobile ? "phone" : "wide"})`, () => {
        for (const seed of SEEDS) expectPerfect(at("/mazes/dfs", `?size=${size}&seed=${seed.toString(36)}`, ctx));
      });

  it("one decision per frame: start, each carve, each backtrack, then the dead ends (2n + 2 frames)", () => {
    const s = at("/mazes/dfs", "?size=small&seed=1");
    const cells = ((s.run.rows - 1) / 2) * ((s.run.cols - 1) / 2);
    expect(s.run.length).toBe(2 * cells + 2);
    // Every cell carved once and popped once: 2n steps, as the about text says.
    expect(lastFrame(s).stats.steps).toBe(2 * cells);
    expect(s.run.frameAt(0).states.every((state) => state === 0)).toBe(true);
  });

  it("the same link gives the same maze, frame for frame; another seed, another maze", () => {
    const a = at("/mazes/dfs", "?size=medium&seed=abc");
    const b = at("/mazes/dfs", "?size=medium&seed=abc");
    for (let i = 0; i < a.run.length; i++) expect(b.run.frameAt(i)).toEqual(a.run.frameAt(i));
    const other = at("/mazes/dfs", "?size=medium&seed=abd");
    expect(lastFrame(other).states).not.toEqual(lastFrame(a).states);
  });

  it("survives its own link: algorithm, size and seed", () => {
    const start = at("/mazes", "?size=large");
    const s = apply(start, slice.newInput(start, single));
    const reopened = at(routePath(routeIn("mazes", slice.current(s), single)), slice.engine.search(s, single));
    expect([reopened.algorithm, reopened.size, reopened.seed]).toEqual([s.algorithm, "large", s.seed]);
    expect(lastFrame(reopened)).toEqual(lastFrame(s));
  });

  it("new maze draws another seed and keeps the size", () => {
    const start = at("/mazes/dfs", "?size=small&seed=zz");
    const renewed = apply(start, slice.newInput(start, single));
    expect(renewed.size).toBe("small");
    expect(renewed.seed).not.toBe(start.seed);
    expect(renewed.inputId).toBe(start.inputId + 1);
    expect(lastFrame(renewed).states).not.toEqual(lastFrame(start).states);
  });

  it("a broken or missing seed falls back to a fresh, valid maze", () => {
    for (const search of ["", "?seed=***", "?seed=-1", "?size=huge&seed=zzzzzzzzzz"]) {
      const s = at("/mazes/dfs", search);
      expect(s.size).toBe("medium");
      expect(Number.isInteger(s.seed)).toBe(true);
      expectPerfect(s);
    }
    expect(at("/mazes/dfs").seed).not.toBe(at("/mazes/dfs").seed);
  });

  it("the dead ends in the stats are the cells the last frame marks", () => {
    for (const seed of SEEDS) {
      const s = at("/mazes/dfs", `?size=large&seed=${seed.toString(36)}`);
      const last = lastFrame(s);
      const { cols } = s.run;
      const marked = [...last.states.keys()].filter((cell) => last.states[cell] === 3);
      // A dead end, as the picture shows it: a carved cell with one open side.
      const oneWayOut = [...last.states.keys()].filter(
        (cell) => isOpen(s, cell) && [cell - cols, cell + 1, cell + cols, cell - 1].filter((n) => isOpen(s, n)).length === 1,
      );
      expect(marked.length).toBeGreaterThan(0);
      expect(marked).toEqual(oneWayOut);
      expect(last.stats.deadEnds).toBe(marked.length);
      expect(s.run.frameAt(s.run.length - 2).stats.deadEnds).toBeNull();
    }
  });

  it("a narrow screen lays the same seed out upright", () => {
    const wide = at("/mazes/dfs", "?size=small&seed=7");
    const upright = apply(wide, slice.fit!(wide, phone));
    expect(upright.run.rows).toBeGreaterThan(upright.run.cols);
    expect(upright.seed).toBe(wide.seed);
    expect(slice.fit!(upright, phone)).toBeNull();
  });
});

describe("mazes in the store", () => {
  it("new maze from the dock replaces the run and starts playback over", () => {
    const app = createAppStore({ url: readLocation("/mazes/dfs", "?seed=5"), isMobile: false, isPortrait: false, theme: "dark" });
    app.getState().seek(10);
    const before = app.getState().mazes.seed;
    app.getState().createNewArray();
    expect(app.getState().mazes.seed).not.toBe(before);
    expect(app.getState().frameIndex).toBe(0);
  });
});
