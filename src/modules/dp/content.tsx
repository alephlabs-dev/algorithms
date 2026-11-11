import type { ModuleContent } from "@/modules/types";
import { DpArticle, DpProblemArticle, DpRaceArticle } from "./articles";
import { DpThumb } from "./Thumbnail";

/** What the prerendered pages show of dp: its articles and its landing thumbnail. */
export const dpContent: ModuleContent<"dp"> = {
  articles: { start: DpArticle, algorithm: DpProblemArticle, race: DpRaceArticle },
  Thumbnail: () => <DpThumb className="h-24 w-full" />,
};
