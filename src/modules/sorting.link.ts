import { sortAlgorithms } from "@/algorithms";
import { displayModes } from "@/consts/displayModes";
import { inputOrders } from "@/consts/inputOrders";
import { sizes } from "@/consts/sizesMap";
import type { Algorithm, DisplayMode, InputOrder, Size } from "@/types";
import type { SpeedPreset } from "@/utils/speed";
import { isOneOf, readRacers, speedParam, toQuery } from "./link";

/** A sorting run as a link carries it. With the seed, a link reproduces the exact same array. */
export type SortingLink = {
  size?: Size;
  inputOrder?: InputOrder;
  displayMode?: DisplayMode;
  seed?: number;
  /** Who races on the array, in the picker's order. */
  racers?: Algorithm[];
};

const ORDER = Object.keys(sortAlgorithms) as Algorithm[];

export const sortingLink = {
  read: (params: URLSearchParams): SortingLink => {
    const link: SortingLink = {};
    const size = Number(params.get("size"));
    if (isOneOf(sizes, size)) link.size = size;
    const inputOrder = params.get("input");
    if (isOneOf(Object.keys(inputOrders) as InputOrder[], inputOrder)) link.inputOrder = inputOrder;
    const displayMode = params.get("mode");
    if (isOneOf(displayModes, displayMode)) link.displayMode = displayMode;
    const seed = parseInt(params.get("seed") ?? "", 36);
    if (Number.isInteger(seed) && seed >= 0 && seed < 2 ** 32) link.seed = seed;
    const racers = readRacers(params, ORDER);
    if (racers) link.racers = racers;
    return link;
  },
  write: (link: Required<SortingLink>, speed: SpeedPreset) =>
    toQuery({
      size: String(link.size),
      input: link.inputOrder,
      mode: link.displayMode,
      ...speedParam(speed),
      seed: link.seed.toString(36),
      race: link.racers.join(","),
    }),
};
