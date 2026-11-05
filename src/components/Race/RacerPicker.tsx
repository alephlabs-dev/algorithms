import { useShallow } from "zustand/react/shallow";
import { useModuleUI } from "@/modules";
import { MAX_RACERS, MIN_RACERS, useStore } from "@/store";
import { ListItem } from "../ui/list-item";
import { SectionLabel } from "../ui/section-label";
import { localized } from "@/i18n";

const text = localized({
  en: {
    atLeast: (min: number) => `At least ${min} racers`,
    upToRemove: (max: number) => `Up to ${max} racers: remove one first`,
    racers: "Racers",
    upTo: (max: number) => `Up to ${max} racers. Remove one to add another.`,
  },
  es: {
    atLeast: (min) => `Al menos ${min} competidores`,
    upToRemove: (max) => `Hasta ${max} competidores: quita uno primero`,
    racers: "Competidores",
    upTo: (max) => `Hasta ${max} competidores. Quita uno para agregar otro.`,
  },
});

/** Why a racer can't be toggled right now, if it can't. */
const blockedReason = (selected: string[], id: string) => {
  const isOn = selected.includes(id);
  if (isOn && selected.length <= MIN_RACERS) return text.atLeast(MIN_RACERS);
  if (!isOn && selected.length >= MAX_RACERS) return text.upToRemove(MAX_RACERS);
  return undefined;
};

/** The module's algorithms in its groups, with checkboxes: who races. */
export const RacerList = ({ showHeader = true }: { showHeader?: boolean }) => {
  const { algorithms, race } = useModuleUI();
  const selected = useStore(useShallow((s) => race?.racers(s) ?? []));
  const toggleRacer = (id: string) => race?.toggleRacer(id);
  return (
    <div className="flex flex-col gap-4">
      {/* Hidden where the surrounding sheet already has a "Racers" title. */}
      {showHeader && (
        <div className="flex items-baseline justify-between px-3">
          <SectionLabel>{text.racers}</SectionLabel>
          <span className="font-mono text-xs text-foreground/60">
            {selected.length}/{MAX_RACERS}
          </span>
        </div>
      )}
      {algorithms.map((group, k) => (
        <div key={group.label ?? k} className="flex flex-col gap-1">
          {group.label && <SectionLabel className="px-3">{group.label}</SectionLabel>}
          {group.items.map((item) => {
            const reason = blockedReason(selected, item.id);
            return (
              <ListItem
                key={item.id}
                checkbox
                selected={selected.includes(item.id)}
                disabled={reason !== undefined}
                title={reason}
                onClick={() => toggleRacer(item.id)}
              >
                {item.title}
              </ListItem>
            );
          })}
        </div>
      ))}
      {selected.length >= MAX_RACERS && (
        <p className="px-3 text-xs text-foreground/70">{text.upTo(MAX_RACERS)}</p>
      )}
    </div>
  );
};
