import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { Controls } from "./components/Controls";
import { MobileRaceBar, MobileTopBar } from "./components/MobileTopBar";
import { CodeSheet, StepCaption } from "./components/Pseudocode";
import { ScrollHint } from "./components/ScrollHint";
import { SettingsAside, SidePanel } from "./components/Settings/ModuleSettings";
import { usePanelTab } from "./components/Settings/panelTab";
import { useSheets } from "./components/ui/sheets";
import { TopBar } from "./components/TopBar";
import { Tour } from "./components/Tour";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { useModuleUI } from "./modules";
import { useStore } from "./store";
import { routeFor } from "./navigation";
import { GameDock, GameLayer } from "./components/Game";

// iPad landscape and desktop: the side panel, whose Pseudocode tab replaces the sheet.
const WIDE_QUERY = "(min-width: 1024px)";

/** The non-modal sheet on screen, if any: only below the side panel's sizes. */
const useSheet = () => {
  const open = useSheets((s) => s.open);
  const card = useMediaQuery(WIDE_QUERY);
  const isTourOpen = useStore((s) => s.isTourOpen);

  // The tour points at the dock and the top bar, so it starts with no sheet in the way.
  useEffect(() => {
    if (isTourOpen) useSheets.getState().close();
  }, [isTourOpen]);

  if (open === "code" && !card) return <CodeSheet />;
  return null;
};

/**
 * One stage, edge to edge: a slim bar on top that names what's playing, the
 * module's stage in the middle with the side panel beside it on wide screens,
 * and a floating dock at the bottom. What's on stage comes from the module.
 */
function App() {
  const view = useStore((s) => s.view);
  const { Stage, race, Tools, Legend } = useModuleUI();
  // Only modules with a race reach race view; the store keeps the others in single view.
  const RaceStage = race?.Stage ?? Stage;
  const route = useStore(useShallow(routeFor));
  const sheet = useSheet();
  const wide = useMediaQuery(WIDE_QUERY);
  const setPanelTab = usePanelTab((s) => s.setTab);

  return (
    <main className="mx-auto flex h-dvh w-full max-w-[1600px] flex-col gap-4 p-4 text-foreground md:p-6 lg:gap-6 lg:px-8">
      <TopBar className="hidden lg:flex" />
      {view !== "race" ? (
        <>
          <MobileTopBar className="lg:hidden" />
          <div className="flex min-h-0 flex-1 gap-8">
            <div className="flex min-w-0 flex-1 flex-col gap-2 lg:px-4">
              {/* Phones keep the module's tools in the settings sheet, so the stage gets the room; wide screens in the settings panel. */}
              {Tools && <Tools className="-ml-1 hidden md:flex lg:hidden" />}
              {/* The legend drops to its own line before it makes the step narrower than on a phone: 373px is
                  the 325px of text a 393px phone gets, plus the caption's padding and icon (e2e/step-sentences-fit.spec.ts). */}
              <div className="flex min-h-10 flex-wrap items-start justify-between gap-x-4 gap-y-1">
                {/* Wide screens: tapping the step opens the side panel's Pseudocode tab. */}
                <StepCaption className="-ml-3 flex-1 md:min-w-[373px]" onActivate={wide ? () => setPanelTab("code") : undefined} />
                {/* Lined up with the step's first line (the caption's py-1). */}
                <Legend className="hidden shrink-0 md:mt-1 md:flex" />
              </div>
              {/* Guess mode asks under the stage, so it never covers what it's asking about. */}
              {/* The panel keeps its own space above it (GameLayer), so the stage can size itself for it. */}
              <div className="relative flex min-h-0 flex-1 flex-col">
                <Stage />
                <GameLayer />
              </div>
            </div>
            {/* Settings | Pseudocode, beside the stage, never covering it (UX.md rule 8). */}
            <SidePanel className="hidden lg:flex" />
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
      {/* Covered by an open sheet, but still mounted: it drives playback. On phones a guess-mode question takes its place. */}
      <GameDock hidden={sheet !== null}>
        <Controls />
      </GameDock>
      {sheet ?? <ScrollHint route={route} className="-my-2 h-6 lg:-my-3" />}
      <Tour />
    </main>
  );
}

export default App;
