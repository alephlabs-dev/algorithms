import type { ModuleContent } from "@/modules/types";
import { AlgorithmArticle, RaceArticle, SortingArticle } from "./articles";
import { SortingThumb } from "./Thumbnail";

/** What the prerendered pages show of sorting: its articles and its landing thumbnail. */
export const sortingContent: ModuleContent<"sorting"> = {
  articles: { start: SortingArticle, algorithm: AlgorithmArticle, race: RaceArticle },
  Thumbnail: () => <SortingThumb className="h-16 w-full" />,
};
