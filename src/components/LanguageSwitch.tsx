import type { MouseEvent, ReactNode } from "react";
import { lang, type Lang } from "@/i18n";
import { pathIn } from "@/routes";
import { useStore } from "@/store";
import { routeFor } from "@/urlSync";
import { cn } from "@/utils/cn";

const other: Lang = lang === "en" ? "es" : "en";

/** Each language named in itself, so a reader of the other one recognizes it. */
const NAMES: Record<Lang, string> = { en: "English", es: "Español" };

/**
 * A link to this same page in the other language. Switching language is a
 * real navigation (the page loads in the new language), keeping the settings
 * in the query string.
 */
const LanguageLink = ({ className, children }: { className?: string; children: ReactNode }) => {
  const path = useStore((s) => pathIn(routeFor(s), other));
  return (
    <a
      href={path}
      hrefLang={other}
      lang={other}
      // The query string changes with every setting; read it when the link is used.
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        event.currentTarget.href = path + window.location.search;
      }}
      className={className}
    >
      {children}
    </a>
  );
};

/** Desktop top bar: the other language's code, next to the theme toggle. */
export const LanguageButton = () => (
  <LanguageLink className="tap-target relative grid h-9 min-w-9 place-items-center rounded-full px-2 font-mono text-xs font-semibold uppercase text-foreground/80 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary">
    <span aria-hidden>{other}</span>
    <span className="sr-only">{NAMES[other]}</span>
  </LanguageLink>
);

/** In the list of modules (a sheet on phones): the other language, by name. */
export const LanguageRow = ({ className }: { className?: string }) => (
  <LanguageLink
    className={cn(
      "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary lg:min-h-9",
      className
    )}
  >
    <span aria-hidden className="font-mono text-xs uppercase text-foreground/60">
      {other}
    </span>
    {NAMES[other]}
  </LanguageLink>
);
