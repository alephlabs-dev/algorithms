import { CodeIcon } from "@radix-ui/react-icons";
import { useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useElementSize } from "@/hooks/useElementSize";
import { useThrottled } from "@/hooks/useThrottled";
import { useModuleUI } from "@/modules";
import { useStore, type StoreState } from "@/store";
import { cn } from "@/utils/cn";
import { stepsPerSecond } from "@/utils/speed";
import { BottomSheet } from "./ui/bottom-sheet";
import { Disclosure } from "./ui/disclosure";
import { useSheetTrigger } from "./ui/sheets";
import { SectionLabel } from "./ui/section-label";
import { localized } from "@/i18n";

const text = localized({
  en: {
    tooFast: "Pause or slow down to follow each step.",
    currentStep: "Current step",
    pseudocode: "Pseudocode",
    showPseudocode: (step: string) => `${step} Show pseudocode`,
  },
  es: {
    tooFast: "Pausa o baja la velocidad para seguir cada paso.",
    currentStep: "Paso actual",
    pseudocode: "Pseudocódigo",
    showPseudocode: (step) => `${step} Ver pseudocódigo`,
  },
});

// Faster than this, a moving highlight can't be read, so the code and the
// sentence step back until playback slows down or pauses.
const READABLE_STEPS_PER_SECOND = 6;
// The highlighted line and the sentence change at most this often.
const UPDATE_INTERVAL_MS = 250;

const tooFastFor = (s: StoreState) => s.isPlaying && stepsPerSecond(s.speed) > READABLE_STEPS_PER_SECOND;

// Only re-renders when the line or the play state changes, not on every frame.
const usePseudocode = () => {
  const { code } = useModuleUI();
  const state = useStore(
    useShallow((s) => ({
      lines: code.lines(s),
      line: code.line(s),
      isPlaying: s.isPlaying,
      tooFast: tooFastFor(s),
    }))
  );
  const line = useThrottled(state.line, UPDATE_INTERVAL_MS);
  return { ...state, line };
};

/** The current step in one plain sentence, e.g. "Compare 17 with the pivot 33: it's smaller." */
const useNarration = () => {
  const { code } = useModuleUI();
  const frameIndex = useStore((s) => s.frameIndex);
  const tooFast = useStore(tooFastFor);
  const index = useThrottled(frameIndex, UPDATE_INTERVAL_MS);
  // Narrates from the store as it is now, at the throttled position.
  const sentence = useStore((s) => (tooFast ? "" : code.narrate(s, index)));
  if (tooFast) return { sentence: text.tooFast, muted: true };
  return { sentence, muted: false };
};

const CodeLines = ({ lines, line }: { lines: string[]; line: number | null }) => (
  <ol className="flex flex-col font-mono text-[13px] leading-6">
    {lines.map((code, k) => {
      const indent = code.length - code.trimStart().length;
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
          {code.trimStart()}
        </li>
      );
    })}
  </ol>
);

const Narration = ({ className }: { className?: string }) => {
  const { sentence, muted } = useNarration();
  return (
    <p aria-live="polite" className={cn("text-[15px] leading-snug", muted ? "text-foreground/60" : "text-foreground", className)}>
      {sentence}
    </p>
  );
};

const cardClass = "flex flex-col gap-4 rounded-3xl border border-edge bg-surface p-5";

const CardLabel = () => (
  <span className="flex items-center gap-2">
    <CodeIcon className="h-4 w-4" /> {text.pseudocode}
  </span>
);

// Room kept for the step's sentence when deciding whether the card fits: about three lines.
const NARRATION_ROOM = "min-h-[4.25rem]";

/**
 * The code with the current line, the step in plain words and the legend,
 * as a card under the settings panel. XL screens. It takes the room the
 * settings leave: when the whole card doesn't fit there, it starts collapsed
 * and scrolls inside once opened (the settings never give way).
 */
export const NowCard = ({ className }: { className?: string }) => {
  const { lines, line, tooFast } = usePseudocode();
  const slotRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const room = useElementSize(slotRef).height;
  const need = useElementSize(measureRef).height;
  // Before the first measurement (or while hidden) the card is shown whole.
  const fits = room === 0 || need <= room;

  const body = (
    <>
      <div className={cn("-mx-3 transition-opacity duration-300", { "opacity-40": tooFast })}>
        <CodeLines lines={lines} line={tooFast ? null : line} />
      </div>
      <Narration className="border-l-2 border-secondary pl-3" />
      <div className="h-px bg-edge" />
      <ModuleLegend />
    </>
  );

  return (
    <div
      ref={slotRef}
      role="region"
      aria-label={text.currentStep}
      data-tour="narration"
      className={cn("relative flex min-h-0 flex-1 flex-col overflow-hidden", className)}
    >
      {/* The whole card, laid out but never seen, to know what it needs. Its sentence
          is a fixed room, so the choice doesn't flip with each step. */}
      <div ref={measureRef} aria-hidden className="pointer-events-none invisible absolute inset-x-0 top-0">
        <div className={cardClass}>
          <SectionLabel>
            <CardLabel />
          </SectionLabel>
          <CodeLines lines={lines} line={null} />
          <p className={NARRATION_ROOM} />
          <div className="h-px" />
          <ModuleLegend />
        </div>
      </div>
      {fits ? (
        <section className={cn(cardClass, "max-h-full min-h-0 overflow-y-auto")}>
          <SectionLabel>
            <CardLabel />
          </SectionLabel>
          {body}
        </section>
      ) : (
        <Disclosure
          title={<CardLabel />}
          className={cn(cardClass, "max-h-full min-h-0")}
          headingClassName="text-xs font-semibold uppercase tracking-wider text-foreground/60"
          panelClassName="-mx-3 min-h-0 overflow-y-auto px-3"
        >
          {body}
        </Disclosure>
      )}
    </div>
  );
};

const ModuleLegend = () => {
  const { Legend } = useModuleUI();
  return <Legend stacked />;
};

/**
 * The step in words above the bars, for narrower screens; tapping it opens
 * the full pseudocode in a sheet under the stage.
 */
export const StepCaption = ({ className }: { className?: string }) => {
  const { sentence, muted } = useNarration();
  const trigger = useSheetTrigger("code");

  return (
    <button
      type="button"
      className={cn(
        "tap-target relative flex min-h-10 min-w-0 items-center gap-2 rounded-full px-3 py-1 text-left text-sm hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
        muted ? "text-foreground/60" : "text-foreground",
        className
      )}
      aria-label={text.showPseudocode(sentence)}
      data-tour="narration"
      {...trigger}
    >
      <CodeIcon className="h-4 w-4 shrink-0 text-secondary" />
      <span className="line-clamp-2">{sentence}</span>
    </button>
  );
};

/**
 * Narrower screens: the code with the current line, in a non-modal sheet, so
 * it can be followed while the run plays above it.
 */
export const CodeSheet = () => {
  const { lines, line, tooFast } = usePseudocode();
  return (
    <BottomSheet id="code" title={text.pseudocode} icon={<CodeIcon className="h-5 w-5" />}>
      <div className={cn("-mx-3 transition-opacity duration-300", { "opacity-40": tooFast })}>
        <CodeLines lines={lines} line={tooFast ? null : line} />
      </div>
      <Narration className="border-l-2 border-secondary pl-3" />
    </BottomSheet>
  );
};
