import { InfoCircledIcon, MixerHorizontalIcon } from "@radix-ui/react-icons";
import type { ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { useModuleUI, useSettingsSummary } from "@/modules";
import { useAlgorithmGroups } from "./algorithmGroups";
import { MAX_RACERS, useStore } from "@/store";
import { cn } from "@/utils/cn";
import { TourLink } from "./TopBar";
import { ModuleButton } from "./ModuleSwitcher";
import { RacerList } from "./Race/RacerPicker";
import { ShareButton } from "./ShareButton";
import { ThemeToggle } from "./ThemeToggle";
import { StageInfo } from "./StageInfo";
import { Button } from "./ui/button";
import { Drawer, DrawerClose, DrawerSheet, DrawerTrigger } from "./ui/drawer";
import { SettingsPanel } from "./Settings/ModuleSettings";
import { FieldChevron, fieldClass, Select } from "./ui/select";
import { ViewSwitch } from "./ViewSwitch";
import { useHasViewSwitch } from "./views";
import { localized } from "@/i18n";

const text = localized({
  en: {
    about: (label: string) => `About ${label}`,
    settings: "Settings",
    settingsLabel: (summary: string) => `Settings: ${summary}`,
    algorithm: "Algorithm",
    racersField: (names: string) => `Racers: ${names}. Change`,
    racers: (count: number) => `${count} racers`,
    racersSheet: (count: number, max: number) => `Racers ${count}/${max}`,
    race: "Race",
  },
  es: {
    about: (label) => `Acerca de ${label}`,
    settings: "Ajustes",
    settingsLabel: (summary) => `Ajustes: ${summary}`,
    algorithm: "Algoritmo",
    racersField: (names) => `Competidores: ${names}. Cambiar`,
    racers: (count) => `${count} ${count === 1 ? "competidor" : "competidores"}`,
    racersSheet: (count, max) => `Competidores ${count}/${max}`,
    race: "Carrera",
  },
});

const InfoButton = ({ label, children }: { label: string; children: ReactNode }) => (
  <Drawer>
    <DrawerTrigger asChild>
      <Button variant="ghost" size="icon" aria-label={text.about(label)}>
        <InfoCircledIcon />
      </Button>
    </DrawerTrigger>
    <DrawerSheet title={label}>{children}</DrawerSheet>
  </Drawer>
);

/**
 * Phones and upright tablets: the settings in a modal sheet over the stage,
 * fitting without scroll (UX.md rule 14). The button's name says what's set.
 */
const SettingsButton = () => {
  const { label: summary } = useSettingsSummary();
  return (
    // The stage stays put under the sheet: no scaling, and playback carries on.
    <Drawer shouldScaleBackground={false}>
      <DrawerTrigger asChild>
        <Button
          data-tour="settings"
          size="icon"
          className="h-12 w-12 shrink-0"
          aria-label={text.settingsLabel(summary)}
          title={summary}
        >
          <MixerHorizontalIcon />
        </Button>
      </DrawerTrigger>
      <DrawerSheet title={text.settings} data-settings>
        <SettingsPanel />
      </DrawerSheet>
    </Drawer>
  );
};

/** The algorithm on stage as a field; tapping it opens the grouped list in a drawer (UX.md rule 11). */
const AlgorithmSelect = () => {
  const { current, pick } = useModuleUI();
  const value = useStore(current);
  return (
    <Select
      data-tour="picker"
      label={text.algorithm}
      value={value}
      onChange={pick}
      className="flex-1"
      groups={useAlgorithmGroups()}
    />
  );
};

/** Picking 2–4 racers doesn't fit a select, so the same field opens a checklist. */
const RacersField = () => {
  const { algorithms, race } = useModuleUI();
  const names = useStore(
    useShallow((s) => {
      const shortOf = new Map(algorithms.flatMap((g) => g.items).map((item) => [item.id, item.short]));
      return (race?.racers(s) ?? []).map((id) => race?.racerName?.(id) ?? shortOf.get(id) ?? id);
    })
  );

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button type="button" aria-label={text.racersField(names.join(", "))} className={cn(fieldClass, "relative")}>
          <span className="truncate">
            {text.racers(names.length)}{" "}
            <span className="font-sans text-sm font-normal text-foreground/70">· {names.join(", ")}</span>
          </span>
          <FieldChevron />
        </button>
      </DrawerTrigger>
      <DrawerSheet title={text.racersSheet(names.length, MAX_RACERS)}>
        <RacerList showHeader={false} />
      </DrawerSheet>
    </Drawer>
  );
};

/** The view switch and share link, above the picker. */
const ViewRow = () => {
  const { title } = useModuleUI();
  return (
    <div className="flex items-center gap-2">
      <ModuleButton />
      {/* A module with one view names itself here instead; the name gives way first, the switch never. */}
      {useHasViewSwitch() ? (
        // Phones stretch it; from iPad up it's as wide as its labels need, so it doesn't outweigh the picker.
        <ViewSwitch className="flex-1 md:min-w-56 md:flex-none md:mr-auto" />
      ) : (
        <span className="min-w-0 flex-1 truncate pl-1 text-[15px] font-semibold">{title}</span>
      )}
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
        <AlgorithmSelect />
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
      <InfoButton label={text.race}>
        <StageInfo />
        <DrawerClose asChild>
          <TourLink />
        </DrawerClose>
      </InfoButton>
      <SettingsButton />
    </div>
  </div>
);
