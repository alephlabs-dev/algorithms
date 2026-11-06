import { ArrowLeftIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";
import { modules } from "@/consts/modules";
import { useModuleUI } from "@/modules";
import { useStore } from "@/store";
import { navigate } from "@/urlSync";
import { cn } from "@/utils/cn";
import { Drawer, DrawerSheet, DrawerTrigger } from "./ui/drawer";
import { ListItem } from "./ui/list-item";
import { popoverClass } from "./ui/popover";
import { SectionLabel } from "./ui/section-label";
import { AlephMark } from "./ui/aleph-mark";
import { LanguageRow } from "./LanguageSwitch";
import { localized } from "@/i18n";

const text = localized({
  en: {
    modules: "Modules",
    comingSoon: "Coming soon",
    allModules: "All modules",
    modulePill: (title: string) => `Module: ${title}. Change`,
  },
  es: {
    modules: "Módulos",
    comingSoon: "Próximamente",
    allModules: "Todos los módulos",
    modulePill: (title) => `Módulo: ${title}. Cambiar`,
  },
});

const logoClass =
  "grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-lg font-bold text-background transition-opacity hover:opacity-90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Every module: the open ones to switch to, the rest as coming soon, and the way back to the landing page. */
const ModuleList = ({ onPick }: { onPick: () => void }) => {
  const current = useStore((s) => s.module);
  const upcoming = modules.filter((m) => !m.route);
  return (
    <nav aria-label={text.modules} className="flex flex-col gap-1">
      {modules
        .filter((m) => m.route)
        .map((m) => (
          <ListItem
            key={m.id}
            selected={m.id === current}
            onClick={() => {
              if (m.id !== current) navigate(m.route!);
              onPick();
            }}
          >
            <span className="flex-1">{m.title}</span>
            <span className="font-mono text-xs font-normal text-foreground/60">{m.count}</span>
          </ListItem>
        ))}
      {/* Only when some module is still in preparation. */}
      {upcoming.length > 0 && <SectionLabel className="px-3 pb-1 pt-3">{text.comingSoon}</SectionLabel>}
      {upcoming.map((m) => (
        <div key={m.id} className="flex min-h-9 items-center px-3 text-sm text-foreground/60">
          {m.title}
        </div>
      ))}
      <div className="my-1 h-px bg-edge" />
      <ListItem
        selected={false}
        onClick={() => {
          navigate({ kind: "home" });
          onPick();
        }}
      >
        <ArrowLeftIcon /> {text.allModules}
      </ListItem>
      <LanguageRow />
    </nav>
  );
};

const useModuleTitle = () => useModuleUI().title;

/** Desktop: the logo (back to the landing page) and the module, which opens the list of modules. */
export const ModuleMenu = ({ className }: { className?: string }) => {
  const [open, setOpen] = useState(false);
  const title = useModuleTitle();
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        aria-label={text.allModules}
        title={text.allModules}
        onClick={() => navigate({ kind: "home" })}
        className={logoClass}
      >
        <AlephMark />
      </button>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          aria-label={text.modulePill(title)}
          className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-line/70 px-4 text-[15px] font-semibold text-foreground transition-colors hover:bg-accent data-[state=open]:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
        >
          {title}
          <ChevronDownIcon className="h-4 w-4 text-foreground/60" />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content align="start" sideOffset={8} className={cn(popoverClass, "w-72")}>
            <ModuleList onPick={() => setOpen(false)} />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};

/** Phones and tablets: the logo opens the list of modules in a sheet, so it takes no row of its own. */
export const ModuleButton = () => {
  const [open, setOpen] = useState(false);
  const title = useModuleTitle();
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger aria-label={text.modulePill(title)} className={logoClass}>
        <AlephMark />
      </DrawerTrigger>
      <DrawerSheet title={text.modules}>
        <ModuleList onPick={() => setOpen(false)} />
      </DrawerSheet>
    </Drawer>
  );
};
