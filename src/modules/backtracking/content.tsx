import type { ModuleContent } from "@/modules/types";
import { BacktrackingArticle, BacktrackingProblemArticle } from "./articles";
import { QueensThumb } from "./Thumbnail";

/** What the prerendered pages show of backtracking: its articles and its landing thumbnail. */
export const backtrackingContent: ModuleContent<"backtracking"> = {
  articles: { start: BacktrackingArticle, algorithm: BacktrackingProblemArticle },
  Thumbnail: () => <QueensThumb className="h-24 w-full" />,
};
