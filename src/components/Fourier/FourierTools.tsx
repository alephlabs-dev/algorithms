import { useShallow } from "zustand/react/shallow";
import { fourierSeries, shapeOptions } from "@/consts/fourierSeries";
import { circleOptions, isWave } from "@/fourier";
import { useStore } from "@/store";
import { cn } from "@/utils/cn";
import { count } from "@/utils/count";
import { FactLine } from "../ui/fact-line";
import { PresetButtons } from "../ui/preset-buttons";
import { SegmentedControl } from "../ui/segmented";

/** How many circles add up the series: the one control that shows the series converging. */
export const CirclesPicker = ({ className }: { className?: string }) => {
  const { circles, setCircles, wave } = useStore(
    useShallow((s) => ({
      circles: s.fourierCircles,
      setCircles: s.setFourierCircles,
      wave: isWave(s.fourierAlgorithm),
    })),
  );
  const options = circleOptions[wave ? "wave" : "drawing"];
  return (
    <SegmentedControl<number>
      label="Circles"
      options={options.map((n) => ({
        value: n,
        label: <span className="font-mono">{n === 256 ? "All" : n}</span>,
        title: count(n, "circle"),
      }))}
      value={circles}
      onChange={(n) => n !== circles && setCircles(n)}
      compact
      className={className}
    />
  );
};

/** The drawings to rebuild, and drawing your own. */
export const ShapeButtons = ({ className }: { className?: string }) => {
  const { shape, setShape } = useStore(useShallow((s) => ({ shape: s.fourierShape, setShape: s.setFourierShape })));
  return (
    <PresetButtons label="Drawings" presets={shapeOptions} current={shape} onPick={setShape} className={className} />
  );
};

/** Above the stage: circles always, and the drawings for epicycles. */
export const FourierTools = ({ className }: { className?: string }) => {
  const wave = useStore((s) => isWave(s.fourierAlgorithm));
  return (
    <div
      data-tour="tools"
      role="toolbar"
      aria-label="Fourier tools"
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 self-start", className)}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground/70">Circles</span>
        <CirclesPicker className="w-72" />
      </div>
      {!wave && <ShapeButtons />}
    </div>
  );
};

const Item = ({ className, label }: { className: string; label: string }) => (
  <li className="flex items-center gap-2">
    <span aria-hidden className={cn("shrink-0", className)} />
    {label}
  </li>
);

/** What each line on the stage is. */
export const FourierLegend = ({ className, stacked }: { className?: string; stacked?: boolean }) => {
  const wave = useStore((s) => isWave(s.fourierAlgorithm));
  return (
    <ul
      aria-label="Legend"
      className={cn(
        "flex text-xs text-foreground md:text-sm",
        stacked ? "flex-col gap-1.5" : "flex-wrap items-center gap-x-4 gap-y-1",
        className,
      )}
    >
      <Item className="h-3 w-3 rounded-full border border-line" label="Circles" />
      <Item className="h-2.5 w-2.5 rounded-full bg-primary" label="Tip" />
      <Item className="h-1 w-4 rounded-full bg-secondary" label={wave ? "Their sum" : "Traced"} />
      <Item
        className="h-0.5 w-4 bg-[repeating-linear-gradient(90deg,var(--color-line)_0_4px,transparent_4px_7px)]"
        label={wave ? "The wave" : "The drawing"}
      />
    </ul>
  );
};

/** Circles and how close they get, for the dock. */
export const FourierStatsInline = ({ className }: { className?: string }) => {
  const { circles, error } = useStore(useShallow((s) => ({ circles: s.fourierCircles, error: s.fourierRun.error })));
  return (
    <p className={cn("whitespace-nowrap font-mono text-xs text-foreground/80", className)}>
      {count(circles, "circle")} · off by {(error * 100).toFixed(1)}%
    </p>
  );
};

/** The series in one line, and the speeds its circles turn at. */
export const FourierFacts = () => {
  const algorithm = useStore((s) => s.fourierAlgorithm);
  const { formula, speeds } = fourierSeries[algorithm];
  return <FactLine facts={[formula, speeds]} />;
};
