import { useShallow } from "zustand/react/shallow";
import { dpProblems } from "@/consts/dp";
import { EXAMPLE_CAPACITY, EXAMPLE_ITEMS, encodeItems, RACE_CAPACITY, RACE_ITEMS, wordPairs } from "@/dp";
import { useStore } from "@/store";
import { cn } from "@/utils/cn";
import { FactLine } from "../ui/fact-line";

/** Example word pairs to start from. */
export const WordPairButtons = ({ className }: { className?: string }) => {
  const { a, b, setWords } = useStore(useShallow((s) => ({ a: s.dpA, b: s.dpB, setWords: s.setDpWords })));
  return (
    <div role="group" aria-label="Example words" className={cn("flex flex-wrap gap-2", className)}>
      {wordPairs.map((pair) => {
        const current = pair.a === a && pair.b === b;
        return (
          <button
            key={pair.label}
            type="button"
            aria-pressed={current}
            onClick={() => setWords(pair.a, pair.b)}
            className={cn(
              "flex h-10 items-center rounded-full border px-4 text-sm transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
              current
                ? "border-foreground/60 bg-accent font-semibold text-foreground"
                : "border-line/70 text-foreground/85 hover:bg-accent hover:text-foreground",
            )}
          >
            {pair.label}
          </button>
        );
      })}
    </div>
  );
};

/** Knapsack: back to the textbook example (the race's bigger one, in a race). */
const ExampleBagButton = () => {
  const race = useStore((s) => s.view === "race");
  const [items, capacity] = race ? [RACE_ITEMS, RACE_CAPACITY] : [EXAMPLE_ITEMS, EXAMPLE_CAPACITY];
  const { current, setItems } = useStore(
    useShallow((s) => ({
      current: s.dpCapacity === capacity && encodeItems(s.dpItems) === encodeItems(items),
      setItems: s.setDpItems,
    })),
  );
  return (
    <button
      type="button"
      aria-pressed={current}
      onClick={() => setItems(items, capacity)}
      title={
        race
          ? "Eight light items, a bag of 12: plenty for plain recursion to repeat itself"
          : "Four items, a bag of 7: the best fill isn't the most valuable item"
      }
      className={cn(
        "flex h-10 items-center rounded-full border px-4 text-sm transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
        current
          ? "border-foreground/60 bg-accent font-semibold text-foreground"
          : "border-line/70 text-foreground/85 hover:bg-accent hover:text-foreground",
      )}
    >
      {race ? "Race example" : "Textbook example"}
    </button>
  );
};

/** What to start from: example words, or the example bag. */
export const DpStartPicker = ({ className }: { className?: string }) => {
  const bag = useStore((s) => s.dpAlgorithm === "knapsack" || s.view === "race");
  return bag ? <ExampleBagButton /> : <WordPairButtons className={className} />;
};

/** Above the stage: example words, or the example bag. */
export const DpTools = ({ className }: { className?: string }) => (
  <div data-tour="tools" role="toolbar" aria-label="Examples" className={cn("self-start", className)}>
    <DpStartPicker />
  </div>
);

const Item = ({ className, label }: { className: string; label: string }) => (
  <li className="flex items-center gap-2">
    <span aria-hidden className={cn("h-2.5 w-2.5 shrink-0 rounded-sm", className)} />
    {label}
  </li>
);

export const DpLegend = ({ className, stacked }: { className?: string; stacked?: boolean }) => {
  const { edit, knapsack, race } = useStore(
    useShallow((s) => ({
      edit: s.dpAlgorithm === "edit",
      knapsack: s.dpAlgorithm === "knapsack",
      race: s.view === "race",
    })),
  );
  if (race)
    return (
      <ul
        aria-label="Legend"
        className={cn(
          "flex text-xs text-foreground md:text-sm",
          stacked ? "flex-col gap-1.5" : "flex-wrap items-center gap-x-4 gap-y-1",
          className,
        )}
      >
        <Item className="bg-primary" label="Worked out once" />
        <Item className="bg-tertiary" label="Again and again (how many times)" />
      </ul>
    );
  return (
    <ul
      aria-label="Legend"
      className={cn(
        "flex text-xs text-foreground md:text-sm",
        stacked ? "flex-col gap-1.5" : "flex-wrap items-center gap-x-4 gap-y-1",
        className,
      )}
    >
      <Item className="bg-secondary" label={edit ? "Working out; replaced" : "Working out"} />
      <Item className="bg-secondary/45" label="Comes from" />
      <Item
        className="bg-primary"
        label={edit ? "The way back; kept" : knapsack ? "The way back; taken" : "The way back; shared"}
      />
      {edit && <Item className="bg-tertiary" label="Inserted or deleted" />}
    </ul>
  );
};

/** Cells filled so far, and the answer once it's in. */
export const DpStatsInline = ({ className }: { className?: string }) => {
  const { filled, total, answer } = useStore(
    useShallow((s) => {
      const frame = s.dpRun.frames[Math.min(s.frameIndex, s.dpRun.length - 1)];
      const total = s.dpRun.frames[s.dpRun.length - 1].filled;
      return { filled: frame.filled, total, answer: frame.filled === total ? s.dpRun.answer : null };
    }),
  );
  return (
    <p className={cn("whitespace-nowrap font-mono text-xs text-foreground/80", className)}>
      {filled}/{total} cells{answer !== null && ` · answer ${answer}`}
    </p>
  );
};

export const DpFacts = () => {
  const algorithm = useStore((s) => s.dpAlgorithm);
  const { cost, cell } = dpProblems[algorithm];
  return <FactLine facts={[cost, `a cell: ${cell}`]} />;
};
