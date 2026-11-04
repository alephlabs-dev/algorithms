import { useStore } from "@/store";
import { AlgorithmList } from "../AlgorithmList";
import { RacerList } from "../Race/RacerPicker";
import { SettingsPanel } from "../Settings/SettingsPanel";
import { SectionLabel } from "../ui/section-label";
import { ViewSwitch } from "../ViewSwitch";

export const Sidebar = () => {
  const view = useStore((s) => s.view);
  return (
    <aside className="hidden lg:flex w-80 shrink-0 flex-col gap-6 overflow-y-auto border-r border-line/60 p-6">
      <ViewSwitch />
      {view === "race" ? <RacerList /> : <AlgorithmList />}
      <section className="flex flex-col gap-4">
        <SectionLabel className="px-3">Settings</SectionLabel>
        <SettingsPanel layout="sidebar" />
      </section>
    </aside>
  );
};
