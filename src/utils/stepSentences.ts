// Every step sentence of representative runs of each module, in the language of this page load.
// Not used by the app: e2e/step-sentences-fit.spec.ts loads it once per language and measures each
// sentence in the real caption (#113). Builds each run the way src/store.ts does.
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Sorting sentence runs move into its slice.
import { pseudocode, SORT_ALGORITHMS, sortAlgorithms } from '@/modules/sorting/generators';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Sorting sentence runs move into its slice.
import { Timeline } from '@/modules/sorting/timeline';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Backtracking sentence runs move into its slice.
import { QueensRun } from '@/modules/backtracking/queens';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Backtracking sentence runs move into its slice.
import { MAX_QUEENS, MIN_QUEENS, type FillOrder, type SudokuPuzzle } from '@/modules/backtracking/types';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Backtracking sentence runs move into its slice.
import { SUDOKU_PUZZLES, SudokuRun } from '@/modules/backtracking/sudoku';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the DP sentence runs move into its slice.
import { DpRun } from '@/modules/dp/run';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the DP sentence runs move into its slice.
import { EXAMPLE_CAPACITY, EXAMPLE_ITEMS, RACE_CAPACITY, RACE_ITEMS, randomItems, wordPairs } from '@/modules/dp/presets';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the DP sentence runs move into its slice.
import { KnapsackRun } from '@/modules/dp/knapsack';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the DP sentence runs move into its slice.
import { MAX_CAPACITY, MAX_ITEMS, MAX_WORD } from '@/modules/dp/types';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Fourier sentence runs move into its slice.
import { circleOptions, FourierRun } from '@/modules/fourier/run';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Fourier sentence runs move into its slice.
import { FOURIER_SHAPES } from '@/modules/fourier/types';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Graphs sentence runs move into its slice.
import { GRAPH_ALGORITHMS } from '@/modules/graphs/types';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Graphs sentence runs move into its slice.
import { graphPresets, graphSizes, makeGraph } from '@/modules/graphs/graph';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Graphs sentence runs move into its slice.
import { graphTimelineFor } from '@/modules/graphs/run';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Mazes sentence runs move into its slice.
import { MAZE_ALGORITHMS } from '@/modules/mazes/generators';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Mazes sentence runs move into its slice.
import { MazeRun } from '@/modules/mazes/run';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Pathfinding sentence runs move into its slice.
import { applyPreset, emptyGrid, type Preset } from '@/modules/pathfinding/grid';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Pathfinding sentence runs move into its slice.
import { PATH_ALGORITHMS, pathSearches } from '@/modules/pathfinding/searches';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Pathfinding sentence runs move into its slice.
import { PathTimeline } from '@/modules/pathfinding/timeline';
import { gridDimensions, type GridSize } from '@/utils/gridSize';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Data structures sentence runs move into its slice.
import { presetOperations, type StructurePreset, type StructureSize } from '@/modules/structures/presets';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Data structures sentence runs move into its slice.
import { recordStructure } from '@/modules/structures/record';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Data structures sentence runs move into its slice.
import { STRUCTURE_ALGORITHMS, type Operation } from '@/modules/structures/types';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Sorting sentence runs move into its slice.
import type { InputOrder } from '@/modules/sorting/types';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Sorting sentence runs move into its slice.
import { generateItems } from '@/modules/sorting/generateItems';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Sorting sentence runs move into its slice.
import { narrate } from '@/modules/sorting/narrate';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Backtracking sentence runs move into its slice.
import { narrateBacktracking, narrateSudoku } from '@/modules/backtracking/narrate';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the DP sentence runs move into its slice.
import { narrateDp } from '@/modules/dp/narrate';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Fourier sentence runs move into its slice.
import { narrateFourier } from '@/modules/fourier/narrate';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Graphs sentence runs move into its slice.
import { narrateGraph } from '@/modules/graphs/narrate';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Mazes sentence runs move into its slice.
import { narrateMaze } from '@/modules/mazes/narrate';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Pathfinding sentence runs move into its slice.
import { narratePath } from '@/modules/pathfinding/narrate';
// eslint-disable-next-line house/module-boundaries -- TODO(#187): the Data structures sentence runs move into its slice.
import { narrateTree } from '@/modules/structures/narrate';
import { seededRandom } from '@/utils/random';

/** One sentence, and the first run that says it (to find it in the app). */
export type StepSentence = { sentence: string; run: string };

const SEEDS = [1, 2, 3];
// Phones and upright screens lay grids and graphs out tall and narrow; landscape screens wide.
const LAYOUTS = [{ narrow: true, name: 'narrow' }, { narrow: false, name: 'wide' }];

const sortingRuns = function* () {
  const orders: InputOrder[] = ['random', 'nearlySorted', 'reversed', 'sorted', 'fewUnique'];
  for (const algorithm of SORT_ALGORITHMS)
    for (const order of orders)
      // Every size offered (400 from iPad up); the big ones once, they're long.
      for (const [size, seeds] of [[10, SEEDS], [20, SEEDS], [40, [1]], [100, [1]], [200, [1]], [400, [1]]] as const)
        for (const seed of seeds) {
          const timeline = new Timeline(sortAlgorithms[algorithm], generateItems(size, order, seededRandom(seed)));
          const run = `sorting ${algorithm} ${order} ${size} seed ${seed}`;
          for (let i = 0; i < timeline.length; i++) yield { run, sentence: narrate(timeline, i, pseudocode[algorithm]) };
        }
};

const pathfindingRuns = function* () {
  const sizes: GridSize[] = ['small', 'medium', 'large'];
  const presets: Preset[] = ['clear', 'maze', 'walls', 'terrain'];
  for (const algorithm of PATH_ALGORITHMS)
    for (const size of sizes)
      for (const preset of presets)
        for (const seed of SEEDS)
          for (const layout of LAYOUTS) {
            const { rows, cols } = gridDimensions(size, layout.narrow);
            const grid = applyPreset(emptyGrid(rows, cols), preset, seededRandom(seed));
            const timeline = new PathTimeline(pathSearches[algorithm], grid);
            const run = `pathfinding ${algorithm} ${size} ${preset} ${layout.name} seed ${seed}`;
            for (let i = 0; i < timeline.length; i++) yield { run, sentence: narratePath(timeline, i, algorithm) };
          }
};

const graphRuns = function* () {
  for (const algorithm of GRAPH_ALGORITHMS)
    for (const size of graphSizes)
      for (const preset of graphPresets)
        for (const seed of SEEDS)
          for (const layout of LAYOUTS) {
            const timeline = graphTimelineFor(algorithm, makeGraph(preset, size, layout.narrow, seededRandom(seed)));
            const run = `graphs ${algorithm} ${size} ${preset} ${layout.name} seed ${seed}`;
            for (let i = 0; i < timeline.length; i++) yield { run, sentence: narrateGraph(timeline, i, algorithm) };
          }
};

// The worst words a learner can type: as long as allowed, in the widest letters. Different,
// the same, sharing no letter, and nearly the same, so every kind of sentence comes up.
const W = 'W'.repeat(MAX_WORD);
const M = 'M'.repeat(MAX_WORD);
const NEARLY_W = `${'W'.repeat(MAX_WORD - 1)}M`;
const WIDE_WORDS = [
  { a: W, b: M },
  { a: W, b: W },
  { a: NEARLY_W, b: W },
  { a: `M${'W'.repeat(MAX_WORD - 1)}`, b: NEARLY_W },
];

const dpRuns = function* () {
  const tables = [
    ...[...wordPairs, ...WIDE_WORDS].flatMap(({ a, b }) => [
      { run: `dp edit ${a} ${b}`, table: new DpRun('edit', a, b) },
      { run: `dp lcs ${a} ${b}`, table: new DpRun('lcs', a, b) },
    ]),
    { run: 'dp knapsack example', table: new KnapsackRun(EXAMPLE_ITEMS, EXAMPLE_CAPACITY) },
    { run: 'dp knapsack race', table: new KnapsackRun(RACE_ITEMS, RACE_CAPACITY) },
    ...SEEDS.flatMap((seed) =>
      [MAX_ITEMS - 1, MAX_ITEMS].map((count) => ({
        run: `dp knapsack ${count} items seed ${seed}`,
        table: new KnapsackRun(randomItems(count, seededRandom(seed)), MAX_CAPACITY),
      }))
    ),
  ];
  for (const { run, table } of tables)
    for (let i = 0; i < table.length; i++) yield { run, sentence: narrateDp(table, i) };
};

/**
 * After the preset's inserts, what a learner can type below the stage: finding a value that's
 * there and one that isn't, deleting (the root or minimum, a middle value, a missing one), a
 * duplicate insert, and enough inserts to fill a probing table.
 */
const typedOperations = (ops: Operation[]): Operation[] => {
  const values = ops.map((op) => op.value);
  const sorted = [...values].sort((a, b) => a - b);
  const missing = [2, 49, 97].filter((v) => !values.includes(v));
  const fill = Array.from({ length: 30 }, (_, k) => 3 + k * 3).filter((v) => !values.includes(v) && !missing.includes(v));
  return [
    ...ops,
    { kind: 'search', value: sorted[Math.floor(sorted.length / 2)] },
    { kind: 'search', value: sorted[sorted.length - 1] },
    ...missing.map((value): Operation => ({ kind: 'search', value })),
    { kind: 'insert', value: values[0] },
    { kind: 'delete', value: values[0] },
    { kind: 'delete', value: sorted[0] },
    { kind: 'delete', value: sorted[Math.floor(sorted.length / 2)] },
    { kind: 'delete', value: missing[0] },
    ...fill.map((value): Operation => ({ kind: 'insert', value })),
  ];
};

const structureRuns = function* () {
  const algorithms = STRUCTURE_ALGORITHMS;
  const presets: StructurePreset[] = ['example', 'random', 'ascending'];
  const sizes: StructureSize[] = ['small', 'medium', 'large'];
  for (const algorithm of algorithms)
    for (const preset of presets)
      for (const size of sizes)
        for (const seed of SEEDS) {
          const structure = recordStructure(algorithm, typedOperations(presetOperations(preset, size, seededRandom(seed))));
          const run = `structures ${algorithm} ${preset} ${size} seed ${seed}`;
          for (let i = 0; i < structure.frames.length; i++) yield { run, sentence: narrateTree(structure, i) };
        }
};

const backtrackingRuns = function* () {
  for (let n = MIN_QUEENS; n <= MAX_QUEENS; n++) {
    const queens = new QueensRun(n);
    for (let i = 0; i < queens.length; i++) yield { run: `backtracking queens ${n}`, sentence: narrateBacktracking(queens, i) };
  }
  for (const puzzle of Object.keys(SUDOKU_PUZZLES) as SudokuPuzzle[])
    for (const order of ['rows', 'mrv'] as FillOrder[]) {
      const sudoku = new SudokuRun(SUDOKU_PUZZLES[puzzle], order);
      for (let i = 0; i < sudoku.frames.length; i++) yield { run: `backtracking sudoku ${puzzle} ${order}`, sentence: narrateSudoku(sudoku, i) };
    }
};

const fourierRuns = function* () {
  // Every drawing but the learner's own, which has no sentences of its own to check.
  const shapes = FOURIER_SHAPES.filter((shape) => shape !== 'custom');
  const waves = (['square', 'sawtooth', 'triangle'] as const).flatMap((algorithm) =>
    circleOptions.wave.map((circles) => ({ run: `fourier ${algorithm} ${circles}`, fourier: new FourierRun(algorithm, circles, 'heart', null) }))
  );
  const drawings = shapes.flatMap((shape) =>
    circleOptions.drawing.map((circles) => ({ run: `fourier epicycles ${shape} ${circles}`, fourier: new FourierRun('epicycles', circles, shape, null) }))
  );
  for (const { run, fourier } of [...waves, ...drawings])
    for (let i = 0; i < fourier.length; i++) yield { run, sentence: narrateFourier(fourier, i) };
};

const mazeRuns = function* () {
  const sizes: GridSize[] = ['small', 'medium', 'large'];
  for (const algorithm of MAZE_ALGORITHMS)
    for (const size of sizes)
      for (const seed of SEEDS)
        for (const layout of LAYOUTS) {
          const maze = new MazeRun(algorithm, gridDimensions(size, layout.narrow), seed);
          const run = `mazes ${algorithm} ${size} ${layout.name} seed ${seed}`;
          for (let i = 0; i < maze.length; i++) yield { run, sentence: narrateMaze(maze, i) };
        }
};

/** Each distinct sentence once, with the first run that says it. */
export const stepSentences = (): StepSentence[] => {
  const seen = new Map<string, string>();
  const all = [sortingRuns, pathfindingRuns, graphRuns, dpRuns, structureRuns, backtrackingRuns, fourierRuns, mazeRuns];
  for (const runs of all)
    for (const { run, sentence } of runs()) if (!seen.has(sentence)) seen.set(sentence, run);
  return [...seen].map(([sentence, run]) => ({ sentence, run }));
};
