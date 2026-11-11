import { useModuleUI } from "@/modules";
import { useStore } from "@/store";
import { useAlgorithmGroups } from "./algorithmGroups";
import { OptionList } from "./ui/select";
import { localized } from "@/i18n";

const text = localized({
  en: { algorithms: "Algorithms" },
  es: { algorithms: "Algoritmos" },
});

/** The module's algorithms in their groups: the same list the phone's algorithm field opens. */
export const AlgorithmList = ({ onPick }: { onPick?: () => void }) => {
  const { current, pick } = useModuleUI();
  const selected = useStore(current);
  return (
    <OptionList
      label={text.algorithms}
      value={selected}
      groups={useAlgorithmGroups()}
      onPick={(id) => {
        if (id !== selected) pick(id);
        onPick?.();
      }}
    />
  );
};
