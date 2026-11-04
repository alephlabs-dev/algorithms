import { ChevronDownIcon, InfoCircledIcon, MixerHorizontalIcon } from "@radix-ui/react-icons";
import type { ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { algorithmGroups } from "@/consts/algorithmGroups";
import { pathAlgorithms, pathTraits } from "@/consts/pathAlgorithms";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import type { PathAlgorithm } from "@/pathfinding";
import { useSettingsSummary } from "@/hooks/useSettingsSummary";
import { MAX_RACERS, useStore } from "@/store";
import type { Algorithm } from "@/types";
import { cn } from "@/utils/cn";
import { PATH_RACE_DESCRIPTION, RACE_DESCRIPTION } from "@/consts/race";
import { Complexity, TourLink } from "./TopBar";
import { ModuleButton } from "./ModuleSwitcher";
import { RacerList } from "./Race/RacerPicker";
import { ShareButton } from "./ShareButton";
import { ThemeToggle } from "./ThemeToggle";
import { SettingsPanel } from "./Settings/SettingsPanel";
import { Button } from "./ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from "./ui/drawer";
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
        <Button
          data-tour="settings"
          size="icon"
          className="h-12 w-12 shrink-0"
          aria-label={`Settings: ${summary}`}
          title={summary}
        >
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
 * iOS wheel, the Android list), with this module's algorithms only.
 */
const AlgorithmField = () => {
  const { value, isPath, setActiveAlgorithm, setPathAlgorithm } = useStore(
    useShallow((s) => ({
      isPath: s.module === "pathfinding",
      // Options are "sort:quick" or "path:astar", since both families share one picker.
      value: s.module === "pathfinding" ? `path:${s.pathAlgorithm}` : `sort:${s.activeAlgorithm}`,
      setActiveAlgorithm: s.setActiveAlgorithm,
      setPathAlgorithm: s.setPathAlgorithm,
    })),
  );
  return (
    <div data-tour="picker" className="relative min-w-0 flex-1">
      <select
        aria-label="Algorithm"
        value={value}
        onChange={(event) => {
          const [family, name] = event.target.value.split(":");
          if (family === "path") setPathAlgorithm(name as PathAlgorithm);
          else setActiveAlgorithm(name as Algorithm);
        }}
        className={cn(fieldClass, "appearance-none")}
      >
        {isPath
          ? (Object.keys(pathAlgorithms) as PathAlgorithm[]).map((algorithm) => (
              <option key={algorithm} value={`path:${algorithm}`}>
                {pathAlgorithms[algorithm].title}
              </option>
            ))
          : algorithmGroups.map((group) => (
              <optgroup key={group.label} label={`${group.label} · ${group.hint}`}>
                {group.algorithms.map((algorithm) => (
                  <option key={algorithm} value={`sort:${algorithm}`}>
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
  const names = useStore(
    useShallow((s) =>
      s.module === "pathfinding"
        ? s.pathRaceAlgorithms.map((a) => pathAlgorithms[a].short)
        : s.raceAlgorithms.map((a) =>
            sortingAlgorithms[a].title.replace(/ Sort$/, "").replace("Cocktail Shaker", "Cocktail"),
          ),
    ),
  );

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button type="button" aria-label={`Racers: ${names.join(", ")}. Change`} className={cn(fieldClass, "relative")}>
          <span className="truncate">
            {names.length} racers{" "}
            <span className="font-sans text-sm font-normal text-foreground/70">· {names.join(", ")}</span>
          </span>
          <FieldChevron />
        </button>
      </DrawerTrigger>
      <Sheet title={`Racers ${names.length}/${MAX_RACERS}`}>
        <RacerList showHeader={false} />
      </Sheet>
    </Drawer>
  );
};

/** The view switch and share link, above the picker. */
const ViewRow = () => (
  <div className="flex items-center gap-2">
    <ModuleButton />
    <ViewSwitch className="min-w-0 flex-1" />
    <ShareButton iconOnly />
    <ThemeToggle />
  </div>
);

/** Phones and tablets: the view, then the algorithm as a field (tap to change), (i) and settings. */
export const MobileTopBar = ({ className }: { className?: string }) => {
  const activeAlgorithm = useStore((s) => s.activeAlgorithm);
  const pathAlgorithm = useStore((s) => (s.module === "pathfinding" ? s.pathAlgorithm : null));
  const { title, shortDescription, longDescription } = pathAlgorithm
    ? pathAlgorithms[pathAlgorithm]
    : sortingAlgorithms[activeAlgorithm];

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <ViewRow />
      <div className="flex items-center gap-1">
        <AlgorithmField />
        <InfoButton label={title}>
          <p className="text-foreground/80">{shortDescription}</p>
          <p className="text-foreground/80">{longDescription}</p>
          {pathAlgorithm ? (
            <p className="font-mono text-xs text-foreground/70">{pathTraits(pathAlgorithm)}</p>
          ) : (
            <Complexity />
          )}
          <DrawerClose asChild>
            <TourLink />
          </DrawerClose>
        </InfoButton>
        <SettingsButton />
      </div>
    </div>
  );
};

/** Race view on phones and tablets: the racers as a field, then settings. */
export const MobileRaceBar = ({ className }: { className?: string }) => {
  const isPath = useStore((s) => s.module === "pathfinding");
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <ViewRow />
      <div className="flex items-center gap-1">
        <RacersField />
        <InfoButton label="Race">
          <p className="text-foreground/80">{isPath ? PATH_RACE_DESCRIPTION : RACE_DESCRIPTION}</p>
          <DrawerClose asChild>
            <TourLink />
          </DrawerClose>
        </InfoButton>
        <SettingsButton />
      </div>
    </div>
  );
};
