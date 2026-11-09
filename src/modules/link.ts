import { DEFAULT_PRESET, type SpeedPreset } from "@/utils/speed";
import { MAX_RACERS, MIN_RACERS } from "./slice";

/** Helpers every module's link codec shares (see ./<id>.link.ts). */

export const isOneOf = <T extends string | number>(options: readonly T[], value: unknown): value is T =>
  options.includes(value as T);

/** Packed data (a grid, a graph, a drawing) travels as URL-safe base64. */
export const isPacked = (value: string | null): value is string => !!value && /^[A-Za-z0-9_-]+$/.test(value);

/** `race=a,b,c`: the racers it names that `order` has, once each and in `order`; none unless there are MIN_RACERS to MAX_RACERS. */
export const readRacers = <T extends string>(params: URLSearchParams, order: readonly T[]): T[] | undefined => {
  const named = (params.get("race") ?? "").split(",");
  const racers = order.filter((a) => named.includes(a));
  return racers.length >= MIN_RACERS && racers.length <= MAX_RACERS ? racers : undefined;
};

/** The speed, when it isn't the default (the default stays out of links). */
export const speedParam = (speed: SpeedPreset | undefined) =>
  speed !== undefined && speed !== DEFAULT_PRESET ? { speed } : {};

/** A query string from a module's params, in the order given; params left undefined stay out. */
export const toQuery = (params: Record<string, string | undefined>) =>
  "?" + new URLSearchParams(Object.entries(params).filter((entry): entry is [string, string] => entry[1] !== undefined)).toString();
