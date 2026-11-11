import type { ModuleContent } from "@/modules/types";
import { MazeArticle, MazesArticle, MazesRaceArticle } from "./articles";
import { MazeThumb } from "./Thumbnail";

/** What the prerendered pages show of mazes: its articles and its landing thumbnail. */
export const mazesContent: ModuleContent<"mazes"> = {
  articles: { start: MazesArticle, algorithm: MazeArticle, race: MazesRaceArticle },
  Thumbnail: () => <MazeThumb className="h-24" />,
};
