import { ChevronDownIcon, InfoCircledIcon, TimerIcon } from "@radix-ui/react-icons";
import * as Popover from "@radix-ui/react-popover";
import { useState, type ComponentProps, type ReactNode } from "react";
import { MAX_RACERS, useStore } from "@/store";
import { PATH_RACE_DESCRIPTION, RACE_DESCRIPTION } from "@/consts/race";
import { pathAlgorithms, pathTraits } from "@/consts/pathAlgorithms";
import { useStageTitle } from "@/hooks/useStageTitle";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { cn } from "@/utils/cn";
import { AlgorithmList } from "./AlgorithmList";
import { ShortcutsHelp } from "./Controls/ShortcutsHelp";
import { RacerList } from "./Race/RacerPicker";
import { ModuleMenu } from "./ModuleSwitcher";
import { ShareButton } from "./ShareButton";
import { ThemeToggle } from "./ThemeToggle";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { popoverClass } from "./ui/popover";
import { ViewSwitch } from "./ViewSwitch";

/** Best / average / worst time complexity for an algorithm. */
export const Complexity = ({ className }: { className?: string }) => {
  const activeAlgorithm = useStore((s) => s.activeAlgorithm);
  const { timeComplexity } = sortingAlgorithms[activeAlgorithm];
  return (
    <div className={cn("flex flex-wrap items-center gap-2 text-sm", className)}>
      <span className="flex items-center gap-1.5 text-foreground/70">
        <TimerIcon className="h-4 w-4" /> Time
      </span>
      {(["best", "average", "worst"] as const).map((key) => (
        <Badge key={key} className="gap-1.5 font-normal">
          <span className="capitalize text-foreground/70">{key}</span>
          <span className="font-mono">{timeComplexity[key]}</span>
        </Badge>
      ))}
    </div>
  );
};

/** A pill that names what's on stage and opens the list to change it. */
const PickerPill = ({
  label,
  children,
  open,
  onOpenChange,
  ariaLabel,
  hint,
}: {
  label: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  ariaLabel: string;
  /** Lets the guided tour point at this pill. */
  hint?: string;
}) => (
  <Popover.Root open={open} onOpenChange={onOpenChange}>
    <Popover.Trigger
      aria-label={ariaLabel}
      data-tour={hint}
      className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-edge bg-surface pl-5 pr-4 text-lg font-semibold text-foreground transition-colors hover:bg-accent data-[state=open]:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
    >
      {label}
      <ChevronDownIcon className="h-4 w-4 text-foreground/60" />
    </Popover.Trigger>
    <Popover.Portal>
      <Popover.Content align="start" sideOffset={8} className={cn(popoverClass, "max-h-[min(36rem,var(--radix-popover-content-available-height))] w-72 overflow-y-auto")}>
        {children}
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>
);

const AlgorithmPicker = () => {
  const title = useStageTitle();
  const [open, setOpen] = useState(false);
  return (
    <PickerPill label={title} ariaLabel={`Algorithm: ${title}. Change`} open={open} onOpenChange={setOpen} hint="picker">
      <AlgorithmList onPick={() => setOpen(false)} />
    </PickerPill>
  );
};

const RacersPicker = () => {
  const count = useStore((s) => (s.module === "pathfinding" ? s.pathRaceAlgorithms : s.raceAlgorithms).length);
  return (
    <PickerPill
      label={
        <>
          Race <span className="font-normal text-foreground/60">· {count} racers</span>
        </>
      }
      ariaLabel={`Racers: ${count} of ${MAX_RACERS}. Change`}
    >
      <RacerList />
    </PickerPill>
  );
};

/** Reopens the guided tour from the about popover and sheet. */
export const TourLink = (props: ComponentProps<"button">) => {
  const openTour = useStore((s) => s.openTour);
  return (
    <button
      type="button"
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        openTour();
      }}
      className="self-start rounded-full text-sm font-semibold underline decoration-line underline-offset-4 hover:decoration-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
    >
      Take the tour
    </button>
  );
};

/** The longer explanation, on demand, so the stage stays clear. */
const AboutButton = () => {
  const view = useStore((s) => s.view);
  const pathAlgorithm = useStore((s) => (s.module === "pathfinding" ? s.pathAlgorithm : null));
  const sorting = useStore((s) => sortingAlgorithms[s.activeAlgorithm]);
  const { title, shortDescription, longDescription } = pathAlgorithm ? pathAlgorithms[pathAlgorithm] : sorting;
  const isRace = view === "race";
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label={`About ${isRace ? "Race" : title}`} title="How it works">
          <InfoCircledIcon />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={8} className={cn(popoverClass, "w-[28rem] gap-4 p-6")}>
          <h2 className="text-xl font-semibold">{isRace ? "Race" : title}</h2>
          {isRace ? (
            <p className="text-foreground/80">{pathAlgorithm ? PATH_RACE_DESCRIPTION : RACE_DESCRIPTION}</p>
          ) : (
            <>
              <p className="text-foreground/80">{shortDescription}</p>
              <p className="text-sm text-foreground/70">{longDescription}</p>
              {pathAlgorithm ? (
                <p className="font-mono text-xs text-foreground/70">
                  {pathTraits(pathAlgorithm)} · {pathAlgorithms[pathAlgorithm].timeComplexity}
                </p>
              ) : (
                <Complexity />
              )}
            </>
          )}
          {/* Closing the popover first, so the tour has the page to itself. */}
          <Popover.Close asChild>
            <TourLink />
          </Popover.Close>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

/** One-line summary next to the picker: how the algorithm scales. */
const Summary = () => {
  const summary = useStore((s) => {
    if (s.view === "race") return s.module === "pathfinding" ? "Same grid, same clock" : "Same array, same clock";
    if (s.module === "pathfinding") return pathTraits(s.pathAlgorithm);
    const { average, worst } = sortingAlgorithms[s.activeAlgorithm].timeComplexity;
    return average === worst ? `${average} always` : `${average} avg · ${worst} worst`;
  });
  return <span className="hidden truncate font-mono text-xs text-foreground/60 xl:inline">{summary}</span>;
};

/** Desktop: what's on stage (a pill to change it) on the left, the view and actions on the right. */
export const TopBar = ({ className }: { className?: string }) => {
  const view = useStore((s) => s.view);
  return (
    <header className={cn("flex items-center gap-3", className)}>
      <ModuleMenu />
      <span aria-hidden className="text-line">
        /
      </span>
      {view === "race" ? <RacersPicker /> : <AlgorithmPicker />}
      <AboutButton />
      <Summary />
      <div className="ml-auto flex items-center gap-2">
        <ViewSwitch className="w-56" />
        <ShareButton iconOnly />
        <ThemeToggle />
        <ShortcutsHelp />
      </div>
    </header>
  );
};
