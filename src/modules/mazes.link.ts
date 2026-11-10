import { MAZE_ALGORITHMS } from "@/mazes/generators";
import type { MazeAlgorithm } from "@/mazes/types";
import { gridSizes, type GridSize } from "@/pathfinding/grid";
import { isOneOf, readRacers, speedParam, toQuery, type LinkCodec } from "./link";

/** A maze as a link carries it: the size and the seed, not the cells (like sorting's array). */
export type MazesLink = {
  size?: GridSize;
  seed?: number;
  /** Who races on the seed, in the picker's order. */
  racers?: MazeAlgorithm[];
};

export const mazesLink: LinkCodec<MazesLink> = {
  read: (params: URLSearchParams): MazesLink => {
    const link: MazesLink = {};
    const size = params.get("size");
    if (isOneOf(gridSizes, size)) link.size = size;
    const seed = parseInt(params.get("seed") ?? "", 36);
    if (Number.isInteger(seed) && seed >= 0 && seed < 2 ** 32) link.seed = seed;
    const racers = readRacers(params, MAZE_ALGORITHMS);
    if (racers) link.racers = racers;
    return link;
  },
  write: (link, speed) =>
    toQuery({
      size: link.size,
      seed: link.seed?.toString(36),
      race: link.racers?.join(","),
      ...speedParam(speed),
    }),
};
