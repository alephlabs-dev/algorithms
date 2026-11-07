import { MixerHorizontalIcon } from "@radix-ui/react-icons";
import { useEffect } from "react";
import { useModuleUI } from "@/modules";
import { useStore } from "@/store";
import { cn } from "@/utils/cn";
import { NowCard } from "../Pseudocode";
import { SectionLabel } from "../ui/section-label";
import { SegmentedControl } from "../ui/segmented";
import { usePanelTab, type PanelTab } from "./panelTab";
import { localized } from "@/i18n";

const text = localized({
  en: { settings: "Settings", pseudocode: "Pseudocode", panel: "Side panel" },
  es: { settings: "Ajustes", pseudocode: "Pseudocódigo", panel: "Panel lateral" },
});

/** The settings of the module on stage. */
export const SettingsPanel = () => {
  const { Settings } = useModuleUI();
  return <Settings />;
};

/**
 * iPad landscape and desktop: the settings in a card beside the stage, fitting
 * without scrolling (UX.md rule 14). Titled unless a tab already names it.
 */
export const SettingsAside = ({ className, titled = true }: { className?: string; titled?: boolean }) => (
  <section
    data-tour="settings"
    data-settings
    aria-label={text.settings}
    className={cn("flex min-h-0 flex-col gap-4 overflow-y-auto rounded-3xl border border-edge bg-surface p-5", className)}
  >
    {titled && (
      <SectionLabel className="flex items-center gap-2">
        <MixerHorizontalIcon className="h-4 w-4" /> {text.settings}
      </SectionLabel>
    )}
    <SettingsPanel />
  </section>
);

/**
 * iPad landscape and desktop: the panel beside the stage, with two tabs for
 * things the learner doesn't need at the same time (UX.md rule 8): the
 * settings, and the pseudocode of the run. The last tab picked is kept for
 * the session.
 */
export const SidePanel = ({ className }: { className?: string }) => {
  const { tab, setTab } = usePanelTab();
  const isTourOpen = useStore((s) => s.isTourOpen);

  // The tour points at the settings, so it starts on that tab.
  useEffect(() => {
    if (isTourOpen) usePanelTab.getState().setTab("settings");
  }, [isTourOpen]);

  return (
    <div className={cn("min-h-0 w-80 shrink-0 flex-col gap-4", className)}>
      <SegmentedControl<PanelTab>
        label={text.panel}
        value={tab}
        onChange={setTab}
        options={[
          { value: "settings", label: text.settings },
          { value: "code", label: text.pseudocode },
        ]}
      />
      {tab === "settings" ? <SettingsAside titled={false} className="max-h-full shrink-0" /> : <NowCard />}
    </div>
  );
};
