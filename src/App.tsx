import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { About } from "./components/About";
import { AlgorithmVisualizer } from "./components/AlgorithmVisualizer";
import { Controls } from "./components/Controls";
import { MobileRaceBar, MobileTopBar } from "./components/MobileTopBar";
import { NowCard, StepCaption } from "./components/Pseudocode";
import { RaceLanes } from "./components/Race/RaceLanes";
import { Legend } from "./components/RunInfo";
import { TopBar } from "./components/TopBar";
import { Tour } from "./components/Tour";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { MOBILE_QUERY, useStore } from "./store";
import { navigate, routeFor } from "./urlSync";

/**
 * One stage, edge to edge: a slim bar on top that names what's playing, the
 * bars in the middle with the "Now" card beside them on wide screens, and a
 * floating dock at the bottom.
 */
function App() {
  const setIsMobile = useStore((s) => s.setIsMobile);
  const view = useStore((s) => s.view);
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const route = useStore(useShallow(routeFor));

  useEffect(() => {
    setIsMobile(isMobile);
  }, [isMobile, setIsMobile]);

  return (
    <>
      <main className="mx-auto flex h-dvh w-full max-w-[1600px] flex-col gap-4 p-4 text-foreground md:p-6 lg:gap-6 lg:px-8">
        <TopBar className="hidden lg:flex" />
        {view === "single" ? (
          <>
            <MobileTopBar className="lg:hidden" />
            <div className="flex min-h-0 flex-1 gap-8">
              <div className="flex min-w-0 flex-1 flex-col gap-2 lg:px-4">
                <div className="flex min-h-10 items-center justify-between gap-4 xl:hidden">
                  <StepCaption className="-ml-3 flex-1" />
                  <Legend className="hidden shrink-0 md:flex" />
                </div>
                <AlgorithmVisualizer />
              </div>
              {/* Never taller than the stage: the card scrolls inside if it has to. */}
              <NowCard className="hidden max-h-full w-80 shrink-0 self-start xl:flex" />
            </div>
          </>
        ) : (
          <>
            <MobileRaceBar className="lg:hidden" />
            <Legend className="-mb-2 lg:-mt-2" />
            <RaceLanes />
          </>
        )}
        <Controls />
        <Tour />
      </main>
      {/* Below the stage: the page's written content, also prerendered for search engines. */}
      <About route={route} onNavigate={navigate} />
    </>
  );
}

export default App;
