import { colOf, rowOf, type PathAlgorithm, type PathTimeline } from "@/pathfinding";
import { count } from "./count";

const frontierName: Record<PathAlgorithm, string> = {
  bfs: "queue",
  dfs: "stack",
  dijkstra: "open set",
  astar: "open set",
  greedy: "open set",
};

/** One plain-language sentence for the search step that led to frame `index`. */
export const narratePath = (timeline: PathTimeline, index: number, algorithm: PathAlgorithm): string => {
  const step = timeline.stepAt(index);
  const { grid } = timeline;
  const at = (cell: number) => `row ${rowOf(grid, cell) + 1}, column ${colOf(grid, cell) + 1}`;
  if (!step) return "Press play to start the search. Drag on the grid to draw walls, or move the start and target.";

  switch (step.type) {
    case "visit": {
      if (step.cell === grid.start) return "Start the search from the green dot.";
      if (step.cell === grid.end) return "Reached the target!";
      const unit = algorithm === "bfs" || algorithm === "dfs" ? count(step.cost, "step") : `cost ${step.cost}`;
      return `Look at ${at(step.cell)}, ${unit} from the start.`;
    }
    case "frontier":
      if (step.cells.length === 1 && step.cells[0] === grid.start) return `Put the start in the ${frontierName[algorithm]}.`;
      return `Add ${count(step.cells.length, "neighbour")} to the ${frontierName[algorithm]}.`;
    case "path": {
      const frame = timeline.frameAt(index);
      if (step.cell === grid.start) return "Trace the path back from the target to the start.";
      return `Path: ${count(frame.stats.pathLength, "step")} so far.`;
    }
    case "done": {
      const { stats } = timeline.frameAt(index);
      if (!step.found) return `No path: the target can't be reached. Looked at ${count(stats.visited, "cell")}.`;
      const cost = stats.pathCost !== stats.pathLength ? ` (cost ${stats.pathCost}, mud included)` : "";
      return `Found a path of ${count(stats.pathLength, "step")}${cost}, after looking at ${count(stats.visited, "cell")}.`;
    }
  }
};
