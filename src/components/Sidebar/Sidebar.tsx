import { useStore } from "@/store";
import { RacerList } from "../Race/RacerPicker";
import { ViewSwitch } from "../ViewSwitch";
import { AlgorithmSelector } from "./AlgorithmSelector";
import { Settings } from "./Settings";

export const Sidebar = () => {
  const view = useStore((s) => s.view);
  return (
    <aside className="hidden lg:flex min-w-[360px] p-8 overflow-y-auto flex-col justify-between border-accent/50 transition border-r-2 hover:border-accent">
      <div className="flex flex-col h-full gap-8">
        <ViewSwitch />
        {view === "race" ? <RacerList /> : <AlgorithmSelector />}
        <Settings />
      </div>
    </aside>
  );
};
