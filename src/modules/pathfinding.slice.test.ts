import { describe, expect, it } from "vitest";
import { createAppStore, selectLastIndex, selectRaceRuns } from "@/appStore";
import { href, routePath } from "@/routes";
import { routeIn } from "./engine";
import { linkFor, readLocation } from "@/urlState";
import { pathfindingSlice as slice, type PathfindingState } from "./pathfinding.slice";
import { MAX_RACERS, type SliceContext } from "./slice";

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
});
