import { useShallow } from "zustand/react/shallow";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";
import { fourierSeries, shapeGroups, shapeLabel, shapeOptions, type ShapeOption } from "@/consts/fourierSeries";
import { circleOptions, isWave, type FourierShape } from "@/fourier";
import { useStore } from "@/store";
import { cn } from "@/utils/cn";
import { count } from "@/utils/count";
import { FactLine } from "../ui/fact-line";
import { popoverClass } from "../ui/popover";
import { SectionLabel } from "../ui/section-label";
import { SegmentedControl } from "../ui/segmented";
import { ShapeThumb } from "./ShapeThumb";
import { localized } from "@/i18n";

const text = localized({
  en: {
    circles: "Circles",
    all: "All",
    circleCount: (n: number) => count(n, "circle"),
    drawing: (label: string) => `Drawing: ${label}. Change`,
    tools: "Fourier tools",
    legend: "Legend",
    tip: "Tip",
    sum: "Their sum",
    traced: "Traced",
    theWave: "The wave",
    theDrawing: "The drawing",
    offBy: (error: string) => ` · off by ${error}%`,
  },
  es: {
    circles: "Círculos",
    all: "Todos",
    circleCount: (n) => `${n} ${n === 1 ? "círculo" : "círculos"}`,
    drawing: (label) => `Dibujo: ${label}. Cambiar`,
    tools: "Herramientas de Fourier",
    legend: "Leyenda",
    tip: "Punta",
    sum: "Su suma",
    traced: "Trazado",
    theWave: "La onda",
    theDrawing: "El dibujo",
    offBy: (error) => ` · error ${error}%`,
  },
});


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
      label={text.circles}
      options={options.map((n) => ({
        value: n,
        label: <span className="font-mono">{n === 256 ? text.all : n}</span>,
        title: text.circleCount(n),
      }))}
      value={circles}
      onChange={(n) => n !== circles && setCircles(n)}
      compact
      className={className}
    />
  );
};

const tileClass =
  "flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border px-1 py-2.5 text-[11px] transition-colors sm:px-2 sm:text-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary";

/** Every drawing as a tile with its miniature, in groups, then drawing your own. */
export const ShapeGrid = ({ onPick, columns = "grid-cols-4" }: { onPick?: () => void; columns?: string }) => {
  const { shape, setShape } = useStore(useShallow((s) => ({ shape: s.fourierShape, setShape: s.setFourierShape })));
  const pick = (value: FourierShape) => {
    setShape(value);
    onPick?.();
  };
  const tile = (option: ShapeOption) => (
    <button
      key={option.value}
      type="button"
      title={option.title}
      aria-pressed={option.value === shape}
      onClick={() => pick(option.value)}
      className={cn(
        tileClass,
        option.value === shape
          ? "border-foreground/60 bg-accent font-semibold text-foreground"
          : "border-edge text-foreground/80 hover:bg-accent hover:text-foreground",
      )}
    >
      <ShapeThumb shape={option.value} />
      <span className="text-center leading-tight">{option.label}</span>
    </button>
  );
  return (
    <div className="flex flex-col gap-4">
      {shapeGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-2">
          <SectionLabel>{group.label}</SectionLabel>
          <div className={cn("grid gap-2", columns)}>{group.shapes.map(tile)}</div>
        </div>
      ))}
      {tile(shapeOptions[shapeOptions.length - 1])}
    </div>
  );
};

/** Wide screens: a button showing the drawing on stage, opening the grid of drawings. */
export const DrawingPicker = () => {
  const [open, setOpen] = useState(false);
  const shape = useStore((s) => s.fourierShape);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={text.drawing(shapeLabel(shape))}
        className="tap-target relative flex h-10 items-center gap-2 rounded-full border border-line/70 pl-2 pr-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent data-[state=open]:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
      >
        <ShapeThumb shape={shape} className="h-7 w-7" />
        {shapeLabel(shape)}
        <ChevronDownIcon className="h-4 w-4 text-foreground/60" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={8} className={cn(popoverClass, "w-[26rem] p-4")}>
          <ShapeGrid onPick={() => setOpen(false)} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

/** Above the stage: circles always, and the drawings for epicycles. */
export const FourierTools = ({ className }: { className?: string }) => {
  const wave = useStore((s) => isWave(s.fourierAlgorithm));
  return (
    <div
      data-tour="tools"
      role="toolbar"
      aria-label={text.tools}
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 self-start", className)}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground/70">{text.circles}</span>
        <CirclesPicker className="w-72" />
      </div>
      {!wave && <DrawingPicker />}
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
      aria-label={text.legend}
      className={cn(
        "flex text-xs text-foreground md:text-sm",
        stacked ? "flex-col gap-1.5" : "flex-wrap items-center gap-x-4 gap-y-1",
        className,
      )}
    >
      <Item className="h-3 w-3 rounded-full border border-line" label={text.circles} />
      <Item className="h-2.5 w-2.5 rounded-full bg-primary" label={text.tip} />
      <Item className="h-1 w-4 rounded-full bg-secondary" label={wave ? text.sum : text.traced} />
      <Item
        className="h-0.5 w-4 bg-[repeating-linear-gradient(90deg,var(--color-line)_0_4px,transparent_4px_7px)]"
        label={wave ? text.theWave : text.theDrawing}
      />
    </ul>
  );
};

/** Circles and how close they get, for the dock. */
export const FourierStatsInline = ({ className }: { className?: string }) => {
  const { circles, error } = useStore(useShallow((s) => ({ circles: s.fourierCircles, error: s.fourierRun.error })));
  return (
    <p className={cn("whitespace-nowrap font-mono text-xs text-foreground/80", className)}>
      {text.circleCount(circles)}
      {text.offBy((error * 100).toFixed(1))}
    </p>
  );
};

/** The series in one line, and the speeds its circles turn at. */
export const FourierFacts = () => {
  const algorithm = useStore((s) => s.fourierAlgorithm);
  const { formula, speeds } = fourierSeries[algorithm];
  return <FactLine facts={[formula, speeds]} />;
};
