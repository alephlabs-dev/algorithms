/* How pathfinding looks on the shared grid renderer: a tone for each terrain × search state. */

import { FRONTIER, MUD, ON_PATH, VISITED, WALL, type Grid, type PathFrame, type Terrain } from "@/pathfinding";
import type { GridCells, GridTone } from "./gridRenderer";
import { mix } from "./structurePaint";
import { hexToRgb, type CanvasColors, type RGB } from "./theme";

/** The floor and walls of a grid, shared with mazes so a maze looks the same in both modules. */
export const gridFloor = (colors: CanvasColors): RGB => mix(hexToRgb(colors.background), hexToRgb(colors.edge), 0.55);
export const gridWall = (colors: CanvasColors): RGB => mix(hexToRgb(colors.background), hexToRgb(colors.bar), 0.55);

// Indexes into the palette below, in its order.
const EMPTY_TONE = 0;
const WALL_TONE = 1;
const MUD_TONE = 2;
const FRONTIER_TONE = 3;
const FRONTIER_MUD_TONE = 4;
const VISITED_TONE = 5;
const VISITED_MUD_TONE = 6;
const PATH_TONE = 7;

/** Pathfinding's tones in the current theme, indexed by the tones `pathGridCells` gives. */
export const pathPalette = (colors: CanvasColors): GridTone[] => {
  const background = hexToRgb(colors.background);
  const secondary = hexToRgb(colors.secondary);
  const mud = hexToRgb(colors.mud);
  const isLight = background[0] + background[1] + background[2] > 384;
  // Visited cells keep a wash of the search color over whatever terrain they are;
  // lighter on paper, where a strong color would flood the grid.
  const wash = isLight ? 0.24 : 0.38;
  return [
    /* EMPTY_TONE */ { rgb: gridFloor(colors) },
    // Walls are solid but quieter than the search colors, so the search stays the subject.
    /* WALL_TONE */ { rgb: gridWall(colors) },
    // Mud gets a few dots, so it reads without relying on color alone; the path covers them.
    /* MUD_TONE */ { rgb: mud, dots: true },
    /* FRONTIER_TONE */ { rgb: secondary },
    /* FRONTIER_MUD_TONE */ { rgb: secondary, dots: true },
    /* VISITED_TONE */ { rgb: mix(background, secondary, wash) },
    /* VISITED_MUD_TONE */ { rgb: mix(mud, secondary, wash), dots: true },
    /* PATH_TONE */ { rgb: hexToRgb(colors.primary) },
  ];
};

const toneOf = (terrain: Terrain, state: number) => {
  if (terrain === WALL) return WALL_TONE;
  const mud = terrain === MUD;
  switch (state) {
    case ON_PATH:
      return PATH_TONE;
    case VISITED:
      return mud ? VISITED_MUD_TONE : VISITED_TONE;
    case FRONTIER:
      return mud ? FRONTIER_MUD_TONE : FRONTIER_TONE;
    default:
      return mud ? MUD_TONE : EMPTY_TONE;
  }
};

/**
 * A search frame as the grid renderer draws it. A cell's rank is its search state
 * (unseen < frontier < visited < path), so it pops each time the search moves it along.
 */
export const pathGridCells = (grid: Grid, frame: PathFrame): GridCells => {
  const tones = new Uint8Array(grid.cells.length);
  for (let cell = 0; cell < tones.length; cell++) tones[cell] = toneOf(grid.cells[cell] as Terrain, frame.states[cell]);
  return {
    rows: grid.rows,
    cols: grid.cols,
    tones,
    ranks: frame.states,
    current: frame.current,
    start: grid.start,
    end: grid.end,
  };
};
