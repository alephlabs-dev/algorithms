import type { ModuleContent } from "@/modules/types";
import { StructureArticle, StructureRaceArticle, StructuresArticle } from "./articles";
import { StructureThumb } from "./Thumbnail";

/** What the prerendered pages show of structures: its articles and its landing thumbnail. */
export const structuresContent: ModuleContent<"structures"> = {
  articles: { start: StructuresArticle, algorithm: StructureArticle, race: StructureRaceArticle },
  Thumbnail: () => <StructureThumb className="h-20 w-full" />,
};
