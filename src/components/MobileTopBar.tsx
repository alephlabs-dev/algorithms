import { InfoCircledIcon, MixerHorizontalIcon } from "@radix-ui/react-icons";
import type { ReactNode } from "react";
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
import { FieldChevron, fieldClass, NativeSelect } from "./ui/native-select";
import { SegmentedControl } from "./ui/segmented";
import { ViewSwitch } from "./ViewSwitch";
import { GameToggle } from "./Game";
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
      <Button variant="ghost" size="icon" aria-label={text.about(label)}>
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
          aria-label={text.settingsLabel(summary)}
          title={summary}
        >
          <MixerHorizontalIcon />
        </Button>
      </DrawerTrigger>
      <Sheet title={text.settings}>
        <SettingsPanel />
      </Sheet>
    </Drawer>
  );
};

/** Up to this many algorithms show inline on phones (UX.md rule 11). */
const INLINE_MAX = 5;

/** Whether the module's algorithms show inline as segments, or in a select. */
const useInline = () => {
  const { algorithms, namesTooLongForSegments } = useModuleUI();
  const count = algorithms.reduce((sum, group) => sum + group.items.length, 0);
  return count <= INLINE_MAX && !namesTooLongForSegments;
};

/** The algorithm on stage, and how to pick another. */
const usePick = () => {
  const { current, pick } = useModuleUI();
  return { value: useStore(current), pick };
};

/** Every algorithm at once, one row of equal segments, each with its short name. */
const AlgorithmSegments = () => {
  const { algorithms } = useModuleUI();
  const { value, pick } = usePick();
  return (
    <div data-tour="picker">
      <SegmentedControl
        label={text.algorithm}
        value={value}
        onChange={pick}
        options={algorithms.flatMap((group) => group.items).map((item) => ({
          value: item.id,
          label: (
            <span data-segment-label className="whitespace-nowrap">
              {item.short}
            </span>
          ),
          // Screen readers also hear the full name, after the one on screen.
          title: item.short === item.title ? undefined : `${item.short}, ${item.title}`,
        }))}
      />
    </div>
  );
};

/** Too many algorithms, or names too long for segments: phones open their own picker. */
const AlgorithmSelect = () => {
  const { algorithms } = useModuleUI();
  const { value, pick } = usePick();
  return (
    <NativeSelect
      data-tour="picker"
      label={text.algorithm}
      value={value}
      onChange={pick}
      className="flex-1"
      groups={algorithms.map((group) => ({
        label: group.label && `${group.label} · ${group.hint}`,
        options: group.items.map((item) => ({ value: item.id, label: item.title, short: item.short })),
      }))}
    />
  );
};

/** Picking 2–4 racers doesn't fit a native select, so the same field opens a checklist. */
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
      <Sheet title={text.racersSheet(names.length, MAX_RACERS)}>
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
  const inline = useInline();
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <ViewRow />
      {inline && <AlgorithmSegments />}
      <div className={cn("flex items-center gap-1", inline && "justify-end")}>
        {!inline && <AlgorithmSelect />}
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
