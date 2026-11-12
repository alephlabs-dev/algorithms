import type { StageView } from "./appStore";
import { isOneOf, type LinkCodec } from "./modules/link";
import { slices, type SliceLink } from "./modules/engine";
import type { Link } from "./modules/slice";
import { modulePages, routeFromPath, type AlgorithmOf, type ModuleId } from "./routes";
import { droppedPresets, speedPresets, type SpeedPreset } from "./utils/speed";

/** Where the app opened: the page, the settings every module shares, and the open module's link. */
export type UrlLocation = {
  isLanding: boolean;
  isModuleStart: boolean;
  module: ModuleId;
  /** Race or single, when the page (or an old link) says. */
  view?: StageView;
  speed?: SpeedPreset;
  /** The open module's part of the link: its page's algorithm and the params its own codec read. */
  link: Link;
};

/** The speed in any module's link. Links with a preset that was dropped open at the nearest kept one. */
const readSpeed = (params: URLSearchParams): SpeedPreset | undefined => {
  const speed = params.get("speed");
  if (isOneOf(speedPresets, speed)) return speed;
  return droppedPresets.get(speed ?? "");
};

/** Sorting's algorithms: the ones it has pages for, in its manifest. */
const SORTING_ALGORITHMS = Object.keys(modulePages.sorting.slugs) as AlgorithmOf<"sorting">[];

/**
 * Before modules had pages, every link was sorting's home page with the algorithm
 * and view in the query (/?algo=quick&view=race). Those links still open them.
 */
const readLegacy = (params: URLSearchParams): { algorithm?: AlgorithmOf<"sorting">; view?: StageView } => {
  const algorithm = params.get("algo");
  const view = params.get("view");
  return {
    ...(isOneOf(SORTING_ALGORITHMS, algorithm) && { algorithm }),
    ...((view === "single" || view === "race") && { view }),
  };
};

/** Reads a full location: the page (path) wins over legacy query parameters, and only the open module reads its params. */
export const readLocation = (pathname: string, search: string): UrlLocation => {
  const params = new URLSearchParams(search);
  const route = routeFromPath(pathname);
  const page = route?.page === "home" ? null : route;
  const legacy = readLegacy(params);
  const module = page?.module ?? "sorting";
  // Legacy links were all sorting, so only sorting reads them, and the path still wins.
  const sorting = module === "sorting";
  const algorithm = page?.page === "algorithm" ? page.algorithm : sorting ? legacy.algorithm : undefined;
  const view = page?.page === "race" ? "race" : page?.page === "algorithm" || !sorting ? "single" : legacy.view;
  const speed = readSpeed(params);
  const { read } = slices[module].link as LinkCodec<object>;
  return {
    isLanding: !page && legacy.algorithm === undefined && legacy.view === undefined,
    isModuleStart: page?.page === "start",
    module,
    ...(view && { view }),
    ...(speed && { speed }),
    link: { ...(algorithm && { algorithm }), params: read(params) },
  };
};

const NO_LINK: Link = { params: {} };

/** A module's part of the link: the open module's, or nothing for the others. */
export const linkFor = <M extends ModuleId>(location: UrlLocation, module: M): SliceLink<M> =>
  (module === location.module ? location.link : NO_LINK) as SliceLink<M>;
