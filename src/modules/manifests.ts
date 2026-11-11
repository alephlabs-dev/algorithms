import { backtrackingManifest } from "./backtracking/manifest";
import { dpManifest } from "./dp/manifest";
import { fourierManifest } from "./fourier/manifest";
import { graphsManifest } from "./graphs/manifest";
import { mazesManifest } from "./mazes/manifest";
import { pathfindingManifest } from "./pathfinding/manifest";
import { sortingManifest } from "./sorting/manifest";
import { structuresManifest } from "./structures/manifest";

/**
 * Every module's manifest (./<id>/manifest.ts), by id: the one place a module is registered with
 * the router, the prerender and e2e. Its keys are the module ids, and their order is the order
 * modules appear in (landing, menu, sitemap). Runs in Node, so it imports only the manifests.
 */
export const manifests = {
  sorting: sortingManifest,
  pathfinding: pathfindingManifest,
  graphs: graphsManifest,
  fourier: fourierManifest,
  structures: structuresManifest,
  dp: dpManifest,
  backtracking: backtrackingManifest,
  mazes: mazesManifest,
};
