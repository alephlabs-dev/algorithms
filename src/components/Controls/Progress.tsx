import { useShallow } from "zustand/react/shallow";
import { selectLastIndex, useStore } from "@/store";
import { cn } from "@/utils/cn";
import { useModuleUI } from "@/modules";
import { Slider } from "../ui/slider";
import { lang, localized } from "@/i18n";

const text = localized({
  en: {
    progress: "Progress",
    step: "step",
    position: (unit: string, at: string, last: string) => `${unit} ${at} of ${last}`,
  },
  es: {
    progress: "Progreso",
    step: "paso",
    position: (unit, at, last) => `${unit} ${at} de ${last}`,
  },
});

const format = (n: number) => n.toLocaleString(lang === "es" ? "es" : "en-US");

/** The timeline with the position and the counters under it. Kept apart from the dock because it re-renders on every frame. */
export const Progress = ({ className }: { className?: string }) => {
  const { race, Stats, progress } = useModuleUI();
  const { frameIndex, lastIndex, seek, setScrubbing, isRace } = useStore(
    useShallow((s) => ({
      frameIndex: s.frameIndex,
      lastIndex: selectLastIndex(s),
      seek: s.seek,
      setScrubbing: s.setScrubbing,
      isRace: s.view === "race",
    }))
  );
  const unit = isRace && race ? race.unit.one : text.step;
  // A module can count its own way (Fourier counts degrees).
  const custom = !isRace && progress ? progress(frameIndex, lastIndex) : null;

  return (
    <div className={cn("flex min-w-0 flex-col gap-2.5", className)}>
      <Slider
        aria-label={text.progress}
        aria-valuetext={custom ?? text.position(unit, format(frameIndex), format(lastIndex))}
        value={[frameIndex]}
        min={0}
        max={lastIndex}
        step={1}
        onValueChange={([value]) => seek(value)}
        // Dragging snaps bars into place; letting go turns animation back on.
        onPointerDown={() => setScrubbing(true)}
        onValueCommit={() => setScrubbing(false)}
      />
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 font-mono text-xs text-foreground/70">
        <span aria-hidden className="whitespace-nowrap">
          {custom ?? (
            <>
              {isRace ? "" : `${text.step} `}
              {format(frameIndex)} / {format(lastIndex)}
              {isRace && race && ` ${race.unit.short}`}
            </>
          )}
        </span>
        {/* Whatever a module counts, it never runs under the controls beside the dock. */}
        {!isRace && <Stats className="min-w-0 max-w-full truncate" />}
      </div>
    </div>
  );
};
