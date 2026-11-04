import { useStore } from "@/store";
import { AlgorithmList } from "../AlgorithmList";
import { RacerList } from "../Race/RacerPicker";
import { ViewSwitch } from "../ViewSwitch";

export const Sidebar = () => {
  const view = useStore((s) => s.view);
  return (
    <aside className="hidden lg:flex w-72 xl:w-80 shrink-0 flex-col gap-6 overflow-y-auto border-r border-line/60 p-6">
      <ViewSwitch />
      {view === "race" ? <RacerList /> : <AlgorithmList />}
    </aside>
  );
};
