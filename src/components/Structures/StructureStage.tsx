import { ShuffleIcon } from "@radix-ui/react-icons";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { HashRenderer } from "@/canvas/hashRenderer";
import { TreeRenderer } from "@/canvas/treeRenderer";
import { structures } from "@/consts/structures";
import { useElementSize } from "@/hooks/useElementSize";
import {
  MAX_VALUE,
  MIN_VALUE,
  valuesIn,
  type OperationKind,
  type StructureAlgorithm,
  type StructureFrame,
} from "@/structures";
import { selectGameQuestion, useStore } from "@/store";
import { count } from "@/utils/count";
import { moveDuration } from "@/utils/speed";
import { cn } from "@/utils/cn";
import { Button } from "../ui/button";
import { parseWholeNumber } from "../ui/number";
import { besideField, TextField } from "../ui/text-field";
import { localized } from "@/i18n";

const copy = localized({
  en: {
    tapSpot: (label: string) => `${label} Tap the spot where the value will land.`,
    actions: { insert: "Insert", search: "Find", delete: "Delete" } as Record<OperationKind, string>,
    wholeNumber: (min: number, max: number) => `A whole number from ${min} to ${max}`,
    operations: "Operations",
    value: "Value",
    random: "Pick a random value",
    popTitle: "Take out the smallest value, the root",
    popMin: "Pop min",
    treeLabel: (title: string, size: number, height: number) => `${title} with ${count(size, "value")}, height ${height}.`,
    tableLabel: (title: string, size: number, places: number, chaining: boolean) =>
      `${title} with ${count(size, "value")} in ${count(places, chaining ? "bucket" : "slot")}.`,
  },
  es: {
    tapSpot: (label) => `${label} Toca el lugar donde va a quedar el valor.`,
    actions: { insert: "Insertar", search: "Buscar", delete: "Borrar" },
    wholeNumber: (min, max) => `Un número entero de ${min} a ${max}`,
    operations: "Operaciones",
    value: "Valor",
    random: "Elegir un valor al azar",
    popTitle: "Saca el valor más pequeño, la raíz",
    // Short so the bar keeps to one row on phones; the title says it takes the minimum.
    popMin: "Sacar",
    treeLabel: (title, size, height) => `${title} con ${size} ${size === 1 ? "valor" : "valores"}, altura ${height}.`,
    tableLabel: (title, size, places, chaining) =>
      `${title} con ${size} ${size === 1 ? "valor" : "valores"} en ${places} ${chaining ? (places === 1 ? "cubeta" : "cubetas") : places === 1 ? "casilla" : "casillas"}.`,
  },
});


/** A structure on canvas: a tree (or heap) or a hash table. Shared by the single view and the race lanes. */
export const StructureCanvas = ({
  frame,
  algorithm,
  label,
  guess = false,
}: {
  frame: StructureFrame;
  algorithm: StructureAlgorithm;
  label: string;
  /** The single view's tree, where guess mode asks (race lanes never do). */
  guess?: boolean;
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TreeRenderer | HashRenderer | null>(null);
  const { width, height } = useElementSize(wrapperRef);
  const { structureId, speed, isScrubbing, theme, ops, question, answer } = useStore(
    useShallow((s) => ({
      structureId: s.structureId,
      speed: s.speed,
      isScrubbing: s.isScrubbing,
      theme: s.theme,
      ops: s.structureOps,
      question: selectGameQuestion(s),
      answer: s.answerGame,
    })),
  );
  // Guess mode: the spots to tap, in the single view's tree (race lanes never ask).
  const slots = question?.kind === "slot" && guess ? question.slots : undefined;
  const kind = frame.shape;

  // A tree and a table draw differently: a new renderer when the shape changes.
  useEffect(() => {
    const renderer = kind === "tree" ? new TreeRenderer(canvasRef.current!) : new HashRenderer(canvasRef.current!);
    rendererRef.current = renderer;
    return () => renderer.destroy();
  }, [kind]);

  useEffect(() => {
    rendererRef.current?.resize(width, height, window.devicePixelRatio || 1);
  }, [width, height, kind]);

  useEffect(() => {
    rendererRef.current?.refreshColors();
  }, [theme]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const fade = isScrubbing ? 0 : Math.min(0.45, moveDuration(speed) * 1.6);
    if (renderer instanceof TreeRenderer && frame.shape === "tree") {
      renderer.update({
        frame,
        structureId,
        fade,
        showBalance: algorithm === "avl",
        array: algorithm === "heap",
        ops,
        slots,
      });
    } else if (renderer instanceof HashRenderer && frame.shape === "table") {
      renderer.update({ frame, chaining: algorithm === "chaining", structureId, fade, ops });
    }
  }, [frame, structureId, speed, isScrubbing, algorithm, ops, kind, slots]);

  const tap = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const renderer = rendererRef.current;
    if (!slots || !(renderer instanceof TreeRenderer)) return;
    const box = event.currentTarget.getBoundingClientRect();
    const key = renderer.slotAt(event.clientX - box.left, event.clientY - box.top);
    if (key) answer(key);
  };

  return (
    <div ref={wrapperRef} className="relative min-h-0 w-full flex-1">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={slots ? copy.tapSpot(label) : label}
        onClick={tap}
        className={cn("absolute inset-0 h-full w-full", slots && "cursor-pointer")}
      />
    </div>
  );
};

/** What the value field takes, checked by the field on blur and by the bar on submit. */
const VALUE = { min: MIN_VALUE, max: MAX_VALUE, message: copy.wholeNumber(MIN_VALUE, MAX_VALUE) };

const ACTIONS: { kind: OperationKind; label: string }[] = (["insert", "search", "delete"] as const).map((kind) => ({
  kind,
  label: copy.actions[kind],
}));

/** Type a value, then insert, find or delete it. Enter inserts. */
const OperationBar = () => {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { runOperation, last, algorithm } = useStore(
    useShallow((s) => ({
      runOperation: s.runOperation,
      // The final frame: a stable reference, unlike a list built here on every read.
      last: s.structureRun.frames[s.structureRun.frames.length - 1],
      algorithm: s.structureAlgorithm,
    })),
  );
  const values = valuesIn(last);
  const heap = algorithm === "heap";
  // A heap's minimum is its root, slot 0.
  const min = heap && last.shape === "tree" && last.nodes.length ? last.nodes[0].value : null;

  const run = (kind: OperationKind) => {
    const value = parseWholeNumber(text, VALUE.min, VALUE.max);
    if (value === null) {
      setError(VALUE.message);
      return;
    }
    setError(null);
    runOperation({ kind, value });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    run("insert");
  };

  // A value that isn't in the tree yet, so "insert" always has something to do.
  const pickRandom = () => {
    const free = Array.from({ length: MAX_VALUE - MIN_VALUE + 1 }, (_, k) => MIN_VALUE + k).filter(
      (v) => !values.includes(v),
    );
    if (free.length) setText(String(free[Math.floor(Math.random() * free.length)]));
    setError(null);
  };

  return (
    <form
      data-tour="structure"
      onSubmit={submit}
      aria-label={copy.operations}
      className="flex flex-wrap items-start gap-1.5 rounded-2xl border border-edge bg-surface px-2 py-2 sm:gap-2 sm:px-3"
    >
      <TextField
        label={copy.value}
        number={VALUE}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
        error={error}
        autoComplete="off"
        className="min-w-11 flex-1 sm:w-40 sm:flex-none"
        inputClassName="px-2.5 text-center font-mono sm:text-left"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(besideField, "h-10 w-9 shrink-0 sm:w-10 pointer-coarse:h-11")}
        onClick={pickRandom}
        aria-label={copy.random}
        title={copy.random}
      >
        <ShuffleIcon />
      </Button>
      {ACTIONS.filter((action) => !heap || action.kind !== "delete").map((action) => (
        <Button
          key={action.kind}
          type={action.kind === "insert" ? "submit" : "button"}
          size="sm"
          variant={action.kind === "insert" ? "primary" : "secondary"}
          className={cn(besideField, "h-10 shrink-0 px-2.5 sm:px-4 pointer-coarse:h-11")}
          onClick={action.kind === "insert" ? undefined : () => run(action.kind)}
        >
          {action.label}
        </Button>
      ))}
      {heap && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className={cn(besideField, "h-10 shrink-0 px-2.5 sm:px-4 pointer-coarse:h-11")}
          disabled={min === null}
          onClick={() => {
            setError(null);
            if (min !== null) runOperation({ kind: "delete", value: min });
          }}
          title={copy.popTitle}
        >
          {copy.popMin}
        </Button>
      )}
    </form>
  );
};

/** The single view: the structure, and the bar to operate on it. */
export const StructureStage = () => {
  const { frame, algorithm } = useStore(
    useShallow((s) => ({
      frame: s.structureRun.frames[Math.min(s.frameIndex, s.structureRun.frames.length - 1)],
      algorithm: s.structureAlgorithm,
    })),
  );
  const size = valuesIn(frame).length;
  const label =
    frame.shape === "tree"
      ? copy.treeLabel(structures[algorithm].title, size, Math.max(0, frame.height))
      : copy.tableLabel(structures[algorithm].title, size, frame.buckets.length, algorithm === "chaining");
  return (
    <div data-tour="bars" className="relative flex h-full min-h-0 min-w-0 flex-col gap-2">
      <StructureCanvas frame={frame} algorithm={algorithm} label={label} guess />
      <OperationBar />
    </div>
  );
};
