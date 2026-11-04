import { ShuffleIcon } from "@radix-ui/react-icons";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { TreeRenderer } from "@/canvas/treeRenderer";
import { structures } from "@/consts/structures";
import { useElementSize } from "@/hooks/useElementSize";
import { MAX_VALUE, MIN_VALUE, type OperationKind, type StructureAlgorithm, type TreeFrame } from "@/structures";
import { useStore } from "@/store";
import { count } from "@/utils/count";
import { moveDuration } from "@/utils/speed";
import { Button } from "../ui/button";

/** A tree on canvas. Shared by the single view and the race lanes. */
export const TreeCanvas = ({
  frame,
  algorithm,
  label,
}: {
  frame: TreeFrame;
  algorithm: StructureAlgorithm;
  label: string;
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TreeRenderer | null>(null);
  const { width, height } = useElementSize(wrapperRef);
  const { structureId, speed, isScrubbing, theme } = useStore(
    useShallow((s) => ({ structureId: s.structureId, speed: s.speed, isScrubbing: s.isScrubbing, theme: s.theme })),
  );

  useEffect(() => {
    const renderer = new TreeRenderer(canvasRef.current!);
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
    rendererRef.current?.update({
      frame,
      structureId,
      fade: isScrubbing ? 0 : Math.min(0.45, moveDuration(speed) * 1.6),
      showBalance: algorithm === "avl",
    });
  }, [frame, structureId, speed, isScrubbing, algorithm]);

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
  const { runOperation, nodes } = useStore(
    useShallow((s) => ({
      runOperation: s.runOperation,
      // The final tree's nodes: a stable reference, unlike a list built here on every read.
      nodes: s.structureRun.frames[s.structureRun.frames.length - 1].nodes,
    })),
  );
  const values = nodes.map((n) => n.value);

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
      <label className="flex min-w-0 flex-1 items-center sm:flex-none">
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
      {ACTIONS.map((action) => (
        <Button
          key={action.kind}
          type={action.kind === "insert" ? "submit" : "button"}
          size="sm"
          variant={action.kind === "insert" ? "primary" : "secondary"}
          className="h-10 shrink-0 px-3 sm:px-4"
          onClick={action.kind === "insert" ? undefined : () => run(action.kind)}
        >
          {action.label}
        </Button>
      ))}
      {error && (
        <span id="operation-error" role="alert" className="basis-full px-1 text-xs text-foreground/70 sm:basis-auto">
          {error}
        </span>
      )}
    </form>
  );
};

/** The single view: the tree, and the bar to operate on it. */
export const StructureStage = () => {
  const { frame, algorithm } = useStore(
    useShallow((s) => ({
      frame: s.structureRun.frames[Math.min(s.frameIndex, s.structureRun.frames.length - 1)],
      algorithm: s.structureAlgorithm,
    })),
  );
  const label = `${structures[algorithm].title} with ${count(frame.nodes.length, "value")}, height ${Math.max(0, frame.height)}.`;
  return (
    <div data-tour="bars" className="relative flex h-full min-h-0 min-w-0 flex-col gap-2">
      <TreeCanvas frame={frame} algorithm={algorithm} label={label} />
      <OperationBar />
    </div>
  );
};
