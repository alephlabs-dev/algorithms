import { InfoCircledIcon, MixerHorizontalIcon } from "@radix-ui/react-icons";
import type { ReactNode } from "react";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";
import { useSettingsSummary } from "@/hooks/useSettingsSummary";
import { useStore } from "@/store";
import { AlgorithmChips } from "./AlgorithmList";
import { Complexity } from "./Header";
import { RACE_DESCRIPTION } from "./Race/RaceHeader";
import { RacerChips } from "./Race/RacerPicker";
import { ShareButton } from "./ShareButton";
import { SettingsPanel } from "./Settings/SettingsPanel";
import { Button } from "./ui/button";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "./ui/drawer";

/** Bottom sheet with a title and scrollable content. */
const Sheet = ({ title, children }: { title: string; children: ReactNode }) => (
  <DrawerContent aria-describedby={undefined}>
    <div className="flex max-h-[85dvh] flex-col gap-4 overflow-y-auto p-6 pb-10 text-foreground">
      <DrawerTitle className="font-display text-xl font-semibold">{title}</DrawerTitle>
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

/** Settings live in a sheet on phones; the button shows what's set. */
const SettingsButton = () => {
  const summary = useSettingsSummary();
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button className="w-full justify-between font-normal">
          <span className="flex items-center gap-2 font-semibold">
            <MixerHorizontalIcon /> Settings
          </span>
          <span className="truncate font-mono text-xs text-foreground/70">{summary}</span>
        </Button>
      </DrawerTrigger>
      <Sheet title="Settings">
        <SettingsPanel />
      </Sheet>
    </Drawer>
  );
};

/**
 * Phones and tablets: the algorithm's name with share and (i), every algorithm
 * as a chip one tap away, then one button for the settings.
 */
export const MobileTopBar = ({ className }: { className?: string }) => {
  const activeAlgorithm = useStore((s) => s.activeAlgorithm);
  const { title, shortDescription, longDescription } = sortingAlgorithms[activeAlgorithm];

  return (
    <div className={className}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1">
          <h1 className="min-w-0 flex-1 truncate font-display text-xl font-semibold">{title}</h1>
          <ShareButton iconOnly />
          <InfoButton label={title}>
            <p className="text-foreground/80">{shortDescription}</p>
            <p className="text-foreground/80">{longDescription}</p>
            <Complexity />
          </InfoButton>
        </div>
        <AlgorithmChips />
        <SettingsButton />
      </div>
    </div>
  );
};

/** Race view on phones and tablets: title, racer chips, settings. */
export const MobileRaceBar = ({ className }: { className?: string }) => (
  <div className={className}>
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <h1 className="flex-1 font-display text-xl font-semibold">Race</h1>
        <ShareButton iconOnly />
        <InfoButton label="Race">
          <p className="text-foreground/80">{RACE_DESCRIPTION}</p>
        </InfoButton>
      </div>
      <RacerChips />
      <SettingsButton />
    </div>
  </div>
);
