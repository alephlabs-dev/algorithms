import { cn } from "@/utils/cn";
import { seededRandom } from "@/utils/random";

// Bubble Sort a few passes in: the largest values have settled on the right.
const BAR_COUNT = 20;
const PASSES = 6;
const COMPARING = 4;
const bars = (() => {
  const random = seededRandom(8);
  const values = Array.from({ length: BAR_COUNT }, () => 10 + Math.round(random() * 90));
  for (let p = 0; p < PASSES; p++) {
    for (let j = 0; j < BAR_COUNT - 1 - p; j++) {
      if (values[j] > values[j + 1]) [values[j], values[j + 1]] = [values[j + 1], values[j]];
    }
  }
  return values;
})();

export const SortingThumb = ({ className }: { className?: string }) => (
  <div aria-hidden className={cn("flex items-end gap-[3px]", className)}>
    {bars.map((height, i) => (
      <span
        key={i}
        style={{ height: `${height}%` }}
        className={cn(
          "flex-1 rounded-t-[3px] rounded-b-[1px]",
          i >= BAR_COUNT - PASSES ? "bg-primary" : i === COMPARING || i === COMPARING + 1 ? "bg-secondary" : "bg-bar",
        )}
      />
    ))}
  </div>
);
