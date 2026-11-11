import type { ModuleContent } from "@/modules/types";
import { GraphArticle, GraphRaceArticle, GraphsArticle } from "./articles";
import { GraphThumb } from "./Thumbnail";

/** What the prerendered pages show of graphs: its articles and its landing thumbnail. */
export const graphsContent: ModuleContent<"graphs"> = {
  articles: { start: GraphsArticle, algorithm: GraphArticle, race: GraphRaceArticle },
  Thumbnail: () => <GraphThumb className="h-20 w-full" />,
};
