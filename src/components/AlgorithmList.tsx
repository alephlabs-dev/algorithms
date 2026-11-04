import { useModuleUI } from "@/modules";
import { useStore } from "@/store";
import { ListItem } from "./ui/list-item";
import { SectionLabel } from "./ui/section-label";

/** The module's algorithms, in its groups (sorting groups them by how they scale). */
export const AlgorithmList = ({ onPick }: { onPick?: () => void }) => {
  const { algorithms, current, pick } = useModuleUI();
  const selected = useStore(current);
  return (
    <nav aria-label="Algorithms" className="flex flex-col gap-4">
      {algorithms.map((group, k) => (
        <div key={group.label ?? k} className="flex flex-col gap-1">
          {group.label && (
            <SectionLabel className="flex justify-between px-3">
              {group.label}
              <span className="font-mono normal-case tracking-normal">{group.hint}</span>
            </SectionLabel>
          )}
          {group.items.map((item) => (
            <ListItem
              key={item.id}
              selected={item.id === selected}
              onClick={() => {
                if (item.id !== selected) pick(item.id);
                onPick?.();
              }}
            >
              {item.title}
            </ListItem>
          ))}
        </div>
      ))}
    </nav>
  );
};
