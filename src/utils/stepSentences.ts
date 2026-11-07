// Every step sentence of representative runs of each module, in the language of this page load.
// Not used by the app: e2e/step-sentences-fit.spec.ts loads it once per language and measures each
// sentence in the real caption (#113). Builds each run the way src/store.ts does.
import { pseudocode, sortAlgorithms, Timeline } from '@/algorithms';
import { QueensRun, MAX_QUEENS, MIN_QUEENS, SUDOKU_PUZZLES, SudokuRun, type FillOrder, type SudokuPuzzle } from '@/backtracking';
import { DpRun, EXAMPLE_CAPACITY, EXAMPLE_ITEMS, KnapsackRun, MAX_CAPACITY, MAX_ITEMS, RACE_CAPACITY, RACE_ITEMS, randomItems, wordPairs } from '@/dp';
import { circleOptions, FourierRun, type FourierShape } from '@/fourier';
import { graphTimelineFor, makeGraph, type GraphAlgorithm, type GraphPreset, type GraphSize } from '@/graphs';
import { applyPreset, emptyGrid, gridDimensions, pathSearches, PathTimeline, type GridSize, type PathAlgorithm, type Preset } from '@/pathfinding';
import { presetOperations, recordStructure, type Operation, type StructureAlgorithm, type StructurePreset, type StructureSize } from '@/structures';
import type { Algorithm, InputOrder } from '@/types';
import { generateItems } from '@/utils/generateItems';
import { narrate } from '@/utils/narrate';
import { narrateBacktracking, narrateSudoku } from '@/utils/narrateBacktracking';
import { narrateDp } from '@/utils/narrateDp';
import { narrateFourier } from '@/utils/narrateFourier';
import { narrateGraph } from '@/utils/narrateGraph';
import { narratePath } from '@/utils/narratePath';
import { narrateTree } from '@/utils/narrateTree';
import { seededRandom } from '@/utils/random';

/** One sentence, and the first run that says it (to find it in the app). */
export type StepSentence = { sentence: string; run: string };

const SEEDS = [1, 2, 3];
// Phones lay grids and graphs out tall and narrow.
const PHONE_LAYOUT = true;

const sortingRuns = function* () {
  const orders: InputOrder[] = ['random', 'nearlySorted', 'reversed', 'sorted', 'fewUnique'];
  for (const algorithm of Object.keys(sortAlgorithms) as Algorithm[])
    for (const order of orders)
      // Every size a phone offers; the big ones once, they're long.
      for (const [size, seeds] of [[10, SEEDS], [20, SEEDS], [40, [1]], [100, [1]], [200, [1]]] as const)
        for (const seed of seeds) {
          const timeline = new Timeline(sortAlgorithms[algorithm], generateItems(size, order, seededRandom(seed)));
          const run = `sorting ${algorithm} ${order} ${size} seed ${seed}`;
          for (let i = 0; i < timeline.length; i++) yield { run, sentence: narrate(timeline, i, pseudocode[algorithm]) };
        }
};

const pathfindingRuns = function* () {
  const sizes: GridSize[] = ['small', 'medium', 'large'];
  const presets: Preset[] = ['clear', 'maze', 'walls', 'terrain'];
  for (const algorithm of Object.keys(pathSearches) as PathAlgorithm[])
    for (const size of sizes)
      for (const preset of presets)
        for (const seed of SEEDS) {
          const { rows, cols } = gridDimensions(size, PHONE_LAYOUT);
          const grid = applyPreset(emptyGrid(rows, cols), preset, seededRandom(seed));
          const timeline = new PathTimeline(pathSearches[algorithm], grid);
          const run = `pathfinding ${algorithm} ${size} ${preset} seed ${seed}`;
          for (let i = 0; i < timeline.length; i++) yield { run, sentence: narratePath(timeline, i, algorithm) };
        }
};

const graphRuns = function* () {
  const algorithms: GraphAlgorithm[] = ['bfs', 'dfs', 'dijkstra', 'prim', 'kruskal', 'topo'];
  const sizes: GraphSize[] = ['small', 'medium', 'large'];
  const presets: GraphPreset[] = ['random', 'tree', 'grid', 'dag'];
  for (const algorithm of algorithms)
    for (const size of sizes)
      for (const preset of presets)
        for (const seed of SEEDS) {
          const timeline = graphTimelineFor(algorithm, makeGraph(preset, size, PHONE_LAYOUT, seededRandom(seed)));
          const run = `graphs ${algorithm} ${size} ${preset} seed ${seed}`;
          for (let i = 0; i < timeline.length; i++) yield { run, sentence: narrateGraph(timeline, i, algorithm) };
        }
};

const dpRuns = function* () {
  const tables = [
    ...wordPairs.flatMap(({ a, b }) => [
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
  const algorithms: StructureAlgorithm[] = ['bst', 'avl', 'heap', 'chaining', 'probing'];
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
  const shapes: FourierShape[] = ['heart', 'star', 'infinity', 'square', 'crux', 'orion', 'dipper', 'cassiopeia', 'aleph', 'butterfly', 'fish', 'cat', 'note'];
  const waves = (['square', 'sawtooth', 'triangle'] as const).flatMap((algorithm) =>
    circleOptions.wave.map((circles) => ({ run: `fourier ${algorithm} ${circles}`, fourier: new FourierRun(algorithm, circles, 'heart', null) }))
  );
  const drawings = shapes.flatMap((shape) =>
    circleOptions.drawing.map((circles) => ({ run: `fourier epicycles ${shape} ${circles}`, fourier: new FourierRun('epicycles', circles, shape, null) }))
  );
  for (const { run, fourier } of [...waves, ...drawings])
    for (let i = 0; i < fourier.length; i++) yield { run, sentence: narrateFourier(fourier, i) };
};

/** Each distinct sentence once, with the first run that says it. */
export const stepSentences = (): StepSentence[] => {
  const seen = new Map<string, string>();
  const all = [sortingRuns, pathfindingRuns, graphRuns, dpRuns, structureRuns, backtrackingRuns, fourierRuns];
  for (const runs of all)
    for (const { run, sentence } of runs()) if (!seen.has(sentence)) seen.set(sentence, run);
  return [...seen].map(([sentence, run]) => ({ sentence, run }));
};
