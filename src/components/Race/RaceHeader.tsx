export const RACE_DESCRIPTION =
  "Same array, same clock. Each tick is one operation (a comparison, a swap or a write), so the lanes show how much work each algorithm really does.";

export const RaceHeader = () => (
  <div className="flex flex-col gap-3 text-foreground animate-in fade-in duration-300 motion-reduce:animate-none">
    <h1 className="text-2xl lg:text-3xl xl:text-4xl font-semibold">Race</h1>
    <p className="xl:text-lg">{RACE_DESCRIPTION}</p>
  </div>
);
