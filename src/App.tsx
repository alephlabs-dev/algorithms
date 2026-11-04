import { useEffect } from "react";
import { AlgorithmVisualizer } from "./components/AlgorithmVisualizer";
import { Controls } from "./components/Controls";
import { Header } from "./components/Header";
import { MobileRaceBar, MobileTopBar } from "./components/MobileTopBar";
import { PseudocodePanel } from "./components/Pseudocode";
import { RaceHeader } from "./components/Race/RaceHeader";
import { RaceLanes } from "./components/Race/RaceLanes";
import { Sidebar } from "./components/Sidebar";
import { ViewSwitch } from "./components/ViewSwitch";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { MOBILE_QUERY, useStore } from "./store";

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
      {/* Below lg (phones, tablets) the sidebar's job moves into the top bar and sheets. */}
      <main className="mx-auto flex h-full w-full max-w-[1440px] min-w-0 flex-col gap-4 p-4 md:p-6 lg:gap-6 lg:p-10">
        <ViewSwitch className="lg:hidden" />
        {view === "single" ? (
          <>
            <MobileTopBar className="lg:hidden" />
            <Header className="hidden lg:flex" />
            <div className="flex min-h-0 flex-1 gap-6">
              <div className="min-w-0 flex-1">
                <AlgorithmVisualizer />
              </div>
              <PseudocodePanel className="hidden w-72 shrink-0 xl:flex" />
            </div>
          </>
        ) : (
          <>
            <MobileRaceBar className="lg:hidden" />
            <RaceHeader className="hidden lg:flex" />
            <RaceLanes />
          </>
        )}
        <Controls />
      </main>
    </div>
  );
}

export default App;
