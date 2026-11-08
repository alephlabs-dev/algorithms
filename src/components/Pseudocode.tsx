import { CodeIcon } from "@radix-ui/react-icons";
import { useShallow } from "zustand/react/shallow";
import { useThrottled } from "@/hooks/useThrottled";
import { useModuleUI } from "@/modules";
import { useStore, type StoreState } from "@/store";
import { cn } from "@/utils/cn";
import { stepsPerSecond } from "@/utils/speed";
import { BottomSheet } from "./ui/bottom-sheet";
import { useSheetTrigger } from "./ui/sheets";
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

/**
 * The code with the current line and the step in plain words, as the side
 * panel's Pseudocode tab. iPad landscape and desktop. The legend stays in the
 * row above the stage, so it shows once, whichever tab is open. It's
 * explanation, not controls, so it may scroll inside (UX.md rule 14).
 */
export const NowCard = ({ className }: { className?: string }) => {
  const { lines, line, tooFast } = usePseudocode();
  return (
    <section
      data-tour="narration"
      aria-label={text.currentStep}
      className={cn("flex min-h-0 flex-col gap-4 overflow-y-auto rounded-3xl border border-edge bg-surface p-5", className)}
    >
      <div className={cn("-mx-3 transition-opacity duration-300", { "opacity-40": tooFast })}>
        <CodeLines lines={lines} line={tooFast ? null : line} />
      </div>
      <Narration className="border-l-2 border-secondary pl-3" />
    </section>
  );
};

/**
 * The step in words above the bars, for narrower screens; tapping it opens
 * the full pseudocode in a sheet under the stage, or does `onActivate` (where
 * the pseudocode lives elsewhere on the page).
 */
export const StepCaption = ({ className, onActivate }: { className?: string; onActivate?: () => void }) => {
  const { sentence, muted } = useNarration();
  const sheetTrigger = useSheetTrigger("code");
  const trigger = onActivate ? { onClick: onActivate } : sheetTrigger;

  return (
    <button
      type="button"
      className={cn(
        "tap-target relative flex min-w-0 items-start gap-2 rounded-2xl px-3 py-1 text-left text-sm hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
        muted ? "text-foreground/60" : "text-foreground",
        className
      )}
      aria-label={text.showPseudocode(sentence)}
      data-tour="narration"
      {...trigger}
    >
      {/* Centred on the first line (text-sm is 20px tall). */}
      <CodeIcon className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
      {/* Always two lines tall, one line or two, so the stage under it never moves (UX.md rule 1).
          Every step sentence fits in two lines at 393px (e2e/step-sentences-fit.spec.ts); the clamp is a safety net. */}
      <span className="line-clamp-2 min-h-[2lh]">{sentence}</span>
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
