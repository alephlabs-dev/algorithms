# Language lives in a URL prefix, text in typed dictionaries

The site is translated into Spanish (#36). English stays at `/` and Spanish lives under `/es/...` with the same English slugs. Every route is prerendered once per language with its own canonical, `hreflang` alternates and `<html lang>`, so search engines index both. There is no automatic redirect by browser language. We picked this over a language stored in `localStorage` or read from the browser, because those serve one URL in two languages and only one version would get indexed.

The text lives in plain TypeScript, each English entry next to its Spanish one (`localized({ en, es })` in `src/i18n.ts`), instead of i18next or Lingui. There are only two languages and we translate them ourselves. Most strings are step sentences built from numbers, so a function like `swap: (a, b) => ...` reads better than an ICU message, and a missing Spanish key fails the typecheck.

## Consequences

- A page whose module isn't translated yet still exists under `/es` with English text. It is left out of the sitemap and `hreflang` and marked `noindex` until its module is translated.
- Pseudocode stays in English in both languages.
- The language is picked once, when the app's modules load: from the URL in the browser, and from a global the prerender sets, with one Vite server per language. Text computed at module level is therefore safe, and switching language reloads the page.
