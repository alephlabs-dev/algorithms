import { CodeIcon } from "@radix-ui/react-icons";
import { useShallow } from "zustand/react/shallow";
import { pseudocode } from "@/algorithms";
import { useThrottled } from "@/hooks/useThrottled";
import { pathPseudocode } from "@/pathfinding";
import { selectFrame, selectPathFrame, useStore, type StoreState } from "@/store";
import { cn } from "@/utils/cn";
import { narrate } from "@/utils/narrate";
import { narratePath } from "@/utils/narratePath";
import { stepsPerSecond } from "@/utils/speed";
import { PathLegend } from "./Pathfinding/PathTools";
import { Legend } from "./RunInfo";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { SectionLabel } from "./ui/section-label";

// Faster than this, a moving highlight can't be read, so the code and the
// sentence step back until playback slows down or pauses.
const READABLE_STEPS_PER_SECOND = 6;
// The highlighted line and the sentence change at most this often.
const UPDATE_INTERVAL_MS = 250;

// The code of whatever is on stage, sorting or pathfinding.
const linesOf = (s: StoreState) => (s.module === "pathfinding" ? pathPseudocode[s.pathAlgorithm] : pseudocode[s.activeAlgorithm]);

// Only re-renders when the line or the play state changes, not on every frame.
const usePseudocode = () => {
  const state = useStore(
    useShallow((s) => ({
      lines: linesOf(s),
      line: s.module === "pathfinding" ? selectPathFrame(s).line : selectFrame(s).line,
      isPlaying: s.isPlaying,
      tooFast: s.isPlaying && stepsPerSecond(s.speed) > READABLE_STEPS_PER_SECOND,
    }))
  );
  const line = useThrottled(state.line, UPDATE_INTERVAL_MS);
  return { ...state, line };
};

/** The current step in one plain sentence, e.g. "Compare 17 with the pivot 33: it's smaller." */
const useNarration = () => {
  const { module, timeline, pathTimeline, pathAlgorithm, frameIndex, lines, tooFast } = useStore(
    useShallow((s) => ({
      module: s.module,
      timeline: s.timeline,
      pathTimeline: s.pathTimeline,
      pathAlgorithm: s.pathAlgorithm,
      frameIndex: s.frameIndex,
      lines: linesOf(s),
      tooFast: s.isPlaying && stepsPerSecond(s.speed) > READABLE_STEPS_PER_SECOND,
    }))
  );
  const index = useThrottled(frameIndex, UPDATE_INTERVAL_MS);
  if (tooFast) return { text: "Pause or slow down to follow each step.", muted: true };
  if (module === "pathfinding") {
    return { text: narratePath(pathTimeline, Math.min(index, pathTimeline.length - 1), pathAlgorithm), muted: false };
  }
  return { text: narrate(timeline, Math.min(index, timeline.length - 1), lines), muted: false };
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
            "rounded-lg pr-3 text-foreground/50 transition-colors duration-200",
            { "bg-secondary/20 text-foreground": k === line }
          )}
        >
          {text.trimStart()}
        </li>
      );
    })}
  </ol>
);

const Narration = ({ className }: { className?: string }) => {
  const { text, muted } = useNarration();
  return (
    <p aria-live="polite" className={cn("text-[15px] leading-snug", muted ? "text-foreground/60" : "text-foreground", className)}>
      {text}
    </p>
  );
};

/**
 * The code with the current line, the step in plain words and the legend,
 * as a card beside the bars. Wide screens.
 */
export const NowCard = ({ className }: { className?: string }) => {
  const { lines, line, tooFast } = usePseudocode();
  return (
    <section
      data-tour="narration"
      aria-label="Current step"
      className={cn("flex min-h-0 flex-col gap-4 overflow-y-auto rounded-3xl border border-edge bg-surface p-5", className)}
    >
      <SectionLabel className="flex items-center gap-2">
        <CodeIcon className="h-4 w-4" /> Pseudocode
      </SectionLabel>
      <div className={cn("-mx-3 transition-opacity duration-300", { "opacity-40": tooFast })}>
        <CodeLines lines={lines} line={tooFast ? null : line} />
      </div>
      <Narration className="border-l-2 border-secondary pl-3" />
      <div className="h-px bg-edge" />
      <ModuleLegend />
    </section>
  );
};

const ModuleLegend = () => {
  const module = useStore((s) => s.module);
  return module === "pathfinding" ? <PathLegend stacked /> : <Legend stacked className="gap-1.5" />;
};

/**
 * The step in words above the bars, for narrower screens; tapping it opens
 * the full pseudocode.
 */
export const StepCaption = ({ className }: { className?: string }) => {
  const { lines, line } = usePseudocode();
  const { text, muted } = useNarration();

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          className={cn(
            "flex min-h-10 min-w-0 items-center gap-2 rounded-full px-3 py-1 text-left text-sm hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
            muted ? "text-foreground/60" : "text-foreground",
            className
          )}
          aria-label={`${text} Show pseudocode`}
          data-tour="narration"
        >
          <CodeIcon className="h-4 w-4 shrink-0 text-secondary" />
          <span className="line-clamp-2">{text}</span>
        </button>
      </DrawerTrigger>
      <DrawerContent aria-describedby={undefined}>
        <div className="flex flex-col gap-4 p-6 pb-10 text-foreground">
          <DrawerTitle className="flex items-center gap-2 text-xl font-semibold">
            <CodeIcon className="h-4 w-4" /> Pseudocode
          </DrawerTitle>
          <CodeLines lines={lines} line={line} />
          <p className="border-l-2 border-secondary pl-3">{text}</p>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
