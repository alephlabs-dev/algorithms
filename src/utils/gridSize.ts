/**
 * Grid sizes shared by the grid modules (pathfinding and mazes): the sizes, their
 * rows × columns, and how a race caps them.
 */

export type GridSize = "small" | "medium" | "large";

/**
 * Rows × columns per size: odd numbers, so mazes have walls all around. Wide
 * screens get landscape grids; phones get taller ones that fit their stage.
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
