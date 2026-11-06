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
import { TextField } from "../ui/text-field";
import { localized } from "@/i18n";

const copy = localized({
  en: {
    oneWord: (max: number) => `Letters only, up to ${max}`,
    words: "Words",
    first: "First word",
    firstAxis: "(down the side)",
    swap: "Swap the words",
    second: "Second word",
    secondAxis: "(across the top)",
    compare: "Compare",
    less: (label: string) => `Less ${label.toLowerCase()}`,
    more: (label: string) => `More ${label.toLowerCase()}`,
    bagAndItems: "Bag and items",
    bag: "Bag",
    items: "Items",
    newItems: "New items",
  },
  es: {
    oneWord: (max) => `Solo letras, hasta ${max}`,
    words: "Palabras",
    first: "Palabra 1",
    firstAxis: "(en el costado)",
    swap: "Intercambiar las palabras",
    second: "Palabra 2",
    secondAxis: "(arriba)",
    compare: "Comparar",
    less: (label) => `${label}: menos`,
    more: (label) => `${label}: más`,
    bagAndItems: "Mochila y objetos",
    bag: "Mochila",
    items: "Objetos",
    newItems: "Nuevos objetos",
  },
});


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

/** A short visible name; screen readers also hear which side of the table the word goes on. */
const WordLabel = ({ name, axis }: { name: string; axis: string }) => (
  <>
    {name}
    <span className="sr-only"> {axis}</span>
  </>
);

// Phones: both fields grow from the width of their button alone (the input's own width is 0), so the two
// inputs come out the same width whatever the buttons beside them. Wider screens: a fixed width each.
const wordClass = "flex-auto sm:flex-none";
const wordInputClass = "w-0 font-mono uppercase sm:w-44 sm:flex-none";

/** Two words in, and the table starts over. Remounted (by key) when the words change elsewhere. */
const WordsBar = ({ a, b }: { a: string; b: string }) => {
  const setWords = useStore((s) => s.setDpWords);
  const [first, setFirst] = useState(a);
  const [second, setSecond] = useState(b);
  const [errors, setErrors] = useState<{ first: boolean; second: boolean }>({ first: false, second: false });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const x = cleanWord(first);
    const y = cleanWord(second);
    setErrors({ first: !x, second: !y });
    if (!x || !y) return;
    setWords(x, y);
    useStore.getState().play();
  };

  return (
    <form
      data-tour="words"
      onSubmit={submit}
      aria-label={copy.words}
      className="flex flex-wrap items-start gap-1.5 rounded-2xl border border-edge bg-surface px-2 py-2 sm:gap-2 sm:px-3"
    >
      <TextField
        label={<WordLabel name={copy.first} axis={copy.firstAxis} />}
        value={first}
        maxLength={MAX_WORD}
        onChange={(e) => {
          setFirst(e.target.value);
          setErrors((was) => ({ ...was, first: false }));
        }}
        error={errors.first ? copy.oneWord(MAX_WORD) : null}
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        className={wordClass}
        inputClassName={wordInputClass}
        end={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-9 shrink-0 sm:w-10 pointer-coarse:h-11"
            onClick={() => {
              setFirst(second);
              setSecond(first);
              setErrors({ first: errors.second, second: errors.first });
            }}
            aria-label={copy.swap}
            title={copy.swap}
          >
            <WidthIcon />
          </Button>
        }
      />
      <TextField
        label={<WordLabel name={copy.second} axis={copy.secondAxis} />}
        value={second}
        maxLength={MAX_WORD}
        onChange={(e) => {
          setSecond(e.target.value);
          setErrors((was) => ({ ...was, second: false }));
        }}
        error={errors.second ? copy.oneWord(MAX_WORD) : null}
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        className={wordClass}
        inputClassName={wordInputClass}
        end={
          <Button type="submit" size="sm" variant="primary" className="h-10 shrink-0 px-3 sm:px-4 pointer-coarse:h-11">
            {copy.compare}
          </Button>
        }
      />
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
      aria-label={copy.less(label)}
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
      aria-label={copy.more(label)}
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
    <div role="group" aria-label={copy.bagAndItems} className={className}>
      <Stepper label={copy.bag} value={capacity} min={1} max={MAX_CAPACITY} onChange={(c) => setItems(items, c)} />
      <Stepper
        label={copy.items}
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
        {copy.newItems}
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
