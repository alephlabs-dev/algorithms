import { MixerHorizontalIcon } from "@radix-ui/react-icons";
import * as Popover from "@radix-ui/react-popover";
import { useModuleUI, useSettingsSummary } from "@/modules";
import { cn } from "@/utils/cn";
import { popoverClass } from "../ui/popover";
import { localized } from "@/i18n";

const text = localized({
  en: { settings: (label: string) => `Settings: ${label}. Change` },
  es: { settings: (label) => `Ajustes: ${label}. Cambiar` },
});

/** The settings of the module on stage. */
export const SettingsPanel = () => {
  const { Settings } = useModuleUI();
  return <Settings />;
};

/**
 * Desktop and tablet: one pill in the dock that reads like the settings
 * ("40 · Random") and opens all of them.
 */
export const SettingsMenu = ({ className }: { className?: string }) => {
  const { main, detail, mono, label } = useSettingsSummary();
  return (
    <Popover.Root>
      <Popover.Trigger
        data-tour="settings"
        aria-label={text.settings(label)}
        className={cn(
          "flex h-11 shrink-0 items-center gap-2 rounded-full border border-edge px-4 text-sm text-foreground transition-colors hover:bg-accent data-[state=open]:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
          className,
        )}
      >
        <MixerHorizontalIcon className="h-4 w-4 text-foreground/70" />
        <span className={mono ? "font-mono" : undefined}>{main}</span>
        <span className="text-foreground/40">·</span>
        <span className="whitespace-nowrap">{detail}</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="end"
          sideOffset={12}
          className={cn(popoverClass, "max-h-[var(--radix-popover-content-available-height)] w-96 overflow-y-auto p-6")}
        >
          <SettingsPanel />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
