import { CodeIcon } from "@radix-ui/react-icons";
import { useShallow } from "zustand/react/shallow";
import { pseudocode } from "@/algorithms";
import { selectFrame, selectLastIndex, useStore } from "@/store";
import { cn } from "@/utils/cn";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "./ui/drawer";

// Only re-renders when the highlighted line changes, not on every frame.
const usePseudocode = () =>
  useStore(
    useShallow((s) => ({
      lines: pseudocode[s.activeAlgorithm],
      line: selectFrame(s).line,
      atStart: s.frameIndex === 0,
      atEnd: s.frameIndex === selectLastIndex(s),
    }))
  );

const CodeLines = ({ lines, line }: { lines: string[]; line: number | null }) => (
  <ol className="font-mono text-sm leading-6">
    {lines.map((text, k) => (
      <li
        key={k}
        aria-current={k === line ? "step" : undefined}
        className={cn(
          "whitespace-pre rounded-sm border-l-2 border-transparent px-3 text-foreground/55 transition-colors duration-150",
          { "border-primary bg-primary/15 text-foreground": k === line }
        )}
      >
        {text}
      </li>
    ))}
  </ol>
);

/** Full pseudocode beside the visualizer, on wide screens. */
export const PseudocodePanel = ({ className }: { className?: string }) => {
  const { lines, line } = usePseudocode();
  return (
    <section
      aria-label="Pseudocode"
      className={cn("flex-col gap-3 overflow-auto rounded-sm bg-accent/40 py-4", className)}
    >
      <h2 className="flex items-center gap-2 px-4 text-xs font-semibold uppercase tracking-wider text-foreground/60">
        <CodeIcon className="h-4 w-4" /> Pseudocode
      </h2>
      <CodeLines lines={lines} line={line} />
    </section>
  );
};

/** The current line alone; tapping it opens the full pseudocode. For narrower screens. */
export const PseudocodeCaption = ({ className }: { className?: string }) => {
  const { lines, line, atStart, atEnd } = usePseudocode();
  const text =
    line !== null
      ? lines[line].trim()
      : atEnd && !atStart
        ? "Sorted!"
        : "Press play or step through to start";

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          className={cn(
            "flex w-full min-h-8 lg:min-h-0 items-center gap-2 rounded-sm px-2 py-1 text-left font-mono text-xs text-foreground/80 hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
            className
          )}
          aria-label={`Current step: ${text}. Show pseudocode`}
        >
          <CodeIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate">{text}</span>
        </button>
      </DrawerTrigger>
      <DrawerContent aria-describedby={undefined}>
        <div className="flex flex-col gap-4 p-6 pb-10 text-foreground">
          <DrawerTitle className="flex items-center gap-2 font-display text-xl font-semibold">
            <CodeIcon className="h-4 w-4" /> Pseudocode
          </DrawerTitle>
          <CodeLines lines={lines} line={line} />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
