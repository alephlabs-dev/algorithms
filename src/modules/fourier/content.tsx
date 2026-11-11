import type { ModuleContent } from "@/modules/types";
import { FourierArticle, SeriesArticle } from "./articles";
import { FourierThumb } from "./Thumbnail";

/** What the prerendered pages show of fourier: its articles and its landing thumbnail. */
export const fourierContent: ModuleContent<"fourier"> = {
  articles: { start: FourierArticle, algorithm: SeriesArticle },
  Thumbnail: () => <FourierThumb className="h-24 w-full" />,
};
