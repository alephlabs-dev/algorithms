import { describe, expect, it } from "vitest";
import { createAppStore, selectLastIndex, selectRaceRuns } from "@/appStore";
import { href, routePath } from "@/routes";
import { routeIn } from "@/routes";
import { linkFor, readLocation } from "@/urlState";
import { pathfindingSlice as slice, type PathfindingState } from "./slice";
import { encodeCells } from "@/utils/gridLink";
import { MUD, WALL } from "./types";
import { applyRoute, searchFor } from "@/navigation";
import { MAX_RACERS, type SliceContext } from "@/modules/slice";

const single: SliceContext = {
  view: "single",
  isModuleStart: false,
  speedPreset: "1x",
  isMobile: false,
  isPortrait: false,
};
const race: SliceContext = { ...single, view: "race" };
const at = (path: string, search = "", ctx = single) => slice.hydrate(linkFor(readLocation(path, search), "pathfinding"), ctx);
const apply = (s: PathfindingState, patch: Partial<PathfindingState> | null) => ({ ...s, ...patch });

describe("pathfinding slice", () => {
  it("opens on A* over a medium maze, painting walls", () => {
    const s = at("/pathfinding");
    expect([s.algorithm, s.gridSize, s.gridPreset, s.brush]).toEqual(["astar", "medium", "maze", "wall"]);
    expect(s.raceRuns).toEqual([]);
  });

  it("survives its own link", () => {
    const start = at("/pathfinding");
    const s = apply(start, slice.actions.toggleRacer(start, single, "bfs"));
    const reopened = at(routePath(routeIn("pathfinding", slice.current(s), single)), slice.engine.search(s, single));
    expect([reopened.algorithm, reopened.gridSize, reopened.racers]).toEqual([s.algorithm, s.gridSize, s.racers]);
    expect(reopened.grid).toEqual(s.grid);
  });

  it("a race lays a large grid out again at the largest size it shows well", () => {
    const start = at("/pathfinding");
    const big = apply(start, slice.actions.setGridSize(start, single, "large"));
    const racing = apply(big, slice.forView!(big, race));
    expect(racing.gridSize).toBe("medium");
    expect(racing.inputId).toBe(big.inputId + 1);
    expect(racing.raceRuns).toHaveLength(racing.racers.length);
  });

  it("new input makes another layout of the same kind; a clear grid becomes a maze", () => {
    const start = at("/pathfinding");
    const clear = apply(start, slice.actions.applyGridPreset(start, single, "clear"));
    expect(apply(clear, slice.newInput(clear, single)).gridPreset).toBe("maze");
    const walls = apply(start, slice.actions.applyGridPreset(start, single, "walls"));
    const renewed = apply(walls, slice.newInput(walls, single));
    expect(renewed.gridPreset).toBe("walls");
    expect(renewed.inputId).toBe(walls.inputId + 1);
  });

  it("adding a racer to a full race gives up the last one", () => {
    const s = at("/pathfinding");
    expect(s.racers).toHaveLength(MAX_RACERS);
    const racers = slice.addRacer!(s, "dfs").racers!;
    expect(racers).toHaveLength(MAX_RACERS);
    expect(racers).toContain("dfs");
  });
});

describe("pathfinding in the store", () => {
  const storeAt = (path: string) =>
    createAppStore({ url: readLocation(path, ""), isMobile: false, isPortrait: false, theme: "dark" });

  it("changing the brush leaves playback where it is", () => {
    const app = storeAt(href({ module: "pathfinding", page: "algorithm", algorithm: "bfs" }));
    app.getState().seek(5);
    app.getState().actions.pathfinding.setBrush("mud");
    expect(app.getState().pathfinding.brush).toBe("mud");
    expect(app.getState().frameIndex).toBe(5);
  });

  it("racing an algorithm from another module opens the pathfinding race with it", () => {
    const app = storeAt(href({ module: "sorting", page: "algorithm", algorithm: "heap" }));
    app.getState().raceWith("pathfinding", "dfs");
    const state = app.getState();
    expect([state.module, state.view]).toEqual(["pathfinding", "race"]);
    expect(state.pathfinding.racers).toContain("dfs");
    expect(selectRaceRuns(state)).toHaveLength(state.pathfinding.racers.length);
    expect(selectLastIndex(state)).toBeGreaterThan(0);
  });

  it("leaving the race gives back the grid size from before it", () => {
    const app = storeAt(href({ module: "pathfinding", page: "algorithm", algorithm: "astar" }));
    app.getState().actions.pathfinding.setGridSize("large");
    app.getState().setView("race");
    expect(app.getState().pathfinding.gridSize).toBe("medium");
    app.getState().setView("single");
    expect(app.getState().pathfinding.gridSize).toBe("large");
  });

  /** The grid on stage with walls and mud drawn on it, away from the markers. */
  const drawOn = (app: ReturnType<typeof storeAt>) => {
    const grid = app.getState().pathfinding.grid;
    const cells = new Uint8Array(grid.cells.length);
    const free = [...cells.keys()].filter((c) => c !== grid.start && c !== grid.end);
    for (const c of free.slice(0, 5)) cells[c] = WALL;
    for (const c of free.slice(5, 9)) cells[c] = MUD;
    app.getState().actions.pathfinding.editGrid({ ...grid, cells });
    return app.getState().pathfinding.grid;
  };

  it.each([
    [false, "large"],
    [true, "medium"],
    [true, "large"],
  ] as const)("on a phone: %s, a %s grid the learner drew is back as it was after a race that shrinks it", (isMobile, size) => {
    const app = createAppStore({
      url: readLocation("/pathfinding/a-star", ""),
      isMobile,
      isPortrait: isMobile,
      theme: "dark",
    });
    app.getState().actions.pathfinding.setGridSize(size);
    const drawn = drawOn(app);
    app.getState().setView("race");
    expect(app.getState().pathfinding.gridSize).not.toBe(size);
    app.getState().setView("single");
    expect(app.getState().pathfinding.gridSize).toBe(size);
    expect(app.getState().pathfinding.grid).toEqual(drawn);
  });

  it("a screen turned and back during the race still gives the drawn grid back", () => {
    const app = storeAt(href({ module: "pathfinding", page: "algorithm", algorithm: "astar" }));
    app.getState().actions.pathfinding.setGridSize("large");
    const drawn = drawOn(app);
    app.getState().setView("race");
    app.getState().setIsPortrait(true);
    app.getState().setIsPortrait(false);
    app.getState().setView("single");
    expect(app.getState().pathfinding.grid).toEqual(drawn);
  });

  it.each([
    ["the size", (app: ReturnType<typeof storeAt>) => app.getState().actions.pathfinding.setGridSize("medium")],
    ["the preset", (app: ReturnType<typeof storeAt>) => app.getState().actions.pathfinding.applyGridPreset("walls")],
    ["the grid", (app: ReturnType<typeof storeAt>) => drawOn(app)],
    ["to a new layout", (app: ReturnType<typeof storeAt>) => app.getState().createNewArray()],
  ])("a grid changed during the race isn't brought back after it: %s", (_, change) => {
    const app = storeAt(href({ module: "pathfinding", page: "algorithm", algorithm: "astar" }));
    app.getState().actions.pathfinding.setGridSize("large");
    const drawn = drawOn(app);
    app.getState().setView("race");
    change(app);
    app.getState().setView("single");
    expect(app.getState().pathfinding.grid).not.toEqual(drawn);
  });

  /** Pathfinding with the learner's own touches: a drawn grid, mud brush, three racers, a few steps in. */
  const touched = () => {
    const app = storeAt(href({ module: "pathfinding", page: "algorithm", algorithm: "astar" }));
    const drawn = drawOn(app);
    app.getState().actions.pathfinding.setBrush("mud");
    app.getState().actions.pathfinding.toggleRacer("greedy");
    app.getState().seek(5);
    return { app, drawn, racers: app.getState().pathfinding.racers };
  };
  const astar = { module: "pathfinding", page: "algorithm", algorithm: "astar" } as const;

  it("a page link without a query leaves the module as it was", () => {
    const { app, drawn, racers } = touched();
    applyRoute(app, astar);
    applyRoute(app, astar, "");
    const s = app.getState();
    expect([s.pathfinding.grid, s.pathfinding.brush, s.pathfinding.racers, s.frameIndex]).toEqual([drawn, "mud", racers, 5]);
  });

  it("a link with only a speed changes only the speed", () => {
    const { app, drawn, racers } = touched();
    applyRoute(app, astar, "?speed=4x");
    const s = app.getState();
    expect(s.speedPreset).toBe("4x");
    expect([s.pathfinding.grid, s.pathfinding.brush, s.pathfinding.racers, s.frameIndex]).toEqual([drawn, "mud", racers, 5]);
  });

  it("a link with a grid replaces the grid, and only what else it names", () => {
    const { app, racers } = touched();
    const { rows, cols } = app.getState().pathfinding.grid;
    const cells = new Uint8Array(rows * cols);
    cells[0] = WALL;
    applyRoute(app, { module: "pathfinding", page: "algorithm", algorithm: "bfs" }, `?grid=medium&cells=${encodeCells(cells)}&from=1&to=2`);
    const s = app.getState().pathfinding;
    expect([s.algorithm, s.grid.cells, s.grid.start, s.grid.end]).toEqual(["bfs", cells, 1, 2]);
    expect([s.brush, s.racers]).toEqual(["mud", racers]);
    expect(s.run.frameAt(Infinity).found).toBe(true);
  });

  it("a grid size picked during the race is the one kept after it", () => {
    const app = storeAt(href({ module: "pathfinding", page: "algorithm", algorithm: "astar" }));
    app.getState().actions.pathfinding.setGridSize("large");
    app.getState().setView("race");
    app.getState().actions.pathfinding.setGridSize("small");
    app.getState().setView("single");
    expect(app.getState().pathfinding.gridSize).toBe("small");
  });
});

describe("pathfinding on a phone's stage", () => {
  const onPhone = (search = "") =>
    createAppStore({ url: readLocation("/pathfinding", search), isMobile: true, isPortrait: true, theme: "dark" });
  // iPhone Safari with its bars: a 361 × 259 stage.
  const SAFARI = 259 / 361;
  const shape = (app: ReturnType<typeof onPhone>) => [app.getState().pathfinding.grid.rows, app.getState().pathfinding.grid.cols];
  const isValid = (grid: PathfindingState["grid"]) =>
    grid.cells.length === grid.rows * grid.cols &&
    grid.start < grid.cells.length &&
    grid.end < grid.cells.length &&
    grid.start !== grid.end;

  it("lays out as many rows as the stage holds at the width's cell size", () => {
    const app = onPhone();
    app.getState().setStageAspect(SAFARI);
    expect(shape(app)).toEqual([7, 11]);
    expect(isValid(app.getState().pathfinding.grid)).toBe(true);
    expect(app.getState().pathfinding.run.frameAt(Infinity).found).toBe(true);
  });

  it("a link made on this phone opens the same grid", () => {
    const made = onPhone();
    made.getState().setStageAspect(SAFARI);
    const opened = onPhone(searchFor(made.getState()));
    opened.getState().setStageAspect(SAFARI);
    expect(opened.getState().pathfinding.grid).toEqual(made.getState().pathfinding.grid);
  });

  it("a link from the old 13 × 11 phone grid still opens that grid", () => {
    // No walls; start and target on the middle row, as a new grid has them.
    const cells = encodeCells(new Uint8Array(13 * 11));
    const app = onPhone(`?grid=small&cells=${cells}&from=${(6 * 11 + 1).toString(36)}&to=${(6 * 11 + 9).toString(36)}`);
    app.getState().setStageAspect(SAFARI);
    const { grid, run } = app.getState().pathfinding;
    expect([grid.rows, grid.cols, grid.start, grid.end]).toEqual([13, 11, 67, 75]);
    expect(run.frameAt(Infinity).found).toBe(true);
  });

  it("a link whose cells fit no grid of its size opens a fresh one that fits the stage", () => {
    const app = onPhone(`?grid=small&cells=${encodeCells(new Uint8Array(12 * 11))}&from=1&to=2`);
    app.getState().setStageAspect(SAFARI);
    expect(shape(app)).toEqual([7, 11]);
    expect(isValid(app.getState().pathfinding.grid)).toBe(true);
  });

  it("a desktop link's grid doesn't fit a phone: it opens a fresh one that fits the stage", () => {
    // The wide small grid is 11 × 21: as many cells as an upright 21 × 11.
    const cells = encodeCells(new Uint8Array(11 * 21));
    const app = onPhone(`?grid=small&cells=${cells}&from=${(5 * 21 + 3).toString(36)}&to=${(5 * 21 + 17).toString(36)}`);
    app.getState().setStageAspect(SAFARI);
    expect(shape(app)).toEqual([7, 11]);
    expect(isValid(app.getState().pathfinding.grid)).toBe(true);
  });

  it("the stage changing shape mid-run leaves the run alone", () => {
    const app = onPhone();
    app.getState().setStageAspect(SAFARI);
    app.getState().seek(3);
    const { grid } = app.getState().pathfinding;
    app.getState().setStageAspect(452 / 361);
    expect(app.getState().pathfinding.grid).toBe(grid);
    expect(app.getState().frameIndex).toBe(3);
    // A new grid fits the stage it has now.
    app.getState().actions.pathfinding.setGridSize("small");
    expect(shape(app)).toEqual([13, 11]);
  });

  it("a grid the learner painted stays when the stage changes shape", () => {
    const app = onPhone();
    app.getState().setStageAspect(SAFARI);
    const painted = { ...app.getState().pathfinding.grid, cells: new Uint8Array(7 * 11) };
    app.getState().actions.pathfinding.editGrid(painted);
    app.getState().setStageAspect(452 / 361);
    expect(app.getState().pathfinding.grid).toEqual(painted);
  });

  it("a new size fits the stage", () => {
    const app = onPhone();
    app.getState().setStageAspect(SAFARI);
    app.getState().actions.pathfinding.setGridSize("large");
    expect(shape(app)).toEqual([15, 21]);
  });
});
