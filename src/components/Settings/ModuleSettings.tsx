import { MixerHorizontalIcon } from "@radix-ui/react-icons";
import { useModuleUI } from "@/modules";
import { cn } from "@/utils/cn";
import { SectionLabel } from "../ui/section-label";
import { localized } from "@/i18n";

const text = localized({
  en: { settings: "Settings" },
  es: { settings: "Ajustes" },
});

/** The settings of the module on stage. */
export const SettingsPanel = () => {
  const { Settings } = useModuleUI();
  return <Settings />;
};

/** iPad landscape and desktop: the settings in a fixed panel beside the stage (UX.md rule 8). */
export const SettingsAside = ({ className }: { className?: string }) => (
  <section
    data-tour="settings"
    aria-label={text.settings}
    className={cn("flex min-h-0 flex-col gap-4 overflow-y-auto rounded-3xl border border-edge bg-surface p-5", className)}
  >
    <SectionLabel className="flex items-center gap-2">
      <MixerHorizontalIcon className="h-4 w-4" /> {text.settings}
    </SectionLabel>
    <SettingsPanel />
  </section>
);
