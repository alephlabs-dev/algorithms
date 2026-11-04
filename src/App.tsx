import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { About } from "./components/About";
import { Controls } from "./components/Controls";
import { Landing } from "./components/Landing/Landing";
import { MobileRaceBar, MobileTopBar } from "./components/MobileTopBar";
import { NowCard, StepCaption } from "./components/Pseudocode";
import { ScrollHint } from "./components/ScrollHint";
import { ThemeToggle } from "./components/ThemeToggle";
import { TopBar } from "./components/TopBar";
import { Tour } from "./components/Tour";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { useModuleUI } from "./modules";
import { MOBILE_QUERY, PORTRAIT_QUERY, useStore } from "./store";
import { navigate, routeFor } from "./urlSync";

/**
 * One stage, edge to edge: a slim bar on top that names what's playing, the
 * module's stage in the middle with the code card beside it on wide screens,
 * and a floating dock at the bottom. What's on stage comes from the module.
 */
function App() {
  const setIsMobile = useStore((s) => s.setIsMobile);
  const view = useStore((s) => s.view);
  const { Stage, race, Tools, Legend } = useModuleUI();
  // Only modules with a race reach race view; the store keeps the others in single view.
  const RaceStage = race?.Stage ?? Stage;
  const isLanding = useStore((s) => s.isLanding);
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const setIsPortrait = useStore((s) => s.setIsPortrait);
  const isPortrait = useMediaQuery(PORTRAIT_QUERY);
  const route = useStore(useShallow(routeFor));

  useEffect(() => {
    setIsMobile(isMobile);
  }, [isMobile, setIsMobile]);

  useEffect(() => {
    setIsPortrait(isPortrait);
  }, [isPortrait, setIsPortrait]);

  if (isLanding) return <Landing onNavigate={navigate} actions={<ThemeToggle />} />;

  return (
    <>
      <main className="mx-auto flex h-dvh w-full max-w-[1600px] flex-col gap-4 p-4 text-foreground md:p-6 lg:gap-6 lg:px-8">
        <TopBar className="hidden lg:flex" />
        {view === "single" ? (
          <>
            <MobileTopBar className="lg:hidden" />
            <div className="flex min-h-0 flex-1 gap-8">
              <div className="flex min-w-0 flex-1 flex-col gap-2 lg:px-4">
                {/* Phones keep the module's tools in the settings sheet, so the stage gets the room. */}
                {Tools && <Tools className="-ml-1 hidden md:flex" />}
                <div className="flex min-h-10 items-center justify-between gap-4 xl:hidden">
                  <StepCaption className="-ml-3 flex-1" />
                  <Legend className="hidden shrink-0 md:flex" />
                </div>
                <Stage />
              </div>
              {/* Never taller than the stage: the card scrolls inside if it has to. */}
              <NowCard className="hidden max-h-full w-80 shrink-0 self-start xl:flex" />
            </div>
          </>
        ) : (
          <>
            <MobileRaceBar className="lg:hidden" />
            {/* A module with tools is one whose stage needs every bit of a phone's room: its legend waits for wider screens too. */}
            <div className="-mb-1 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 lg:-mt-2">
              {Tools && <Tools className="-ml-1 hidden md:flex" />}
              <Legend className={Tools ? "hidden md:flex" : undefined} />
            </div>
            <RaceStage />
          </>
        )}
        <Controls />
        <ScrollHint route={route} className="-my-2 h-6 lg:-my-3" />
        <Tour />
      </main>
      {/* Below the stage: the page's written content, also prerendered for search engines. */}
      <About route={route} onNavigate={navigate} />
    </>
  );
}

export default App;
