import { useShallow } from "zustand/react/shallow";
import { MAX_QUEENS, MIN_QUEENS } from "@/backtracking";
import { backtrackingProblems, QUEENS_SOLUTIONS } from "@/consts/backtracking";
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
    pruning: "conflicts rule out most of the Nᴺ boards",
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
    pruning: "los conflictos descartan casi todos los Nᴺ tableros",
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

/** Above the stage: the board size. */
export const BacktrackingTools = ({ className }: { className?: string }) => (
  <div
    data-tour="tools"
    role="toolbar"
    aria-label={text.tools}
    className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 self-start", className)}
  >
    <div className="flex items-center gap-2">
      <span className="text-sm text-foreground/70">{text.queens}</span>
      <QueensPicker className="w-60" />
    </div>
  </div>
);

const Item = ({ className, label }: { className: string; label: string }) => (
  <li className="flex items-center gap-2">
    <span aria-hidden className={cn("h-3 w-3 shrink-0 rounded-sm", className)} />
    {label}
  </li>
);

/** What the marks on the board mean. */
export const BacktrackingLegend = ({ className, stacked }: { className?: string; stacked?: boolean }) => (
  <ul
    aria-label={text.legend}
    className={cn(
      "flex text-xs text-foreground md:text-sm",
      stacked ? "flex-col gap-1.5" : "flex-wrap items-center gap-x-4 gap-y-1",
      className,
    )}
  >
    <Item className="bg-primary" label={text.placed} />
    <li className="flex items-center gap-2">
      <span aria-hidden className="grid h-3 w-3 shrink-0 place-items-center rounded-sm bg-edge">
        <span className="h-1 w-1 rounded-full bg-muted" />
      </span>
      {text.attacked}
    </li>
    <Item className="border-2 border-conflict bg-conflict/30" label={text.conflict} />
    <Item className="border-2 border-conflict" label={text.deadEnd} />
  </ul>
);

/**
 * Choices, conflicts and backtracks so far, for the dock. In words they don't fit beside the
 * step count (least of all in Spanish), so each number wears its legend mark; the words are for
 * screen readers and the tooltip.
 */
export const BacktrackingStatsInline = ({ className }: { className?: string }) => {
  const { choices, conflicts, backtracks } = useStore(
    useShallow((s) => {
      const frame = s.queensRun.frames[Math.min(s.frameIndex, s.queensRun.length - 1)];
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

/** Cost, how many solutions the board has, and what conflicts save. */
export const BacktrackingFacts = () => {
  const { problem, n } = useStore(useShallow((s) => ({ problem: s.backtrackingProblem, n: s.queensN })));
  return (
    <FactLine facts={[backtrackingProblems[problem].cost, text.solutions(n, QUEENS_SOLUTIONS[n]), text.pruning]} />
  );
};
