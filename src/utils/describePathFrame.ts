import type { PathFrame } from "@/pathfinding";
import { count } from "./count";

/** What a frame shows, in words, for screen readers. */
export const describeFrame = (frame: PathFrame) =>
  frame.found === null
    ? `${count(frame.stats.visited, "cell")} looked at.`
    : frame.found
      ? `Path found, ${count(frame.stats.pathLength, "step")}.`
      : "No path.";
