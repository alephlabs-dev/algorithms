import { MinusIcon, PlusIcon, ShuffleIcon, WidthIcon } from "@radix-ui/react-icons";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { DpRenderer } from "@/canvas/dpRenderer";
import { dpProblems } from "@/consts/dp";
import { cleanWord, MAX_CAPACITY, MAX_ITEMS, MAX_WORD, randomItems } from "@/dp";
import { newSeed, seededRandom } from "@/utils/random";
import { useElementSize } from "@/hooks/useElementSize";
import { selectGameQuestion, useStore } from "@/store";
import { Button } from "../ui/button";

const DpCanvas = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<DpRenderer | null>(null);
  const { width, height } = useElementSize(wrapperRef);
  const { run, frame, theme, ask } = useStore(
    useShallow((s) => {
      const question = selectGameQuestion(s);
      return {
        run: s.dpRun,
        frame: s.dpRun.frames[Math.min(s.frameIndex, s.dpRun.length - 1)],
        theme: s.theme,
        ask: question?.kind === "choice" && question.cell ? s.dpRun.frames[question.at] : undefined,
      };
    }),
  );

  useEffect(() => {
    const renderer = new DpRenderer(canvasRef.current!);
    rendererRef.current = renderer;
    return () => renderer.destroy();
  }, []);

  useEffect(() => {
    rendererRef.current?.resize(width, height, window.devicePixelRatio || 1);
  }, [width, height]);

  useEffect(() => {
    rendererRef.current?.refreshColors();
  }, [theme]);

  useEffect(() => {
    rendererRef.current?.update({ run, frame, ask });
  }, [run, frame, ask]);

  const label = `${dpProblems[run.algorithm].title} table: ${run.rowLabels.length - 1} rows, ${run.colLabels.length - 1} columns.`;
  return (
    <div ref={wrapperRef} className="relative min-h-0 w-full flex-1">
      <canvas ref={canvasRef} role="img" aria-label={label} className="absolute inset-0 h-full w-full" />
    </div>
  );
};

const inputClass =
  "h-10 w-full min-w-0 rounded-full border border-line/70 bg-background px-3 font-mono text-sm uppercase text-foreground placeholder:normal-case placeholder:text-foreground/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary sm:px-4";

/** Two words in, and the table starts over. Remounted (by key) when the words change elsewhere. */
const WordsBar = ({ a, b }: { a: string; b: string }) => {
  const setWords = useStore((s) => s.setDpWords);
  const [first, setFirst] = useState(a);
  const [second, setSecond] = useState(b);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const x = cleanWord(first);
    const y = cleanWord(second);
    if (!x || !y) {
      setError(`Two words of letters, up to ${MAX_WORD} each`);
      return;
    }
    setError(null);
    setWords(x, y);
    useStore.getState().play();
  };

  return (
    <form
      data-tour="words"
      onSubmit={submit}
      aria-label="Words"
      className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-edge bg-surface px-2 py-2 sm:gap-2 sm:px-3"
    >
      <label className="flex min-w-16 flex-1 items-center sm:max-w-44">
        <span className="sr-only">First word (down the side)</span>
        <input
          value={first}
          maxLength={MAX_WORD}
          onChange={(e) => setFirst(e.target.value)}
          placeholder="First word"
          autoCapitalize="characters"
          spellCheck={false}
          className={inputClass}
        />
      </label>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-9 shrink-0 sm:w-10"
        onClick={() => {
          setFirst(second);
          setSecond(first);
        }}
        aria-label="Swap the words"
        title="Swap the words"
      >
        <WidthIcon />
      </Button>
      <label className="flex min-w-16 flex-1 items-center sm:max-w-44">
        <span className="sr-only">Second word (across the top)</span>
        <input
          value={second}
          maxLength={MAX_WORD}
          onChange={(e) => setSecond(e.target.value)}
          placeholder="Second word"
          autoCapitalize="characters"
          spellCheck={false}
          className={inputClass}
        />
      </label>
      <Button type="submit" size="sm" variant="primary" className="h-10 shrink-0 px-3 sm:px-4">
        Compare
      </Button>
      {error && (
        <span role="alert" className="basis-full px-1 text-xs text-foreground/70 sm:basis-auto">
          {error}
        </span>
      )}
    </form>
  );
};

/** A number with − and + either side. */
const Stepper = ({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) => (
  <div role="group" aria-label={label} className="flex items-center gap-1">
    <span className="pl-1 pr-0.5 text-xs text-foreground/70 sm:text-sm">{label}</span>
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className="h-9 w-9 shrink-0"
      disabled={value <= min}
      onClick={() => onChange(value - 1)}
      aria-label={`Less ${label.toLowerCase()}`}
    >
      <MinusIcon />
    </Button>
    <span className="w-6 text-center font-mono text-sm font-semibold" aria-live="polite">
      {value}
    </span>
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className="h-9 w-9 shrink-0"
      disabled={value >= max}
      onClick={() => onChange(value + 1)}
      aria-label={`More ${label.toLowerCase()}`}
    >
      <PlusIcon />
    </Button>
  </div>
);

/** Knapsack: the bag's capacity, how many items, and a fresh set. In the bar under the table, and in settings. */
export const ItemsControls = ({ className }: { className?: string }) => {
  const { items, capacity, setItems } = useStore(
    useShallow((s) => ({ items: s.dpItems, capacity: s.dpCapacity, setItems: s.setDpItems })),
  );
  const random = () => seededRandom(newSeed());
  return (
    <div role="group" aria-label="Bag and items" className={className}>
      <Stepper label="Bag" value={capacity} min={1} max={MAX_CAPACITY} onChange={(c) => setItems(items, c)} />
      <Stepper
        label="Items"
        value={items.length}
        min={1}
        max={MAX_ITEMS}
        onChange={(n) =>
          setItems(
            n < items.length ? items.slice(0, n) : [...items, ...randomItems(n - items.length, random())],
            capacity,
          )
        }
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="h-9 shrink-0 gap-1.5 px-3"
        onClick={() => setItems(randomItems(items.length, random()), capacity)}
      >
        <ShuffleIcon />
        New items
      </Button>
    </div>
  );
};

// From tablet width up; on phones it lives in settings, so the table gets the room.
const ItemsBar = () => (
  <div data-tour="words" className="hidden rounded-2xl border border-edge bg-surface px-3 py-2 md:block">
    <ItemsControls className="flex flex-wrap items-center gap-x-5 gap-y-1.5" />
  </div>
);

/** The table, and the words (or items) it's for. */
export const DpStage = () => {
  const { a, b, knapsack } = useStore(
    useShallow((s) => ({ a: s.dpA, b: s.dpB, knapsack: s.dpAlgorithm === "knapsack" })),
  );
  return (
    <div data-tour="bars" className="relative flex h-full min-h-0 min-w-0 flex-col gap-2">
      <DpCanvas />
      {knapsack ? <ItemsBar /> : <WordsBar key={`${a}|${b}`} a={a} b={b} />}
    </div>
  );
};
