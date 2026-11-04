import { sortAlgorithms } from "./algorithms";
import { displayModes } from "./consts/displayModes";
import { inputOrders } from "./consts/inputOrders";
import { sizes } from "./consts/sizesMap";
import type { Algorithm, DisplayMode, InputOrder, Size } from "./types";
import { DEFAULT_PRESET, speedPresets, type SpeedPreset } from "./utils/speed";

// Kept in sync with MIN_RACERS / MAX_RACERS in the store (not imported to avoid a cycle).
const MIN_RACERS = 2;
const MAX_RACERS = 4;

/** The settings a link can carry. With the seed, a link reproduces the exact same array. */
export type UrlState = {
  algorithm: Algorithm;
  size: Size;
  inputOrder: InputOrder;
  displayMode: DisplayMode;
  /** Left out of the URL when it's the default. */
  speed?: SpeedPreset;
  seed: number;
  view: "single" | "race";
  raceAlgorithms: Algorithm[];
};

const isOneOf = <T extends string | number>(options: readonly T[], value: unknown): value is T =>
  options.includes(value as T);

/** Reads whatever valid settings the URL has; anything missing or malformed is skipped. */
export const readUrlState = (search: string): Partial<UrlState> => {
  const params = new URLSearchParams(search);
  const state: Partial<UrlState> = {};

  const algorithm = params.get("algo");
  if (isOneOf(Object.keys(sortAlgorithms) as Algorithm[], algorithm)) state.algorithm = algorithm;

  const size = Number(params.get("size"));
  if (isOneOf(sizes, size)) state.size = size;

  const inputOrder = params.get("input");
  if (isOneOf(Object.keys(inputOrders) as InputOrder[], inputOrder)) state.inputOrder = inputOrder;

  const displayMode = params.get("mode");
  if (isOneOf(displayModes, displayMode)) state.displayMode = displayMode;

  const speed = params.get("speed");
  if (isOneOf(speedPresets, speed)) state.speed = speed;
  // Links from before the presets were all multiples.
  else if (speed === "max") state.speed = "8x";

  const seed = parseInt(params.get("seed") ?? "", 36);
  if (Number.isInteger(seed) && seed >= 0 && seed < 2 ** 32) state.seed = seed;

  const view = params.get("view");
  if (view === "single" || view === "race") state.view = view;

  const algorithms = Object.keys(sortAlgorithms) as Algorithm[];
  const racers = (params.get("race") ?? "").split(",").filter((a) => isOneOf(algorithms, a));
  const unique = algorithms.filter((a) => racers.includes(a));
  if (unique.length >= MIN_RACERS && unique.length <= MAX_RACERS) state.raceAlgorithms = unique;

  return state;
};

export const toSearch = (state: UrlState) =>
  "?" +
  new URLSearchParams({
    algo: state.algorithm,
    size: String(state.size),
    input: state.inputOrder,
    mode: state.displayMode,
    ...(state.speed !== undefined && state.speed !== DEFAULT_PRESET && { speed: state.speed }),
    seed: state.seed.toString(36),
    view: state.view,
    race: state.raceAlgorithms.join(","),
  }).toString();
