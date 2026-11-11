import type { ModuleId } from "@/routes";
import { backtrackingContent } from "./backtracking/content";
import { dpContent } from "./dp/content";
import { fourierContent } from "./fourier/content";
import { graphsContent } from "./graphs/content";
import { mazesContent } from "./mazes/content";
import { pathfindingContent } from "./pathfinding/content";
import { sortingContent } from "./sorting/content";
import { structuresContent } from "./structures/content";
import type { ModuleContent } from "./types";

/**
 * Every module's content: what the prerendered pages show of it (articles, landing thumbnail).
 * The prerender loads it in Node, so nothing here reaches the store, an interface or a slice.
 * Adding a module: a content.tsx and an entry here.
 */
export const moduleContents: { [M in ModuleId]: ModuleContent<M> } = {
  sorting: sortingContent,
  pathfinding: pathfindingContent,
  graphs: graphsContent,
  fourier: fourierContent,
  structures: structuresContent,
  dp: dpContent,
  backtracking: backtrackingContent,
  mazes: mazesContent,
};
