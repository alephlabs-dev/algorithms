import { AlgorithmVisualizer } from "./components/AlgorithmVisualizer";
import { Header } from "./components/Header";
import { Controls } from "./components/Controls";
import { MOBILE_QUERY, useStore } from "./store";
import { MobileSettings } from "./components/MobileSettings";
import { MobileAlgorithmSelector } from "./components/MobileAlgorithmSelector";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Separator } from "./components/ui/separator";
import { MobileHeader } from "./components/MobileHeader";
import { PseudocodePanel } from "./components/Pseudocode";
import { RACE_DESCRIPTION, RaceHeader } from "./components/Race/RaceHeader";
import { RaceLanes } from "./components/Race/RaceLanes";
import { RacerChips } from "./components/Race/RacerPicker";
import { ViewSwitch } from "./components/ViewSwitch";

function App() {
  const setIsMobile = useStore((s) => s.setIsMobile);
  const view = useStore((s) => s.view);
  const isMobile = useMediaQuery(MOBILE_QUERY);

  useEffect(() => {
    setIsMobile(isMobile);
  }, [isMobile, setIsMobile]);

  return (
    <div className="flex h-dvh bg-background text-foreground">
      <Sidebar />
      <main className="lg:container lg:max-w-7xl flex flex-col gap-4 lg:gap-6 xl:gap-10 p-4 md:p-8 lg:p-10 h-full w-full">
        {/* On desktop the switch lives at the top of the sidebar. */}
        <ViewSwitch className="lg:hidden" />
        {view === "single" ? (
          <>
            <MobileHeader />
            <div className="hidden md:flex flex-col gap-6 xl:gap-10">
              <Header />
              <Separator />
            </div>
            <MobileSettings />
            <div className="flex flex-1 min-h-0 gap-6">
              <div className="flex-1 min-w-0">
                <AlgorithmVisualizer />
              </div>
              <PseudocodePanel className="hidden xl:flex w-72 shrink-0" />
            </div>
            <MobileAlgorithmSelector />
          </>
        ) : (
          <>
            <div className="hidden md:flex flex-col gap-6 xl:gap-10">
              <RaceHeader />
              <Separator />
            </div>
            <p className="md:hidden text-sm text-foreground/80 line-clamp-2">{RACE_DESCRIPTION}</p>
            <MobileSettings />
            <RacerChips className="lg:hidden" />
            <RaceLanes />
          </>
        )}
        <Controls />
      </main>
    </div>
  );
}

export default App;
