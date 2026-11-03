import { Header } from "./Header";
import { useStore } from "../store";
import { sortingAlgorithms } from "../consts/sortingAlgorithms";
import { Button } from "./ui/button";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "./ui/drawer";

export const MobileHeader = () => {
  const activeAlgorithm = useStore((s) => s.activeAlgorithm);
  const { title, shortDescription } = sortingAlgorithms[activeAlgorithm];
  return (
    <div className="flex md:hidden flex-col gap-2 bg-accent p-4 rounded-sm">
      {/* Button sits beside the title to leave more height for the visualizer. */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-2xl font-medium relative">{title}</h2>
        <Drawer>
          <DrawerTrigger asChild>
            <Button
              className="shrink-0 bg-background hover:bg-background/90 hover:text-foreground"
              size="sm"
            >
              Learn more
            </Button>
          </DrawerTrigger>
          <DrawerContent
            className="bg-background border-none border-accent/50"
            aria-describedby={undefined}
          >
            <DrawerTitle className="sr-only">About {title}</DrawerTitle>
            <Header />
          </DrawerContent>
        </Drawer>
      </div>
      <p className="line-clamp-2">{shortDescription}</p>
    </div>
  );
};
