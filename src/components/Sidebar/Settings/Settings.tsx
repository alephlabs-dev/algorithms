import { useStore } from "@/store";
import { DisplayModeSelector } from "./DisplayModeSelector";
import { InputSelector } from "./InputSelector";
import { SizeSelector } from "./SizeSelector";
import { Title } from "../Title";

export const Settings = () => {
  // Race lanes are too small for number tiles, so they always draw bars.
  const isRace = useStore((s) => s.view === "race");
  return (
    <div className="flex flex-col gap-8">
      <Title title="Settings" />
      <SizeSelector />
      <InputSelector />
      {!isRace && <DisplayModeSelector />}
    </div>
  );
};
