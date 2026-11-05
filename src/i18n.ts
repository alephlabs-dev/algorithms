/**
 * The site's languages. English lives at `/`, Spanish under `/es` (see
 * docs/adr/0001). A page load is in one language for its whole life:
 * switching language is navigating to the other URL.
 */
export const LANGS = ["en", "es"] as const;
export type Lang = (typeof LANGS)[number];

/** The URL prefix of each language. */
export const LANG_PREFIX: Record<Lang, string> = { en: "", es: "/es" };

/** The language a path is in, from its prefix. */
export const langOfPath = (pathname: string): Lang => (/^\/es(\/|$)/.test(pathname) ? "es" : "en");

/** The path without its language prefix: /es/sorting → /sorting, /es → /. */
export const stripLang = (pathname: string): string =>
  langOfPath(pathname) === "en" ? pathname : pathname.slice(LANG_PREFIX.es.length) || "/";

// The prerender loads the app once per language and says which through this global.
declare global {
  var __LANG__: Lang | undefined;
}

const detect = (): Lang => {
  if (globalThis.__LANG__) return globalThis.__LANG__;
  if (typeof location !== "undefined") return langOfPath(location.pathname);
  return "en";
};

/** The language of this page load. */
export const lang: Lang = detect();

/**
 * Text in both languages, side by side; returns the one for this page load.
 * The Spanish entry must have the same shape as the English one, so a
 * missing translation fails the typecheck.
 */
export const localized = <T>(text: { en: T; es: NoInfer<T> }): T => text[lang];
