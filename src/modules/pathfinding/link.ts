import { PATH_ALGORITHMS } from "./searches";
import type { PathAlgorithm } from "./types";
import { readRacers, speedParam, toQuery, type LinkCodec } from "@/modules/link";
import { gridParams, readGridLink, type GridLink } from "@/utils/gridLink";

/** A pathfinding grid as a link carries it (the shared grid link), and who races on it. */
export type PathfindingLink = GridLink & {
  /** Who races on the grid, in the picker's order. */
  racers?: PathAlgorithm[];
};

export const pathfindingLink: LinkCodec<PathfindingLink> = {
  read: (params: URLSearchParams): PathfindingLink => {
    const link: PathfindingLink = readGridLink(params);
    const racers = readRacers(params, PATH_ALGORITHMS);
    if (racers) link.racers = racers;
    return link;
  },
  write: (link, speed) => toQuery({ ...gridParams(link), race: link.racers?.join(","), ...speedParam(speed) }),
};
