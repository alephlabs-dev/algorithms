import { CodeIcon } from "@radix-ui/react-icons";
import { useShallow } from "zustand/react/shallow";
import { pseudocode } from "@/algorithms";
import { useThrottled } from "@/hooks/useThrottled";
import { selectFrame, selectLastIndex, useStore } from "@/store";
import { cn } from "@/utils/cn";
import { stepsPerSecond } from "@/utils/speed";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { SectionLabel } from "./ui/section-label";

// Faster than this, a moving highlight can't be read, so the code steps back.
const READABLE_STEPS_PER_SECOND = 6;
// The highlighted line changes at most this often.
const LINE_INTERVAL_MS = 250;

// Only re-renders when the line or the play state changes, not on every frame.
const usePseudocode = () => {
  const state = useStore(
    useShallow((s) => ({
      lines: pseudocode[s.activeAlgorithm],
      line: selectFrame(s).line,
      atStart: s.frameIndex === 0,
      atEnd: s.frameIndex === selectLastIndex(s),
      isPlaying: s.isPlaying,
      tooFast: s.isPlaying && stepsPerSecond(s.speed) > READABLE_STEPS_PER_SECOND,
    }))
  );
  const line = useThrottled(state.line, LINE_INTERVAL_MS);
  return { ...state, line };
};

const CodeLines = ({ lines, line }: { lines: string[]; line: number | null }) => (
  <ol className="flex flex-col font-mono text-[13px] leading-6">
    {lines.map((text, k) => {
      const indent = text.length - text.trimStart().length;
      return (
        <li
          key={k}
          aria-current={k === line ? "step" : undefined}
          // Long lines wrap with a hanging indent instead of scrolling sideways.
          style={{ paddingLeft: `calc(0.75rem + ${indent + 2}ch)`, textIndent: "-2ch" }}
          className={cn(
            "rounded-sm border-l-2 border-transparent pr-3 text-foreground/55 transition-colors duration-200",
            { "border-primary bg-primary/15 text-foreground": k === line }
          )}
        >
          {text.trimStart()}
        </li>
      );
    })}
  </ol>
);

/** Pseudocode as a card beside the bars, sized to the code. Wide screens. */
export const CodeCard = ({ className }: { className?: string }) => {
  const { lines, line, tooFast } = usePseudocode();
  return (
    <section aria-label="Pseudocode" className={cn("flex min-h-0 flex-col gap-3 overflow-y-auto rounded-sm bg-accent/40 py-4", className)}>
      <SectionLabel className="flex items-center gap-2 px-4">
        <CodeIcon className="h-4 w-4" /> Pseudocode
      </SectionLabel>
      <div className={cn("px-1 transition-opacity duration-300", { "opacity-40": tooFast })}>
        <CodeLines lines={lines} line={tooFast ? null : line} />
      </div>
      {tooFast && <p className="px-4 text-xs text-foreground/70">Pause or slow down to follow the code.</p>}
    </section>
  );
};

/**
 * The current line alone, for narrower screens; tapping it opens the full code.
 * While playing it doesn't follow the steps: a line flashing by can't be read.
 */
export const PseudocodeCaption = ({ className }: { className?: string }) => {
  const { lines, line, atStart, atEnd, isPlaying } = usePseudocode();
  const text = isPlaying
    ? "Pause to follow the code"
    : line !== null
      ? lines[line].trim()
      : atEnd && !atStart
        ? "Sorted!"
        : "Press play or step through to start";

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          className={cn(
            "flex min-h-8 min-w-0 items-center gap-2 rounded-sm px-2 py-1 text-left font-mono text-xs hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary lg:min-h-0",
            isPlaying ? "text-foreground/50" : "text-foreground/80",
            className
          )}
          aria-label={`${isPlaying ? "Playing" : `Current step: ${text}`}. Show pseudocode`}
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
