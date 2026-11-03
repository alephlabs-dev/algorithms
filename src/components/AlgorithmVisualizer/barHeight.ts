import { MAX_ITEM } from "@/utils/generateItems";

// Tallest bar as a share of the container. The rest leaves room for the
// comparison lift and the swap arc.
const BAR_MAX_HEIGHT = 0.8;

export const calculateItemHeight = (item: number, containerHeight: number) =>
  (item / MAX_ITEM) * containerHeight * BAR_MAX_HEIGHT;
