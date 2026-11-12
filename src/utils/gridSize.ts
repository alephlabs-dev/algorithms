/**
 * Grid sizes shared by the grid modules (pathfinding and mazes): the sizes, their
 * rows × columns, and how a race caps them.
 */

export type GridSize = "small" | "medium" | "large";

/**
 * Rows × columns per size: odd numbers, so mazes have walls all around. Wide
 * screens get landscape grids; portrait ones get upright grids. A phone keeps the
 * upright columns and takes its rows from its stage (see stageGridDimensions).
 */
const dimensions: Record<GridSize, { wide: [number, number]; phone: [number, number] }> = {
  small: { wide: [11, 21], phone: [13, 11] },
  medium: { wide: [17, 33], phone: [19, 15] },
  large: { wide: [25, 49], phone: [27, 21] },
};

export const gridSizes: GridSize[] = ["small", "medium", "large"];

/** Race lanes are a quarter of the stage, so bigger grids get too small to follow. */
export const raceMaxGridSize = (isMobile: boolean): GridSize => (isMobile ? "small" : "medium");

/** The grid size to use: the one asked for, capped in a race. */
export const fitGridSize = (size: GridSize, view: "single" | "race", isMobile: boolean): GridSize => {
  const cap = raceMaxGridSize(isMobile);
  return view === "race" && gridSizes.indexOf(size) > gridSizes.indexOf(cap) ? cap : size;
};

/**
 * The grid size a view shows, and the size to give back when the race ends (`beforeRace`).
 * A race caps a big size and remembers it; single view gives the remembered size back.
 */
export const sizeForView = (
  size: GridSize,
  beforeRace: GridSize | null,
  view: "single" | "race",
  isMobile: boolean,
): { size: GridSize; beforeRace: GridSize | null } => {
  if (view === "single") return { size: beforeRace ?? size, beforeRace: null };
  const fitted = fitGridSize(size, view, isMobile);
  return { size: fitted, beforeRace: fitted === size ? beforeRace : size };
};

export const gridDimensions = (size: GridSize, isMobile: boolean) => {
  const [rows, cols] = dimensions[size][isMobile ? "phone" : "wide"];
  return { rows, cols };
};

/** The fewest rows a phone grid gets, however short its stage. */
export const MIN_PHONE_ROWS = 5;

/**
 * The screen a grid is laid out for: phones and portrait windows get upright grids, and a
 * phone's stage shape (height over width, null until measured) picks how many rows it gets
 * in single view. Race lanes keep the fixed grids.
 */
export type GridScreen = {
  isMobile: boolean;
  isPortrait: boolean;
  stageAspect?: number | null;
  view?: "single" | "race";
};

/**
 * Rows × columns for a screen. A phone keeps its upright columns and gets as many rows as its
 * stage holds at the cell size the width gives (an odd number, so mazes have walls all around):
 * the grid spans the stage's width however much height the browser's bars leave.
 * Tablets and desktops keep their fixed grids.
 */
export const stageGridDimensions = (size: GridSize, screen: GridScreen) => {
  const upright = gridDimensions(size, screen.isMobile || screen.isPortrait);
  if (!screen.isMobile || !screen.stageAspect || screen.view === "race") return upright;
  const fit = Math.floor(screen.stageAspect * upright.cols);
  const odd = fit % 2 === 0 ? fit - 1 : fit;
  return { rows: Math.max(MIN_PHONE_ROWS, odd), cols: upright.cols };
};
