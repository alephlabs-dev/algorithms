import type { ComponentType } from "react";
import { localized } from "@/i18n";
import { moduleContents } from "@/modules/contents";
import type { Nav } from "@/modules/types";
import { HOME, type Route } from "@/routes";
import { PageLink } from "./PageLink";

/**
 * The page's written content, below the visualizer: what search engines index
 * and what readers scroll to for the details. Each module's articles come from
 * its content (src/modules/contents.ts). Pure (no store, no browser APIs),
 * because the build also renders it to static HTML for each page.
 */

type Props = Nav & { route: Route };

const text = localized({
  en: {
    allModules: "All modules",
    madeBy: "Made by Aleph Labs",
    github: "Open source on GitHub",
  },
  es: {
    allModules: "Todos los módulos",
    madeBy: "Hecho por Aleph Labs",
    github: "Código abierto en GitHub",
  },
});

/** The page's article; the landing page has none. */
const PageArticle = ({ route, onNavigate }: Props) => {
  if (route.page === "home") return null;
  // TypeScript can't pair route.module with its own articles here; the registry's type checks each module's set.
  const pages = moduleContents[route.module].articles as {
    start: ComponentType<Nav>;
    algorithm: ComponentType<Nav & { algorithm: string }>;
    race?: ComponentType<Nav>;
  };
  if (route.page === "algorithm") return <pages.algorithm algorithm={route.algorithm} onNavigate={onNavigate} />;
  const Article = route.page === "race" ? pages.race! : pages.start;
  return <Article onNavigate={onNavigate} />;
};

export const About = ({ route, onNavigate }: Props) => (
  <article id="about" className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-4 pb-20 pt-16 text-foreground md:px-6">
    <PageArticle route={route} onNavigate={onNavigate} />
    <footer className="border-t border-edge pt-6 text-sm text-foreground/60">
      <PageLink
        to={HOME}
        onNavigate={onNavigate}
        className="tap-target relative underline decoration-line underline-offset-4 hover:text-foreground"
      >
        {text.allModules}
      </PageLink>{" "}
      · {text.madeBy} ·{" "}
      <a
        href="https://github.com/alephlabs-dev/algorithms"
        className="tap-target relative underline decoration-line underline-offset-4 hover:text-foreground"
      >
        {text.github}
      </a>
    </footer>
  </article>
);
