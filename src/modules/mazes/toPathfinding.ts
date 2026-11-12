import type { StoreState } from "@/appStore";
import { speedParam, toQuery } from "@/modules/link";
import type { Route } from "@/routes";
import { CELL, encodeCells, gridParams, rowsParam } from "@/utils/gridLink";
import { WALL } from "./types";

/** What the link reads from the store: the maze, pathfinding's algorithm, the speed and the screen. */
export type LinkInputs = Pick<StoreState, "mazes" | "speedPreset" | "isMobile" | "isPortrait" | "stageAspect"> & {
  algorithm: StoreState["pathfinding"]["algorithm"];
};

/**
 * Where solving the maze on stage takes the learner: pathfinding's page for its own algorithm,
 * with the finished maze in the shared grid link. Walls where Mazes left walls, every other
 * cell open; start and end on the maze cells in opposite corners, so it stays a perfect maze.
 * In the app it opens like any link, from its query.
 */
export const pathfindingLinkFor = ({ mazes, algorithm, speedPreset, ...screen }: LinkInputs): { route: Route; search: string } => {
  const { run, size } = mazes;
  const { rows, cols } = run;
  const { states } = run.frameAt(run.length - 1);
  const cells = states.map((state) => (state === WALL ? CELL.wall : CELL.open));
  const link = {
    gridSize: size,
    cells: encodeCells(cells),
    rows: rowsParam(rows, size, screen),
    start: cols + 1,
    end: (rows - 2) * cols + cols - 2,
  };
  return {
    route: { module: "pathfinding", page: "algorithm", algorithm },
    search: toQuery({ ...gridParams(link), ...speedParam(speedPreset) }),
  };
};
