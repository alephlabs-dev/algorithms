import { describe, expect, it } from "vitest";
import { createAppStore } from "@/appStore";
import { slices } from "@/modules/engine";
import { applyRoute } from "@/navigation";
import { routePath } from "@/routes";
import { linkFor, readLocation } from "@/urlState";
import { gridSizes, type GridSize } from "@/utils/gridSize";
import { isMazeCell } from "@/utils/mazeGenerators";
import { pathfindingLinkFor } from "./toPathfinding";
import { MAZE_ALGORITHMS, WALL, type MazeAlgorithm } from "./types";

const mazesAt = (algorithm: MazeAlgorithm, size: GridSize, isMobile = false) =>
  createAppStore({
    url: readLocation(routePath({ module: "mazes", page: "algorithm", algorithm }), `?size=${size}&seed=k1`),
    isMobile,
    isPortrait: isMobile,
    theme: "dark",
  });

/** The pathfinding grid a fresh page load opens on the link. */
const openedFrom = ({ route, search }: ReturnType<typeof pathfindingLinkFor>, isMobile = false) => {
  const location = readLocation(routePath(route), search);
  const ctx = { view: "single" as const, isModuleStart: false, speedPreset: "1x" as const, isMobile, isPortrait: isMobile };
  return { location, state: slices.pathfinding.hydrate(linkFor(location, "pathfinding"), ctx) };
};

/** Cells reachable from start, through open cells. */
const reachable = (grid: { rows: number; cols: number; cells: Uint8Array; start: number }) => {
  const seen = new Set([grid.start]);
  const queue = [grid.start];
  while (queue.length) {
    const cell = queue.shift()!;
    const row = Math.floor(cell / grid.cols);
    const col = cell % grid.cols;
    const around = [
      row > 0 ? cell - grid.cols : -1,
      col < grid.cols - 1 ? cell + 1 : -1,
      row < grid.rows - 1 ? cell + grid.cols : -1,
      col > 0 ? cell - 1 : -1,
    ];
    for (const n of around) if (n >= 0 && grid.cells[n] === 0 && !seen.has(n) && seen.add(n)) queue.push(n);
  }
  return seen;
};

describe("solving a maze from Mazes in pathfinding", () => {
  for (const algorithm of MAZE_ALGORITHMS)
    for (const size of gridSizes)
      for (const isMobile of [false, true])
        it(`${algorithm}, ${size}${isMobile ? " on a phone" : ""}: the link opens pathfinding on the maze as carved`, () => {
          const app = mazesAt(algorithm, size, isMobile);
          const { run } = app.getState().mazes;
          const { states } = run.frameAt(run.length - 1);
          const { location, state } = openedFrom(pathfindingLinkFor(app.getState()), isMobile);
          expect(location.module).toBe("pathfinding");
          expect(state.algorithm).toBe("astar");
          expect(state.gridSize).toBe(size);
          const { grid } = state;
          expect([grid.rows, grid.cols]).toEqual([run.rows, run.cols]);
          // Pathfinding's cells: 0 is open, 1 a wall.
          expect([...grid.cells]).toEqual([...states].map((s) => (s === WALL ? 1 : 0)));
          expect(grid.start).not.toBe(grid.end);
          expect(isMazeCell(grid, grid.start) && isMazeCell(grid, grid.end)).toBe(true);
          expect(reachable(grid).has(grid.end)).toBe(true);
        });

  it("follows pathfinding's own algorithm", () => {
    const app = mazesAt("prim", "small");
    app.getState().pick("pathfinding", "bfs");
    app.getState().pick("mazes", "prim");
    const { route } = pathfindingLinkFor(app.getState());
    expect(route).toEqual({ module: "pathfinding", page: "algorithm", algorithm: "bfs" });
  });

  it("in the app, opens the same grid a fresh page load of the link does", () => {
    const app = mazesAt("wilson", "large");
    const link = pathfindingLinkFor(app.getState());
    app.getState().actions.pathfinding.openMaze(link.maze, app.getState().mazes.size);
    applyRoute(app, link.route);
    const state = app.getState();
    expect([state.module, state.view]).toEqual(["pathfinding", "single"]);
    expect(state.pathfinding.gridSize).toBe("large");
    expect(state.pathfinding.grid).toEqual(openedFrom(link).state.grid);
    expect(state.pathfinding.run.frameAt(Infinity).found).toBe(true);
  });

  it("the maze is back as it was after a race that shrinks it", () => {
    const app = mazesAt("kruskal", "large");
    const link = pathfindingLinkFor(app.getState());
    app.getState().actions.pathfinding.openMaze(link.maze, "large");
    applyRoute(app, link.route);
    const imported = app.getState().pathfinding.grid;
    app.getState().setView("race");
    expect(app.getState().pathfinding.gridSize).toBe("medium");
    app.getState().setView("single");
    expect(app.getState().pathfinding.gridSize).toBe("large");
    expect(app.getState().pathfinding.grid).toEqual(imported);
  });
});
