import { isOneOf, isPacked } from "@/modules/link";
import { gridSizes, stageGridDimensions, type GridScreen, type GridSize } from "./gridSize";

/**
 * A grid as a link carries it (pathfinding's page): its size, what each cell is, and the start
 * and end. Shared, so another module (Mazes) can write a link pathfinding opens.
 * Cells are checked against the size when pathfinding hydrates.
 */
export type GridLink = {
  gridSize?: GridSize;
  /** Each cell's code (CELL), packed (see encodeCells). */
  cells?: string;
  /** A phone's rows, which follow its stage; absent when the grid has the size's usual rows. */
  rows?: number;
  start?: number;
  end?: number;
};

/** What a cell is, as a link's cells say it: pathfinding's terrain. */
export const CELL = { open: 0, wall: 1, mud: 2 } as const;

/** The rows a size has before any stage is measured: a link without its own rows has these. */
export const usualRows = (size: GridSize, screen: GridScreen) => stageGridDimensions(size, { ...screen, stageAspect: null }).rows;

/** The rows a link names: none when they're the size's usual ones. */
export const rowsParam = (rows: number, size: GridSize, screen: GridScreen) => (rows === usualRows(size, screen) ? undefined : rows);

export const readGridLink = (params: URLSearchParams): GridLink => {
  const link: GridLink = {};
  const gridSize = params.get("grid");
  if (isOneOf(gridSizes, gridSize)) link.gridSize = gridSize;
  const cells = params.get("cells");
  if (isPacked(cells)) link.cells = cells;
  const rows = parseInt(params.get("rows") ?? "", 10);
  if (Number.isInteger(rows) && rows > 0) link.rows = rows;
  const start = parseInt(params.get("from") ?? "", 36);
  const end = parseInt(params.get("to") ?? "", 36);
  if (Number.isInteger(start) && start >= 0) link.start = start;
  if (Number.isInteger(end) && end >= 0) link.end = end;
  return link;
};

/** The grid's query params, in the order links write them (for toQuery). */
export const gridParams = (link: GridLink) => ({
  grid: link.gridSize,
  cells: link.cells,
  rows: link.rows?.toString(),
  from: link.start?.toString(36),
  to: link.end?.toString(36),
});

// Cells pack 4 per byte (2 bits each), then base64url.

export const encodeCells = (cells: Uint8Array): string => {
  const bytes = new Uint8Array(Math.ceil(cells.length / 4));
  cells.forEach((t, i) => (bytes[i >> 2] |= t << ((i & 3) * 2)));
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const decodeCells = (text: string, count: number): Uint8Array | null => {
  try {
    const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
    if (binary.length !== Math.ceil(count / 4)) return null;
    const cells = new Uint8Array(count);
    for (let i = 0; i < count; i++) {
      const t = (binary.charCodeAt(i >> 2) >> ((i & 3) * 2)) & 3;
      if (t > CELL.mud) return null;
      cells[i] = t;
    }
    return cells;
  } catch {
    return null;
  }
};
