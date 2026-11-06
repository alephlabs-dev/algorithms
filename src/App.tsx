import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { About } from "./components/About";
import { Controls } from "./components/Controls";
import { Landing } from "./components/Landing/Landing";
import { MobileRaceBar, MobileTopBar } from "./components/MobileTopBar";
import { CodeSheet, NowCard, StepCaption } from "./components/Pseudocode";
import { ScrollHint } from "./components/ScrollHint";
import { SettingsAside, SettingsSheet } from "./components/Settings/ModuleSettings";
import { useSheets } from "./components/ui/sheets";
import { LanguageButton } from "./components/LanguageSwitch";
import { ThemeToggle } from "./components/ThemeToggle";
import { TopBar } from "./components/TopBar";
import { Tour } from "./components/Tour";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { useModuleUI } from "./modules";
import { href } from "./routes";
import { MOBILE_QUERY, PORTRAIT_QUERY, useStore } from "./store";
import { navigate, routeFor } from "./urlSync";
import { GameLayer } from "./components/Game";

// Settings get a side panel from here up, and the pseudocode a card from XL up (UX.md rule 8).
const PANEL_QUERY = "(min-width: 1024px)";
const CARD_QUERY = "(min-width: 1280px)";

/** The non-modal sheet on screen, if any: each one only exists where its panel or card doesn't. */
const useSheet = () => {
  const open = useSheets((s) => s.open);
  const panel = useMediaQuery(PANEL_QUERY);
  const card = useMediaQuery(CARD_QUERY);
  const isTourOpen = useStore((s) => s.isTourOpen);

  // The tour points at the dock and the top bar, so it starts with no sheet in the way.
  useEffect(() => {
    if (isTourOpen) useSheets.getState().close();
  }, [isTourOpen]);

  if (open === "settings" && !panel) return <SettingsSheet />;
  if (open === "code" && !card) return <CodeSheet />;
  return null;
};

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
  const sheet = useSheet();

  useEffect(() => {
    setIsMobile(isMobile);
  }, [isMobile, setIsMobile]);

  useEffect(() => {
    setIsPortrait(isPortrait);
  }, [isPortrait, setIsPortrait]);

  if (isLanding) return <Landing onNavigate={navigate} actions={
          <>
            <ThemeToggle />
            <LanguageButton />
          </>
        } />;

  return (
    <>
      <main className="mx-auto flex h-dvh w-full max-w-[1600px] flex-col gap-4 p-4 text-foreground md:p-6 lg:gap-6 lg:px-8">
        <TopBar className="hidden lg:flex" />
        {view === "single" ? (
          <>
            <MobileTopBar className="lg:hidden" />
            <div className="flex min-h-0 flex-1 gap-8">
              <div className="flex min-w-0 flex-1 flex-col gap-2 lg:px-4">
                {/* Phones keep the module's tools in the settings sheet, so the stage gets the room; wide screens in the settings panel. */}
                {Tools && <Tools className="-ml-1 hidden md:flex lg:hidden" />}
                <div className="flex min-h-10 items-center justify-between gap-4 xl:hidden">
                  <StepCaption className="-ml-3 flex-1" />
                  <Legend className="hidden shrink-0 md:flex" />
                </div>
                {/* Guess mode asks under the stage, so it never covers what it's asking about. */}
                <div className="relative flex min-h-0 flex-1 flex-col gap-2">
                  <Stage />
                  <GameLayer />
                </div>
              </div>
              {/* Settings whole, then the code card in the room they leave (collapsed when it doesn't fit), beside the stage. */}
              <div className="hidden min-h-0 w-80 shrink-0 flex-col gap-4 lg:flex">
                <SettingsAside className="max-h-full shrink-0" />
                <NowCard className="hidden xl:flex" />
              </div>
            </div>
          </>
        ) : (
          <>
            <MobileRaceBar className="lg:hidden" />
            <div className="flex min-h-0 flex-1 gap-8">
              <div className="flex min-w-0 flex-1 flex-col gap-3 lg:gap-4">
                {/* A module with tools is one whose stage needs every bit of a phone's room: its legend waits for wider screens too. */}
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 lg:-mt-2">
                  {Tools && <Tools className="-ml-1 hidden md:flex lg:hidden" />}
                  <Legend className={Tools ? "hidden md:flex" : undefined} />
                </div>
                <RaceStage />
              </div>
              <SettingsAside className="hidden max-h-full w-80 shrink-0 self-start lg:flex" />
            </div>
          </>
        )}
        {/* Covered by an open sheet, but still mounted: it drives playback. */}
        <Controls className={sheet ? "hidden" : undefined} />
        {sheet ?? <ScrollHint route={route} className="-my-2 h-6 lg:-my-3" />}
        <Tour />
      </main>
      {/* Below the stage: the page's written content, also prerendered for search engines. */}
      {/* Keyed by page, so each page's explanations start closed. */}
      <About key={href(route)} route={route} onNavigate={navigate} />
    </>
  );
}

export default App;
