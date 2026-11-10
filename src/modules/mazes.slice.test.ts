import { describe, expect, it } from "vitest";
import { createAppStore } from "@/appStore";
import { routePath } from "@/routes";
import {
  ACTIVE,
  CARVED,
  FRONTIER,
  MAZE_ALGORITHMS,
  OTHER_REGION,
  REGION,
  SKIPPED,
  WALK,
  WALL,
  isMazeCell,
  mazePseudocode,
} from "@/mazes";
import { linkFor, readLocation } from "@/urlState";
import { routeIn } from "./engine";
import { mazesSlice as slice, type MazesState } from "./mazes.slice";
import { MAX_RACERS, type SliceContext } from "./slice";

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
  for (const algorithm of MAZE_ALGORITHMS)
    for (const size of ["small", "medium", "large"] as const)
      for (const ctx of [single, phone])
        it(`${algorithm} carves a perfect maze on every ${size} grid (${ctx.isMobile ? "phone" : "wide"})`, () => {
          for (const seed of SEEDS) {
            const s = at(`/mazes/${algorithm}`, `?size=${size}&seed=${seed.toString(36)}`, ctx);
            expect(s.algorithm).toBe(algorithm);
            expectPerfect(s);
          }
        });

  it("one decision per frame: start, each carve, each backtrack, then the dead ends (2n + 2 frames)", () => {
    const s = at("/mazes/dfs", "?size=small&seed=1");
    const cells = ((s.run.rows - 1) / 2) * ((s.run.cols - 1) / 2);
    expect(s.run.length).toBe(2 * cells + 2);
    // Every cell carved once and popped once: 2n steps, as the about text says.
    expect(lastFrame(s).stats.steps).toBe(2 * cells);
    expect(s.run.frameAt(0).states.every((state) => state === 0)).toBe(true);
  });

  it("Prim: the start and its frontier, then one pick per frame, then the dead ends (n + 2 frames)", () => {
    const s = at("/mazes/prim", "?size=small&seed=1");
    const { rows, cols } = s.run;
    const cells = ((rows - 1) / 2) * ((cols - 1) / 2);
    expect(s.run.length).toBe(cells + 2);
    expect(lastFrame(s).stats.steps).toBe(cells);
    const start = s.run.start!;
    const frontierOf = (i: number) =>
      [...s.run.frameAt(i).states.keys()].filter((c) => s.run.frameAt(i).states[c] === FRONTIER);
    // The first frame: the start cell carved, its neighbours on the frontier.
    const first = s.run.frameAt(1);
    expect(first.states[start]).not.toBe(0);
    expect(frontierOf(1).sort((a, b) => a - b)).toEqual(
      [start - 2 * cols, start - 2, start + 2, start + 2 * cols].filter((c) => {
        const r = Math.floor(c / cols);
        const col = c % cols;
        return r > 0 && r < rows - 1 && col > 0 && col < cols - 1 && Math.abs(col - (start % cols)) <= 2;
      }),
    );
    for (let i = 2; i < s.run.length - 1; i++) {
      const before = s.run.frameAt(i - 1);
      const frame = s.run.frameAt(i);
      // Each pick takes a frontier cell, highlights it and the wall it joins through, and carves both in.
      const picked = [...frame.states.keys()].filter((c) => frame.states[c] === ACTIVE);
      expect(picked, `frame ${i} highlights a cell and its wall`).toHaveLength(2);
      expect(picked).toContain(frame.current);
      expect(before.states[frame.current!], `frame ${i} picks from the frontier`).toBe(FRONTIER);
      const opened = (f: typeof frame) => [...f.states].filter((state) => state !== 0 && state !== FRONTIER).length;
      expect(opened(frame) - opened(before)).toBe(2);
    }
    expect(frontierOf(s.run.length - 1)).toEqual([]);
    expect([...lastFrame(s).states].includes(ACTIVE)).toBe(false);
  });

  describe("Kruskal", () => {
    const cellsOf = (s: MazesState, state: number, i: number) =>
      [...s.run.frameAt(i).states.keys()].filter((c) => s.run.frameAt(i).states[c] === state);
    /** The two maze cells a wall separates: above and below it, or left and right. */
    const sides = (s: MazesState, wall: number) =>
      Math.floor(wall / s.run.cols) % 2 === 0 ? [wall - s.run.cols, wall + s.run.cols] : [wall - 1, wall + 1];
    const runs = SEEDS.map((seed) => at("/mazes/kruskal", `?size=small&seed=${seed.toString(36)}`));

    it("starts with every cell carved, each its own region, and has no start cell", () => {
      for (const s of runs) {
        const cells = ((s.run.rows - 1) / 2) * ((s.run.cols - 1) / 2);
        expect(cellsOf(s, CARVED, 1)).toHaveLength(cells);
        expect(s.run.start).toBeNull();
      }
    });

    it("each frame tests one wall: carved between two regions, or skipped inside one", () => {
      for (const s of runs)
        for (let i = 2; i < s.run.length - 1; i++) {
          const carved = cellsOf(s, ACTIVE, i);
          const skipped = cellsOf(s, SKIPPED, i);
          expect(carved.length + skipped.length, `frame ${i} tests one wall`).toBe(1);
          const [a, b] = sides(s, carved[0] ?? skipped[0]);
          const region = cellsOf(s, REGION, i);
          const other = cellsOf(s, OTHER_REGION, i);
          if (carved.length) {
            // Two regions, each in its own tone, one on each side of the wall.
            expect(region, `frame ${i}`).toContain(a);
            expect(other, `frame ${i}`).toContain(b);
            expect(s.run.frameAt(i + 1).states[carved[0]], "a carved wall stays open").not.toBe(WALL);
          } else {
            // One region: both sides are in it already, so the wall would close a loop.
            expect(region, `frame ${i}`).toEqual(expect.arrayContaining([a, b]));
            expect(other, `frame ${i}`).toEqual([]);
            expect(s.run.frameAt(i + 1).states[skipped[0]], "a skipped wall stays a wall").toBe(WALL);
          }
        }
    });

    it("some seeds skip walls, and none is skipped after the last carve", () => {
      let skips = 0;
      for (const s of runs) {
        const cells = ((s.run.rows - 1) / 2) * ((s.run.cols - 1) / 2);
        const carves = [];
        for (let i = 2; i < s.run.length - 1; i++) {
          if (cellsOf(s, SKIPPED, i).length) skips++;
          else carves.push(i);
        }
        // n cells join through n - 1 walls; the run ends on the frame where the last one is carved.
        expect(carves).toHaveLength(cells - 1);
        expect(carves[carves.length - 1]).toBe(s.run.length - 2);
      }
      expect(skips).toBeGreaterThan(0);
    });
  });

  it("every algorithm on a seed starts from the same cell", () => {
    const dfs = at("/mazes/dfs", "?size=medium&seed=k3");
    const prim = apply(dfs, slice.pick(dfs, single, "prim"));
    expect(prim.algorithm).toBe("prim");
    expect(prim.seed).toBe(dfs.seed);
    expect(prim.run.start).toBe(dfs.run.start);
    expect(prim.run.length).not.toBe(dfs.run.length);
    const wilson = apply(dfs, slice.pick(dfs, single, "wilson"));
    expect(wilson.run.start).toBe(dfs.run.start);
  });

  /** The cells a frame shows on Wilson's walk: walk-toned, or the walk's move this frame. */
  const walkOf = (s: MazesState, i: number) => {
    const { states } = s.run.frameAt(i);
    // An ACTIVE cell is on the walk unless it's the maze cell the walk just reached.
    const wasCarved = (cell: number) => s.run.frameAt(i - 1).states[cell] === CARVED;
    return [...states.keys()].filter((c) => states[c] === WALK || (states[c] === ACTIVE && !wasCarved(c)));
  };

  it("Wilson: erasing a loop is its own frame, and takes the loop's cells off the walk", () => {
    const eraseLine = mazePseudocode.wilson.findIndex((line) => line.includes("erase the loop"));
    let erasures = 0;
    for (const seed of SEEDS) {
      const s = at("/mazes/wilson", `?size=medium&seed=${seed.toString(36)}`);
      for (let i = 2; i < s.run.length; i++) {
        if (s.run.frameAt(i).line !== eraseLine) continue;
        erasures++;
        const before = new Set(walkOf(s, i - 1));
        const after = walkOf(s, i);
        const gone = [...before].filter((c) => !after.includes(c));
        expect(gone.length, `frame ${i} takes the loop off the walk`).toBeGreaterThan(0);
        expect(gone.every((c) => s.run.frameAt(i).states[c] === WALL), `frame ${i} walls the loop in again`).toBe(true);
        expect(after.every((c) => before.has(c)), `frame ${i} adds nothing to the walk`).toBe(true);
        // What's left is still a walk: each of its walls lies between two of its cells.
        const { cols } = s.run;
        for (const wall of after.filter((c) => !isMazeCell(s.run, c))) {
          const ends = Math.floor(wall / cols) % 2 === 0 ? [wall - cols, wall + cols] : [wall - 1, wall + 1];
          expect(ends.every((c) => after.includes(c)), `frame ${i}: wall ${wall} joins two walk cells`).toBe(true);
        }
        expect(after.length, `frame ${i} keeps the walk up to where it crossed itself`).toBeGreaterThan(0);
        // The walk goes on from the cell where it crossed itself, which stays on it.
        expect(after).toContain(s.run.frameAt(i).current);
        // The step before closed the loop: it stepped onto a cell already on the walk.
        expect(before.has(s.run.frameAt(i - 1).current!)).toBe(true);
      }
    }
    expect(erasures, "some seed erases a loop").toBeGreaterThan(0);
  });

  it("Wilson: a walk that reaches the maze is carved in all at once", () => {
    const s = at("/mazes/wilson", "?size=medium&seed=k3");
    let joins = 0;
    for (let i = 2; i < s.run.length - 1; i++) {
      const before = walkOf(s, i - 1);
      const frame = s.run.frameAt(i);
      if (!before.length || walkOf(s, i).length || before.some((c) => frame.states[c] !== CARVED)) continue;
      joins++;
      // In one frame: every cell and wall of the walk (the wall into the maze included), and the
      // maze cell it reached, which the step before highlighted.
      const carved = (f: typeof frame) => [...f.states].filter((state) => state === CARVED).length;
      expect(carved(frame) - carved(s.run.frameAt(i - 1))).toBe(before.length + 1);
    }
    expect(joins).toBeGreaterThan(0);
    expect([...lastFrame(s).states].some((state) => state === WALK || state === ACTIVE)).toBe(false);
  });

  for (const algorithm of MAZE_ALGORITHMS) {
    it(`${algorithm}: the same link gives the same maze, frame for frame; another seed, another maze`, () => {
      const a = at(`/mazes/${algorithm}`, "?size=medium&seed=abc");
      const b = at(`/mazes/${algorithm}`, "?size=medium&seed=abc");
      for (let i = 0; i < a.run.length; i++) expect(b.run.frameAt(i)).toEqual(a.run.frameAt(i));
      const other = at(`/mazes/${algorithm}`, "?size=medium&seed=abd");
      expect(lastFrame(other).states).not.toEqual(lastFrame(a).states);
    });

    it(`${algorithm} survives its own link: algorithm, size and seed`, () => {
      const start = at(`/mazes/${algorithm}`, "?size=large");
      const s = apply(start, slice.newInput(start, single));
      const reopened = at(routePath(routeIn("mazes", slice.current(s), single)), slice.engine.search(s, single));
      expect([reopened.algorithm, reopened.size, reopened.seed]).toEqual([algorithm, "large", s.seed]);
      expect(lastFrame(reopened)).toEqual(lastFrame(s));
    });
  }

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
    for (const algorithm of MAZE_ALGORITHMS)
      for (const seed of SEEDS) {
        const s = at(`/mazes/${algorithm}`, `?size=large&seed=${seed.toString(36)}`);
        const last = lastFrame(s);
        const { cols } = s.run;
        const marked = [...last.states.keys()].filter((cell) => last.states[cell] === 3);
        // A dead end, as the picture shows it: a carved cell with one open side.
        const oneWayOut = [...last.states.keys()].filter(
          (cell) =>
            isOpen(s, cell) && [cell - cols, cell + 1, cell + cols, cell - 1].filter((n) => isOpen(s, n)).length === 1,
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

describe("mazes race", () => {
  const race: SliceContext = { ...single, view: "race" };
  const racing = (search: string, ctx = race) => {
    const s = at("/mazes/race", search, ctx);
    return apply(s, slice.forView!(s, ctx));
  };

  it("every racer carves the same seed, size and start cell", () => {
    const s = racing("?size=small&seed=abc");
    expect(s.raceRuns.map((r) => r.algorithm)).toEqual(s.racers);
    expect(s.racers).toEqual([...MAZE_ALGORITHMS]);
    for (const run of s.raceRuns) {
      expect(run.seed).toBe(s.seed);
      expect([run.rows, run.cols]).toEqual([s.run.rows, s.run.cols]);
    }
    // Kruskal has no start cell; every other racer starts where the single run does.
    const starts = s.raceRuns.map((r) => r.start).filter((start) => start !== null);
    expect(starts).toHaveLength(3);
    expect(new Set(starts)).toEqual(new Set([s.run.start]));
  });

  it("entering the race carves a large maze again at the capped size, from the same seed", () => {
    for (const [ctx, cap] of [
      [race, "medium"],
      [{ ...phone, view: "race" } as SliceContext, "small"],
    ] as const) {
      const big = at("/mazes/wilson", "?size=large&seed=abc", ctx.isMobile ? phone : single);
      const s = apply(big, slice.forView!(big, ctx));
      expect(s.size).toBe(cap);
      expect(s.seed).toBe(big.seed);
      expect(s.inputId).toBe(big.inputId + 1);
      expect(s.raceRuns.every((r) => r.rows === s.run.rows && r.cols === s.run.cols)).toBe(true);
    }
    // A medium maze already fits, so the same maze races.
    const medium = at("/mazes/dfs", "?size=medium&seed=abc");
    const kept = apply(medium, slice.forView!(medium, race));
    expect([kept.size, kept.inputId, kept.run]).toEqual([medium.size, medium.inputId, medium.run]);
    // Back in single view, the race runs go.
    expect(slice.forView!(kept, single).raceRuns).toEqual([]);
  });

  it("a race link opens capped, and the size picker stays capped in the race", () => {
    expect(racing("?size=large&seed=abc").size).toBe("medium");
    const s = racing("?size=small&seed=abc");
    expect(apply(s, slice.actions.setSize(s, race, "large")).size).toBe("medium");
  });

  it("race= round-trips through the link, and all four stay out of it", () => {
    const s = racing("?size=small&seed=abc&race=wilson,dfs");
    expect(s.racers).toEqual(["dfs", "wilson"]);
    const search = slice.engine.search(s, race);
    expect(search).toBe("?size=small&seed=abc&race=dfs%2Cwilson");
    expect(at("/mazes/race", search, race).racers).toEqual(["dfs", "wilson"]);
    expect(slice.engine.search(racing("?size=small&seed=abc"), race)).toBe("?size=small&seed=abc");
    // Too few, or a racer from another module: the default four.
    expect(racing("?race=dfs").racers).toEqual([...MAZE_ALGORITHMS]);
    expect(racing("?race=bfs,astar").racers).toEqual([...MAZE_ALGORITHMS]);
  });

  it("racers can be taken out down to two and added back up to four", () => {
    let s = racing("?size=small&seed=abc");
    expect(slice.actions.toggleRacer(s, race, "dfs")?.racers).toEqual(["prim", "kruskal", "wilson"]);
    s = apply(s, slice.actions.toggleRacer(s, race, "dfs"));
    s = apply(s, slice.actions.toggleRacer(s, race, "prim"));
    expect(s.racers).toEqual(["kruskal", "wilson"]);
    expect(s.raceRuns.map((r) => r.algorithm)).toEqual(["kruskal", "wilson"]);
    expect(slice.actions.toggleRacer(s, race, "wilson")).toBeNull();
    s = apply(s, slice.actions.toggleRacer(s, race, "dfs"));
    s = apply(s, slice.actions.toggleRacer(s, race, "prim"));
    expect(s.racers).toEqual([...MAZE_ALGORITHMS]);
    expect(s.raceRuns).toHaveLength(MAX_RACERS);
    // "Race it" from single view puts the generator back in the race, in the picker's order.
    s = apply(s, slice.actions.toggleRacer(s, race, "kruskal"));
    expect(slice.addRacer!(s, "kruskal").racers).toEqual(["dfs", "prim", "kruskal", "wilson"]);
  });

  it("the race clock runs until the longest carve is done, at one decision per tick for everyone", () => {
    const s = racing("?size=small&seed=abc");
    const longest = Math.max(...s.raceRuns.map((r) => r.length - 1));
    expect(slice.engine.lastIndex(s, "race")).toBe(longest);
    expect(slice.engine.pace("race")).toBe("mazeRace");
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
