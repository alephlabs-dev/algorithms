import { lang, type Lang } from "@/i18n";

/**
 * The LanguageButton's language and look, apart from its component
 * (src/components/LanguageSwitch.tsx), which reads the store: the prerendered
 * landing keeps the button's exact space with them (#182).
 */

/** The language the LanguageButton switches to. */
export const otherLang: Lang = lang === "en" ? "es" : "en";

export const languageButtonClass =
  "tap-target relative grid h-9 min-w-9 place-items-center rounded-full px-2 font-mono text-xs font-semibold uppercase text-foreground/80 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary";
