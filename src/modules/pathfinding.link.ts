import { gridSizes, type GridSize } from "@/utils/gridSize";
import { PATH_ALGORITHMS } from "@/pathfinding/searches";
import type { PathAlgorithm } from "@/pathfinding/types";
import { isOneOf, isPacked, readRacers, speedParam, toQuery, type LinkCodec } from "./link";

/** A pathfinding grid as a link carries it. Cells are checked against the size when the slice hydrates. */
export type PathfindingLink = {
  gridSize?: GridSize;
  /** Terrain, packed (see encodeCells). */
  cells?: string;
  start?: number;
  end?: number;
  /** Who races on the grid, in the picker's order. */
  racers?: PathAlgorithm[];
};

export const pathfindingLink: LinkCodec<PathfindingLink> = {
  read: (params: URLSearchParams): PathfindingLink => {
    const link: PathfindingLink = {};
    const gridSize = params.get("grid");
    if (isOneOf(gridSizes, gridSize)) link.gridSize = gridSize;
    const cells = params.get("cells");
    if (isPacked(cells)) link.cells = cells;
    const start = parseInt(params.get("from") ?? "", 36);
    const end = parseInt(params.get("to") ?? "", 36);
    if (Number.isInteger(start) && start >= 0) link.start = start;
    if (Number.isInteger(end) && end >= 0) link.end = end;
    const racers = readRacers(params, PATH_ALGORITHMS);
    if (racers) link.racers = racers;
    return link;
  },
  write: (link, speed) =>
    toQuery({
      grid: link.gridSize,
      cells: link.cells,
      from: link.start?.toString(36),
      to: link.end?.toString(36),
      race: link.racers?.join(","),
      ...speedParam(speed),
    }),
};
