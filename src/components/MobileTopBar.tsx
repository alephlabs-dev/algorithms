import { ChevronDownIcon, InfoCircledIcon, MixerHorizontalIcon } from "@radix-ui/react-icons";
import { Fragment, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { useModuleUI, useSettingsSummary } from "@/modules";
import { MAX_RACERS, useStore } from "@/store";
import { cn } from "@/utils/cn";
import { TourLink } from "./TopBar";
import { ModuleButton } from "./ModuleSwitcher";
import { RacerList } from "./Race/RacerPicker";
import { ShareButton } from "./ShareButton";
import { ThemeToggle } from "./ThemeToggle";
import { SettingsPanel } from "./Settings/ModuleSettings";
import { StageInfo } from "./StageInfo";
import { Button } from "./ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { ViewSwitch } from "./ViewSwitch";
import { GameToggle } from "./Game";

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
  const { label: summary } = useSettingsSummary();
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
  const { algorithms, current, pick } = useModuleUI();
  const value = useStore(current);
  return (
    <div data-tour="picker" className="relative min-w-0 flex-1">
      <select
        aria-label="Algorithm"
        value={value}
        onChange={(event) => pick(event.target.value)}
        className={cn(fieldClass, "appearance-none truncate")}
      >
        {algorithms.map((group, k) => {
          const options = group.items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ));
          return group.label ? (
            <optgroup key={group.label} label={`${group.label} · ${group.hint}`}>
              {options}
            </optgroup>
          ) : (
            <Fragment key={k}>{options}</Fragment>
          );
        })}
      </select>
      <FieldChevron />
    </div>
  );
};

/** Picking 2–4 racers doesn't fit a native select, so the same field opens a checklist. */
const RacersField = () => {
  const { algorithms, race } = useModuleUI();
  const names = useStore(
    useShallow((s) => {
      const shortOf = new Map(algorithms.flatMap((g) => g.items).map((item) => [item.id, item.short]));
      return (race?.racers(s) ?? []).map((id) => shortOf.get(id) ?? id);
    })
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
const ViewRow = () => {
  const { race, title } = useModuleUI();
  return (
    <div className="flex items-center gap-2">
      <ModuleButton />
      {/* A module without a race names itself here instead. */}
      {race ? (
        <ViewSwitch className="min-w-0 flex-1" />
      ) : (
        <span className="flex-1 pl-1 text-[15px] font-semibold">{title}</span>
      )}
      <GameToggle compact />
      <ShareButton iconOnly />
      <ThemeToggle />
    </div>
  );
};

/** Phones and tablets: the view, then the algorithm as a field (tap to change), (i) and settings. */
export const MobileTopBar = ({ className }: { className?: string }) => {
  const { about } = useModuleUI();
  const title = useStore((s) => about(s).title);
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <ViewRow />
      <div className="flex items-center gap-1">
        <AlgorithmField />
        <InfoButton label={title}>
          <StageInfo compact />
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
export const MobileRaceBar = ({ className }: { className?: string }) => (
  <div className={cn("flex flex-col gap-3", className)}>
    <ViewRow />
    <div className="flex items-center gap-1">
      <RacersField />
      <InfoButton label="Race">
        <StageInfo />
        <DrawerClose asChild>
          <TourLink />
        </DrawerClose>
      </InfoButton>
      <SettingsButton />
    </div>
  </div>
);
