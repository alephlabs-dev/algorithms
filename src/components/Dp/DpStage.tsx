import { WidthIcon } from "@radix-ui/react-icons";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { DpRenderer } from "@/canvas/dpRenderer";
import { dpProblems } from "@/consts/dp";
import { cleanWord, MAX_WORD } from "@/dp";
import { useElementSize } from "@/hooks/useElementSize";
import { useStore } from "@/store";
import { Button } from "../ui/button";

const DpCanvas = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<DpRenderer | null>(null);
  const { width, height } = useElementSize(wrapperRef);
  const { run, frame, theme } = useStore(
    useShallow((s) => ({
      run: s.dpRun,
      frame: s.dpRun.frames[Math.min(s.frameIndex, s.dpRun.length - 1)],
      theme: s.theme,
    })),
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
    rendererRef.current?.update({ run, frame });
  }, [run, frame]);

  const label = `${dpProblems[run.algorithm].title} table for ${run.a} and ${run.b}.`;
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

/** The table, and the words it's for. */
export const DpStage = () => {
  const { a, b } = useStore(useShallow((s) => ({ a: s.dpA, b: s.dpB })));
  return (
    <div data-tour="bars" className="relative flex h-full min-h-0 min-w-0 flex-col gap-2">
      <DpCanvas />
      <WordsBar key={`${a}|${b}`} a={a} b={b} />
    </div>
  );
};
