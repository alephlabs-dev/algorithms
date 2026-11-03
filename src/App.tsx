import { AlgorithmVisualizer } from "./components/AlgorithmVisualizer";
import { Header } from "./components/Header";
import { Controls } from "./components/Controls";
import { useStore } from "./store";
import { MobileSettings } from "./components/MobileSettings";
import { MobileAlgorithmSelector } from "./components/MobileAlgorithmSelector";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Separator } from "./components/ui/separator";
import { MobileHeader } from "./components/MobileHeader";
import { PseudocodePanel } from "./components/Pseudocode";

function App() {
  const setIsMobile = useStore((s) => s.setIsMobile);
  const setSize = useStore((s) => s.setSize);

  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    setIsMobile(isMobile);
    if (isMobile) {
      setSize(20);
    }
  }, [isMobile, setIsMobile, setSize]);

  return (
    <div className="flex h-dvh bg-background text-foreground">
      <Sidebar />
      <main className="lg:container lg:max-w-7xl flex flex-col gap-4 lg:gap-6 xl:gap-10 p-4 md:p-8 lg:p-10 h-full w-full">
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
        <Controls />
      </main>
    </div>
  );
}

export default App;
