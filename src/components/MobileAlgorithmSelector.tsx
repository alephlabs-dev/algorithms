import { cn } from "@/utils/cn";
import { Algorithm } from "@/types";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { Button } from "./ui/button";
import { Title } from "./Sidebar/Title";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { sortingAlgorithms } from "@/consts/sortingAlgorithms";

const algorithms = Object.keys(sortingAlgorithms) as Algorithm[];

export const MobileAlgorithmSelector = () => {
  const { activeAlgorithm, setActiveAlgorithm, isPlaying } = useStore(
    useShallow((s) => ({
      activeAlgorithm: s.activeAlgorithm,
      setActiveAlgorithm: s.setActiveAlgorithm,
      isPlaying: s.isPlaying,
    }))
  );

  const { title } = sortingAlgorithms[activeAlgorithm];

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          className="bg-accent border-2 border-accent hover:bg-accent text-base text-foreground hover:text-foreground h-auto px-4 py-2 w-full lg:hidden"
          disabled={isPlaying}
        >
          {title}
          <ChevronDownIcon className="h-6 w-6 ml-auto" />
        </Button>
      </DrawerTrigger>
      <DrawerContent
        className="bg-background border-none border-accent/50"
        aria-describedby={undefined}
      >
        {/* Screen readers need a dialog title; the visible heading is below. */}
        <DrawerTitle className="sr-only">Choose a sorting algorithm</DrawerTitle>
        <div className="flex flex-col w-full gap-4 text-foreground p-8">
          <Title title="Sorting Algorithms" />
          <div className="flex flex-col gap-4">
            {algorithms.map((algorithm) => (
              <DrawerClose asChild key={algorithm}>
                <Button
                  key={algorithm}
                  variant="ghost"
                  className={cn(
                    "px-4 py-2 capitalize text-base text-foreground justify-start hover:bg-accent hover:text-foreground h-auto",
                    {
                      "bg-primary text-background hover:bg-primary/90 hover:text-background":
                        activeAlgorithm === algorithm,
                    }
                  )}
                  onClick={() => setActiveAlgorithm(algorithm)}
                  disabled={isPlaying}
                >
                  {algorithm} Sort
                </Button>
              </DrawerClose>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
