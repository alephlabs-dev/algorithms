import { useShallow } from "zustand/react/shallow";
import { MAX_QUEENS, MIN_QUEENS, rowOrderRun, runOf, type FillOrder, type SudokuPuzzle } from "@/backtracking";
import { backtrackingProblems, fillOrderNames, QUEENS_SOLUTIONS, sudokuPuzzleNames } from "@/consts/backtracking";
import { localized } from "@/i18n";
import { useStore } from "@/store";
import { cn } from "@/utils/cn";
import { count } from "@/utils/count";
import { FactLine } from "../ui/fact-line";
import { SegmentedControl } from "../ui/segmented";

const text = localized({
  en: {
    queens: "Queens",
    queensCount: (n: number) => count(n, "queen"),
    tools: "Backtracking tools",
    legend: "Legend",
    placed: "Queen placed",
    attacked: "Attacked",
    conflict: "Conflict",
    deadEnd: "Dead end",
    allStats: (choices: number, conflicts: number, backtracks: number) =>
      `${count(choices, "choice")}, ${count(conflicts, "conflict")}, ${count(backtracks, "backtrack")}`,
    solutions: (n: number, solutions: number) => `${n} queens: ${count(solutions, "solution")}`,
    whatConflictsSave: "conflicts rule out most of the Nᴺ boards",
    puzzle: "Puzzle",
    given: "Given",
    digitPlaced: "Digit placed",
    emptyCells: (n: number) => `${n} empty cells · 1 solution`,
    whatConflictsSaveSudoku: "conflicts rule out almost all 9ᵐ grids",
    order: "Order",
    optionsLeft: "Digits that fit",
    rowsTook: (steps: number, backtracks: number) =>
      `row by row: ${count(steps, "step")}, ${count(backtracks, "backtrack")}`,
  },
  es: {
    queens: "Reinas",
    queensCount: (n) => count(n, "reina"),
    tools: "Herramientas de backtracking",
    legend: "Leyenda",
    placed: "Reina colocada",
    attacked: "Atacada",
    conflict: "Conflicto",
    deadEnd: "Callejón sin salida",
    allStats: (choices, conflicts, backtracks) =>
      `${count(choices, "elección", "elecciones")}, ${count(conflicts, "conflicto")}, ${count(backtracks, "vuelta atrás", "vueltas atrás")}`,
    solutions: (n, solutions) => `${n} reinas: ${count(solutions, "solución", "soluciones")}`,
    whatConflictsSave: "los conflictos descartan casi todos los Nᴺ tableros",
    puzzle: "Sudoku",
    given: "Pista",
    digitPlaced: "Dígito colocado",
    emptyCells: (n) => `${n} casillas vacías · 1 solución`,
    whatConflictsSaveSudoku: "los conflictos descartan casi todas las 9ᵐ cuadrículas",
    order: "Orden",
    optionsLeft: "Dígitos que caben",
    rowsTook: (steps, backtracks) =>
      `por filas: ${count(steps, "paso")}, ${count(backtracks, "vuelta atrás", "vueltas atrás")}`,
  },
});

const sizes = Array.from({ length: MAX_QUEENS - MIN_QUEENS + 1 }, (_, k) => MIN_QUEENS + k);

/** How many queens, and so how big the board is. */
export const QueensPicker = ({ className }: { className?: string }) => {
  const { n, setN } = useStore(useShallow((s) => ({ n: s.queensN, setN: s.setQueensN })));
  return (
    <SegmentedControl<number>
      label={text.queens}
      options={sizes.map((size) => ({
        value: size,
        label: <span className="font-mono">{size}</span>,
        title: text.queensCount(size),
      }))}
      value={n}
      onChange={(size) => size !== n && setN(size)}
      compact
      className={className}
    />
  );
};

/** Which Sudoku: easy or hard. */
export const SudokuPuzzlePicker = ({ className }: { className?: string }) => {
  const { puzzle, setPuzzle } = useStore(useShallow((s) => ({ puzzle: s.sudokuPuzzle, setPuzzle: s.setSudokuPuzzle })));
  return (
    <SegmentedControl<SudokuPuzzle>
      label={text.puzzle}
      options={(["easy", "hard"] as const).map((value) => ({ value, label: sudokuPuzzleNames[value] }))}
      value={puzzle}
      onChange={(value) => value !== puzzle && setPuzzle(value)}
      compact
      className={className}
    />
  );
};

/** Which empty cell goes next: row by row, or fewest options first. */
export const FillOrderPicker = ({ className }: { className?: string }) => {
  const { order, setOrder } = useStore(useShallow((s) => ({ order: s.sudokuOrder, setOrder: s.setSudokuOrder })));
  return (
    <SegmentedControl<FillOrder>
      label={text.order}
      options={(["rows", "mrv"] as const).map((value) => ({
        value,
        label: fillOrderNames[value],
        title: value === "mrv" ? `${fillOrderNames.mrv} (MRV)` : fillOrderNames.rows,
      }))}
      value={order}
      onChange={(value) => value !== order && setOrder(value)}
      compact
      className={className}
    />
  );
};

/** The setting each problem has: the board size, or the puzzle. */
export const BacktrackingPicker = ({ className }: { className?: string }) => {
  const sudoku = useStore((s) => s.backtrackingProblem === "sudoku");
  return sudoku ? <SudokuPuzzlePicker className={className} /> : <QueensPicker className={className} />;
};

/** Above the stage: the board size, or the puzzle. */
export const BacktrackingTools = ({ className }: { className?: string }) => {
  const sudoku = useStore((s) => s.backtrackingProblem === "sudoku");
  return (
    <div
      data-tour="tools"
      role="toolbar"
      aria-label={text.tools}
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 self-start", className)}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground/70">{sudoku ? text.puzzle : text.queens}</span>
        <BacktrackingPicker className={sudoku ? "w-48" : "w-60"} />
      </div>
      {sudoku && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground/70">{text.order}</span>
          <FillOrderPicker className="w-72" />
        </div>
      )}
    </div>
  );
};

const Item = ({ className, label }: { className: string; label: string }) => (
  <li className="flex items-center gap-2">
    <span aria-hidden className={cn("h-3 w-3 shrink-0 rounded-sm", className)} />
    {label}
  </li>
);

const Digit = ({ className, label }: { className: string; label: string }) => (
  <li className="flex items-center gap-2">
    <span aria-hidden className={cn("w-3 shrink-0 text-center font-mono leading-none", className)}>
      7
    </span>
    {label}
  </li>
);

/** What the marks on the board mean. */
export const BacktrackingLegend = ({ className, stacked }: { className?: string; stacked?: boolean }) => {
  const sudoku = useStore((s) => s.backtrackingProblem === "sudoku");
  const fewest = useStore((s) => s.backtrackingProblem === "sudoku" && s.sudokuOrder === "mrv");
  return (
    <ul
      aria-label={text.legend}
      className={cn(
        "flex text-xs text-foreground md:text-sm",
        stacked ? "flex-col gap-1.5" : "flex-wrap items-center gap-x-4 gap-y-1",
        className,
      )}
    >
      {sudoku ? (
        <>
          <Digit className="font-bold text-foreground" label={text.given} />
          <Digit className="text-primary" label={text.digitPlaced} />
          {fewest && <Digit className="text-[10px] text-muted" label={text.optionsLeft} />}
        </>
      ) : (
        <>
          <Item className="bg-primary" label={text.placed} />
          <li className="flex items-center gap-2">
            <span aria-hidden className="grid h-3 w-3 shrink-0 place-items-center rounded-sm bg-edge">
              <span className="h-1 w-1 rounded-full bg-muted" />
            </span>
            {text.attacked}
          </li>
        </>
      )}
      <Item className="border-2 border-conflict bg-conflict/30" label={text.conflict} />
      <Item className="border-2 border-conflict" label={text.deadEnd} />
    </ul>
  );
};

/**
 * Choices, conflicts and backtracks so far, for the dock. In words they don't fit beside the
 * step count (least of all in Spanish), so each number wears its legend mark; the words are for
 * screen readers and the tooltip.
 */
export const BacktrackingStatsInline = ({ className }: { className?: string }) => {
  const { choices, conflicts, backtracks } = useStore(
    useShallow((s) => {
      const frame = runOf(s).frameAt(s.frameIndex);
      return { choices: frame.choices, conflicts: frame.conflicts, backtracks: frame.backtracks };
    }),
  );
  return (
    <p
      title={text.allStats(choices, conflicts, backtracks)}
      className={cn("flex items-center gap-1.5 whitespace-nowrap font-mono text-xs text-foreground/80", className)}
    >
      <span className="sr-only">{text.allStats(choices, conflicts, backtracks)}</span>
      <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-sm bg-primary" />
      <span aria-hidden>{choices}</span>
      <span aria-hidden className="text-foreground/40">·</span>
      <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-sm border-2 border-conflict bg-conflict/30" />
      <span aria-hidden>{conflicts}</span>
      <span aria-hidden className="text-foreground/40">·</span>
      <span aria-hidden>↩ {backtracks}</span>
    </p>
  );
};

/** Cost, how many solutions the puzzle has, and what conflicts save; under fewest options first, what row by row took. */
export const BacktrackingFacts = () => {
  const { problem, n, run } = useStore(
    useShallow((s) => ({ problem: s.backtrackingProblem, n: s.queensN, run: s.sudokuRun })),
  );
  const rows = run.order === "mrv" ? rowOrderRun(run.puzzle) : null;
  const facts =
    problem === "sudoku"
      ? [
          text.emptyCells(run.emptyCount),
          rows ? text.rowsTook(rows.length - 2, rows.frameAt(rows.length).backtracks) : text.whatConflictsSaveSudoku,
        ]
      : [text.solutions(n, QUEENS_SOLUTIONS[n]), text.whatConflictsSave];
  return <FactLine facts={[backtrackingProblems[problem].cost, ...facts]} />;
};
