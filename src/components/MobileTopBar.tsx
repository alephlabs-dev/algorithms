import { ChevronDownIcon, InfoCircledIcon, MixerHorizontalIcon } from "@radix-ui/react-icons";
import type { ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { algorithmGroups } from "@/consts/algorithmGroups";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { useSettingsSummary } from "@/hooks/useSettingsSummary";
import { MAX_RACERS, useStore } from "@/store";
import type { Algorithm } from "@/types";
import { cn } from "@/utils/cn";
import { RACE_DESCRIPTION } from "@/consts/race";
import { Complexity } from "./TopBar";
import { RacerList } from "./Race/RacerPicker";
import { ShareButton } from "./ShareButton";
import { ThemeToggle } from "./ThemeToggle";
import { SettingsPanel } from "./Settings/SettingsPanel";
import { Button } from "./ui/button";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { ViewSwitch } from "./ViewSwitch";

/** Bottom sheet with a title and scrollable content. */
const Sheet = ({ title, children }: { title: string; children: ReactNode }) => (
  <DrawerContent aria-describedby={undefined}>
    <div className="flex max-h-[85dvh] flex-col gap-4 overflow-y-auto p-6 pb-10 text-foreground">
      <DrawerTitle className="text-xl font-semibold">{title}</DrawerTitle>
      {children}
    </div>
  </DrawerContent>
);

const InfoButton = ({ label, children }: { label: string; children: ReactNode }) => (
  <Drawer>
    <DrawerTrigger asChild>
      <Button variant="ghost" size="icon" aria-label={`About ${label}`}>
        <InfoCircledIcon />
      </Button>
    </DrawerTrigger>
    <Sheet title={label}>{children}</Sheet>
  </Drawer>
);

/** Settings live in a sheet on phones and tablets; the button's name says what's set. */
const SettingsButton = () => {
  const summary = useSettingsSummary();
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button size="icon" className="h-12 w-12 shrink-0" aria-label={`Settings: ${summary}`} title={summary}>
          <MixerHorizontalIcon />
        </Button>
      </DrawerTrigger>
      <Sheet title="Settings">
        <SettingsPanel />
      </Sheet>
    </Drawer>
  );
};

// Shared look for the two field-style pickers: they read as "tap to change".
const fieldClass =
  "flex h-12 w-full min-w-0 items-center rounded-full border border-edge bg-surface pl-5 pr-10 text-left text-lg font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary";

const FieldChevron = () => (
  <ChevronDownIcon
    aria-hidden
    className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/70"
  />
);

/**
 * A native select styled as a field, so phones open their own picker (the
 * iOS wheel, the Android list), grouped by family like the desktop sidebar.
 */
const AlgorithmField = () => {
  const { activeAlgorithm, setActiveAlgorithm } = useStore(
    useShallow((s) => ({ activeAlgorithm: s.activeAlgorithm, setActiveAlgorithm: s.setActiveAlgorithm }))
  );
  return (
    <div data-hint="picker" className="relative min-w-0 flex-1">
      <select
        aria-label="Algorithm"
        value={activeAlgorithm}
        onChange={(event) => setActiveAlgorithm(event.target.value as Algorithm)}
        className={cn(fieldClass, "appearance-none")}
      >
        {algorithmGroups.map((group) => (
          <optgroup key={group.label} label={`${group.label} · ${group.hint}`}>
            {group.algorithms.map((algorithm) => (
              <option key={algorithm} value={algorithm}>
                {sortingAlgorithms[algorithm].title}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <FieldChevron />
    </div>
  );
};

/** Picking 2–4 racers doesn't fit a native select, so the same field opens a checklist. */
const RacersField = () => {
  const racers = useStore((s) => s.raceAlgorithms);
  const names = racers.map((a) => sortingAlgorithms[a].title.replace(/ Sort$/, "").replace("Cocktail Shaker", "Cocktail"));
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button type="button" aria-label={`Racers: ${names.join(", ")}. Change`} className={cn(fieldClass, "relative")}>
          <span className="truncate">
            {racers.length} racers <span className="font-sans text-sm font-normal text-foreground/70">· {names.join(", ")}</span>
          </span>
          <FieldChevron />
        </button>
      </DrawerTrigger>
      <Sheet title={`Racers ${racers.length}/${MAX_RACERS}`}>
        <RacerList showHeader={false} />
      </Sheet>
    </Drawer>
  );
};

/** The view switch and share link, above the picker. */
const ViewRow = () => (
  <div className="flex items-center gap-2">
    <ViewSwitch className="flex-1" />
    <ShareButton iconOnly />
    <ThemeToggle />
  </div>
);

/** Phones and tablets: the view, then the algorithm as a field (tap to change), (i) and settings. */
export const MobileTopBar = ({ className }: { className?: string }) => {
  const activeAlgorithm = useStore((s) => s.activeAlgorithm);
  const { title, shortDescription, longDescription } = sortingAlgorithms[activeAlgorithm];

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <h1 className="sr-only">{title}</h1>
      <ViewRow />
      <div className="flex items-center gap-1">
        <AlgorithmField />
        <InfoButton label={title}>
          <p className="text-foreground/80">{shortDescription}</p>
          <p className="text-foreground/80">{longDescription}</p>
          <Complexity />
        </InfoButton>
        <SettingsButton />
      </div>
    </div>
  );
};

/** Race view on phones and tablets: the racers as a field, then settings. */
export const MobileRaceBar = ({ className }: { className?: string }) => (
  <div className={cn("flex flex-col gap-3", className)}>
    <h1 className="sr-only">Race</h1>
    <ViewRow />
    <div className="flex items-center gap-1">
      <RacersField />
      <InfoButton label="Race">
        <p className="text-foreground/80">{RACE_DESCRIPTION}</p>
      </InfoButton>
      <SettingsButton />
    </div>
  </div>
);
