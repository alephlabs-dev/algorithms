import { ChevronDownIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import * as Popover from "@radix-ui/react-popover";
import { useState, type ComponentProps, type ReactNode } from "react";
import { useModuleUI } from "@/modules";
import { MAX_RACERS, useStore } from "@/store";
import { cn } from "@/utils/cn";
import { AlgorithmList } from "./AlgorithmList";
import { ShortcutsHelp } from "./Controls/ShortcutsHelp";
import { RacerList } from "./Race/RacerPicker";
import { ModuleMenu } from "./ModuleSwitcher";
import { ShareButton } from "./ShareButton";
import { StageInfo } from "./StageInfo";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { popoverClass } from "./ui/popover";
import { ViewSwitch } from "./ViewSwitch";

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
  const { about, algorithms, current } = useModuleUI();
  const title = useStore((s) => about(s).title);
  const id = useStore(current);
  const short = algorithms.flatMap((g) => g.items).find((item) => item.id === id)?.short;
  const [open, setOpen] = useState(false);
  // Long names give way to the short one until there's room.
  const label =
    short && title.length > 20 ? (
      <>
        <span className="2xl:hidden">{short}</span>
        <span className="hidden 2xl:inline">{title}</span>
      </>
    ) : (
      title
    );
  return (
    <PickerPill label={label} ariaLabel={`Algorithm: ${title}. Change`} open={open} onOpenChange={setOpen} hint="picker">
      <AlgorithmList onPick={() => setOpen(false)} />
    </PickerPill>
  );
};

const RacersPicker = () => {
  const { race } = useModuleUI();
  const count = useStore((s) => race?.racers(s).length ?? 0);
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
  const { about } = useModuleUI();
  const title = useStore((s) => (s.view === "race" ? "Race" : about(s).title));
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label={`About ${title}`} title="How it works">
          <InfoCircledIcon />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={8} className={cn(popoverClass, "w-[28rem] gap-4 p-6")}>
          <h2 className="text-xl font-semibold">{title}</h2>
          <StageInfo />
          {/* Closing the popover first, so the tour has the page to itself. */}
          <Popover.Close asChild>
            <TourLink />
          </Popover.Close>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

/** One line next to the picker: how the algorithm scales, or what the race measures. */
const Summary = () => {
  const { summary, race } = useModuleUI();
  const text = useStore((s) => (s.view === "race" && race ? race.tagline : summary(s)));
  return <span className="hidden truncate font-mono text-xs text-foreground/60 xl:inline">{text}</span>;
};

/** Desktop: what's on stage (a pill to change it) on the left, the view and actions on the right. */
export const TopBar = ({ className }: { className?: string }) => {
  const view = useStore((s) => s.view);
  const hasRace = useModuleUI().race !== undefined;
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
        {hasRace && <ViewSwitch className="w-56" />}
        <ShareButton iconOnly />
        <ThemeToggle />
        <ShortcutsHelp />
      </div>
    </header>
  );
};
