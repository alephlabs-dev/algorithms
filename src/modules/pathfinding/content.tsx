import type { ModuleContent } from "@/modules/types";
import { PathArticle, PathRaceArticle, PathfindingArticle } from "./articles";
import { HeroDemo } from "./HeroDemo";
import { PathThumb } from "./Thumbnail";

/** What the prerendered pages show of pathfinding: its articles and its landing thumbnail, and the landing's live demo. */
export const pathfindingContent: ModuleContent<"pathfinding"> = {
  articles: { start: PathfindingArticle, algorithm: PathArticle, race: PathRaceArticle },
  Thumbnail: () => <PathThumb className="w-full" />,
  HeroDemo,
};
