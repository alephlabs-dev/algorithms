import type { StoreState } from "@/appStore";
import { routeIn, slices } from "@/modules/engine";
import type { Route } from "@/routes";
import type { SliceContext } from "@/modules/slice";
import type { CarvedMaze } from "@/utils/mazeGenerators";
import type { MazeRun } from "./run";
import { WALL } from "./types";

/** The maze a run leaves once it's done: any cell it didn't leave a wall is open. */
export const finishedMaze = (run: MazeRun): CarvedMaze => {
  const { states } = run.frameAt(run.length - 1);
  return { rows: run.rows, cols: run.cols, open: new Set([...states.keys()].filter((cell) => states[cell] !== WALL)) };
};

/** What the link reads from the store: the maze, pathfinding's slice, the speed and the screen. */
export type LinkInputs = Pick<StoreState, "mazes" | "pathfinding" | "speedPreset" | "isMobile" | "isPortrait" | "stageAspect">;

/**
 * Where solving the maze on stage takes the learner: pathfinding's page for its own algorithm,
 * with the maze in its link (written by pathfinding's link codec, so it opens in a new tab too).
 * In the app, `maze` goes to pathfinding's `openMaze` before switching to `route`.
 */
export const pathfindingLinkFor = (s: LinkInputs): { route: Route; search: string; maze: CarvedMaze } => {
  const maze = finishedMaze(s.mazes.run);
  const { speedPreset, isMobile, isPortrait, stageAspect } = s;
  const ctx: SliceContext = { view: "single", isModuleStart: false, speedPreset, isMobile, isPortrait, stageAspect };
  const pathfinding = slices.pathfinding;
  const opened = { ...s.pathfinding, ...pathfinding.actions.openMaze(s.pathfinding, ctx, maze, s.mazes.size) };
  return {
    route: routeIn("pathfinding", pathfinding.current(opened), ctx),
    search: pathfinding.engine.search(opened, ctx),
    maze,
  };
};
