import { cn } from "@/utils/cn";

export const RACE_DESCRIPTION =
  "Same array, same clock. Each tick is one operation (a comparison, a swap or a write), so the lanes show how much work each algorithm really does.";

export const RaceHeader = ({ className }: { className?: string }) => (
  <header className={cn("flex flex-col gap-3 text-foreground animate-in fade-in duration-300 motion-reduce:animate-none", className)}>
    <h1 className="font-display text-display font-semibold">Race</h1>
    <p className="max-w-3xl text-foreground/80">{RACE_DESCRIPTION}</p>
  </header>
);
