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
import { useStore } from "@/store";
import { count } from "@/utils/count";
import { moveDuration } from "@/utils/speed";
import { Button } from "../ui/button";

/** A structure on canvas: a tree (or heap) or a hash table. Shared by the single view and the race lanes. */
export const StructureCanvas = ({
  frame,
  algorithm,
  label,
}: {
  frame: StructureFrame;
  algorithm: StructureAlgorithm;
  label: string;
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TreeRenderer | HashRenderer | null>(null);
  const { width, height } = useElementSize(wrapperRef);
  const { structureId, speed, isScrubbing, theme, ops } = useStore(
    useShallow((s) => ({
      structureId: s.structureId,
      speed: s.speed,
      isScrubbing: s.isScrubbing,
      theme: s.theme,
      ops: s.structureOps,
    })),
  );
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
      });
    } else if (renderer instanceof HashRenderer && frame.shape === "table") {
      renderer.update({ frame, chaining: algorithm === "chaining", structureId, fade, ops });
    }
  }, [frame, structureId, speed, isScrubbing, algorithm, ops, kind]);

  return (
    <div ref={wrapperRef} className="relative min-h-0 w-full flex-1">
      <canvas ref={canvasRef} role="img" aria-label={label} className="absolute inset-0 h-full w-full" />
    </div>
  );
};

const ACTIONS: { kind: OperationKind; label: string }[] = [
  { kind: "insert", label: "Insert" },
  { kind: "search", label: "Find" },
  { kind: "delete", label: "Delete" },
];

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
    const value = Number(text);
    if (!Number.isInteger(value) || value < MIN_VALUE || value > MAX_VALUE) {
      setError(`A whole number from ${MIN_VALUE} to ${MAX_VALUE}`);
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
      aria-label="Operations"
      className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-edge bg-surface px-2 py-2 sm:gap-2 sm:px-3"
    >
      <label className="flex min-w-11 flex-1 items-center sm:flex-none">
        <span className="sr-only">Value</span>
        <input
          type="number"
          inputMode="numeric"
          min={MIN_VALUE}
          max={MAX_VALUE}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Value"
          aria-invalid={error !== null}
          aria-describedby={error ? "operation-error" : undefined}
          className="h-10 w-full min-w-11 rounded-full border border-line/70 bg-background px-2.5 text-center font-mono sm:w-24 sm:text-left sm:px-4 text-sm text-foreground placeholder:text-foreground/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
      </label>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-9 shrink-0 sm:w-10"
        onClick={pickRandom}
        aria-label="Pick a random value"
        title="Pick a random value"
      >
        <ShuffleIcon />
      </Button>
      {ACTIONS.filter((action) => !heap || action.kind !== "delete").map((action) => (
        <Button
          key={action.kind}
          type={action.kind === "insert" ? "submit" : "button"}
          size="sm"
          variant={action.kind === "insert" ? "primary" : "secondary"}
          className="h-10 shrink-0 px-2.5 sm:px-4"
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
          className="h-10 shrink-0 px-2.5 sm:px-4"
          disabled={min === null}
          onClick={() => {
            setError(null);
            if (min !== null) runOperation({ kind: "delete", value: min });
          }}
          title="Take out the smallest value, the root"
        >
          Pop min
        </Button>
      )}
      {error && (
        <span id="operation-error" role="alert" className="basis-full px-1 text-xs text-foreground/70 sm:basis-auto">
          {error}
        </span>
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
      ? `${structures[algorithm].title} with ${count(size, "value")}, height ${Math.max(0, frame.height)}.`
      : `${structures[algorithm].title} with ${count(size, "value")} in ${count(frame.buckets.length, algorithm === "chaining" ? "bucket" : "slot")}.`;
  return (
    <div data-tour="bars" className="relative flex h-full min-h-0 min-w-0 flex-col gap-2">
      <StructureCanvas frame={frame} algorithm={algorithm} label={label} />
      <OperationBar />
    </div>
  );
};
